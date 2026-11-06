'use strict';
// Nocturne · 深色石板与暖金 —— 蒸馏自 sci-brain-slides 0.1.0 dark 主题色板（2026）。
// 签名：全稿深色、暖金唯一强调、淡蓝次级数据、发丝线 + 等宽小标签、无阴影无发光。
module.exports = function makeNocturne({pageNo}) {
  const W = (t) => t.slide.w, MX = (t) => t.grid.marginX, CW = (t) => W(t) - 2 * MX(t);
  const ems = (s) => [...String(s || '')].reduce((a, ch) => a + (/[\u4E00-\u9FFF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);

  function grid(c, t) {
    for (let i = 1; i < 6; i++) {
      const x = W(t) * i / 6;
      c.line({x1: x, y1: 0, x2: x, y2: t.slide.h, color: t.color.rule, w: 0.4});
    }
  }
  function head(c, t, s) {
    c.text(s.kicker || 'PAPER READING / 02', {x: MX(t), y: t.grid.kickerY, w: CW(t), h: 0.24,
      size: t.size.kicker, bold: true, color: t.color.accent, charSpacing: 2.4});
    c.text(s.title, {x: MX(t), y: 0.9, w: CW(t), h: 0.5, size: t.size.title, bold: true,
      color: t.color.ink, heading: true});
    c.line({x1: MX(t), y1: t.grid.ruleY, x2: W(t) - MX(t), y2: t.grid.ruleY,
      color: t.color.rule, w: 0.6});
  }
  function foot(c, t, s) {
    // No default paper name: the deck supplies the footer, or there is none.
    if (s.footLeft) c.text(s.footLeft, {x: MX(t), y: t.grid.footerY - 0.08,
      w: 8, h: 0.22, size: t.size.footer, color: t.color.faint, charSpacing: 1.4});
    if (s.page) c.text(`${String(s.page).padStart(2, '0')} / ${String(s.total || 10).padStart(2, '0')}`,
      {x: W(t) - MX(t) - 1.5, y: t.grid.footerY - 0.08, w: 1.5, h: 0.22,
        size: t.size.footer, color: t.color.faint, align: 'right', charSpacing: 1.4});
  }
  function card(c, t, x, y, w, h, hot) {
    c.rect({x, y, w, h, fill: t.color.surface, radius: 0.06,
      line: t.color.rule, lineW: 0.5});
    if (hot) c.rect({x, y, w, h: 0.055, fill: t.color.accent});
  }
  function hbars(c, t, s) {
    const {x, y, w} = s.box, data = s.data, rowH = 0.86;
    const max = Math.max(...data.map((d) => d.value)) * 1.08;
    data.forEach((d, i) => {
      const yy = y + i * rowH;
      c.text(d.label, {x, y: yy, w: 2.0, h: 0.28, size: 12.5,
        color: d.ours ? t.color.ink : t.color.muted, bold: !!d.ours});
      const bx = x + 2.1, bw = w - 3.0;
      c.rect({x: bx, y: yy + 0.02, w: bw, h: 0.2, fill: t.color.surfaceAlt, radius: 0.03});
      c.rect({x: bx, y: yy + 0.02, w: Math.max(0.08, bw * d.value / max), h: 0.2,
        fill: d.ours ? t.color.accent : t.color.cool, radius: 0.03});
      c.text(String(d.value), {x: bx + bw + 0.16, y: yy - 0.02, w: 0.8, h: 0.3,
        size: 14, bold: !!d.ours, color: d.ours ? t.color.accent : t.color.muted});
    });
  }

  return {
    head, foot, card, hbars,
    cover(c, t, s) {
      c.background(t.color.bg); grid(c, t);
      c.text(s.kicker || 'SYSTEMS TALK / 2026', {x: MX(t), y: 0.84, w: CW(t), h: 0.26,
        size: t.size.kicker, bold: true, color: t.color.accent, charSpacing: 3});
      c.text(s.title, {x: MX(t), y: 2.16, w: CW(t) - 1.0, h: 1.24,
        size: t.size.cover, bold: true, color: t.color.ink, lineSpacing: 1.24, heading: true});
      c.rect({x: MX(t), y: 3.74, w: 0.7, h: 0.05, fill: t.color.accent});
      c.text(s.subtitle, {x: MX(t), y: 4.06, w: CW(t) - 2.2, h: 0.9,
        size: t.size.subtitle, color: t.color.muted, lineSpacing: 1.5});
      c.text(s.meta || '', {x: MX(t), y: 6.42, w: 7, h: 0.26, size: 10.5, color: t.color.faint});
      c.text(s.authors || '', {x: W(t) - MX(t) - 4.4, y: 6.42, w: 4.4, h: 0.26,
        size: 10.5, color: t.color.faint, align: 'right'});
      c.notes(s.notes);
    },
    outline(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      s.items.forEach((it, i) => {
        const y = 1.94 + i * 1.12;
        c.text(String(i + 1).padStart(2, '0'), {x: MX(t), y: y + 0.05, w: 0.7, h: 0.3,
          size: 13, bold: true, color: t.color.accent, charSpacing: 1.6});
        c.text(it.t, {x: MX(t) + 0.82, y, w: CW(t) - 2.6, h: 0.4, size: 19,
          color: t.color.ink, heading: true});
        if (it.note) c.text(it.note, {x: MX(t) + 0.82, y: y + 0.46, w: CW(t) - 2.6,
          h: 0.28, size: 12, color: t.color.muted});
        c.line({x1: MX(t) + 0.82, y1: y + 0.9, x2: W(t) - MX(t), y2: y + 0.9,
          color: t.color.rule, w: 0.5});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    section(c, t, s) {
      c.background(t.color.bg); grid(c, t);
      c.text(`PART ${String(s.index).padStart(2, '0')}`, {x: MX(t), y: 2.34, w: 6, h: 0.3,
        size: 12, bold: true, color: t.color.accent, charSpacing: 4});
      c.text(s.title, {x: MX(t), y: 2.86, w: CW(t), h: 0.98, size: t.size.section,
        bold: true, color: t.color.ink, heading: true});
      c.text(s.note || '', {x: MX(t), y: 4.06, w: CW(t) * 0.78, h: 0.5, size: 15,
        color: t.color.muted});
      c.rect({x: MX(t), y: 4.8, w: 1.0, h: 0.045, fill: t.color.accent});
      c.notes(s.notes);
    },
    claim(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      c.text(s.claim, {x: MX(t), y: 1.98, w: CW(t) * 0.62, h: 1.5, size: 25,
        color: t.color.ink, lineSpacing: 1.45, heading: true});
      const xr = MX(t) + CW(t) * 0.66, wr = CW(t) * 0.34;
      s.metrics.forEach((m, i) => {
        const y = 2.0 + i * 1.36;
        c.line({x1: xr, y1: y - 0.16, x2: xr + wr, y2: y - 0.16, color: t.color.rule, w: 0.6});
        c.text(m.v, {x: xr, y, w: wr, h: 0.6, size: 27, bold: true,
          color: m.hot ? t.color.accent : t.color.cool});
        c.text(m.k, {x: xr, y: y + 0.6, w: wr, h: 0.48, size: 11.5,
          color: t.color.muted, lineSpacing: 1.3});
      });
      if (s.source) c.text(s.source, {x: MX(t), y: 6.2, w: CW(t), h: 0.24,
        size: t.size.source, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    method(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const gap = 0.46, n = s.stages.length;
      const bw = (CW(t) - gap * (n - 1)) / n, y = 2.14, bh = 2.3;
      s.stages.forEach((st, i) => {
        const x = MX(t) + i * (bw + gap);
        card(c, t, x, y, bw, bh, i === s.hot);
        c.text(`0${i + 1} / STAGE`, {x: x + 0.28, y: y + 0.3, w: bw - 0.56, h: 0.24,
          size: 9.5, bold: true, color: i === s.hot ? t.color.accent : t.color.faint,
          charSpacing: 2});
        c.text(st.t, {x: x + 0.28, y: y + 0.76, w: bw - 0.56, h: 0.4, size: 17,
          bold: true, color: t.color.ink});
        c.text(st.d, {x: x + 0.28, y: y + 1.28, w: bw - 0.56, h: 0.8, size: 12,
          color: t.color.muted, lineSpacing: 1.42});
        if (i < n - 1) c.line({x1: x + bw + 0.08, y1: y + bh / 2, x2: x + bw + gap - 0.08,
          y2: y + bh / 2, color: t.color.accent, w: 1, arrow: true});
      });
      c.line({x1: MX(t), y1: 4.96, x2: W(t) - MX(t), y2: 4.96, color: t.color.rule, w: 0.6});
      c.text(s.takeaway || s.claim, {x: MX(t), y: 5.2, w: CW(t), h: 0.7, size: 17,
        color: t.color.body, lineSpacing: 1.4});
      foot(c, t, s); c.notes(s.notes);
    },
    result(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      c.text(s.big, {x: MX(t), y: 2.04, w: 4.2, h: 1.2, size: t.size.bigNumber,
        bold: true, color: t.color.accent, heading: true});
      c.text(s.bigLabel, {x: MX(t), y: 3.36, w: 4.2, h: 0.34, size: 14.5,
        bold: true, color: t.color.ink});
      c.text(s.bigNote, {x: MX(t), y: 3.84, w: 4.95, h: 1.1, size: 11.5,
        color: t.color.muted, lineSpacing: 1.5});
      hbars(c, t, {box: {x: 5.9, y: 2.24, w: W(t) - MX(t) - 5.9}, data: s.data});
      c.line({x1: 5.9, y1: 5.08, x2: W(t) - MX(t), y2: 5.08, color: t.color.rule, w: 0.6});
      c.text(s.caption, {x: 5.9, y: 5.28, w: W(t) - MX(t) - 5.9, h: 0.5,
        size: t.size.caption, color: t.color.faint, lineSpacing: 1.35});
      foot(c, t, s); c.notes(s.notes);
    },
    table(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const y0 = 2.06, rh = 0.82, x0 = MX(t);
      const xs = []; let acc = x0;
      s.widths.forEach((w) => { xs.push(acc); acc += w; });
      const right = x0 + s.widths.reduce((a, b) => a + b, 0);
      c.line({x1: x0, y1: y0 - 0.2, x2: right, y2: y0 - 0.2, color: t.color.accent, w: 1.1});
      s.cols.forEach((cl, i) => c.text(cl, {x: xs[i], y: y0, w: s.widths[i], h: 0.28,
        size: 10, bold: true, color: t.color.faint, charSpacing: 1.4,
        align: i === 0 ? 'left' : 'right'}));
      s.rows.forEach((r, i) => {
        const y = y0 + 0.6 + i * rh;
        if (r.ours) c.rect({x: x0 - 0.18, y: y - 0.1, w: right - x0 + 0.36,
          h: rh - 0.08, fill: t.color.accentSoft, radius: 0.05});
        r.cells.forEach((cell, j) => c.text(cell, {x: xs[j], y, w: s.widths[j], h: 0.36,
          size: 15, bold: !!r.ours, color: r.ours ? t.color.accent : t.color.body,
          align: j === 0 ? 'left' : 'right'}));
        c.line({x1: x0, y1: y + rh - 0.18, x2: right, y2: y + rh - 0.18,
          color: t.color.rule, w: 0.5});
      });
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.6 + s.rows.length * rh + 0.2,
        w: CW(t), h: 0.44, size: 11, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    summary(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      s.items.forEach((it, i) => {
        const y = 1.98 + i * 1.3;
        c.text(`0${i + 1}`, {x: MX(t), y: y + 0.06, w: 0.66, h: 0.3, size: 13,
          bold: true, color: t.color.accent});
        c.text(it, {x: MX(t) + 0.78, y, w: CW(t) - 1.0, h: 0.86, size: 19,
          color: t.color.ink, lineSpacing: 1.36, heading: true});
        c.line({x1: MX(t) + 0.78, y1: y + 1.0, x2: W(t) - MX(t), y2: y + 1.0,
          color: t.color.rule, w: 0.5});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    thanks(c, t, s) {
      c.background(t.color.bg); grid(c, t);
      c.text('Q & A', {x: MX(t), y: 1.9, w: CW(t), h: 0.4, size: 13, bold: true,
        color: t.color.accent, charSpacing: 5});
      c.text(s.title || '谢谢，欢迎讨论', {x: MX(t), y: 2.72, w: CW(t), h: 1.0,
        size: 44, bold: true, color: t.color.ink, heading: true});
      c.rect({x: MX(t), y: 4.0, w: 0.7, h: 0.05, fill: t.color.accent});
      c.text(s.line || '预取窗口与 SSD 队列深度的关系', {x: MX(t), y: 4.32,
        w: CW(t) * 0.8, h: 0.44, size: 16, color: t.color.muted});
      c.text(s.contact || '', {x: MX(t), y: 6.42, w: CW(t), h: 0.26, size: 10,
        color: t.color.faint});
      c.notes(s.notes);
    },
  };
};
