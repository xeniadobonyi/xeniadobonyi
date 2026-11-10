/* ---- Project list: each title opens its text and media.
   Titles are links to #id for no-JS fallback; with JS they act as disclosure buttons. ---- */
function imgShow(imgContainer) {
	var links = document.querySelectorAll('ul#titles > li.link');
	var txtBase = 'ul#texts > li';
	function sync() {
		links.forEach(function (l) {
			var a = l.querySelector('a');
			if (a && a.getAttribute('role') === 'button') a.setAttribute('aria-expanded', l.classList.contains('selected') ? 'true' : 'false');
		});
	}
	links.forEach(function (link) {
		var a = link.querySelector('a');
		// Blog is a real page link; every other title toggles a panel.
		if (a && !a.classList.contains('bloglink')) {
			a.setAttribute('role', 'button');
			if (document.getElementById('text-' + link.id)) a.setAttribute('aria-controls', 'text-' + link.id);
			a.addEventListener('click', function (e) { e.preventDefault(); });
			a.addEventListener('keydown', function (e) {
				if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); link.click(); }
			});
		}
		link.addEventListener('click', function () {
			var itemClass = link.id;
			var txts = document.querySelectorAll(txtBase + '.' + itemClass);
			var imgs = document.querySelectorAll(imgContainer + '.' + itemClass);
			var wasOpen = link.classList.contains('selected');
			document.querySelectorAll(txtBase).forEach(function (el) { el.style.display = 'none'; });
			document.querySelectorAll(imgContainer).forEach(function (el) { el.style.display = 'none'; });
			links.forEach(function (el) { el.classList.remove('selected'); });
			if (!wasOpen) {
				txts.forEach(function (el) { el.style.display = 'list-item'; });
				imgs.forEach(function (el) { el.style.display = 'block'; });
				link.classList.add('selected');
			}
			sync();
		});
	});
	sync();
}

/* Blog pages: falling flowers. */
document.querySelectorAll('.flower').forEach(function (flower) {
	flower.style.left = (Math.random() * 100) + '%';
	flower.style.animationDelay = (Math.random() * 10) + 's';
	var inner = flower.querySelector('.inner');
	if (inner) inner.style.animationDuration = (Math.random() * 20 + 20) + 's';
});


/* Desktop: grow the open text panel to the next title-row line,
   so its bottom border lines up with a line in the titles column. */
function snapTextToRows() {
	var row = document.querySelector('ul#titles > li');
	var desktop = window.matchMedia('(min-width: 1058px)').matches;
	document.querySelectorAll('ul#texts > li').forEach(function (li) {
		li.style.minHeight = '';
		if (!desktop || !row || li.offsetHeight === 0) return;
		var rowHeight = row.offsetHeight;
		li.style.minHeight = Math.ceil(li.offsetHeight / rowHeight) * rowHeight + 'px';
	});
}

imgShow('ul#imagesDesktop > ul');
snapTextToRows();
document.querySelectorAll('.link').forEach(function (link) {
	link.addEventListener('click', snapTextToRows);
});
window.addEventListener('resize', snapTextToRows);
window.addEventListener('load', snapTextToRows);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(snapTextToRows);

/* ---- Mobile accordion: the open project's media and text sit under its own title.
   The nodes are moved into a panel after the selected title, and moved back home
   before every selection change so the desktop switcher above keeps working. ---- */
(function () {
	var titles = document.querySelector('ul#titles');
	var texts = document.querySelector('ul#texts');
	var images = document.querySelector('ul#imagesDesktop');
	if (!titles || !texts || !images) return;
	var mobile = window.matchMedia('(max-width: 1057px)');
	var panel = document.createElement('li');
	panel.className = 'm-panel';

	function undock() {
		Array.prototype.slice.call(panel.children).forEach(function (node) {
			(node.tagName === 'LI' ? texts : images).appendChild(node);
		});
		if (panel.parentNode) panel.parentNode.removeChild(panel);
	}
	function dock() {
		undock();
		if (!mobile.matches) return;
		var selected = titles.querySelector('li.link.selected');
		if (!selected) return;
		var media = images.querySelector(':scope > ul.' + selected.id);
		var text = texts.querySelector(':scope > li.' + selected.id);
		titles.insertBefore(panel, selected.nextSibling);
		if (media) panel.appendChild(media);
		if (text) panel.appendChild(text);
		// closing a panel above the tapped row shifts the page; keep the row in view
		if (selected.getBoundingClientRect().top < 0) selected.scrollIntoView({ block: 'start' });
	}

	// capture phase: runs before the switcher's own click handlers
	document.addEventListener('click', function (e) {
		if (e.target.closest && e.target.closest('ul#titles > li.link')) undock();
	}, true);
	titles.querySelectorAll('li.link').forEach(function (link) {
		link.addEventListener('click', dock);
	});
	// desktop always shows a project; open the first one if nothing is open
	function onResize() {
		if (!mobile.matches && !titles.querySelector('li.link.selected')) {
			var first = titles.querySelector('li.link');
			if (first) first.click();
		}
		dock();
	}
	if (mobile.addEventListener) mobile.addEventListener('change', onResize);
	else if (mobile.addListener) mobile.addListener(onResize);

	// top bar: About and Contact open their entry and scroll to it
	document.querySelectorAll('.m-bar a[data-open]').forEach(function (a) {
		a.addEventListener('click', function (e) {
			var row = titles.querySelector('li#' + a.getAttribute('data-open'));
			if (!row) return;
			e.preventDefault();
			if (!row.classList.contains('selected')) row.click();
			row.scrollIntoView({ block: 'start' });
		});
	});

	// mobile starts with every project collapsed (desktop keeps deep cuts open)
	if (mobile.matches) {
		var open = titles.querySelector('li.link.selected');
		if (open) open.click();
	}
	// mobile starts with every project collapsed; desktop keeps the first one open
	if (mobile.matches) {
		var open = titles.querySelector('li.link.selected');
		if (open) open.click();
	}
	dock();
})();
/* ---- Videos load only when their project is open, and play muted on a loop.
   With reduced motion they stay still, with controls to play by choice. ---- */
