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

# desktop pages: (source, output)
DESKTOP = [
    ('pages/tokens.html', '00-brand-guidelines.html'),
    ('pages/home.html', '01-home.html'),
    ('pages/content-commemorative-series.html', '02-commemorative-series.html'),
    ('pages/content-collections.html', '03-collection-2026.html'),
    ('pages/product-2026-1oz-gold.html', '04-product-2026-1oz-gold.html'),
    ('pages/content-modern-redbacks.html', '05-modern-redbacks.html'),
    ('pages/product-redback-5cg.html', '06-product-redback-5cg.html'),
    ('pages/designer-joel-iskowitz.html', '07-designer-joel-iskowitz.html'),
    ('pages/first-in-class.html', '08-first-in-class.html'),
    ('pages/info-template.html', '09-info-page-template.html'),
    ('pages/states.html', '10-component-states.html'),
]
MOBILE = [
    ('pages/home.html', '11-home-mobile.html'),
    ('pages/content-commemorative-series.html', '12-commemorative-series-mobile.html'),
    ('pages/content-collections.html', '13-collection-2026-mobile.html'),
    ('pages/product-2026-1oz-gold.html', '14-product-2026-mobile.html'),
    ('pages/content-modern-redbacks.html', '15-modern-redbacks-mobile.html'),
    ('pages/product-redback-5cg.html', '16-product-redback-5cg-mobile.html'),
    ('pages/designer-joel-iskowitz.html', '17-designer-mobile.html'),
    ('pages/first-in-class.html', '18-first-in-class-mobile.html'),
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

def unwrap_all(css, header):
    out, start = [], 0
    while True:
        i = css.find(header, start)
        if i < 0:
            break
        j = css.find('{', i); depth = 0; k = j
        while k < len(css):
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
                if depth == 0:
                    break
            k += 1
        out.append(css[j + 1:k]); start = k + 1
    return '\n'.join(out)

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

def make_png(base):
    # transparency-preserving copy (coin cut-outs etc.)
    im = Image.open(asset_src[base]).convert('RGBA')
    if im.width > 1200:
        h = round(im.height * 1200 / im.width); im = im.resize((1200, h), Image.LANCZOS)
    im.save(f'{DIST}/assets/img/{base}.png', 'PNG', optimize=True)

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
    # images -> .jpg, except transparent cut-outs (keep .png with alpha)
    def _img(m):
        base = m.group(1)
        return f'assets/img/{base}.png' if base.endswith('-cut') else f'assets/img/{base}.jpg'
    h = re.sub(r'assets/img/([^"\')]+?)\.(png|jpe?g)', _img, h)
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
        # unwrap THIS page's own inline @media blocks so its responsive
        # rules fire inside the 390 frame (which renders at desktop viewport)
        inline = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', h, flags=re.S))
        extra = (unwrap_all(inline, '@media (max-width: 900px)') + '\n' +
                 unwrap_all(inline, '@media (max-width: 768px)'))
        if extra.strip():
            h = h.replace('</head>', '<style>\n' + extra + '\n</style>\n</head>')
        h = h.replace('<body>', '<body><div class="mobileframe">', 1)
        h = h.rsplit('</body>', 1)
        h = ('</div></body>').join(h) if len(h) == 2 else ''.join(h)
        h = h.replace('</div></body>', '</div>\n</body>')
    return h

used_bases = set()
used_png = set()
def write_page(src, out, mobile=False):
    h = transform(src, mobile)
    for b in re.findall(r'assets/img/([^"\')]+)\.jpg', h):
        used_bases.add(b)
    for b in re.findall(r'assets/img/([^"\')]+)\.png', h):
        used_png.add(b)
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
for b in sorted(used_png):
    if b in asset_src:
        make_png(b)
    else:
        print('  ! missing png asset for', b)

# README
open(f'{DIST}/README.txt', 'w', encoding='utf-8').write(
    "TxBD Commemorative — Figma import bundle\n\n"
    "Import this zip in html.to.design (File tab -> upload .zip).\n"
    "Set the import viewport to Desktop (1440). One import brings in every page.\n\n"
    "Desktop (00-10):\n"
    "  00 Brand guidelines (tokens & components)\n"
    "  01 Home\n"
    "  02 The Commemorative Series\n"
    "  03 The 2026 Lone Star Collection\n"
    "  04 Product — 2026 1 oz Gold Lone Star\n"
    "  05 Modern Redbacks\n"
    "  06 Product — 5cg Modern Redback\n"
    "  07 Designer — Joel Iskowitz\n"
    "  08 First in Class (state oversight)\n"
    "  09 Info / Educational page template\n"
    "  10 Component states (hover/open/active)\n\n"
    "Mobile (11-18): Home, Commemorative Series, 2026 Collection, Product 2026,\n"
    "Modern Redbacks, Product 5cg Redback, Designer, First in Class.\n"
    "These are hard-framed to 390px so they import as phone layouts in the same pass.\n")

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
