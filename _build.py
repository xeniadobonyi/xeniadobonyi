#!/usr/bin/env python3
"""Builds the blog from the post files in _blog/.

    python3 _build.py

Each post is one file, _blog/<name>.md, which becomes <name>.html. A post file is:

    ---
    title: Designing for the Post-Screen Era
    date: 2025-05-25
    label: CASE STUDY              (optional: PRESENTATION, CASE STUDY…)
    short: Designing for the Post-Screen Era   (short title for the side list)
    description: One or two sentences for Google and link previews.
    image: blog/13-io.jpg          (lead image: list preview and link previews)
    ---
    The text, in Markdown: blank line between paragraphs, ## for a heading,
    **bold**, *italic*, [link text](https://…), ![alt text](blog/picture.jpg),
    "- " at the start of a line for a list, "> " for a pull quote.
    Videos and embeds can be pasted as HTML, each on its own with blank lines around it.

To start a new post, copy _blog/_new-post-template.md to a new name (that name becomes
the page's address) and fill it in; files whose name starts with _ are skipped.

The script writes blog.html (all posts, newest first), every post page, feed.xml (RSS)
and sitemap.xml. It needs nothing but Python 3. Files and folders starting with _
are not published by GitHub Pages, so the post files and this script stay private.
"""
import html, json, re
from datetime import date as Date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = 'https://xeniadobonyi.com/'
CSS = 'style.css?v=20261114i'
JS = 'main.js?v=20261114h'
MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()

BLOG_ASCII = r""" ____   _       ___    ____
|    \ | |     /   \  /    |
|  o  )| |    |     ||   __|
|     || |___ |  O  ||  |  |
|  O  ||     ||     ||  |_ |
|     ||     ||     ||     |
|_____||_____| \___/ |___,_|"""


# ---------------------------------------------------------------- Markdown (the small subset the posts use)

def md_inline(t):
    """Inline Markdown: images, links, bold, italic. HTML tags written in the text pass through."""
    keep = []
    def stash(s):
        keep.append(s)
        return '\x00%d\x00' % (len(keep) - 1)
    t = re.sub(r'\\([\\*`\[\]])', lambda m: stash(html.escape(m.group(1))), t)        # escaped characters
    t = re.sub(r'</?[a-zA-Z][^<>]*>', lambda m: stash(m.group(0)), t)                    # raw inline HTML
    t = html.escape(t, quote=False).replace('&amp;', '&').replace('&', '&amp;')
    t = re.sub(r'&amp;(#?\w+;)', r'&\1', t)                                               # keep entities
    t = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)\)',
               lambda m: stash('<img src="%s" alt="%s" loading="lazy" decoding="async">' % (m.group(2), html.escape(m.group(1), quote=True))), t)
    def link(m):
        href = m.group(2)
        ext = href.startswith('http') and not href.startswith(SITE)
        return stash('<a href="%s"%s>' % (href, ' target="_blank" rel="noopener"' if ext else '')) + m.group(1) + stash('</a>')
    t = re.sub(r'\[([^\[\]]+)\]\(([^)\s]+)\)', link, t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])', r'<em>\1</em>', t)
    while '\x00' in t:
        t = re.sub(r'\x00(\d+)\x00', lambda m: keep[int(m.group(1))], t)
    return t

BLOCK_HTML = re.compile(r'^<(div|video|iframe|figure|p|table|section|blockquote|h\d|ul|ol)\b', re.I)

def md_blocks(text):
    out = []
    for block in re.split(r'\n\s*\n', text.strip()):
        b = block.strip()
        if not b:
            continue
        if BLOCK_HTML.match(b):
            out.append(b)
        elif b.startswith('## '):
            out.append('<h2>%s</h2>' % md_inline(b[3:].strip()))
        elif all(l.startswith('> ') or l == '>' for l in b.splitlines()):
            out.append('<blockquote><p>%s</p></blockquote>' % md_inline(' '.join(l[2:] for l in b.splitlines())))
        elif all(l.startswith('- ') for l in b.splitlines()):
            out.append('<ul>\n%s\n</ul>' % '\n'.join('<li>%s</li>' % md_inline(l[2:].strip()) for l in b.splitlines()))
        else:
            out.append('<p>%s</p>' % md_inline(' '.join(l.strip() for l in b.splitlines())))
    return '\n'.join(out)


# ---------------------------------------------------------------- posts

