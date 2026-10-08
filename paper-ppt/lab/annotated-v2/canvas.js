// Dual-backend canvas (PPTX via pptxgenjs + SVG preview). Inches, 13.333 x 7.5.
const fs = require('node:fs');
const path = require('node:path');
module.paths.unshift(path.join(__dirname, '..', '..', 'node_modules'));
const PX = 96;
const W = 13.333, H = 7.5;
const isCJK = (ch) => /[\u2018-\u201D\u2026\u25A0-\u25FF\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F\u2460-\u24FF\u2190-\u21FF\u2600-\u27BF]/.test(ch);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function imgSize(file) {
  const b = fs.readFileSync(file);
  return {w: b.readUInt32BE(16), h: b.readUInt32BE(20)};
}
// fit image into box (contain), returns placed geometry
function fit(file, box, align = 'center') {
  const s = imgSize(file); const r = s.w / s.h;
  let w = box.w, h = box.w / r;
  if (h > box.h) { h = box.h; w = h * r; }
  let x = box.x + (box.w - w) / 2; let y = box.y + (box.h - h) / 2;
  if (align.includes('left')) x = box.x;
  if (align.includes('top')) y = box.y;
  if (align.includes('right')) x = box.x + box.w - w;
  if (align.includes('bottom')) y = box.y + box.h - h;
  return {x, y, w, h};
}
// [[x]] accent, **x** bold
const CJKRE = /([\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F\u2018-\u201D\u2026\u2190-\u21FF\u2460-\u24FF\u25A0-\u25FF]+)/;
function cjkFont(o) { return o.cjk || (/Serif|Pagella/.test(o.font || '') ? 'Noto Serif SC' : 'Noto Sans SC'); }
function split(r, o) { return r.t.split(CJKRE).filter(Boolean).map((t) => ({...r, t, font: CJKRE.test(t) ? cjkFont(o) : o.font})); }
function runs(text) {
  const out = []; const re = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\^\{[^}]+\})/g; let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({t: text.slice(last, m.index)});
    const k = m[0];
    out.push(k.startsWith('[[') ? {t: k.slice(2, -2), acc: true} : k.startsWith('^{') ? {t: k.slice(2, -1), sup: true} : {t: k.slice(2, -2), b: true});
    last = m.index + k.length;
  }
  if (last < text.length) out.push({t: text.slice(last)});
  return out;
}

class Pptx {
  constructor(slide) { this.s = slide; }
  bg(color) { this.s.background = {color}; }
  text(content, o) {
    const paras = Array.isArray(content) ? content : [content];
    const arr = [];
    paras.forEach((p, i) => {
      const rs = runs(p).flatMap((r) => split(r, o));
      rs.forEach((r, j) => {
        const opt = {color: r.acc ? (o.acc || o.color) : o.color, bold: !!(r.b || o.bold || (r.acc && o.accBold)),
          italic: !!o.italic, fontSize: o.size, fontFace: r.font};
        if (r.sup) opt.superscript = true;
        if (o.paraGap && i > 0 && j === 0) opt.paraSpaceBefore = o.paraGap;
        if (j === rs.length - 1 && i < paras.length - 1) opt.breakLine = true;
        arr.push({text: r.t, options: opt});
      });
    });
    this.s.addText(arr, {x: o.x, y: o.y, w: o.w, h: o.h, fontFace: o.font, fontSize: o.size, color: o.color,
      align: o.align || 'left', valign: o.valign || 'top', margin: 0, lineSpacingMultiple: o.lh || 1.2,
      charSpacing: o.cs, fit: 'none', autoFit: false, rotate: o.rotate});
  }
  rect(o) {
    const opt = {x: o.x, y: o.y, w: o.w, h: o.h,
      fill: o.fill ? {color: o.fill, transparency: o.alpha != null ? Math.round((1 - o.alpha) * 100) : 0} : {type: 'none'},
      line: o.line ? {color: o.line, width: o.lw || 1, dashType: o.dash ? 'dash' : 'solid'} : {type: 'none'}};
    if (o.r) opt.rectRadius = o.r;
    this.s.addShape(o.r ? 'roundRect' : 'rect', opt);
  }
  ellipse(o) {
    this.s.addShape('ellipse', {x: o.x, y: o.y, w: o.w, h: o.h,
      fill: o.fill ? {color: o.fill, transparency: o.alpha != null ? Math.round((1 - o.alpha) * 100) : 0} : {type: 'none'},
      line: o.line ? {color: o.line, width: o.lw || 1} : {type: 'none'}});
  }
  line(o) {
    const x = Math.min(o.x1, o.x2), y = Math.min(o.y1, o.y2);
    this.s.addShape('line', {x, y, w: Math.abs(o.x2 - o.x1) || 0.001, h: Math.abs(o.y2 - o.y1) || 0.001,
      flipH: o.x2 < o.x1, flipV: o.y2 < o.y1,
      line: {color: o.color, width: o.lw || 1, dashType: o.dash ? 'dash' : 'solid',
        endArrowType: o.arrow ? 'triangle' : undefined, beginArrowType: o.arrow2 ? 'triangle' : undefined}});
  }
  image(file, g) { this.s.addImage({path: file, x: g.x, y: g.y, w: g.w, h: g.h}); }
  notes(t) { this.s.addNotes(t); }
}

