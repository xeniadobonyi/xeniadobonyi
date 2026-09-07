function imgShow(imgContainer) {
	let item = $('.link');
	item.click(function(e) {
		let itemClass = $(this).attr('id');
		let txtBase = 'ul#texts > li';
		let imgBase = imgContainer;
		let txt = $(txtBase + '.' + itemClass);
		let img = $( imgBase + '.' + itemClass);
		if ($(this).hasClass('selected')) {
			//UNSELECTED
			$(this).css('padding-left', '22px');
			$(txtBase).hide();
			$(imgBase).hide();
			$(this).removeClass('selected');
		} else {
			//SELECTED
			$('ul#titles > li').css('padding-left', '22px');
			$(this).css('padding-left', '37px');
			$(txtBase).hide();
			$(imgBase).hide();
			$(txt).toggle();
			$(img).show();
			item.removeClass('selected');
			$(this).addClass('selected');
		}
	});
}


function imagesDestopWidth() {
	let titles = $('ul#titles');
	let texts = $('ul#texts');
	let imgDesktop = $('ul#imagesDesktop');
	let width = titles.outerWidth() + texts.outerWidth();
};

document.querySelectorAll('.flower').forEach(flower => {
    const randomLeft = Math.random() * 100; // Random horizontal position (0% to 100%)
    const randomDelay = Math.random() * 10; // Random animation delay (0s to 10s)
    const randomDuration = Math.random() * 20 + 20; // Random fall duration (20s to 40s)

    flower.style.left = `${randomLeft}%`;
    flower.style.animationDelay = `${randomDelay}s`;
    flower.querySelector('.inner').style.animationDuration = `${randomDuration}s`;
});


$(document).ready(function() {
	if ($(window)) {
		imgShow('ul#imagesDesktop > ul');
		imagesDestopWidth();
	}
});
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