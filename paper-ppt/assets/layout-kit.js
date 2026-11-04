// Layout primitives shared by the preset archetypes.
//
// Why this file exists: every preset could draw a paper figure and a paragraph, but each
// one re-derived the geometry, so the *same* skeleton ("figure left, text right") reappeared
// under six different names. These helpers make a composition an explicit choice:
// a framed figure, a leader-line callout, a numbered annotation, a labelled panel, a column
// grid. They only use the canvas verbs (rect/line/text/image/ellipse) so the PPTX and the
// SVG preview stay in sync.
const {imageDimensions} = require('./image-geometry');

const PRESETS_PAD = 0.12;

// Tight rect for a file inside a box (never stretches, never letterboxes the frame).
function fitBox(file, box) {
  const {w: iw, h: ih} = imageDimensions(file);
  const ar = iw / ih;
  let w = box.w, h = w / ar;
  if (h > box.h) { h = box.h; w = h * ar; }
  return {x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h};
}

// Framed figure: an optional backing card, the image at its own aspect ratio, an optional
// caption on the card. Returns the card rect so callers can butt a second card against it.
//   o: {pad, fill, line, lineW, radius, caption, captionSize, captionColor, frame (default true), align}
function figure(c, t, file, box, o = {}) {
  const pad = o.pad != null ? o.pad : PRESETS_PAD;
  const capH = o.caption ? (o.captionH || 0.36) : 0;
  const inner = {x: box.x + pad, y: box.y + pad, w: box.w - 2 * pad, h: box.h - 2 * pad - capH};
  const img = fitBox(file, inner);
  if (o.align === 'left') img.x = box.x + pad;
  if (o.align === 'right') img.x = box.x + box.w - pad - img.w;
  if (o.align === 'top') img.y = box.y + pad;
  const card = {x: img.x - pad, y: img.y - pad, w: img.w + 2 * pad, h: img.h + 2 * pad + capH};
  if (o.frame !== false) {
    c.rect({x: card.x, y: card.y, w: card.w, h: card.h, fill: o.fill || null,
      line: o.line || null, lineW: o.lineW || 1, radius: o.radius || 0});
  }
  c.image(file, {x: img.x, y: img.y, w: img.w, h: img.h, alt: o.alt});
  if (o.caption) {
    c.text(o.caption, {x: card.x + 0.06, y: img.y + img.h + 0.06, w: card.w - 0.12, h: capH - 0.04,
      size: o.captionSize || t.size.caption, color: o.captionColor || t.color.muted, align: o.align === 'left' ? 'left' : 'center'});
  }
  return card;
}

// Leader-line label. `from` is the point being annotated; the line is drawn to the nearest
// edge of `box` so the label never touches its target.
//   o: {fill, line, color, size, bold, arrow, lw, radius, font}
function callout(c, from, box, text, o = {}) {
  const cx = Math.min(Math.max(from.x, box.x), box.x + box.w);
  const cy = Math.min(Math.max(from.y, box.y), box.y + box.h);
  c.line({x1: from.x, y1: from.y, x2: cx, y2: cy, color: o.line || o.color, w: o.lw || 1.5, arrow: o.arrow !== false});
  c.rect({x: box.x, y: box.y, w: box.w, h: box.h, fill: o.fill || null, line: o.line || null, lineW: o.lineW || 1.25, radius: o.radius || 0.08});
  c.text(text, {x: box.x + 0.12, y: box.y, w: box.w - 0.24, h: box.h, size: o.size || 12.5,
    color: o.color, bold: o.bold, font: o.font, valign: 'middle', align: o.align || 'left', lineSpacing: 1.25});
}

// Circle over a point on a figure (the "this edge / this bar" mark).
function ring(c, p, r, color, lw) {
  c.ellipse({x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, line: color, lineW: lw || 2});
}

// Small filled number on a figure or beside a list item.
function badge(c, p, label, o = {}) {
  const r = o.r || 0.16;
  c.ellipse({x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, fill: o.fill, line: o.line || null, lineW: 1});
  c.text(String(label), {x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, size: o.size || 10.5,
    color: o.color || 'FFFFFF', bold: true, align: 'center', valign: 'middle', font: o.font});
}

// Place a mark given fractional coordinates of a figure card (0..1). Figures are placed by
// aspect ratio, so marks must ride the returned rect, not a fixed grid.
const at = (card, f) => ({x: card.x + f[0] * card.w, y: card.y + f[1] * card.h});

// Vertical hairline that separates two columns (Swiss/Keynote split).
function divide(c, x, y1, y2, color, lw = 1) { c.line({x1: x, y1, x2: x, y2, color, w: lw}); }

// Underlined column head: the label plus a rule exactly as wide as the text is not
// measurable in PPTX, so the rule spans the column and reads as a table header.
function columnHead(c, x, y, w, text, o = {}) {
  c.text(text, {x, y, w, h: 0.36, size: o.size || 15, bold: o.bold !== false, color: o.color, font: o.font});
  if (o.rule !== false) c.line({x1: x, y1: y + 0.4, x2: x + w, y2: y + 0.4, color: o.ruleColor || o.color, w: o.ruleW || 1});
}

// Equal columns inside a band.
function columns(box, n, gap) {
  const w = (box.w - gap * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => ({x: box.x + i * (w + gap), y: box.y, w, h: box.h}));
}

// Greedy line estimate (CJK = 1em, Latin = 0.55em). Only used to reserve vertical room;
// the build still renders and is reviewed as pixels.
const textLines = (text, size, w, lineSpacing = 1.2) => {
  const em = [...String(text || '')].reduce((a, ch) => a + (/[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);
  return Math.max(1, Math.ceil(em * size / 72 / w));
};
const textHeight = (text, size, w, lineSpacing = 1.25) => textLines(text, size, w, lineSpacing) * size * lineSpacing / 72;

module.exports = {fitBox, figure, callout, ring, badge, at, divide, columnHead, columns, textLines, textHeight};