(function () {
	var videos = document.querySelectorAll('video.video[data-poster]');
	if (!videos.length) return;
	var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function syncVideos() {
		videos.forEach(function (v) {
			var open = v.parentElement && v.parentElement.style.display === 'block';
			if (open) {
				// the poster frame is only fetched once the project is opened
				if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster;
				if (v.preload !== 'auto') v.preload = 'auto';
				if (still) { v.controls = true; return; }
				var p = v.play(); if (p && p.catch) p.catch(function () {});
			} else if (!v.paused) v.pause();
		});
	}
	document.querySelectorAll('ul#titles > li.link').forEach(function (l) { l.addEventListener('click', syncVideos); });
	window.matchMedia('(max-width: 1057px)').addEventListener && window.matchMedia('(max-width: 1057px)').addEventListener('change', syncVideos);
	syncVideos();
})();

/* ---- Blog videos: load and play only while on screen. ---- */
(function () {
	var vids = document.querySelectorAll('video[data-autoplay]');
	if (!vids.length) return;
	var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function play(v) {
		v.preload = 'auto';
		if (still) { v.controls = true; return; }
		var p = v.play(); if (p && p.catch) p.catch(function () {});
	}
	if (!('IntersectionObserver' in window)) { vids.forEach(play); return; }
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (e) { if (e.isIntersecting) play(e.target); else if (!e.target.paused) e.target.pause(); });
	}, { rootMargin: '200px 0px' });
	vids.forEach(function (v) { io.observe(v); });
})();

/* ---- ASCII logo decode ---- */
(function () {
  var el = document.getElementById('xd-logo');
  if (!el) return;

  var POOL = 'xeniadobony'.split('');     // flickers through the letters of your name
  var CYCLE_MS = 60;                       // ms per flicker frame (raise → letters more legible)
  var STAGGER_MS = 7;                      // left-to-right delay per char (raise → slower sweep, 0 → snap)
  var MIN_CYCLES = 8, EXTRA_CYCLES = 7;    // each char flickers 8–14 times before locking

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // wrap only the "ink" characters in spans; keep spaces & newlines untouched so the grid holds
  var raw = el.textContent, frag = document.createDocumentFragment();
  raw.split('').forEach(function (ch) {
    if (ch === ' ' || ch === '\n') { frag.appendChild(document.createTextNode(ch)); return; }
    var s = document.createElement('span');
    s.textContent = ch;
    s.setAttribute('data-ch', ch);
    frag.appendChild(s);
  });
  el.textContent = '';
  el.appendChild(frag);

  var timers = [];
  function decode() {
    if (reduce) return;
    timers.forEach(clearTimeout); timers = [];
    el.querySelectorAll('span').forEach(function (s, i) {
      var real = s.getAttribute('data-ch');
      var cycles = MIN_CYCLES + Math.floor(Math.random() * EXTRA_CYCLES), c = 0;
      timers.push(setTimeout(function tick() {
        if (c >= cycles) { s.textContent = real; s.classList.remove('xd-flick'); return; }
        s.textContent = POOL[Math.floor(Math.random() * POOL.length)];
        s.classList.add('xd-flick');
        c++; timers.push(setTimeout(tick, CYCLE_MS));
      }, i * STAGGER_MS));
    });
  }

  el.addEventListener('mouseenter', decode);  // replay on hover
  el.addEventListener('click', decode);       // replay on tap (touch devices)
  decode();                                    // run once on load (logo is above the fold)
})();

/* ---- deep cuts player: tap play for a 30-second preview of the record ----
   Same sources as digdeepcuts.com: Deezer first, then Apple Music. Both are asked
   from the browser (JSONP), so nothing runs on this site's side. Preview links
   expire, so a failed one is looked up again on the next tap. */