class Svg {
  constructor() { this.p = []; this.bgc = 'FFFFFF'; }
  bg(c) { this.bgc = c; }
  measure(s, px, bold, font) {
    let w = 0; const mono = /Mono/.test(font || '');
    for (const ch of s) w += isCJK(ch) ? px : mono ? 0.6 * px : (ch === ' ' ? 0.27 : /[A-Z0-9$%]/.test(ch) ? 0.63 : /[.,:;!|il'’]/.test(ch) ? 0.28 : 0.52) * px;
    return w * (bold ? 1.05 : 1);
  }
  text(content, o) {
    const paras = Array.isArray(content) ? content : [content];
    const px = o.size * PX / 72; const lh = o.lh || 1.2; const lines = [];
    paras.forEach((p, pi) => {
      const chunks = [];
      for (const r of runs(p).flatMap((x) => split(x, o))) for (const c of (r.t.match(/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]|[^\s\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+/g) || [])) chunks.push({...r, t: c});
      let cur = [], cw = 0;
      const flush = () => { lines.push({c: cur, gap: pi > 0 && !lines.some(l => l.pi === pi) ? (o.paraGap || 0) * PX / 72 : 0, pi}); cur = []; cw = 0; };
      for (const c of chunks) { const w = this.measure(c.t, px, c.b || o.bold, c.font) * (c.sup ? 0.7 : 1); if (cw + w > o.w * PX + 1 && cur.length) flush(); cur.push(c); cw += w; }
      flush();
    });
    const total = lines.reduce((a, l) => a + px * lh + l.gap, 0);
    if (total > o.h * PX * 1.08 + 2 || o.x + o.w > W + 0.01 || o.y + o.h > H + 0.05) (global.QA = global.QA || []).push(`${(paras.join(' ')).slice(0, 28)} | need ${(total / PX).toFixed(2)}in, box ${o.h.toFixed(2)}in`);
    let y = o.y * PX + (o.valign === 'middle' ? (o.h * PX - total) / 2 : o.valign === 'bottom' ? o.h * PX - total : 0);
    for (const l of lines) {
      y += l.gap;
      const lw = l.c.reduce((a, c) => a + this.measure(c.t, px, c.b || o.bold, c.font) * (c.sup ? 0.7 : 1), 0);
      let x = o.x * PX; if (o.align === 'center') x += (o.w * PX - lw) / 2; if (o.align === 'right') x += o.w * PX - lw;
      const spans = l.c.map(c => `<tspan font-family="${c.font}"${c.sup ? ` baseline-shift="super" font-size="${(px * 0.7).toFixed(1)}"` : ''} fill="#${c.acc ? (o.acc || o.color) : o.color}" font-weight="${(c.b || o.bold || (c.acc && o.accBold)) ? 'bold' : 'normal'}">${esc(c.t)}</tspan>`).join('');
      this.p.push(`<text x="${x}" y="${y + px * 0.93}" font-family="${o.font}" font-size="${px}"${o.italic ? ' font-style="italic"' : ''}${o.cs ? ` letter-spacing="${o.cs}"` : ''} xml:space="preserve">${spans}</text>`);
      y += px * lh;
    }
  }
  rect(o) { this.p.push(`<rect x="${o.x * PX}" y="${o.y * PX}" width="${o.w * PX}" height="${o.h * PX}" rx="${(o.r || 0) * PX}" fill="${o.fill ? '#' + o.fill : 'none'}" fill-opacity="${o.alpha != null ? o.alpha : 1}" stroke="${o.line ? '#' + o.line : 'none'}" stroke-width="${(o.lw || 1) * 1.333}"${o.dash ? ' stroke-dasharray="7 5"' : ''}/>`); }
  ellipse(o) { this.p.push(`<ellipse cx="${(o.x + o.w / 2) * PX}" cy="${(o.y + o.h / 2) * PX}" rx="${o.w / 2 * PX}" ry="${o.h / 2 * PX}" fill="${o.fill ? '#' + o.fill : 'none'}" fill-opacity="${o.alpha != null ? o.alpha : 1}" stroke="${o.line ? '#' + o.line : 'none'}" stroke-width="${(o.lw || 1) * 1.333}"/>`); }
  line(o) {
    const id = 'm' + this.p.length;
    if (o.arrow || o.arrow2) this.p.push(`<defs><marker id="${id}" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto-start-reverse"><path d="M0,0 L5,2.5 L0,5 z" fill="#${o.color}"/></marker></defs>`);
    this.p.push(`<line x1="${o.x1 * PX}" y1="${o.y1 * PX}" x2="${o.x2 * PX}" y2="${o.y2 * PX}" stroke="#${o.color}" stroke-width="${(o.lw || 1) * 1.333}"${o.dash ? ' stroke-dasharray="7 5"' : ''}${o.arrow ? ` marker-end="url(#${id})"` : ''}${o.arrow2 ? ` marker-start="url(#${id})"` : ''}/>`);
  }
  image(file, g) { this.p.push(`<image x="${g.x * PX}" y="${g.y * PX}" width="${g.w * PX}" height="${g.h * PX}" preserveAspectRatio="none" href="data:image/png;base64,${fs.readFileSync(file).toString('base64')}"/>`); }
  notes() {}
  svg() { return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * PX}" height="${H * PX}" viewBox="0 0 ${W * PX} ${H * PX}"><rect width="100%" height="100%" fill="#${this.bgc}"/>${this.p.join('')}</svg>`; }
}

// Both backends at once.
class Both {
  constructor(slide) { this.a = new Pptx(slide); this.b = new Svg(); }
}
for (const m of ['bg', 'text', 'rect', 'ellipse', 'line', 'image', 'notes']) Both.prototype[m] = function (...x) { this.a[m](...x); this.b[m](...x); };

module.exports = {Both, fit, W, H, imgSize};