def read_post(path):
    src = path.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n(.*)', src, re.S)
    if not m:
        raise SystemExit('%s: the file must start with a --- block (title, date…)' % path.name)
    meta = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip()
    for k in ('title', 'date'):
        if not meta.get(k):
            raise SystemExit('%s: "%s:" is missing at the top' % (path.name, k))
    y, mo, d = (int(x) for x in meta['date'].split('-'))
    body = md_blocks(m.group(2))
    text = ''
    for para in re.findall(r'<p>(.*?)</p>', body, re.S):      # first paragraph with words in it
        text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', para))).strip()
        if text:
            break
    excerpt = text if len(text) <= 230 else text[:230].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    return dict(meta, slug=path.stem, url=path.stem + '.html', body=body, excerpt=excerpt,
                day=Date(y, mo, d), date_text='%02d %s %d' % (d, MONTHS[mo - 1], y),
                short=meta.get('short') or meta['title'], label=meta.get('label', ''),
                description=meta.get('description') or excerpt, image=meta.get('image', ''))

def e(s):
    return html.escape(s, quote=True)

def labelled(p):
    return ('<b>%s:</b> ' % e(p['label']) if p['label'] else '') + e(p['title'])


# ---------------------------------------------------------------- page parts

def head(title, description, url, image, kind='website', extra=''):
    img = SITE + image if image and not image.startswith('http') else (image or SITE + 'og-image.png')
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="Xenia Dobonyi">
<meta name="theme-color" content="#FFFAF0">
<link rel="canonical" href="{SITE}{url}">
<link rel="alternate" type="application/rss+xml" title="xenia dobonyi // blog" href="{SITE}feed.xml">
<link rel="preload" href="font/HelveticaNowText-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link href="{CSS}" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✿</text></svg>">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="{kind}">
<meta property="og:site_name" content="xenia dobonyi">
<meta property="og:locale" content="en_GB">
<meta property="og:url" content="{SITE}{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(description)}">
<meta name="twitter:image" content="{img}">
{extra}<script async src="https://www.googletagmanager.com/gtag/js?id=G-DKK3NS2YLR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-DKK3NS2YLR');
</script>
</head>
'''

def header():
    # Same structure as the homepage header, so BLOG sits exactly where the name logo sits.
    return f'''<body class="blog-v2">
<h1 class="title">xenia dobonyi // blog</h1>
	<nav>
	<a class="logo-link" href="blog.html" aria-label="Blog, all posts"><pre class="blog-logo" aria-hidden="true">{BLOG_ASCII}</pre></a>
		<h2 class="description">xenia dobonyi // I write about tech, luxury fashion and digital innovation</h2>
		<p class="b-links"><a href="./">Work</a><a href="./#about">About</a><a href="./#contact">Contact</a><a href="blog.html" aria-current="page">Blog</a></p>
	</nav>
	<div class="m-bar" role="navigation" aria-label="Site">
		<div class="m-bar-links">
			<a href="./">Work</a>
			<a href="./#about">About</a>
			<a href="./#contact">Contact</a>
			<a href="blog.html" aria-current="page">Blog</a>
		</div>
	</div>
'''

FOOT = f'''<script type="text/javascript" src="{JS}"></script>
</body>
</html>
'''

GENERATED = '<!-- Built by _build.py from the files in _blog/. Edit those, not this page. -->\n'


def index_page(posts):
    # every post shows straight away: date, title, its picture and opening lines
    rows = []
    for i, p in enumerate(posts):
        pic = (f'<span class="b-thumb"><img src="{e(p["image"])}" alt="" '
               f'{"loading=\"lazy\" " if i > 2 else ""}decoding="async"></span>') if p['image'] else '<span class="b-thumb"></span>'
        rows.append(f'''			<a class="b-entry" href="{p['url']}">
				<span class="b-date">{p['date_text']}</span>
				<span class="b-main"><span class="b-title">{labelled(p)}</span><span class="b-excerpt">{e(p['excerpt'])}</span></span>
				{pic}
			</a>''')
    return (head('blog // xenia dobonyi (✿◠‿◠)',
                 'Xenia Dobonyi writes about tech, luxury fashion and digital innovation: e-commerce, AI, AR and experience design.',
                 'blog.html', 'og-image.png')
            + GENERATED + header() + f'''
	<main class="b-index">
		<section class="b-list" aria-label="All posts">
{chr(10).join(rows)}
			<p class="b-feed"><a href="feed.xml">RSS feed</a></p>
		</section>
	</main>