(function () {
  var spin = document.querySelector('.dc-spin');
  if (!spin) return;
  var disc = document.getElementById('dcDisc');
  var play = document.getElementById('dcPlay');
  var love = document.getElementById('dcLove');
  var label = document.getElementById('dcLabel');
  var line = document.getElementById('dcPreview');
  var ARTIST = 'Gino Vannelli', ALBUM = 'Powerful People', SONG = 'People Gotta Move';

  // Same cover lookup the real site uses; the pink label with the artist name stays if it fails.
  var img = new Image();
  img.onload = function () { label.style.backgroundImage = 'url("' + img.src + '")'; label.textContent = ''; };
  img.src = 'https://digdeepcuts.com/api/cover?artist=Gino%20Vannelli&album=Powerful%20People';

  var audio = typeof Audio === 'function' ? new Audio() : null;
  var clip = null, looking = null, n = 0;

  function jsonp(url, done) {
    var name = 'dcCb' + Date.now() + (n++), s = document.createElement('script'), over = false;
    function finish(data) {
      if (over) return; over = true;
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      if (s.parentNode) s.parentNode.removeChild(s);
      done(data);
    }
    window[name] = finish;
    s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'callback=' + name;
    s.onerror = function () { finish(null); };
    setTimeout(function () { finish(null); }, 8000);
    document.head.appendChild(s);
  }
  function same(a, b) { return String(a || '').toLowerCase().indexOf(b.toLowerCase()) === 0; }
  function pick(list) { // "People Gotta Move" if it has a preview, else the album's first track that does
    var ok = list.filter(function (t) { return t.preview && same(t.artist, ARTIST) && same(t.album, ALBUM); });
    return ok.filter(function (t) { return same(t.title, SONG); })[0] || ok[0] || null;
  }
  function deezer(done) {
    jsonp('https://api.deezer.com/search?output=jsonp&limit=50&q=' + encodeURIComponent('artist:"' + ARTIST + '" album:"' + ALBUM + '"'), function (d) {
      done(pick(((d && d.data) || []).map(function (t) {
        return { preview: t.preview, title: t.title_short || t.title, artist: t.artist && t.artist.name, album: t.album && t.album.title, link: t.link, source: 'Deezer' };
      })));
    });
  }
  function apple(done) {
    jsonp('https://itunes.apple.com/search?entity=song&limit=50&term=' + encodeURIComponent(ARTIST + ' ' + ALBUM), function (d) {
      done(pick(((d && d.results) || []).map(function (t) {
        return { preview: t.previewUrl, title: t.trackName, artist: t.artistName, album: t.collectionName, link: t.trackViewUrl, source: 'Apple Music' };
      })));
    });
  }
  function find(done) {
    if (clip) return done(clip);
    if (looking) return looking.push(done);
    looking = [done];
    deezer(function (c) {
      function out(c) { clip = c; var w = looking; looking = null; w.forEach(function (f) { f(c); }); }
      if (c) out(c); else apple(out);
    });
  }

  function show(state) { // 'play' (stopped), 'pause' (playing), 'busy' (starting)
    var on = state === 'pause';
    spin.classList.toggle('playing', on);
    play.setAttribute('aria-pressed', on ? 'true' : 'false');
    play.setAttribute('aria-busy', state === 'busy' ? 'true' : 'false');
    play.setAttribute('aria-label', on ? 'Pause the preview' : 'Play a 30-second preview');
    if (!clip) return;
    var src = document.createElement('a');
    src.href = clip.link || '#'; src.target = '_blank'; src.rel = 'noopener'; src.textContent = clip.source;
    line.textContent = '';
    line.appendChild(document.createTextNode((on ? 'Playing “' : 'Press play: “') + clip.title + '”, 30 sec via '));
    line.appendChild(src);
    line.hidden = false;
  }
  function start(retry) {
    show('busy');
    find(function (c) {
      if (!c || !audio) {
        show('play');
        line.textContent = 'No preview right now: try the links below for the full record.';
        line.hidden = false;
        return;
      }
      if (audio.src !== c.preview) audio.src = c.preview;
      var p = audio.play();
      if (p && p.then) p.then(function () { show('pause'); }, function () {
        if (!retry) { clip = null; audio.removeAttribute('src'); return start(true); } // expired link: look it up again once
        show('play');
      });
      else show('pause');
    });
  }
  function toggle() { if (audio && !audio.paused) audio.pause(); else start(false); }

  if (audio) {
    audio.preload = 'none';
    audio.addEventListener('ended', function () { show('play'); });
    audio.addEventListener('pause', function () { show('play'); });
  }
  play.addEventListener('click', toggle);
  disc.addEventListener('click', toggle);
  love.addEventListener('click', function () {
    love.setAttribute('aria-pressed', love.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
  // stop the music when another project is opened or this one is closed
  document.querySelectorAll('ul#titles > li.link').forEach(function (l) {
    l.addEventListener('click', function () { if (audio && !audio.paused) audio.pause(); });
  });
  find(function () { show('play'); }); // look the clip up early so "Press play" can name the song
})();
