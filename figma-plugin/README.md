# TxBD Commemorative — Homepage Builder (Figma plugin)

Builds the Commemorative Series **homepage as native, editable Figma layers** — real
color + text **styles**, **auto-layout**, **components** (buttons, cards, stat, etc.),
and **embedded images**. No HTML import, so none of the importer artifacts (button sheen,
collapsed accordions, dropped backgrounds, empty nav).

## Run it (Figma desktop app required)
1. Open the **Figma desktop app** (dev plugins don't load in the browser version).
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select `figma-plugin/manifest.json` from this project.
4. Open any file (or a new one) → **Plugins → Development → “TxBD Commemorative — Homepage Builder” → Run**.
5. It builds a frame **“Homepage — Commemorative Series”** (1440 wide) plus a **“TxBD Components”**
   group, and registers color/text styles in the file. It zooms to the result when done.

## Fonts
Uses **Playfair Display** (display serif) + **Inter** (body). Inter ships with Figma; Playfair
Display is a free Google font — if it isn't enabled it falls back to Inter automatically (run will
still succeed). To guarantee the serif, enable Playfair Display in Figma first.

## Rebuild after edits
The image data is baked into `code.js`. To regenerate it from the source design/assets:
```
python3 export/build-plugin.py
```
(`code.template.js` is the logic; `build-plugin.py` injects optimized base64 images → `code.js`.)

## Notes
- This is v1 of the native rebuild — faithful, not a pixel photocopy. After your first run, share a
  screenshot and I'll tune spacing/specifics.
- The repeated atoms (Button Primary/Navy/Outline, Collection Card, Stat) are real **components**;
  page elements use **instances** so edits propagate. More atoms can be componentized / given
  variants on request.
- Product and Content pages can be added as additional build functions in the same plugin.
