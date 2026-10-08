// Shared drawing helpers: figure placement + annotation layer, redrawn charts and diagrams.
const {fit} = require('./canvas');

const at = (g, f) => ({x: g.x + f[0] * g.w, y: g.y + f[1] * g.h});

function figure(c, file, box, align, frame) {
  const g = fit(file, box, align);
  if (frame) {
    if (frame.shadow) c.rect({x: g.x + frame.shadow, y: g.y + frame.shadow, w: g.w, h: g.h, fill: frame.shadowColor || '000000', r: frame.r});
    c.rect({x: g.x - (frame.pad || 0), y: g.y - (frame.pad || 0), w: g.w + 2 * (frame.pad || 0), h: g.h + 2 * (frame.pad || 0), fill: frame.fill, line: frame.line, lw: frame.lw, r: frame.r});
  }
  c.image(file, g);
  return g;
}

// ring around a point
function ring(c, p, r, color, lw = 2.5) { c.ellipse({x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, line: color, lw}); }

// dim everything in g except rect region (fractions)
function spotlight(c, g, reg, color = '000000', alpha = 0.55) {
  const x0 = g.x + reg[0] * g.w, y0 = g.y + reg[1] * g.h, x1 = g.x + reg[2] * g.w, y1 = g.y + reg[3] * g.h;
  const R = (x, y, w, h) => { if (w > 0.01 && h > 0.01) c.rect({x, y, w, h, fill: color, alpha}); };
  R(g.x, g.y, g.w, y0 - g.y); R(g.x, y1, g.w, g.y + g.h - y1); R(g.x, y0, x0 - g.x, y1 - y0); R(x1, y0, g.x + g.w - x1, y1 - y0);
}

// label box + arrow to point. st: {font,size,color,fill,line,stroke,r,lw,bold,shadow}
function callout(c, p, box, text, st) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  // start at nearest edge of box
  let sx = cx, sy = cy;
  if (p.x > box.x + box.w) sx = box.x + box.w; else if (p.x < box.x) sx = box.x;
  if (p.y > box.y + box.h) sy = box.y + box.h; else if (p.y < box.y) sy = box.y;
  if (sx === cx && sy === cy) sy = p.y < cy ? box.y : box.y + box.h;
  const r = st.ring || 0;
  const dx = p.x - sx, dy = p.y - sy, L = Math.hypot(dx, dy) || 1;
  if (r) ring(c, p, r, st.stroke, st.lw || 2.5);
  c.line({x1: sx, y1: sy, x2: p.x - dx / L * (r + 0.03), y2: p.y - dy / L * (r + 0.03), color: st.stroke, lw: st.lw || 2, arrow: !r || st.arrow});
  if (st.shadow) c.rect({x: box.x + st.shadow, y: box.y + st.shadow, w: box.w, h: box.h, fill: st.shadowColor || '000000', r: st.r});
  c.rect({...box, fill: st.fill, line: st.line, lw: st.boxLw || 1.25, r: st.r});
  c.text(text, {x: box.x + 0.1, y: box.y, w: box.w - 0.2, h: box.h, size: st.size || 14, color: st.color, font: st.font, bold: st.bold !== false, valign: 'middle', align: st.align || 'center', lh: 1.1});
}

function badge(c, p, n, st) {
  const r = st.r || 0.2;
  c.ellipse({x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, fill: st.fill, line: st.line, lw: st.lw || 1.5});
  c.text(String(n), {x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r, size: st.size || 14, color: st.color, bold: true, font: st.font, align: 'center', valign: 'middle', lh: 1});
}

