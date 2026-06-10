/* ============================================================
   TxBD Commemorative — Homepage Builder (Figma plugin)
   Native Figma layers: color + text styles, auto-layout,
   components, embedded images.
   NOTE: layoutGrow / layoutAlign are ALWAYS set AFTER appendChild
   (via add()) — Figma ignores them on unparented nodes.
   ============================================================ */

const IMAGES = __IMAGES__;

(async () => {
  // ---------- color helpers ----------
  const rgb = (hex) => { hex = hex.replace('#', ''); return { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255 }; };
  const solid = (hex, o) => { const p = { type: 'SOLID', color: rgb(hex) }; if (o != null) p.opacity = o; return [p]; };
  const C = {
    navy900: '08080A', navy700: '18181B', navy600: '232327',
    gold500: 'F0C030', gold400: 'D8C660', gold600: 'B8902A', gold700: '7E6018', gold100: 'F7EFD2',
    slate600: '4A4A4E', gray400: '8C8C92', gray300: 'BBBBC0',
    gray100: 'E9E9EB', gray50: 'F4F4F2', paper: 'FBFAF7', white: 'FFFFFF',
    onDark: 'ECECEE', onDarkMuted: 'A2A2A8'
  };

  // ---------- fonts ----------
  const wanted = [
    ['Crimson Text', 'Bold'], ['Crimson Text', 'SemiBold'], ['Crimson Text', 'Medium'],
    ['Crimson Text', 'Regular'], ['Crimson Text', 'Italic'],
    ['Archivo', 'Regular'], ['Archivo', 'Medium'], ['Archivo', 'SemiBold'], ['Archivo', 'Bold']
  ];
  const loaded = {};
  for (const [family, style] of wanted) { try { await figma.loadFontAsync({ family, style }); loaded[family + '/' + style] = true; } catch (e) {} }
  const font = (family, style) => {
    if (loaded[family + '/' + style]) return { family, style };
    if (family === 'Crimson Text') for (const s of ['Bold', 'SemiBold', 'Medium', 'Regular']) if (loaded['Crimson Text/' + s]) return { family, style: s };
    for (const s of [style, 'Regular', 'Bold']) if (loaded['Archivo/' + s]) return { family: 'Archivo', style: s };
    return { family: 'Archivo', style: 'Regular' };
  };
  const F = {
    dispBold: font('Crimson Text', 'Bold'), dispSemi: font('Crimson Text', 'SemiBold'), dispItalic: font('Crimson Text', 'Italic'),
    reg: font('Archivo', 'Regular'), med: font('Archivo', 'Medium'), semi: font('Archivo', 'SemiBold'), bold: font('Archivo', 'Bold')
  };

  // ---------- styles ----------
  const ps = (name, hex) => { const s = figma.createPaintStyle(); s.name = name; s.paints = solid(hex); };
  ps('Onyx/700 Primary', C.navy700); ps('Onyx/900 Black', C.navy900); ps('Gold/500 Accent', C.gold500);
  ps('Gold/400 Light', C.gold400); ps('Gold/700 Bronze', C.gold700); ps('Slate/600', C.slate600);
  ps('Gray/300 Border', C.gray300); ps('Paper', C.paper);

  const TS = {
    h1: { font: F.dispBold, size: 52, lh: 110, color: C.navy700 },
    h2: { font: F.dispBold, size: 36, lh: 116, color: C.navy700 },
    h3: { font: F.dispSemi, size: 24, lh: 128, color: C.navy700 },
    h4: { font: F.bold, size: 19, lh: 130, color: C.navy700 },
    lead: { font: F.reg, size: 21, lh: 152, color: C.slate600 },
    body: { font: F.reg, size: 17, lh: 162, color: C.slate600 },
    small: { font: F.reg, size: 15, lh: 150, color: C.gray400 },
    eyebrow: { font: F.bold, size: 13, lh: 120, color: C.gold600, ls: 16, case: 'UPPER' }
  };
  for (const [name, t] of [['Display/H1', TS.h1], ['Display/H2', TS.h2], ['Display/H3', TS.h3], ['Body/Lead', TS.lead], ['Body/Default', TS.body], ['Label/Eyebrow', TS.eyebrow]]) {
    try { const s = figma.createTextStyle(); s.name = name; s.fontName = t.font; s.fontSize = t.size; s.lineHeight = { unit: 'PERCENT', value: t.lh }; if (t.ls != null) s.letterSpacing = { unit: 'PERCENT', value: t.ls }; } catch (e) {}
  }

  // ---------- node helpers ----------
  function add(parent, child, o) { parent.appendChild(child); o = o || {}; if (o.grow) child.layoutGrow = 1; if (o.stretch) child.layoutAlign = 'STRETCH'; return child; }
  function fixW(f, w) { f.counterAxisSizingMode = 'FIXED'; f.resize(w, Math.max(1, f.height)); return f; }

  function T(chars, ts, o) {
    o = o || {};
    const t = figma.createText();
    t.fontName = ts.font; t.fontSize = ts.size; t.characters = chars;
    t.fills = solid(o.color || ts.color);
    if (ts.lh) t.lineHeight = { unit: 'PERCENT', value: ts.lh };
    if (ts.ls != null) t.letterSpacing = { unit: 'PERCENT', value: ts.ls };
    if (ts.case) t.textCase = ts.case;
    t.textAlignHorizontal = o.align || 'LEFT';
    if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); }
    else if (o.fill) { t.textAutoResize = 'HEIGHT'; t.resize(400, t.height); }
    else t.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (o.name) t.name = o.name;
    return t;
  }
  // text that fills its parent width and wraps
  const Tfill = (parent, chars, ts, o) => { o = o || {}; o.fill = true; return add(parent, T(chars, ts, o), { stretch: true }); };

  function AF(name, dir, o) {
    o = o || {};
    const f = figma.createFrame();
    f.name = name; f.layoutMode = dir;
    f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
    f.itemSpacing = o.gap || 0;
    f.paddingTop = o.pt != null ? o.pt : (o.py != null ? o.py : (o.p || 0));
    f.paddingBottom = o.pb != null ? o.pb : (o.py != null ? o.py : (o.p || 0));
    f.paddingLeft = o.pl != null ? o.pl : (o.px != null ? o.px : (o.p || 0));
    f.paddingRight = o.pr != null ? o.pr : (o.px != null ? o.px : (o.p || 0));
    if (o.justify) f.primaryAxisAlignItems = o.justify;
    if (o.align) f.counterAxisAlignItems = o.align;
    f.fills = o.fill ? solid(o.fill, o.fillOpacity) : [];
    if (o.radius != null) f.cornerRadius = o.radius;
    if (o.stroke) { f.strokes = solid(o.stroke, o.strokeOpacity); f.strokeWeight = o.strokeW || 1; f.strokeAlign = 'INSIDE'; }
    if (o.clip != null) f.clipsContent = o.clip;
    return f;
  }

  const imgCache = {};
  function imageFill(key, opacity) {
    try {
      if (!IMAGES[key]) return null;
      if (!imgCache[key]) { const bytes = figma.base64Decode ? figma.base64Decode(IMAGES[key]) : Uint8Array.from(atob(IMAGES[key]), c => c.charCodeAt(0)); imgCache[key] = figma.createImage(bytes).hash; }
      const p = { type: 'IMAGE', scaleMode: 'FILL', imageHash: imgCache[key] }; if (opacity != null) p.opacity = opacity; return p;
    } catch (e) { return null; }
  }
  // image box with fixed height; width controlled by caller (grow/stretch)
  function media(name, key, w, h, radius) {
    const f = AF(name, 'VERTICAL', { radius: radius || 0, clip: true });
    const img = imageFill(key); f.fills = img ? [img] : solid(C.gray100);
    f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'FIXED'; f.resize(w, h);
    return f;
  }

  function eyebrow(parent, txt, onDark) {
    const r = AF('eyebrow', 'HORIZONTAL', { gap: 8, align: 'CENTER' });
    const line = figma.createRectangle(); line.resize(24, 2); line.name = 'line'; line.fills = solid(onDark ? C.gold400 : C.gold500);
    add(r, line); add(r, T(txt, TS.eyebrow, { color: onDark ? C.gold400 : C.gold600 }));
    return add(parent, r);
  }

  // ---------- components ----------
  const components = [];
  const compFrom = (node, name) => { const c = figma.createComponentFromNode(node); c.name = name; components.push(c); return c; };

  function buildButton(label, kind) {
    const f = AF('Button/' + kind, 'HORIZONTAL', { gap: 8, px: 26, py: 15, radius: 4, align: 'CENTER', justify: 'CENTER' });
    let fill = C.gold500, col = C.navy900, stroke = null, sOp = null;
    if (kind === 'Navy') { fill = C.navy700; col = C.white; }
    else if (kind === 'Outline') { fill = null; col = C.navy700; stroke = C.gray300; }
    else if (kind === 'GhostLight') { fill = null; col = C.white; stroke = 'FFFFFF'; sOp = 0.4; }
    f.fills = fill ? solid(fill) : [];
    if (stroke) { f.strokes = solid(stroke, sOp); f.strokeWeight = 1.5; }
    add(f, T(label, { font: F.bold, size: 15, lh: 100, color: col, ls: 5, case: 'UPPER' }, { name: 'label' }));
    return f;
  }
  const btnPrimary = compFrom(buildButton('Where to Buy', 'Primary'), 'Button/Primary');
  const btnNavy = compFrom(buildButton('Contact Us', 'Navy'), 'Button/Navy');
  const btnOutline = compFrom(buildButton('Find a Retailer', 'Outline'), 'Button/Outline');
  function button(parent, comp, label, o) { const i = comp.createInstance(); const t = i.findOne(n => n.type === 'TEXT' && n.name === 'label'); if (t) t.characters = label; return add(parent, i, o); }

  function buildStat(num, label) {
    const f = AF('Stat', 'VERTICAL', { gap: 8, px: 16, py: 32, align: 'CENTER', justify: 'CENTER' });
    add(f, T(num, { font: F.dispBold, size: 40, lh: 100, color: C.navy700 }, { name: 'num', align: 'CENTER' }));
    add(f, T(label, TS.small, { name: 'label', align: 'CENTER' }));
    return f;
  }
  const statComp = compFrom(buildStat('2025', 'Inaugural release year'), 'Stat');
  function stat(parent, num, label) { const i = statComp.createInstance(); const a = i.findOne(n => n.type === 'TEXT' && n.name === 'num'); if (a) a.characters = num; const b = i.findOne(n => n.type === 'TEXT' && n.name === 'label'); if (b) b.characters = label; return add(parent, i, { grow: true }); }

  function buildCard(imgKey, tag, title, meta) {
    const f = AF('Collection Card', 'VERTICAL', { radius: 12, clip: true, stroke: C.gray100, strokeW: 1 });
    f.fills = solid(C.white);
    add(f, media('media', imgKey, 380, 220), { stretch: true });
    const body = AF('body', 'VERTICAL', { gap: 12, p: 24 }); add(f, body, { stretch: true });
    const tags = AF('tags', 'HORIZONTAL', { gap: 8 }); add(body, tags);
    const badge = AF('badge', 'HORIZONTAL', { px: 10, py: 5, radius: 999, fill: C.gold100 }); add(tags, badge);
    add(badge, T(tag, { font: F.bold, size: 13, lh: 100, color: C.gold700, ls: 5, case: 'UPPER' }, { name: 'tag' }));
    Tfill(body, title, TS.h4, { name: 'title', color: C.navy700 });
    Tfill(body, meta, TS.small, { name: 'meta' });
    add(body, T('Explore  ›', { font: F.bold, size: 15, lh: 100, color: C.gold700, ls: 5, case: 'UPPER' }, { name: 'link' }));
    return f;
  }
  const cardComp = compFrom(buildCard('coins2026', 'New', 'The 2026 Collection', 'Lady Liberty & the Texas Capitol.'), 'Collection Card');
  function card(parent, imgKey, tag, title, meta) {
    const i = cardComp.createInstance();
    const m = i.findOne(n => n.name === 'media'); if (m) { const f = imageFill(imgKey); if (f) m.fills = [f]; }
    const tg = i.findOne(n => n.type === 'TEXT' && n.name === 'tag'); if (tg) tg.characters = tag;
    const tt = i.findOne(n => n.type === 'TEXT' && n.name === 'title'); if (tt) tt.characters = title;
    const mm = i.findOne(n => n.type === 'TEXT' && n.name === 'meta'); if (mm) mm.characters = meta;
    return add(parent, i, { grow: true });
  }

  function faqItem(parent, q, a) {
    const f = AF('FAQ Item', 'VERTICAL', { gap: 10, pt: 20, pb: 24 }); add(parent, f, { stretch: true });
    const top = AF('q-row', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER', gap: 24 }); add(f, top, { stretch: true });
    add(top, T(q, TS.h3, { name: 'q' }), { grow: true });
    const ic = AF('icon', 'VERTICAL', { radius: 999, fill: C.navy700, align: 'CENTER', justify: 'CENTER' });
    ic.counterAxisSizingMode = 'FIXED'; ic.primaryAxisSizingMode = 'FIXED'; ic.resize(28, 28);
    const bar = figma.createRectangle(); bar.resize(12, 2); bar.fills = solid(C.white); add(ic, bar); add(top, ic);
    Tfill(f, a, TS.body, { name: 'a' });
    const rule = figma.createRectangle(); rule.resize(100, 1); rule.fills = solid(C.gray100); rule.name = 'rule'; add(f, rule, { stretch: true });
    return f;
  }

  function bullet(parent, strongTxt, rest) {
    const r = AF('bullet', 'HORIZONTAL', { gap: 12, align: 'MIN' }); add(parent, r, { stretch: true });
    const dotWrap = AF('d', 'VERTICAL', { pt: 8 }); const dot = figma.createEllipse(); dot.resize(8, 8); dot.fills = solid(C.gold500); add(dotWrap, dot); add(r, dotWrap);
    const tw = AF('tw', 'VERTICAL', {}); add(r, tw, { grow: true });
    Tfill(tw, strongTxt + ' ' + rest, TS.body, {});
    return r;
  }

  function mono(parent, txt) {
    const f = AF('mono', 'VERTICAL', { radius: 11, align: 'CENTER', justify: 'CENTER' });
    f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'FIXED'; f.resize(48, 48);
    f.fills = solid(C.white, 0.07); f.strokes = solid('FFFFFF', 0.14); f.strokeWeight = 1;
    add(f, T(txt, { font: F.dispSemi, size: 15, lh: 100, color: C.gold400 }, { align: 'CENTER' }));
    return add(parent, f);
  }

  // ---------- sections ----------
  const W = 1440, PAD = 120, PADW = 72;

  function ticker(page) {
    const s = AF('Ticker', 'HORIZONTAL', { fill: C.navy900, px: PAD, pt: 9, pb: 9, justify: 'SPACE_BETWEEN', align: 'CENTER' });
    add(page, s, { stretch: true });
    const metals = AF('metals', 'HORIZONTAL', { gap: 24, align: 'CENTER' }); add(s, metals);
    const mk = (n, v) => { const r = AF('m', 'HORIZONTAL', { gap: 6, align: 'CENTER' }); add(r, T(n, { font: F.reg, size: 13, lh: 100, color: C.onDarkMuted })); add(r, T(v, { font: F.semi, size: 13, lh: 100, color: C.white })); add(metals, r); };
    mk('Gold', '$2,412.80'); mk('Silver', '$31.40'); mk('Platinum', '$998.10');
    const util = AF('util', 'HORIZONTAL', { gap: 20, align: 'CENTER' }); add(s, util);
    add(util, T('1-844-416-GOLD', { font: F.reg, size: 13, lh: 100, color: C.onDarkMuted }));
    add(util, T('Sign In', { font: F.semi, size: 13, lh: 100, color: C.gold400 }));
  }

  function header(page) {
    const s = AF('Header', 'HORIZONTAL', { fill: C.paper, px: PAD, pt: 18, pb: 18, align: 'CENTER', gap: 32, stroke: C.gray100, strokeW: 1 });
    add(page, s, { stretch: true });
    const brand = AF('brand', 'HORIZONTAL', { gap: 12, align: 'CENTER' }); add(s, brand);
    const seal = figma.createEllipse(); seal.resize(36, 36); seal.fills = solid(C.navy700); add(brand, seal);
    const bt = AF('bt', 'VERTICAL', { gap: 1 }); add(brand, bt);
    add(bt, T('Texas Bullion Depository', { font: F.dispBold, size: 18, lh: 104, color: C.navy700 }));
    add(bt, T('COMMEMORATIVE SERIES', { font: F.bold, size: 9, lh: 100, color: C.gold700, ls: 20 }));
    const nav = AF('nav', 'HORIZONTAL', { gap: 28, align: 'CENTER' }); add(s, nav, { grow: true });
    for (const l of ['Coins & Redbacks', 'The Depository', 'Account', 'Support']) add(nav, T(l, { font: F.semi, size: 15, lh: 100, color: C.navy700 }));
    const acts = AF('acts', 'HORIZONTAL', { gap: 16, align: 'CENTER' }); add(s, acts);
    add(acts, T('Create Account', { font: F.bold, size: 15, lh: 100, color: C.navy700 }));
    button(acts, btnPrimary, 'Where to Buy');
  }

  function hero(page) {
    const s = AF('Hero', 'VERTICAL', { px: PAD, pt: 128, pb: 96, align: 'CENTER' });
    const img = imageFill('hero', 0.28); s.fills = img ? [{ type: 'SOLID', color: rgb(C.navy900) }, img] : solid(C.navy900);
    add(page, s, { stretch: true });
    const inner = AF('inner', 'VERTICAL', { gap: 20, align: 'CENTER', justify: 'CENTER' }); fixW(inner, 820); add(s, inner);
    eyebrow(inner, 'A State-Authorized Initiative', true);
    Tfill(inner, 'The State of Texas Commemorative Series', { font: F.dispBold, size: 64, lh: 106, color: C.white }, { align: 'CENTER' });
    Tfill(inner, 'Official gold and silver products issued by the State of Texas, honoring the heritage, independence, and enduring spirit of the Lone Star State.', { font: F.reg, size: 21, lh: 152, color: C.onDark }, { align: 'CENTER' });
    const acts = AF('acts', 'HORIZONTAL', { gap: 12, justify: 'CENTER', pt: 12 }); add(inner, acts);
    button(acts, btnPrimary, 'Explore the Collections');
    add(acts, buildButton('Where to Buy', 'GhostLight'));
  }

  function statsRow(page) {
    const s = AF('Stats', 'VERTICAL', { px: PAD }); add(page, s, { stretch: true });
    const cardF = AF('stats-card', 'HORIZONTAL', { radius: 12, fill: C.white, stroke: C.gray100, strokeW: 1 }); add(s, cardF, { stretch: true });
    stat(cardF, '2025', 'Inaugural release year'); stat(cardF, '.9999', 'Fine gold purity (24k)');
    stat(cardF, '8', 'Products in the series'); stat(cardF, '6', 'Authorized retailers');
  }

  function collections(page) {
    const s = AF('Collections', 'VERTICAL', { px: PADW, py: 96, gap: 40 }); add(page, s, { stretch: true });
    const head = AF('head', 'VERTICAL', { gap: 12 }); add(s, head);
    eyebrow(head, 'Explore'); add(head, T('Collections in the Series', TS.h2));
    const row = AF('cards', 'HORIZONTAL', { gap: 24 }); add(s, row, { stretch: true });
    card(row, 'coins2026', 'New', 'The 2026 Collection', 'Lady Liberty & the Texas Capitol, the new perennial Lone Star design by Joel Iskowitz.');
    card(row, 'coins2025', 'Inaugural', 'The 2025 Collection', 'The historic inaugural release, a sculpted relief map of Texas anchored by the lone star.');
    card(row, 'redbacks', 'Gold Bills', 'Modern Redbacks', 'A contemporary tribute to the Republic of Texas redbacks, layered with 24-karat gold.');
  }

  function split(page, reverse, tint, imgKey, eyeb, title, body, bullets, btnLabel) {
    const s = AF('Split', 'HORIZONTAL', { px: PADW, py: 96, gap: 80, align: 'CENTER', fill: tint ? C.gray50 : null });
    add(page, s, { stretch: true });
    const m = media('media', imgKey, 600, 440, 12);
    const txt = AF('text', 'VERTICAL', { gap: 16 });
    if (reverse) { add(s, txt, { grow: true }); add(s, m, { grow: true }); } else { add(s, m, { grow: true }); add(s, txt, { grow: true }); }
    eyebrow(txt, eyeb); Tfill(txt, title, TS.h2, {}); Tfill(txt, body, TS.body, {});
    const list = AF('list', 'VERTICAL', { gap: 16, pt: 8 }); add(txt, list, { stretch: true });
    for (const [b, r] of bullets) bullet(list, b, r);
    const bw = AF('bw', 'HORIZONTAL', { pt: 16 }); add(txt, bw); button(bw, btnNavy, btnLabel);
  }

  function quote(page) {
    const s = AF('Quote', 'VERTICAL', { px: PAD, py: 96, align: 'CENTER', gap: 20, fill: C.gray50 }); add(page, s, { stretch: true });
    const inner = AF('q', 'VERTICAL', { gap: 20, align: 'CENTER' }); fixW(inner, 760); add(s, inner);
    add(inner, T('“', { font: F.dispBold, size: 72, lh: 60, color: C.gold400 }, { align: 'CENTER' }));
    Tfill(inner, 'More than a precious metals product series, this initiative is a lasting tribute to Texas heritage, uniting history, craftsmanship, and tangible value in a way that is uniquely Texan.', { font: F.dispItalic, size: 30, lh: 140, color: C.navy700 }, { align: 'CENTER' });
    add(inner, T('THE STATE OF TEXAS COMMEMORATIVE SERIES', { font: F.semi, size: 13, lh: 100, color: C.gray400, ls: 5 }, { align: 'CENTER' }));
  }

  function designer(page) {
    const s = AF('Designer', 'VERTICAL', { px: PAD, py: 96 }); add(page, s, { stretch: true });
    const cardF = AF('card', 'HORIZONTAL', { gap: 40, p: 40, radius: 12, fill: C.white, stroke: C.gray100, strokeW: 1, align: 'CENTER' }); add(s, cardF, { stretch: true });
    add(cardF, media('photo', 'joel', 220, 240, 8));
    const tx = AF('tx', 'VERTICAL', { gap: 12 }); add(cardF, tx, { grow: true });
    eyebrow(tx, 'Designed by a Legend'); Tfill(tx, 'The Final Works of Joel Iskowitz', TS.h2, {});
    Tfill(tx, 'The 2026 Lone Star designs represent one of the final artistic works of internationally acclaimed master medallic artist Joel Iskowitz, whose work for the U.S. Mint includes the Arizona and District of Columbia quarters and the reverse of the 2009 Lincoln Bicentennial cent.', TS.body, {});
    const bw = AF('bw', 'HORIZONTAL', { pt: 8 }); add(tx, bw); button(bw, btnOutline, 'Meet the Designer');
  }

  function faq(page) {
    const s = AF('FAQ', 'HORIZONTAL', { px: PAD, py: 96, gap: 64, fill: C.gray50, align: 'MIN' }); add(page, s, { stretch: true });
    const aside = AF('aside', 'VERTICAL', { gap: 12 }); fixW(aside, 320); add(s, aside);
    eyebrow(aside, 'Good to Know'); Tfill(aside, 'Frequently Asked Questions', TS.h2, {});
    Tfill(aside, 'Answers to the most common questions about the Commemorative Series.', TS.body, {});
    const list = AF('list', 'VERTICAL', {}); add(s, list, { grow: true });
    const items = [
      ['Are these coins legal tender?', 'No. State of Texas commemorative products are official State of Texas products issued for their commemorative, numismatic, and collectible value based on their precious metals content, not as legal tender.'],
      ['Are they IRA-eligible?', 'The State of Texas Lone Star commemorative coins are produced to investment-grade standards and are IRA-eligible. The Modern Redbacks do not qualify as an eligible collectible for an IRA.'],
      ['Where can I buy them?', 'Through the State’s authorized retailer network, including APMEX, U.S. Gold Bureau, Bullion Shark, and others. Each product page links you directly to authorized dealers.'],
      ['What is Certi-Lock® packaging?', 'Specialized tamper-evident packaging that securely encapsulates the coin to help protect its condition and verify authenticity through advanced digital verification technology.'],
      ['Who designed the 2026 Lone Star?', 'Master medallic artist Joel Iskowitz, whose U.S. Mint credits include the Arizona and District of Columbia quarters and the 2009 Lincoln Bicentennial cent reverse.']
    ];
    for (const [q, a] of items) faqItem(list, q, a);
  }

  function wtb(page) {
    const s = AF('Where to Buy', 'VERTICAL', { px: PADW, py: 96 }); add(page, s, { stretch: true });
    const band = AF('band', 'HORIZONTAL', { p: 48, gap: 40, radius: 12, fill: C.navy700, align: 'CENTER' }); add(s, band, { stretch: true });
    const left = AF('left', 'VERTICAL', { gap: 12 }); add(band, left, { grow: true });
    eyebrow(left, 'Where to Buy', true);
    Tfill(left, 'Purchase from an Authorized Retailer', { font: F.dispBold, size: 36, lh: 116, color: C.white }, {});
    Tfill(left, 'The series is sold exclusively through the State’s authorized dealer network. Choose a retailer to check current pricing and availability.', { font: F.reg, size: 17, lh: 160, color: C.onDarkMuted }, {});
    const chips = AF('chips', 'HORIZONTAL', { gap: 12, pt: 12 }); add(left, chips);
    for (const m of ['A', 'UG', 'BS', 'DG', 'FK', 'VB']) mono(chips, m);
    const acts = AF('acts', 'VERTICAL', { gap: 12 }); fixW(acts, 220); add(band, acts);
    button(acts, btnPrimary, 'Find a Retailer', { stretch: true });
    add(acts, buildButton('Contact the Team', 'GhostLight'), { stretch: true });
  }

  function contact(page) {
    const s = AF('Contact', 'VERTICAL', { px: PAD, py: 96, fill: C.gray50 }); add(page, s, { stretch: true });
    const band = AF('band', 'HORIZONTAL', { radius: 12, clip: true, fill: C.gold500, align: 'STRETCH' }); add(s, band, { stretch: true });
    const tx = AF('tx', 'VERTICAL', { gap: 12, p: 48, justify: 'CENTER' }); add(band, tx, { grow: true });
    eyebrow(tx, 'Texas Bullion Depository');
    Tfill(tx, 'Have questions about the series?', { font: F.dispBold, size: 36, lh: 116, color: C.navy900 }, {});
    Tfill(tx, 'Our Texas-based team can help you learn more about the program and where to purchase.', { font: F.reg, size: 17, lh: 160, color: C.navy700 }, {});
    const acts = AF('acts', 'HORIZONTAL', { gap: 12, pt: 12 }); add(tx, acts);
    button(acts, btnNavy, 'Contact Us'); button(acts, btnOutline, 'Find a Retailer');
    add(band, media('cmedia', 'contact', 460, 280), { stretch: true });
  }

  function footer(page) {
    const s = AF('Footer', 'VERTICAL', { px: PAD, pt: 80, pb: 24, gap: 48, fill: C.navy900 }); add(page, s, { stretch: true });
    const top = AF('top', 'HORIZONTAL', { gap: 40, align: 'MIN' }); add(s, top, { stretch: true });
    const brand = AF('brand', 'VERTICAL', { gap: 16 }); add(top, brand, { grow: true });
    const bt = AF('bt', 'HORIZONTAL', { gap: 12, align: 'CENTER' }); add(brand, bt);
    const seal = figma.createEllipse(); seal.resize(36, 36); seal.fills = solid(C.navy600); add(bt, seal);
    add(bt, T('Texas Bullion Depository', { font: F.dispBold, size: 18, lh: 104, color: C.white }));
    Tfill(brand, 'Official precious metal products issued under the direction of the Texas Bullion Depository®, the nation’s first state-administered precious metals depository.', { font: F.reg, size: 15, lh: 160, color: C.onDarkMuted }, {});
    const col = (title, links) => {
      const c = AF('col', 'VERTICAL', { gap: 4 }); fixW(c, 180); add(top, c);
      add(c, T(title, { font: F.bold, size: 13, lh: 100, color: C.white, ls: 12, case: 'UPPER' }));
      const pad = AF('p', 'VERTICAL', { pt: 8 }); add(c, pad, { stretch: true });
      for (const l of links) { const w = AF('w', 'VERTICAL', { pt: 7, pb: 7 }); add(w, T(l, { font: F.reg, size: 15, lh: 100, color: C.onDarkMuted })); add(pad, w); }
    };
    col('Products', ['2026 Collection', '2025 Collection', 'Modern Redbacks', 'Lone Star Coins', 'Where to Buy']);
    col('Learn', ['The Commemorative Series', 'Meet the Designer', 'The Redback Story', 'FAQs', 'Contact Us']);
    const sub = AF('sub', 'VERTICAL', { gap: 12 }); fixW(sub, 320); add(top, sub);
    add(sub, T('Stay informed', { font: F.dispBold, size: 19, lh: 120, color: C.white }));
    Tfill(sub, 'Be the first to know about new releases in the Commemorative Series.', { font: F.reg, size: 15, lh: 150, color: C.onDarkMuted }, {});
    const form = AF('form', 'HORIZONTAL', { gap: 8 }); add(sub, form, { stretch: true });
    const input = AF('input', 'VERTICAL', { px: 14, py: 12, radius: 4 }); input.fills = solid(C.white, 0.06); input.strokes = solid('FFFFFF', 0.16); input.strokeWeight = 1; add(form, input, { grow: true });
    add(input, T('Enter your email', { font: F.reg, size: 15, lh: 100, color: C.onDarkMuted }));
    button(form, btnPrimary, 'Subscribe');
    const legal = T('Disclaimer: State of Texas commemorative products are not intended as and are not legal tender in the United States or any foreign country. They are issued solely for their commemorative, numismatic, and collectible value, not as an investment vehicle. The purchase carries inherent risk and there is no guarantee that a resale market exists or will exist in the future. Neither Texas Bullion Depository® nor any of its agents provides investment, financial, or tax advice.', { font: F.reg, size: 13, lh: 170, color: C.onDarkMuted }, { fill: true });
    add(s, legal, { stretch: true }); legal.opacity = 0.7;
    const bar = AF('bar', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', pt: 20, stroke: 'FFFFFF', strokeOpacity: 0.1, strokeW: 1 }); add(s, bar, { stretch: true });
    add(bar, T('© 2026 Texas Bullion Depository. A Texas state agency.', { font: F.reg, size: 13, lh: 100, color: C.onDarkMuted }));
    add(bar, T('The Lone Star State', { font: F.semi, size: 13, lh: 100, color: C.gold400 }));
  }

  // ---------- assemble ----------
  const page = AF('Homepage — Commemorative Series', 'VERTICAL', { fill: C.paper });
  fixW(page, W);
  ticker(page); header(page); hero(page); statsRow(page); collections(page);
  split(page, false, true, 'splitcoins', 'Official Coinage', 'State of Texas Lone Star Coins',
    'Precision-crafted gold and silver commemorative coins featuring iconic Texas imagery, produced to the highest standards as collectible works of art that also meet investment-grade bullion purity.',
    [['Bullion & Proof editions', 'in both gold and silver weights.'], ['.9999 fine purity,', 'comparable to sovereign issues from the U.S. and Royal Mints.'], ['An enduring reverse', 'by master designer Joel Iskowitz, constant across every release.']], 'Explore the Coins');
  split(page, true, false, 'splitredbacks', 'Gold Bills of Texas', 'The Modern Redbacks',
    'A contemporary tribute to one of the most distinctive forms of early Texas currency, the Republic of Texas redbacks issued in 1839 and 1840, reimagined with enduring value through gold.',
    [['Verifiable 24-karat gold', 'deposited onto a durable polymer substrate.'], ['Six denominations', 'from 1 to 100 centigrams for accessible fractional ownership.'], ['Uniquely Texan scenes,', 'from the longhorn to the bluebonnet, on every bill.']], 'Explore the Redbacks');
  quote(page); designer(page); faq(page); wtb(page); contact(page); footer(page);

  page.x = 0; page.y = 0;
  if (components.length) { const lib = figma.group(components, figma.currentPage); lib.name = 'TxBD Components'; lib.x = W + 160; lib.y = 0; }
  figma.currentPage.selection = [page];
  figma.viewport.scrollAndZoomIntoView([page]);
  figma.notify('TxBD homepage built ✓');
  figma.closePlugin('TxBD homepage built');
})();
