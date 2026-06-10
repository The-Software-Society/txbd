#!/usr/bin/env python3
"""
Build a .zip bundle for html.to.design's "import a .zip of webpages".
Contains import-friendly DESKTOP pages + forced-MOBILE pages + brand
guidelines + component states, all sharing css/ and assets/.
A single zip import brings in the whole experience.

Usage:  python3 export/build-zip.py
"""
import io, os, re, shutil, zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
DIST = 'dist-import'
ZIP = 'txbd-figma-import.zip'

CSS = ['tokens', 'base', 'components', 'pages', 'responsive', 'animations', 'import', 'states']

# desktop pages: (source, output, label)
DESKTOP = [
    ('pages/tokens.html', '00-brand-guidelines.html'),
    ('pages/home.html', '01-home.html'),
    ('pages/product-2026-1oz-gold.html', '02-product-2026-1oz-gold.html'),
    ('pages/first-in-class.html', '03-first-in-class.html'),
    ('pages/info-template.html', '04-info-page-template.html'),
    ('pages/states.html', '05-component-states.html'),
]
MOBILE = [
    ('pages/home.html', '06-home-mobile.html'),
    ('pages/product-2026-1oz-gold.html', '07-product-mobile.html'),
    ('pages/first-in-class.html', '08-first-in-class-mobile.html'),
]

FLAT_NAV = ('<nav class="mainnav" aria-label="Primary">'
            '<a class="mainnav__link" href="#">Coins &amp; Redbacks</a>'
            '<a class="mainnav__link" href="#">The Depository</a>'
            '<a class="mainnav__link" href="#">Account</a>'
            '<a class="mainnav__link" href="#">Support</a></nav>')

# ---------- fresh dist ----------
if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST + '/css', exist_ok=True)
os.makedirs(DIST + '/assets/img', exist_ok=True)

# ---------- css ----------
for c in CSS:
    shutil.copy(f'css/{c}.css', f'{DIST}/css/{c}.css')

# mobile-force.css: unwrap responsive media blocks so mobile layout
# applies at any viewport, plus a 390 phone frame + re-show hamburger.
def unwrap(css, header):
    i = css.find(header)
    if i < 0:
        return ''
    j = css.find('{', i); depth = 0; k = j
    while k < len(css):
        if css[k] == '{':
            depth += 1
        elif css[k] == '}':
            depth -= 1
            if depth == 0:
                break
        k += 1
    return css[j + 1:k]

resp = open('css/responsive.css', encoding='utf-8').read()
mobile_force = (unwrap(resp, '@media (max-width: 900px)') + '\n' +
                unwrap(resp, '@media (max-width: 768px)') + '\n' +
                'html,body{background:#E8EAED;margin:0;}\n'
                '.mobileframe{width:390px;margin:0 auto;overflow:hidden;background:var(--paper);}\n'
                '.hamburger{display:inline-flex !important;}\n'
                '.mainnav,.site-header__actions{display:none !important;}\n')
open(f'{DIST}/css/mobile-force.css', 'w', encoding='utf-8').write(mobile_force)

# ---------- optimize + copy assets (everything -> .jpg) ----------
asset_src = {}      # base -> source path
for f in os.listdir('assets/img'):
    base = os.path.splitext(f)[0]
    asset_src[base] = 'assets/img/' + f
def make_jpg(base):
    im = Image.open(asset_src[base])
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255)); im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > 1400:
        h = round(im.height * 1400 / im.width); im = im.resize((1400, h), Image.LANCZOS)
    im.save(f'{DIST}/assets/img/{base}.jpg', 'JPEG', quality=82, optimize=True)

# ---------- page transform ----------
def transform(src, mobile=False):
    h = open(src, encoding='utf-8').read()
    h = re.sub(r'<script>document\.documentElement[^<]*</script>\s*', '', h)
    h = re.sub(r'<script src="\.\./js/[^"]+"></script>\s*', '', h)
    h = re.sub(r'<nav class="mainnav"[^>]*>.*?</nav>', FLAT_NAV, h, flags=re.S)
    h = re.sub(r'<div class="contact-banner__media" style="background-image:url\(\'([^\']+)\'\)"></div>',
               r'<img class="contact-banner__media" src="\1" alt="">', h)
    # real +/- bars for accordion icons (importer ignores the pseudo transform)
    h = h.replace('<span class="acc__icon"></span>', '<span class="acc__icon"><span class="bar-h"></span><span class="bar-v"></span></span>')
    h = h.replace('../css/', 'css/').replace('../assets/', 'assets/').replace('../index.html', '#')
    # all images -> .jpg
    h = re.sub(r'assets/img/([^"\')]+?)\.(png|jpe?g)', r'assets/img/\1.jpg', h)
    # ensure import.css linked (after page styles)
    links = '<link rel="stylesheet" href="css/import.css">\n'
    if mobile:
        links += '<link rel="stylesheet" href="css/mobile-force.css">\n'
    if 'css/import.css' in h:
        # states page already links import (+states); just add mobile-force if needed
        if mobile and 'mobile-force' not in h:
            h = h.replace('</head>', '<link rel="stylesheet" href="css/mobile-force.css">\n</head>')
    else:
        h = h.replace('</head>', links + '</head>')
    if mobile:
        h = h.replace('<body>', '<body><div class="mobileframe">', 1)
        h = h.rsplit('</body>', 1)
        h = ('</div></body>').join(h) if len(h) == 2 else ''.join(h)
        h = h.replace('</div></body>', '</div>\n</body>')
    return h

used_bases = set()
def write_page(src, out, mobile=False):
    h = transform(src, mobile)
    for b in re.findall(r'assets/img/([^"\')]+)\.jpg', h):
        used_bases.add(b)
    open(f'{DIST}/{out}', 'w', encoding='utf-8').write(h)

for src, out in DESKTOP:
    write_page(src, out, mobile=False)
for src, out in MOBILE:
    write_page(src, out, mobile=True)

for b in sorted(used_bases):
    if b in asset_src:
        make_jpg(b)
    else:
        print('  ! missing asset for', b)

# README
open(f'{DIST}/README.txt', 'w', encoding='utf-8').write(
    "TxBD Commemorative — Figma import bundle\n\n"
    "Import this zip in html.to.design (File tab -> upload .zip).\n"
    "It imports every webpage:\n"
    "  00 Brand guidelines (tokens & components)\n"
    "  01 Home / 02 Product / 03 Content (desktop)\n"
    "  04 Component states (hover/open/active)\n"
    "  05-07 Home/Product/Content (mobile)\n\n"
    "Set the import viewport to Desktop (1440). The 05-07 mobile pages are\n"
    "hard-framed to 390px so they import as phone layouts in the same pass.\n")

# ---------- zip ----------
if os.path.exists(ZIP):
    os.remove(ZIP)
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(DIST):
        for fn in files:
            fp = os.path.join(root, fn)
            z.write(fp, os.path.relpath(fp, DIST))

size = os.path.getsize(ZIP) // 1024
html_count = len(DESKTOP) + len(MOBILE)
print(f'wrote {ZIP}: {size} KB | {html_count} pages | {len(used_bases)} images')
