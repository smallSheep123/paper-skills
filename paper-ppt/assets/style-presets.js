// Style presets: International (海外组会) and Domestic (国内组会).
//
// A preset = design tokens (styles/<name>/tokens.json) + page archetypes drawn
// with plain shapes/text. Archetypes are starting points for the AI author,
// not slots to fill blindly: the AI still decides the message, crops figures,
// and may adjust geometry after looking at the render.
//
// Inline markup in any text: [[keyword]] -> accent color, **bold** -> bold.
//
// Two backends share the same drawing calls:
//   - pptx: PptxGenJS slides (editable output)
//   - svg : quick preview without LibreOffice (approximate text wrapping)

const fs = require('node:fs');
const path = require('node:path');

const STYLE_DIR = path.join(__dirname, '..', 'styles');

function loadTokens(name) {
  const file = path.join(STYLE_DIR, name, 'tokens.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// ---------- inline markup ----------
function parseRuns(text, base = {}) {
  const runs = [];
  const re = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({text: text.slice(last, m.index), ...base});
    const tok = m[0];
    if (tok.startsWith('[[')) runs.push({text: tok.slice(2, -2), ...base, accent: true});
    else runs.push({text: tok.slice(2, -2), ...base, bold: true});
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push({text: text.slice(last), ...base});
  return runs;
}

// ---------- backends ----------
class PptxCanvas {
  constructor(slide, tokens) { this.slide = slide; this.t = tokens; }
  text(content, o) {
    const t = this.t;
    const paras = Array.isArray(content) ? content : [content];
    const runs = [];
    paras.forEach((p, i) => {
      const src = typeof p === 'string' ? {text: p} : p;
      const prs = parseRuns(src.text);
      prs.forEach((r, j) => {
        const opt = {
          color: r.accent ? (o.accentColor || t.color.accent) : (src.color || o.color),
          bold: !!(r.bold || o.bold || src.bold),
          fontSize: src.size || o.size,
        };
        if (j === prs.length - 1 && i < paras.length - 1) opt.breakLine = true;
        if (j === 0 && (src.bullet || o.bullet)) opt.bullet = {indent: 18};
        if (j === 0 && src.indent) opt.indentLevel = src.indent;
        if (j === 0 && (src.paraSpaceBefore || o.paraSpaceBefore)) opt.paraSpaceBefore = src.paraSpaceBefore || o.paraSpaceBefore;
        runs.push({text: r.text, options: opt});
      });
    });
    this.slide.addText(runs, {
      x: o.x, y: o.y, w: o.w, h: o.h,
      fontFace: o.mono ? t.fonts.mono[0] : t.fonts.cjk[0],
      fontSize: o.size, color: o.color, bold: !!o.bold,
      align: o.align || 'left', valign: o.valign || 'top',
      margin: 0, lineSpacingMultiple: o.lineSpacing || 1.15,
      fit: 'none', autoFit: false,
    });
  }
  rect(o) {
    const opt = {x: o.x, y: o.y, w: o.w, h: o.h,
      fill: o.fill ? {color: o.fill} : {type: 'none'},
      line: o.line ? {color: o.line, width: o.lineW || 1, dashType: o.dash ? 'dash' : 'solid'} : {type: 'none'}};
    if (o.radius) opt.rectRadius = o.radius;
    this.slide.addShape(o.radius ? 'roundRect' : 'rect', opt);
  }
  line(o) {
    const x = Math.min(o.x1, o.x2); const y = Math.min(o.y1, o.y2);
    this.slide.addShape('line', {x, y, w: Math.abs(o.x2 - o.x1) || 0.001, h: Math.abs(o.y2 - o.y1) || 0.001,
      flipH: o.x2 < o.x1, flipV: o.y2 < o.y1,
      line: {color: o.color, width: o.w || 1, dashType: o.dash ? 'dash' : 'solid', endArrowType: o.arrow ? 'triangle' : undefined}});
  }
  image(file, o) {
    this.slide.addImage({path: file, x: o.x, y: o.y, w: o.w, h: o.h, sizing: {type: 'contain', w: o.w, h: o.h}, altText: o.alt || ''});
  }
  notes(text) { if (text) this.slide.addNotes(text); }
}

const PX = 96; // px per inch in svg preview
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const isCJK = (ch) => /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch);

class SvgCanvas {
  constructor(tokens) { this.t = tokens; this.parts = []; this.notesText = ''; }
  measure(str, sizePx, bold) {
    let w = 0;
    for (const ch of str) w += isCJK(ch) ? sizePx : (ch === ' ' ? 0.28 : (/[A-Z0-9]/.test(ch) ? 0.64 : 0.52)) * sizePx;
    return w * (bold ? 1.04 : 1);
  }
  text(content, o) {
    const t = this.t;
    const paras = Array.isArray(content) ? content : [content];
    const font = o.mono ? t.fonts.mono.join(',') : [...t.fonts.cjk.slice(-1), ...t.fonts.latin, 'sans-serif'].join(',');
    const lineSp = o.lineSpacing || 1.15;
    let y = o.y * PX;
    const lines = [];
    paras.forEach((p, pi) => {
      const src = typeof p === 'string' ? {text: p} : p;
      const sizePx = (src.size || o.size) * PX / 72;
      const bullet = src.bullet || o.bullet;
      const indent = (bullet ? sizePx * 0.9 : 0) + (src.indent ? (src.indent - 1) * sizePx * 1.2 : 0);
      const maxW = o.w * PX - indent;
      const chunks = [];
      for (const r of parseRuns(src.text)) {
        const parts = r.text.match(/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]|[^\s\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+/g) || [];
        for (const c of parts) chunks.push({...r, text: c});
      }
      let cur = []; let curW = 0;
      const flush = () => { lines.push({chunks: cur, sizePx, indent, bullet: bullet && !lines.some((l) => l.para === pi), para: pi, src}); cur = []; curW = 0; };
      for (const c of chunks) {
        const cw = this.measure(c.text, sizePx, c.bold || o.bold || src.bold);
        if (curW + cw > maxW && cur.length) flush();
        cur.push(c); curW += cw;
      }
      flush();
      const sb = (src.paraSpaceBefore || o.paraSpaceBefore || 0);
      if (pi < paras.length - 1 && sb) lines.push({spacer: sb * PX / 72});
    });
    const total = lines.reduce((a, l) => a + (l.spacer || l.sizePx * lineSp), 0);
    if (o.valign === 'middle') y += (o.h * PX - total) / 2;
    if (o.valign === 'bottom') y += o.h * PX - total;
    for (const l of lines) {
      if (l.spacer) { y += l.spacer; continue; }
      const h = l.sizePx * lineSp;
      const baseline = y + l.sizePx * 0.95;
      let x = o.x * PX + l.indent;
      const lineW = l.chunks.reduce((a, c) => a + this.measure(c.text, l.sizePx, c.bold || o.bold), 0);
      if (o.align === 'center') x = o.x * PX + (o.w * PX - lineW) / 2;
      if (o.align === 'right') x = (o.x + o.w) * PX - lineW;
      if (l.bullet) this.parts.push(`<circle cx="${o.x * PX + l.sizePx * 0.28}" cy="${baseline - l.sizePx * 0.33}" r="${l.sizePx * 0.12}" fill="#${l.src.color || o.color}"/>`);
      const merged = [];
      for (const ch of l.chunks) {
        const col = ch.accent ? (o.accentColor || t.color.accent) : (l.src.color || o.color);
        const b = !!(ch.bold || o.bold || l.src.bold);
        const prev = merged[merged.length - 1];
        if (prev && prev.col === col && prev.b === b) prev.text += ch.text; else merged.push({text: ch.text, col, b});
      }
      const spans = merged.map((m) => `<tspan fill="#${m.col}" font-weight="${m.b ? 'bold' : 'normal'}">${esc(m.text)}</tspan>`).join('');
      this.parts.push(`<text x="${x}" y="${baseline}" font-family="${font}" font-size="${l.sizePx}" xml:space="preserve">${spans}</text>`);
      y += h;
    }
  }
  rect(o) {
    const r = o.radius ? o.radius * PX : 0;
    this.parts.push(`<rect x="${o.x * PX}" y="${o.y * PX}" width="${o.w * PX}" height="${o.h * PX}" rx="${r}" fill="${o.fill ? '#' + o.fill : 'none'}" stroke="${o.line ? '#' + o.line : 'none'}" stroke-width="${(o.lineW || 1) * 1.333}" ${o.dash ? 'stroke-dasharray="6 4"' : ''}/>`);
  }
  line(o) {
    const id = `a${this.parts.length}`;
    if (o.arrow) this.parts.push(`<defs><marker id="${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#${o.color}"/></marker></defs>`);
    this.parts.push(`<line x1="${o.x1 * PX}" y1="${o.y1 * PX}" x2="${o.x2 * PX}" y2="${o.y2 * PX}" stroke="#${o.color}" stroke-width="${(o.w || 1) * 1.333}" ${o.dash ? 'stroke-dasharray="6 4"' : ''} ${o.arrow ? `marker-end="url(#${id})"` : ''}/>`);
  }
  image(file, o) {
    const ext = path.extname(file).slice(1).replace('jpg', 'jpeg');
    const data = fs.readFileSync(file).toString('base64');
    this.parts.push(`<image x="${o.x * PX}" y="${o.y * PX}" width="${o.w * PX}" height="${o.h * PX}" preserveAspectRatio="xMidYMid meet" href="data:image/${ext};base64,${data}"/>`);
  }
  notes(text) { this.notesText = text || ''; }
  toSVG() {
    const W = this.t.slide.w * PX; const H = this.t.slide.h * PX;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#${this.t.color.bg}"/>${this.parts.join('')}</svg>`;
  }
}

// ---------- shared pieces ----------
function sourceLine(c, t, text) {
  if (!text) return;
  c.text(text, {x: t.grid.marginX, y: t.grid.footerY, w: 9.5, h: 0.3, size: t.size.source, color: t.color.faint});
}

function pageNo(c, t, n) {
  if (n == null) return;
  c.text(String(n), {x: t.slide.w - t.grid.marginX - 1, y: t.grid.footerY, w: 1, h: 0.3, size: t.size.source, color: t.color.faint, align: 'right'});
}

// ================= International =================
const international = {
  // Title = one sentence (conclusion or question). Optional venue tag at top right.
  title(c, t, s) {
    c.text(s.title, {x: t.grid.marginX, y: t.grid.titleY, w: t.slide.w - 2 * t.grid.marginX - (s.tag ? 1.9 : 0), h: t.grid.titleH, size: t.size.title, bold: true, color: t.color.text, valign: 'middle'});
    if (s.tag) c.text(s.tag, {x: t.slide.w - t.grid.marginX - 1.8, y: t.grid.titleY + 0.05, w: 1.8, h: 0.3, size: t.size.source, color: t.color.muted, align: 'right'});
    if (s.subtitle) c.text(s.subtitle, {x: t.grid.marginX, y: t.grid.titleY + t.grid.titleH, w: 11.5, h: 0.4, size: t.size.subtitle, color: t.color.muted});
  },
  frame(c, t, s) { this.title(c, t, s); sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes); },

  cover(c, t, s) {
    c.text(s.title, {x: 1.2, y: 2.0, w: 10.9, h: 1.6, size: t.size.cover, bold: true, color: t.color.text, align: 'center', valign: 'bottom'});
    c.text(s.authors, {x: 1.2, y: 3.9, w: 10.9, h: 0.5, size: t.size.subtitle, color: t.color.body, align: 'center'});
    c.text(s.venue, {x: 1.2, y: 4.4, w: 10.9, h: 0.4, size: t.size.small, color: t.color.muted, align: 'center'});
    c.text(s.presenter, {x: 1.2, y: 5.6, w: 10.9, h: 0.4, size: t.size.small, color: t.color.muted, align: 'center'});
    c.notes(s.notes);
  },

  // Research-question map (navigation) — current question in accent, others muted.
  questions(c, t, s) {
    this.frame(c, t, s);
    const rowH = 0.9; const y0 = (t.slide.h - s.items.length * rowH) / 2 + 0.2;
    s.items.forEach((q, i) => {
      const on = i === s.current;
      c.text(`Q${i + 1})`, {x: 1.2, y: y0 + i * rowH, w: 0.9, h: rowH, size: 22, bold: true, color: on ? t.color.accent : t.color.faint, valign: 'middle'});
      c.text(q, {x: 2.1, y: y0 + i * rowH, w: 9.5, h: rowH, size: 22, bold: on, color: on ? t.color.text : t.color.faint, valign: 'middle'});
    });
  },

  // Big single question / section page. No bullets.
  section(c, t, s) {
    c.text(s.title, {x: 1.0, y: 2.6, w: 11.3, h: 1.6, size: t.size.section, bold: true, color: s.accent ? t.color.accent : t.color.text, align: 'center', valign: 'middle'});
    if (s.subtitle) c.text(s.subtitle, {x: 1.0, y: 4.25, w: 11.3, h: 0.6, size: t.size.subtitle, color: t.color.muted, align: 'center'});
    pageNo(c, t, s.page); c.notes(s.notes);
  },

  // Figure-hero: figure takes ~62% width; 2–3 short notes on the right; optional takeaway box.
  figureNotes(c, t, s) {
    this.frame(c, t, s);
    const figW = 7.9; const top = t.grid.contentY + (s.subtitle ? 0.35 : 0);
    const figH = (s.takeaway ? 4.5 : 5.2);
    c.image(s.figure, {x: t.grid.marginX, y: top, w: figW, h: figH, alt: s.figureAlt});
    const nx = t.grid.marginX + figW + t.grid.gutter; const nw = t.slide.w - t.grid.marginX - nx;
    c.text(s.points.map((p) => ({text: p, bullet: true})), {x: nx, y: top + 0.3, w: nw, h: figH - 0.3, size: t.size.body, color: t.color.body, paraSpaceBefore: 14});
    if (s.takeaway) this.takeaway(c, t, s.takeaway, top + figH + 0.25);
  },

  // One-line takeaway box at the end of the eye path.
  takeaway(c, t, text, y, kind = 'accent') {
    const col = kind === 'note' ? t.color.note : t.color.accent;
    const w = 8.6; const x = (t.slide.w - w) / 2;
    c.rect({x, y, w, h: 0.62, line: col, lineW: 1.5});
    c.text(text, {x: x + 0.15, y, w: w - 0.3, h: 0.62, size: t.size.body, color: t.color.text, align: 'center', valign: 'middle'});
  },

  // Incremental build: the same pipeline drawn N times; steps before `active` solid, after ghosted.
  buildSteps(c, t, s) {
    this.frame(c, t, s);
    const n = s.steps.length; const gap = 0.45; const bw = (t.slide.w - 2 * t.grid.marginX - 1.2 - gap * (n - 1)) / n;
    const y = 3.0; const x0 = t.grid.marginX + 0.6;
    s.steps.forEach((label, i) => {
      const state = i < s.active ? 'done' : i === s.active ? 'now' : 'ghost';
      const line = state === 'ghost' ? t.color.ghost : state === 'now' ? t.color.accent : t.color.muted;
      const x = x0 + i * (bw + gap);
      c.rect({x, y, w: bw, h: 1.0, line, lineW: state === 'now' ? 2 : 1, radius: 0.08, fill: 'FFFFFF'});
      c.text(label, {x, y, w: bw, h: 1.0, size: t.size.small, color: state === 'ghost' ? t.color.ghost : t.color.text, bold: state === 'now', align: 'center', valign: 'middle'});
      if (i < n - 1) c.line({x1: x + bw + 0.05, y1: y + 0.5, x2: x + bw + gap - 0.05, y2: y + 0.5, color: i < s.active ? t.color.muted : t.color.ghost, w: 1.25, arrow: true});
    });
    if (s.explain) c.text(s.explain, {x: x0, y: 4.5, w: t.slide.w - 2 * x0, h: 1.2, size: t.size.body, color: t.color.body, align: 'center'});
  },

  // Equation with an annotation layer (labels in note color, one replacement in accent).
  equation(c, t, s) {
    this.frame(c, t, s);
    c.text(s.lines.map((l) => ({text: l})), {x: 1.3, y: 2.0, w: 10.7, h: 2.2, size: 26, color: t.color.text, mono: false, paraSpaceBefore: 18});
    (s.labels || []).forEach((lb) => {
      c.line({x1: lb.from[0], y1: lb.from[1], x2: lb.to[0], y2: lb.to[1], color: t.color.note, w: 1, arrow: true});
      c.text(lb.text, {x: lb.to[0] - 1.4, y: lb.to[1] + 0.05, w: 2.8, h: 0.4, size: t.size.caption + 2, color: t.color.note, align: 'center'});
    });
    if (s.points) c.text(s.points.map((p) => ({text: p, bullet: true})), {x: 1.3, y: 5.2, w: 10.7, h: 1.4, size: t.size.small + 2, color: t.color.body, paraSpaceBefore: 8});
  },

  // Result: keep the paper's figure/table, add exactly one callout number.
  result(c, t, s) {
    this.frame(c, t, s);
    const top = t.grid.contentY + 0.1; const figW = 8.4; const figH = 5.1;
    c.image(s.figure, {x: t.grid.marginX, y: top, w: figW, h: figH, alt: s.figureAlt});
    const nx = t.grid.marginX + figW + 0.5; const nw = t.slide.w - t.grid.marginX - nx;
    c.text(s.number, {x: nx, y: top + 1.2, w: nw, h: 0.9, size: t.size.bigNumber, bold: true, color: t.color.accent});
    c.text(s.numberLabel, {x: nx, y: top + 2.1, w: nw, h: 1.0, size: t.size.small, color: t.color.body});
    if (s.condition) c.text(s.condition, {x: nx, y: top + 3.3, w: nw, h: 1.2, size: t.size.caption, color: t.color.muted});
  },

  closing(c, t, s) {
    this.frame(c, t, s);
    c.text(s.points.map((p) => ({text: p, bullet: true})), {x: 1.0, y: t.grid.contentY + 0.4, w: 11.3, h: 4.6, size: 22, color: t.color.body, paraSpaceBefore: 22});
  },
};

