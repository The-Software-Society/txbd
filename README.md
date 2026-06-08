# TxBD Commemorative Series, Design Templates (Phase 1)

HTML/CSS design templates for the **Texas Bullion Depository, State of Texas Commemorative
Series**. Built in code, exported to print-perfect PDFs, then converted to an editable Figma file via
**Magicul (PDF → Figma)**. Final deliverable = a Figma file of reusable templates + components.

## What's in Phase 1 (the "first look")
- **Design system**, `css/tokens.css` (brand palette/type/spacing, sampled from the approved style
  guide) + `pages/tokens.html` (a swatch/component seed page).
- **Global components**, header nav, navy footer, **Authorized-Retailers block**, product cards,
  button set, spec table, accordion, collapsible disclaimer, contact banner, breadcrumb, timeline.
- **Two flagship templates** (desktop 1440 + mobile 390):
  - `pages/product-2026-1oz-gold.html`, Product Detail (gallery, specs-first, sticky retailer CTA,
    progressive-disclosure legal, related variants).
  - `pages/content-commemorative-series.html`, Content / Educational (hero, two product lines,
    heritage timeline, designer cross-link).

Phase 2 reserves the remaining 3 template families (Collection, Hub, Where-to-Buy), all remaining
page instances × responsive, and final Figma library polish + revisions.

## Folder structure
```
txbd-commemorative/
├── css/            tokens, base, components, pages, responsive
├── pages/          tokens.html + the two flagship templates
├── assets/img/     optimized coin/lifestyle/designer imagery
├── export/
│   ├── generate-pdf.js   Playwright → one tall PDF per page per breakpoint
│   └── out/              generated PDFs (upload these to Magicul)
└── package.json
```

## Preview locally
Open `pages/*.html` directly in a browser, or serve the folder:
```bash
python3 -m http.server 8080   # then visit http://localhost:8080/pages/
```

## Regenerate the PDFs
```bash
npm install
npx playwright install chromium   # first time only
npm run pdf                        # writes export/out/*.pdf
```
Output: `<page>--desktop-1440.pdf` and `<page>--mobile-390.pdf` for each page.

### Why these export settings (for clean Magicul → Figma)
- `emulateMedia('screen')`, converts the real on-screen responsive design (not a stripped print view).
- **One PDF page = one full design**, page height = full `scrollHeight`, so each design becomes a
  single Figma frame with no pagination splits.
- `printBackground: true`, keeps all brand fills (navy header, gold banners).
- `margin: 0`, the PDF page size equals the design size → correct Figma frame dimensions.
- Waits on `document.fonts.ready`, Playfair Display + Inter render and are subset-embedded; text
  stays **selectable** (verified: ToUnicode CMaps present in output).

## Step 1, Convert with Magicul (PDF → Figma)
1. Go to Magicul → **PDF to Figma**. Upload from `export/out/`. Convert **desktop** files first,
   then mobile (one design = one frame).
2. Open the generated `.fig` / Figma file. Confirm:
   - Text is **editable** (not outlined). Both fonts are standard Google fonts, if Magicul outlines
     any text, select it in Figma and re-apply **Playfair Display** (display) or **Inter** (body).
   - Brand colors match the tokens below; images came through crisp.
3. If any single page imports poorly, re-run it through a fallback importer (`pdf.to.design` by
   divRIOTS, Codia AI PDF, or Importrix), same PDF, just a different converter.

## Step 2, Figma cleanup → reusable library (Phase 1 deliverable)
Magicul output is **absolutely positioned** (PDF has no layout semantics), so rebuild the system:
1. **Seed styles** from the `tokens` frame, create Figma color styles + text styles:
   - Navy `#001F3D`, Navy-900 `#06121E`, Gold `#F0C030`, Bronze `#7E6018`, Red `#BA0630`,
     Slate `#485460`, Border `#B4BAC0`, Paper `#FBFAF7`.
   - Text: Display = Playfair Display; Body = Inter (sizes in `tokens.css`).
2. **Componentize the repeated blocks** (build once, reuse on every page): header nav, footer,
   **Authorized-Retailers block**, product card, button (variants: primary/navy/outline + sizes),
   badge, spec table row, accordion, contact banner, breadcrumb.
3. **Apply Auto Layout** to each component and to page sections (top-down, matching the flex/grid the
   HTML already uses).
4. **Bind** fills/text to the styles from step 1; name + organize layers; add a cover page.

## Brand tokens (sampled from the approved style guide)
| Token | Hex | Role |
|---|---|---|
| Navy 700 | `#001F3D` | primary, header, footer, headings |
| Navy 900 | `#06121E` | deepest navy |
| Gold 500 | `#F0C030` | primary accent / CTA |
| Gold 700 | `#7E6018` | bronze detailing |
| Red 600 | `#BA0630` | Texas accent |
| Slate 600 | `#485460` | body/secondary text |
| Gray 300 | `#B4BAC0` | borders |
| Paper | `#FBFAF7` | page background |

**Fonts:** Playfair Display (display serif) + Inter (body). These approximate the style guide's
serif/sans pairing and are present in Figma, **swap to the true licensed brand fonts when provided.**

## Notes
- Copy is the **approved** TxBD content (`2026 TxBd Site Content Updates V2`). Long copy is moved into
  progressive disclosure (accordions, collapsible legal), not deleted.
- Retailer phone numbers are placeholders pending the final authorized-dealer contact list.
- Metal price ticker values are placeholders (live data wired by the bdma dev team).
