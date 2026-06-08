/* ============================================================
   generate-pdf.js
   Renders each design page to a single, tall, custom-sized PDF
   page per breakpoint — optimized for Magicul PDF → Figma.

   Key choices (see README "Why these settings"):
   - emulateMedia('screen')  → keep the on-screen responsive design
   - one PDF page == one full design (height = full scrollHeight)
   - printBackground: true    → keep brand fills/backgrounds
   - margins 0                → frame size == design size
   - fonts: wait for document.fonts.ready so Google fonts embed
   ============================================================ */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');

// Pages to export (label → file)
const PAGES = [
  { name: 'tokens',               file: 'pages/tokens.html' },
  { name: 'home',                 file: 'pages/home.html' },
  { name: 'product-2026-1oz-gold',file: 'pages/product-2026-1oz-gold.html' },
  { name: 'content-commemorative-series', file: 'pages/content-commemorative-series.html' },
];

// Breakpoints → frame widths
const BREAKPOINTS = [
  { label: 'desktop', width: 1440 },
  { label: 'mobile',  width: 390 },
];

async function exportPage(browser, page, bp) {
  const ctx = await browser.newContext({
    viewport: { width: bp.width, height: 1200 },
    deviceScaleFactor: 2,
  });
  const tab = await ctx.newPage();
  const url = 'file://' + path.join(ROOT, page.file);

  await tab.goto(url, { waitUntil: 'networkidle' });
  await tab.emulateMedia({ media: 'screen' });
  // Force all scroll-reveal elements visible for the static capture
  await tab.evaluate(() => document.documentElement.classList.add('force-reveal'));
  // Ensure web fonts are fully loaded before measuring/printing
  await tab.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
  await tab.waitForTimeout(400);

  // Measure full content height at this width
  const height = await tab.evaluate(() => Math.ceil(document.documentElement.scrollHeight));

  const outFile = path.join(OUT, `${page.name}--${bp.label}-${bp.width}.pdf`);
  await tab.pdf({
    path: outFile,
    width: `${bp.width}px`,
    height: `${height}px`,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    scale: 1,
  });

  await ctx.close();
  console.log(`  ✓ ${path.basename(outFile)}  (${bp.width} × ${height})`);
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  console.log('Generating PDFs → export/out/');
  for (const page of PAGES) {
    console.log(`\n${page.name}`);
    for (const bp of BREAKPOINTS) {
      await exportPage(browser, page, bp);
    }
  }
  await browser.close();
  console.log('\nDone. Upload the PDFs in export/out/ to Magicul (PDF → Figma).');
})();
