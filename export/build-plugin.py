#!/usr/bin/env python3
"""
Inject optimized, base64-encoded images into the Figma plugin template
and write figma-plugin/code.js.

Usage:  python3 export/build-plugin.py
"""
import base64, io, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# plugin image key -> source asset
SRC = {
    'hero':          'group-2026-coins.jpg',
    'coins2026':     'group-2026-coins.jpg',
    'coins2025':     'group-2025-coins.jpg',
    'redbacks':      'group-redbacks.png',
    'splitcoins':    'coin-2025-gold-pair.png',
    'splitredbacks': 'lifestyle-redbacks-hat.png',
    'joel':          'joel-iskowitz.jpg',
    'contact':       'lifestyle-coins-notes.png',
}

def b64(path, maxw=1000, q=72):
    im = Image.open('assets/img/' + path)
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > maxw:
        h = round(im.height * maxw / im.width); im = im.resize((maxw, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

images = {}
total = 0
for key, f in SRC.items():
    images[key] = b64(f); total += len(images[key])
    print(f'{len(images[key])//1024:4} KB  {key:14} <- {f}')
print('images total (base64):', total // 1024, 'KB')

tpl = open('figma-plugin/code.template.js', encoding='utf-8').read()
code = tpl.replace('__IMAGES__', json.dumps(images))
open('figma-plugin/code.js', 'w', encoding='utf-8').write(code)
print('wrote figma-plugin/code.js:', len(code) // 1024, 'KB')
