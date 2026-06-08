#!/usr/bin/env python3
"""
Build a self-contained, import-friendly standalone HTML file for
html.to.design: inlines all CSS, embeds images as base64, drops JS,
applies css/import.css overrides, and converts the contact-banner
CSS background-image into a real <img>.

Usage:  python3 export/build-standalone.py pages/home.html home-import.html
"""
import base64, io, re, sys, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SRC = sys.argv[1] if len(sys.argv) > 1 else 'pages/home.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'home-import.html'

CSS_ORDER = ['tokens', 'base', 'components', 'pages', 'responsive', 'animations', 'import']

def data_uri(path, maxw=1300, q=82):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > maxw:
        h = round(im.height * maxw / im.width); im = im.resize((maxw, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

html = open(SRC, encoding='utf-8').read()

# 1. drop the has-js flag (keeps reveal elements visible)
html = re.sub(r'<script>document\.documentElement\.className[^<]*</script>\s*', '', html)

# 2. strip stylesheet links + the JS include (no JS in the import build)
html = re.sub(r'<link rel="stylesheet" href="\.\./css/[^"]+">\s*', '', html)
html = re.sub(r'<script src="\.\./js/[^"]+"></script>\s*', '', html)

# 3. inline all CSS (import.css last); strip transform-hidden pseudo rules
#    (the importer ignores transforms and would render them as smears)
css = ''
for c in CSS_ORDER:
    css += f'\n/* ===== {c}.css ===== */\n' + open(f'css/{c}.css', encoding='utf-8').read()
for pat in (r'\.btn::after\s*\{[^}]*\}',
            r'\.btn:hover::after\s*\{[^}]*\}',
            r'\.mainnav__link::after\s*\{[^}]*\}'):
    css = re.sub(pat, '', css)
html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>')

# 4. embed every referenced image as base64
for f in sorted(set(re.findall(r'\.\./assets/img/([^"\')]+)', html))):
    html = html.replace('../assets/img/' + f, data_uri('assets/img/' + f))

# 5. convert contact-banner CSS background-image div -> real <img>
html = re.sub(
    r'<div class="contact-banner__media" style="background-image:url\(\'(data:[^\']+)\'\)"></div>',
    r'<img class="contact-banner__media" src="\1" alt="State of Texas commemorative products">',
    html)

# 6. replace the whole nav with dead-simple flat links (drops the
#    item wrappers + hidden mega/menu panels the importer chokes on)
FLAT_NAV = ('<nav class="mainnav" aria-label="Primary">'
            '<a class="mainnav__link" href="#">Coins &amp; Redbacks</a>'
            '<a class="mainnav__link" href="#">The Depository</a>'
            '<a class="mainnav__link" href="#">Account</a>'
            '<a class="mainnav__link" href="#">Support</a>'
            '</nav>')
html = re.sub(r'<nav class="mainnav"[^>]*>.*?</nav>', FLAT_NAV, html, flags=re.S, count=1)

open(OUT, 'w', encoding='utf-8').write(html)
leftover = re.findall(r'\.\./(?:assets|css|js)/[^"\')]+', html)
print(f'wrote {OUT}: {len(html)//1024} KB | unresolved refs: {sorted(set(leftover)) or "none"}')