// ================= Domestic =================
const domestic = {
  title(c, t, s) {
    const x = t.grid.marginX;
    c.rect({x, y: t.grid.titleY + 0.17, w: 0.11, h: 0.38, fill: t.color.primary});
    c.text(s.prefix ? `${s.prefix}${s.title}` : s.title, {x: x + 0.25, y: t.grid.titleY, w: t.slide.w - 2 * x - 0.25 - (s.tag ? 2.8 : 0), h: t.grid.titleH, size: t.size.title, bold: true, color: t.color.primary, valign: 'middle'});
    if (s.tag) c.text(s.tag, {x: t.slide.w - x - 2.7, y: t.grid.titleY + 0.22, w: 2.7, h: 0.3, size: t.size.source + 1, color: t.color.muted, align: 'right'});
    c.line({x1: x, y1: t.grid.titleRuleY, x2: t.slide.w - x, y2: t.grid.titleRuleY, color: t.color.rule, w: 0.75});
  },
  footer(c, t, s) {
    const x = t.grid.marginX;
    if (s.footer) c.text(s.footer, {x, y: t.grid.footerY, w: 8, h: 0.3, size: t.size.source, color: t.color.faint});
    pageNo(c, t, s.page);
  },
  frame(c, t, s) { this.title(c, t, s); this.footer(c, t, s); c.notes(s.notes); },

  cover(c, t, s) {
    c.rect({x: 0, y: 0, w: t.slide.w, h: 0.12, fill: t.color.primary});
    c.text(s.paperTitle, {x: 1.0, y: 1.55, w: 11.3, h: 1.5, size: t.size.cover - 6, bold: true, color: t.color.primary, align: 'center', valign: 'bottom'});
    if (s.titleZh) c.text(s.titleZh, {x: 1.0, y: 3.3, w: 11.3, h: 0.6, size: t.size.subtitle + 2, color: t.color.body, align: 'center'});
    c.text(s.paperMeta, {x: 1.0, y: 3.95, w: 11.3, h: 0.45, size: t.size.small, color: t.color.muted, align: 'center'});
    c.line({x1: 5.2, y1: 4.55, x2: 8.13, y2: 4.55, color: t.color.rule, w: 1});
    c.text([{text: `汇报人：${s.presenter}`}, {text: s.group}, {text: s.date}], {x: 1.0, y: 4.8, w: 11.3, h: 1.4, size: t.size.small, color: t.color.body, align: 'center', paraSpaceBefore: 4});
    c.notes(s.notes);
  },

  // 提纲 with current section highlighted.
  outline(c, t, s) {
    this.frame(c, t, {...s, title: s.title || '汇报提纲'});
    const nums = ['一', '二', '三', '四', '五', '六'];
    const rowH = 0.85; const y0 = (t.slide.h - s.items.length * rowH) / 2 + 0.25;
    s.items.forEach((it, i) => {
      const on = s.current == null || i === s.current;
      const y = y0 + i * rowH;
      c.rect({x: 2.2, y: y + 0.12, w: 0.62, h: 0.62, fill: on ? t.color.primary : t.color.primaryLight, radius: 0.06});
      c.text(nums[i], {x: 2.2, y: y + 0.12, w: 0.62, h: 0.62, size: 20, bold: true, color: on ? 'FFFFFF' : t.color.primary, align: 'center', valign: 'middle'});
      c.text(it, {x: 3.1, y, w: 8.5, h: rowH, size: 22, bold: on && s.current != null, color: on ? t.color.text : t.color.faint, valign: 'middle'});
    });
  },

  section(c, t, s) {
    c.text(s.number, {x: 1.2, y: 2.3, w: 2.4, h: 1.9, size: 88, bold: true, color: t.color.primaryLight, valign: 'middle'});
    c.rect({x: 3.7, y: 2.75, w: 0.08, h: 1.0, fill: t.color.primary});
    c.text(s.title, {x: 4.0, y: 2.55, w: 8.3, h: 0.9, size: t.size.section, bold: true, color: t.color.primary, valign: 'middle'});
    if (s.subtitle) c.text(s.subtitle, {x: 4.0, y: 3.45, w: 8.3, h: 0.6, size: t.size.subtitle, color: t.color.muted});
    this.footer(c, t, s); c.notes(s.notes);
  },

  // 一页看懂一篇论文：目标 / 挑战 / 方法 三行 + 一张图
  paperGlance(c, t, s) {
    this.frame(c, t, s);
    const rows = [['研究目标', s.goal], ['核心挑战', s.challenge], ['本文方法', s.solution]];
    const y0 = t.grid.contentY + 0.1;
    rows.forEach(([k, v], i) => {
      const y = y0 + i * 0.62;
      c.text(`${k}：`, {x: t.grid.marginX, y, w: 1.5, h: 0.55, size: t.size.small + 1, bold: true, color: t.color.primary, valign: 'middle'});
      c.text(v, {x: t.grid.marginX + 1.5, y, w: 10.5, h: 0.55, size: t.size.small + 1, color: t.color.body, valign: 'middle'});
    });
    this.figureFrame(c, t, s.figure, s.caption, {x: 1.4, y: y0 + 2.05, w: 10.5, h: 3.15});
  },

  // Paper figure on a light grey frame with a short Chinese caption underneath.
  figureFrame(c, t, file, caption, b) {
    c.rect({x: b.x, y: b.y, w: b.w, h: b.h, fill: t.color.frame, radius: 0.06});
    c.image(file, {x: b.x + 0.15, y: b.y + 0.12, w: b.w - 0.3, h: b.h - (caption ? 0.55 : 0.24)});
    if (caption) c.text(caption, {x: b.x, y: b.y + b.h - 0.42, w: b.w, h: 0.36, size: t.size.caption, color: t.color.muted, align: 'center'});
  },

  // 方法页：左图（承托框+图注）右要点（关键词标红、出处小字）
  method(c, t, s) {
    this.frame(c, t, s);
    const top = t.grid.contentY + 0.15;
    this.figureFrame(c, t, s.figure, s.caption, {x: t.grid.marginX, y: top, w: 7.6, h: 5.1});
    const nx = t.grid.marginX + 7.6 + 0.45; const nw = t.slide.w - t.grid.marginX - nx;
    c.text(s.points.map((p) => ({text: p, bullet: true})), {x: nx, y: top + 0.2, w: nw, h: 4.9, size: t.size.body - 1, color: t.color.body, paraSpaceBefore: 16});
  },

  // 结果页：原图 + 唯一强调数字 + 实验条件
  result(c, t, s) {
    this.frame(c, t, s);
    const top = t.grid.contentY + 0.15;
    this.figureFrame(c, t, s.figure, s.caption, {x: t.grid.marginX, y: top, w: 8.2, h: 5.1});
    const nx = t.grid.marginX + 8.2 + 0.45; const nw = t.slide.w - t.grid.marginX - nx;
    c.text(s.number, {x: nx, y: top + 0.9, w: nw, h: 0.8, size: t.size.bigNumber, bold: true, color: t.color.accent});
    c.text(s.numberLabel, {x: nx, y: top + 1.75, w: nw, h: 1.0, size: t.size.small, color: t.color.body});
    c.text(s.points.map((p) => ({text: p, bullet: true})), {x: nx, y: top + 2.9, w: nw, h: 2.0, size: t.size.small, color: t.color.body, paraSpaceBefore: 8});
  },

  // 总结 / 个人思考 / 讨论问题：两栏，不用卡片
  summary(c, t, s) {
    this.frame(c, t, {...s, title: s.title || '总结与讨论'});
    const top = t.grid.contentY + 0.25; const colW = 5.75;
    const col = (x, head, items) => {
      c.text(head, {x, y: top, w: colW, h: 0.5, size: t.size.body, bold: true, color: t.color.primary});
      c.line({x1: x, y1: top + 0.55, x2: x + colW, y2: top + 0.55, color: t.color.primaryLight, w: 1.5});
      c.text(items.map((p) => ({text: p, bullet: true})), {x, y: top + 0.75, w: colW, h: 4.3, size: t.size.small + 1, color: t.color.body, paraSpaceBefore: 12});
    };
    col(t.grid.marginX + 0.1, '本文结论', s.conclusions);
    col(t.grid.marginX + 0.1 + colW + 0.6, '思考与讨论', s.discussion);
  },

  thanks(c, t, s) {
    c.text(s.text || '恳请各位老师和同学批评指正', {x: 1, y: 2.9, w: 11.3, h: 1.0, size: t.size.section - 4, bold: true, color: t.color.primary, align: 'center', valign: 'middle'});
    this.footer(c, t, s); c.notes(s.notes);
  },
};

const PRESETS = {international, domestic};

function drawSlide(canvas, tokens, spec) {
  const preset = PRESETS[tokens.name];
  const fn = preset[spec.type];
  if (typeof fn !== 'function') throw new Error(`Unknown archetype "${spec.type}" for ${tokens.name}`);
  fn.call(preset, canvas, tokens, spec);
}

module.exports = {loadTokens, parseRuns, PptxCanvas, SvgCanvas, drawSlide, PRESETS};