// horizontal paired bars (before/after). rows: {k,a,b,...}; st: colors + fonts
function hbars(c, box, rows, st) {
  const max = st.max || Math.max(...rows.map(r => r.a));
  const labelW = st.labelW || 2.6, valW = st.valW || 1.0;
  const x0 = box.x + labelW, bw = box.w - labelW - valW - (st.extraW || 0);
  if (!st.absolute) { c.text('条长：相对接入前成本（接入前 = 100%）', {x: x0, y: box.y + box.h - 0.02, w: Math.min(5, bw), h: 0.25, size: 9.5, color: st.muted, font: st.font}); box = {...box, h: box.h - 0.25}; }
  const rowH = box.h / rows.length; const bh = Math.min(0.24, rowH * 0.3);
  rows.forEach((r, i) => {
    const y = box.y + i * rowH + (rowH - 2 * bh - 0.06) / 2;
    const kk = r.k.split(' · ');
    c.text(kk[0], {x: box.x, y: y - 0.06, w: labelW - 0.15, h: bh + 0.06, size: st.labelSize || 13, color: st.text, font: st.font, valign: 'middle', align: 'right', bold: true});
    if (kk[1]) c.text(kk[1], {x: box.x, y: y + bh + 0.02, w: labelW - 0.15, h: bh + 0.06, size: (st.labelSize || 13) - 2, color: st.muted, font: st.font, valign: 'middle', align: 'right'});
    // default: normalise each row to its own "before" so small-dollar rows stay readable
    const wa = st.absolute ? Math.max(0.02, bw * r.a / max) : bw, wb = st.absolute ? Math.max(0.02, bw * r.b / max) : Math.max(0.02, bw * r.b / r.a);
    c.rect({x: x0, y, w: wa, h: bh, fill: st.before, r: st.r});
    c.rect({x: x0, y: y + bh + 0.06, w: wb, h: bh, fill: st.after, r: st.r});
    c.text(st.fmt(r.a), {x: x0 + wa + 0.08, y: y - 0.03, w: st.absolute ? valW + 1 : valW, h: bh + 0.06, size: st.valSize || 11, color: st.muted, font: st.numFont || st.font, valign: 'middle'});
    c.text(st.fmt(r.b) + (st.absolute ? '' : '  ' + Math.round(100 * r.b / r.a) + '%'), {x: x0 + wb + 0.08, y: y + bh + 0.03, w: Math.min(valW + 1.2, box.x + box.w + valW - x0 - wb), h: bh + 0.06, size: st.valSize || 11, color: st.afterText || st.after, bold: true, font: st.numFont || st.font, valign: 'middle'});
    if (st.extra) st.extra(r, {x: box.x + box.w - (st.extraW || 0), y, h: 2 * bh + 0.06});
  });
}

// vertical paired bars for attack data, axis from lo
function vbars(c, box, rows, st) {
  const lo = st.lo || 60, hi = st.hi || 90; const n = rows.length;
  const gw = box.w / n; const bw = Math.min(0.42, gw * 0.3);
  const base = box.y + box.h - 0.55; const ph = box.h - 0.95;
  const Y = (v) => base - ph * (v - lo) / (hi - lo);
  c.line({x1: box.x, y1: base, x2: box.x + box.w, y2: base, color: st.axis, lw: 1});
  c.text(String(lo), {x: box.x - 0.45, y: base - 0.12, w: 0.4, h: 0.25, size: 10, color: st.muted, font: st.numFont || st.font, align: 'right'});
  c.text(String(hi), {x: box.x - 0.45, y: Y(hi) - 0.12, w: 0.4, h: 0.25, size: 10, color: st.muted, font: st.numFont || st.font, align: 'right'});
  c.line({x1: box.x, y1: Y(hi), x2: box.x + box.w, y2: Y(hi), color: st.grid || st.axis, lw: 0.5, dash: true});
  rows.forEach((r, i) => {
    const cx = box.x + i * gw + gw / 2;
    const fa = r.ours ? st.oursBefore : st.before, fb = r.ours ? st.oursAfter : st.after;
    c.rect({x: cx - bw - 0.02, y: Y(r.a), w: bw, h: base - Y(r.a), fill: fa, line: st.barLine, lw: st.barLw, r: st.r});
    c.rect({x: cx + 0.02, y: Y(r.b), w: bw, h: base - Y(r.b), fill: fb, line: st.barLine, lw: st.barLw, r: st.r});
    c.text(r.a.toFixed(1), {x: cx - bw - 0.17, y: Y(r.a) - 0.27, w: bw + 0.3, h: 0.25, size: 10, color: st.muted, font: st.numFont || st.font, align: 'center'});
    c.text(r.b.toFixed(1), {x: cx - 0.13, y: Y(r.b) - 0.27, w: bw + 0.3, h: 0.25, size: 10, color: r.ours ? st.oursText : st.text, bold: true, font: st.numFont || st.font, align: 'center'});
    const d = (r.b - r.a).toFixed(1); const ds = (r.b - r.a >= 0 ? '+' : '−') + Math.abs(d).toFixed(1);
    c.text(r.k, {x: cx - gw / 2, y: base + 0.08, w: gw, h: 0.26, size: st.labelSize || 11, color: r.ours ? st.oursText : st.text, bold: !!r.ours, font: st.font, align: 'center'});
    c.text(ds, {x: cx - gw / 2, y: base + 0.32, w: gw, h: 0.24, size: 11, color: r.ours ? st.oursText : st.bad, bold: true, font: st.numFont || st.font, align: 'center'});
  });
}

