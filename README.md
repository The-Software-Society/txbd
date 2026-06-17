# TxBD Commemorative Series — Design Templates

Design system + page templates for the **Texas Bullion Depository — State of Texas Commemorative
Series**. Built in HTML/CSS, delivered to Figma via **html.to.design** (a single `.zip` import).

## Brand
- **Palette:** true black (**Onyx** `#18181B` / `#08080A`) + **gold** (`#F0C030`) on warm paper
  (`#FBFAF7`). Warm-neutral grays, no blue, no red.
- **Type:** **Crimson Text** (display serif) + **Archivo** (body sans) — the approved brand fonts,
  both free Google fonts present in Figma.
- **Iconography:** heritage/typographic — gold lone-star marks, gold serif numerals, gold rules;
  generic UI icons kept only for functional affordances.

## Pages (`pages/`)
| File | What it is |
|---|---|
| `home.html` | Homepage — hero, collections, splits, FAQ, where-to-buy |
| `content-commemorative-series.html` | The Commemorative Series — program overview |
| `content-2025-collection.html` | The 2025 Inaugural Collection — the historic first release |
| `content-collections.html` | The 2026 Lone Star Collection — overview + product cards |
| `product-2026-1oz-gold.html` | Product Detail — gallery, specs, retailer block, **designer band** |
| `content-modern-redbacks.html` | Modern Redbacks — the gold bills of Texas |
| `product-redback-5cg.html` | Product Detail — 5 Centigram Modern Redback |
| `designer-joel-iskowitz.html` | Designer — Joel Iskowitz ("Meet the Coin Designer") |
| `first-in-class.html` | Info page example ("State Oversight / HB 483") built from the kit |
| `info-template.html` | **Info / Educational page template** — labeled block kit ("the options") |
| `tokens.html` | Brand guidelines — color + type + component reference |
| `states.html` | Component states & interactions (hover / open / active) |

`board.html` previews all of the above (desktop + mobile) on one canvas. `pages/nav-preview*.html`
are internal nav explorations — not part of the client deliverable or the import zip.

## Structure
```
txbd-commemorative/
├── css/         tokens · base · components · pages · responsive · animations · import · states
├── pages/       the templates above
├── assets/img/  optimized coin / lifestyle / depository imagery
├── js/app.js    accordions, mega-nav, drawer, reveal-on-scroll (live preview only)
├── export/      build scripts (see below)
└── figma-plugin/ native Figma builder (alternative to the zip route)
```

## Deliver to Figma (primary route)
```bash
python3 export/build-zip.py        # -> txbd-figma-import.zip  (desktop + forced-mobile pages)
```
In **html.to.design** → **File tab → upload the .zip**, viewport **Desktop / 1440**. One import brings
in every page (the mobile pages are hard-framed to 390 so they import as phone layouts in the same
pass). The builder inlines an import-friendly layer (`css/import.css`): flat nav, no button sheen,
accordions shown open with real ± bars, banners as real `<img>`, optimized assets.

## Preview locally
```bash
python3 -m http.server 8080 --bind 127.0.0.1   # then open:
#   http://localhost:8080/            index — links to every page
#   http://localhost:8080/board.html  board view — all pages, desktop + mobile, as Figma-style frames
```
The board must be opened over the local server (not `file://`) — it reads each page's height through
same-origin iframe access.

## Other build script (`export/`)
- `build-plugin.py` → `figma-plugin/code.js` — an alternative route: a Figma plugin that builds the
  homepage as **native layers** (color/text styles, auto-layout, components) instead of importing
  HTML. Optional; the zip is the primary delivery.

## Tokens
| Token | Hex | Role |
|---|---|---|
| Onyx 700 | `#18181B` | primary dark — ticker, footer, dark bands, headings |
| Onyx 900 | `#08080A` | deepest black |
| Gold 500 | `#F0C030` | primary accent / CTA |
| Gold 400 | `#D8C660` | light gold |
| Gold 700 | `#7E6018` | bronze detailing |
| Slate 600 | `#4A4A4E` | body / secondary text |
| Gray 300 | `#BBBBC0` | borders |
| Paper | `#FBFAF7` | page background |

Full token definitions in `css/tokens.css`; the visual reference is `pages/tokens.html`.
