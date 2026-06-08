#!/usr/bin/env python3
"""
Combine multiple page templates into ONE import-friendly standalone
HTML file for html.to.design — one upload imports every design as
labeled, stacked 1440-wide blocks.

Usage:
  python3 export/build-combined.py                 # desktop (1440) -> txbd-all-desktop.html
  python3 export/build-combined.py 390 mobile      # mobile (390)   -> txbd-all-mobile.html
"""
import base64, io, re, sys, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

WIDTH = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
TAG = sys.argv[2] if len(sys.argv) > 2 else 'desktop'
OUT = f'txbd-all-{TAG}.html'

PAGES = [
    ('pages/home.html', 'Homepage'),
    ('pages/product-2026-1oz-gold.html', 'Product Detail — 2026 1 oz Gold Lone Star'),
    ('pages/content-commemorative-series.html', 'Content / Educational — The Commemorative Series'),
    ('pages/tokens.html', 'Design System — Tokens & Components'),
    ('pages/states.html', 'Component States & Interactions'),
]
# the states board is a width-agnostic component reference -> desktop only
if WIDTH <= 768:
    PAGES = [p for p in PAGES if 'states.html' not in p[0]]
CSS_ORDER = ['tokens', 'base', 'components', 'pages', 'responsive', 'animations', 'import', 'states']

FLAT_NAV = ('<nav class="mainnav" aria-label="Primary">'
            '<a class="mainnav__link" href="#">Coins &amp; Redbacks</a>'
            '<a class="mainnav__link" href="#">The Depository</a>'
            '<a class="mainnav__link" href="#">Account</a>'
            '<a class="mainnav__link" href="#">Support</a></nav>')

def transform_body(html):
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.S)   # drop inline/included JS
    body = re.sub(r'<nav class="mainnav"[^>]*>.*?</nav>', FLAT_NAV, body, flags=re.S)
    return body

# ---- collect inline <style> blocks (e.g. tokens.html swatch styles) ----
inline_styles = []
sections = []
for path, label in PAGES:
    raw = open(path, encoding='utf-8').read()
    for m in re.findall(r'<style>(.*?)</style>', raw, re.S):
        if m not in inline_styles:
            inline_styles.append(m)
    body = transform_body(raw)
    sections.append(f'<div class="tpl"><div class="tpl__label">{label}</div><div class="page">{body}</div></div>')

doc_body = '\n'.join(sections)

# ---- embed every referenced image (deduped) ----
def data_uri(path, maxw=1200, q=80):
    im = Image.open('assets/img/' + path)
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255)); im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > maxw:
        h = round(im.height * maxw / im.width); im = im.resize((maxw, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

for f in sorted(set(re.findall(r'\.\./assets/img/([^"\')]+)', doc_body))):
    doc_body = doc_body.replace('../assets/img/' + f, data_uri(f))

# ---- contact-banner background-image div -> real <img> (after data URIs exist) ----
doc_body = re.sub(
    r'<div class="contact-banner__media" style="background-image:url\(\'(data:[^\']+)\'\)"></div>',
    r'<img class="contact-banner__media" src="\1" alt="State of Texas commemorative products">',
    doc_body)

# ---- combined CSS ----
css = ''
for c in CSS_ORDER:
    css += f'\n/* ===== {c}.css ===== */\n' + open(f'css/{c}.css', encoding='utf-8').read()
for pat in (r'\.btn::after\s*\{[^}]*\}', r'\.btn:hover::after\s*\{[^}]*\}', r'\.mainnav__link::after\s*\{[^}]*\}'):
    css = re.sub(pat, '', css)
css += '\n/* page inline styles */\n' + '\n'.join(inline_styles)
css += f'''
/* ===== combiner ===== */
html, body {{ background: #E8EAED; margin: 0; }}
.tpl {{ margin: 0 auto 72px; }}
.tpl__label {{ width: {WIDTH}px; margin: 0 auto; box-sizing: border-box; font-family: Inter, sans-serif;
  font-weight: 700; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #F0C030;
  background: #06121E; padding: 14px 24px; }}
.page {{ width: {WIDTH}px; margin: 0 auto; background: #FBFAF7; overflow: hidden; }}
'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TxBD Commemorative — All Templates ({TAG})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
{doc_body}
</body>
</html>'''

open(OUT, 'w', encoding='utf-8').write(html)
left = re.findall(r'\.\./(?:assets|css|js)/[^"\')]+', html)
print(f'wrote {OUT}: {len(html)//1024} KB | width {WIDTH} | pages {len(PAGES)} | unresolved refs: {sorted(set(left)) or "none"}')