// redrawn node-link graph of the spatial topology
function graph(c, box, A, st, pruned = true) {
  const P = {T1: [0.18, 0.2], T2: [0.82, 0.2], T3: [0.18, 0.8], S: [0.82, 0.8]};
  const pos = (k) => ({x: box.x + P[k][0] * box.w, y: box.y + P[k][1] * box.h});
  const nw = st.nodeW || 1.55, nh = st.nodeH || 0.55;
  const out = {};
  A.edges.forEach(([u, v, cut]) => {
    const a = pos(u), b = pos(v);
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    // shrink to node boxes
    const sh = (p, s) => { const tx = Math.abs(dx) > 0.01 ? (nw / 2 + 0.05) / Math.abs(dx / L) : 99; const ty = Math.abs(dy) > 0.01 ? (nh / 2 + 0.05) / Math.abs(dy / L) : 99; const t = Math.min(tx, ty); return {x: p.x + s * dx / L * t, y: p.y + s * dy / L * t}; };
    const p1 = sh(a, 1), p2 = sh(b, -1);
    const isCut = pruned && cut > 0;
    c.line({x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: isCut ? st.cut : st.edge, lw: isCut ? 2 : 2.25, dash: isCut, arrow: true});
    if (cut > 0) out[cut] = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
  });
  Object.entries(A.nodes).forEach(([k, name]) => {
    const p = pos(k);
    if (st.nodeShadow) c.rect({x: p.x - nw / 2 + st.nodeShadow, y: p.y - nh / 2 + st.nodeShadow, w: nw, h: nh, fill: st.nodeShadowColor || '000000', r: st.nodeR});
    c.rect({x: p.x - nw / 2, y: p.y - nh / 2, w: nw, h: nh, fill: k === 'S' ? (st.nodeS || st.node) : st.node, line: st.nodeLine, lw: st.nodeLw || 1.5, r: st.nodeR});
    c.text(name, {x: p.x - nw / 2, y: p.y - nh / 2, w: nw, h: nh, size: st.nodeSize || 14, color: st.nodeText, bold: true, font: st.font, align: 'center', valign: 'middle', lh: 1});
  });
  return out; // midpoints of cut edges by callout id
}

// token ledger table
function ledger(c, box, rows, st) {
  const cols = [0, 0.3, 0.55, 0.8]; const rh = box.h / (rows.length + 1);
  const heads = ['', '剪枝前', '剪枝后', '变化'];
  heads.forEach((h, i) => c.text(h, {x: box.x + cols[i] * box.w, y: box.y, w: box.w * 0.25, h: rh, size: st.headSize || 12, color: st.muted, font: st.font, valign: 'middle', bold: true}));
  c.line({x1: box.x, y1: box.y + rh, x2: box.x + box.w, y2: box.y + rh, color: st.rule, lw: 1});
  rows.forEach((r, i) => {
    const y = box.y + (i + 1) * rh; const last = i === rows.length - 1;
    if (last) c.line({x1: box.x, y1: y, x2: box.x + box.w, y2: y, color: st.rule, lw: 0.75});
    const sz = last ? (st.lastSize || 18) : (st.size || 15);
    c.text(r.k, {x: box.x, y, w: box.w * 0.3, h: rh, size: sz, color: st.text, font: st.font, valign: 'middle', bold: last});
    c.text(r.a, {x: box.x + cols[1] * box.w, y, w: box.w * 0.25, h: rh, size: sz, color: st.muted, font: st.numFont || st.font, valign: 'middle'});
    c.text(r.b, {x: box.x + cols[2] * box.w, y, w: box.w * 0.25, h: rh, size: sz, color: st.accent, font: st.numFont || st.font, valign: 'middle', bold: true});
    c.text(r.d, {x: box.x + cols[3] * box.w, y, w: box.w * 0.2, h: rh, size: sz, color: st.accent, font: st.numFont || st.font, valign: 'middle', bold: last});
  });
}

// utterance-history chips redraw
function history(c, box, H, st) {
  const n = H.before.length; const gap = 0.15; const w = (box.w - gap * (n - 1)) / n; const h = Math.min(0.5, box.h);
  H.before.forEach((t, i) => {
    const x = box.x + i * (w + gap); const keep = H.keep[i];
    if (st.shadow && keep) c.rect({x: x + st.shadow, y: box.y + st.shadow, w, h, fill: st.shadowColor || '000000', r: st.r});
    c.rect({x, y: box.y, w, h, fill: keep ? st.keepFill : st.dropFill, line: keep ? st.keepLine : st.dropLine, lw: 1.5, r: st.r, dash: !keep});
    c.text(t, {x, y: box.y, w, h, size: st.size || 13, color: keep ? st.keepText : st.dropText, bold: keep, font: st.font, align: 'center', valign: 'middle'});
    if (!keep) c.line({x1: x + 0.15, y1: box.y + h / 2, x2: x + w - 0.15, y2: box.y + h / 2, color: st.dropText, lw: 1.5});
  });
  return {h};
}

const money = (v) => '$' + (v < 10 ? v.toFixed(3).replace(/0$/, '') : v.toFixed(2));

module.exports = {at, figure, ring, spotlight, callout, badge, hbars, vbars, graph, ledger, history, money};