''' + FOOT)


def post_page(posts, i):
    p = posts[i]
    newer = posts[i - 1] if i > 0 else None
    older = posts[i + 1] if i + 1 < len(posts) else None
    side = '\n'.join(
        f'''			<a class="b-side-row" href="{q['url']}"{' aria-current="page"' if q is p else ''}>[{q['day'].year}] {e(q['short'])}</a>'''
        for q in posts)
    pager = []
    if older:
        pager.append(f'<a class="b-older" href="{older["url"]}"><span>&larr; Older</span>{e(older["title"])}</a>')
    else:
        pager.append('<span class="b-older b-none"></span>')
    if newer:
        pager.append(f'<a class="b-newer" href="{newer["url"]}"><span>Newer &rarr;</span>{e(newer["title"])}</a>')
    else:
        pager.append('<span class="b-newer b-none"></span>')
    ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        'headline': p['title'], 'datePublished': p['day'].isoformat(), 'description': p['description'],
        'author': {'@type': 'Person', 'name': 'Xenia Dobonyi', 'url': SITE},
        'publisher': {'@type': 'Person', 'name': 'Xenia Dobonyi', 'url': SITE},
        'mainEntityOfPage': SITE + p['url'],
    }
    if p['image']:
        ld['image'] = SITE + p['image']
    extra = '<script type="application/ld+json">\n%s\n</script>\n' % json.dumps(ld, ensure_ascii=False, indent=2)
    return (head(p['title'] + ' // xenia dobonyi', p['description'], p['url'], p['image'], 'article', extra)
            + GENERATED + header() + f'''
	<main class="b-post">
		<nav class="b-side" aria-label="Blog posts">
			<a class="b-back" href="blog.html">&larr; All posts</a>
{side}
		</nav>
		<article class="b-article">
			<div class="b-column">
				<p class="b-meta"><time datetime="{p['day'].isoformat()}">{p['date_text']}</time>{(' &middot; ' + e(p['label'])) if p['label'] else ''}</p>
				<h1 class="b-h1">{e(p['title'])}</h1>
				<div class="b-body">
{p['body']}
				</div>
			</div>
			<nav class="b-pager" aria-label="More posts">{''.join(pager)}</nav>
		</article>
	</main>
''' + FOOT)


def feed(posts):
    items = '\n'.join(f'''  <item>
    <title>{e((p['label'] + ': ' if p['label'] else '') + p['title'])}</title>
    <link>{SITE}{p['url']}</link>
    <guid>{SITE}{p['url']}</guid>
    <pubDate>{p['day'].strftime('%a, %d %b %Y')} 09:00:00 +0000</pubDate>
    <description>{e(p['description'])}</description>
  </item>''' for p in posts)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>xenia dobonyi // blog</title>
  <link>{SITE}blog.html</link>
  <atom:link href="{SITE}feed.xml" rel="self" type="application/rss+xml"/>
  <description>I write about tech, luxury fashion and digital innovation.</description>
  <language>en</language>
{items}
</channel>
</rss>
'''


def sitemap(posts):
    old = (ROOT / 'sitemap.xml').read_text(encoding='utf-8') if (ROOT / 'sitemap.xml').exists() else ''
    home = re.search(r'<loc>https://xeniadobonyi.com/</loc><lastmod>([^<]+)</lastmod>', old)
    urls = ['  <url><loc>%s</loc><lastmod>%s</lastmod></url>' % (SITE, home.group(1) if home else Date.today().isoformat()),
            '  <url><loc>%sblog.html</loc><lastmod>%s</lastmod></url>' % (SITE, posts[0]['day'].isoformat())]
    urls += ['  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>' % (SITE, p['url'], p['day'].isoformat()) for p in posts]
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % '\n'.join(urls)


def main():
    posts = sorted((read_post(f) for f in (ROOT / '_blog').glob('*.md') if not f.name.startswith('_')), key=lambda p: (p['day'], p['slug']), reverse=True)
    if not posts:
        raise SystemExit('No posts found in _blog/')
    (ROOT / 'blog.html').write_text(index_page(posts), encoding='utf-8')
    for i, p in enumerate(posts):
        (ROOT / p['url']).write_text(post_page(posts, i), encoding='utf-8')
    (ROOT / 'feed.xml').write_text(feed(posts), encoding='utf-8')
    (ROOT / 'sitemap.xml').write_text(sitemap(posts), encoding='utf-8')
    print('Built blog.html, %d posts, feed.xml and sitemap.xml' % len(posts))


if __name__ == '__main__':
    main()
