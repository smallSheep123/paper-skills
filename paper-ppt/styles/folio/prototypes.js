'use strict';
// Folio · 编辑式留白（Indigo）—— 蒸馏自 sci-brain-slides 0.1.0 academic / starter.pdf（2026）。
// 签名：超大留白、0.7in 紫色短横线、浅灰无边框卡片、满版靛蓝结论页。
// 只调 canvas API，PPTX / SVG 双画布可用。由 assets/style-presets-stylekit.js 注册。
module.exports = function makeFolio({pageNo}) {
  const W = (t) => t.slide.w, MX = (t) => t.grid.marginX, CW = (t) => W(t) - 2 * MX(t);
  const ems = (s) => [...String(s || '')].reduce((a, ch) => a + (/[\u4E00-\u9FFF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);

  function marker(c, t, x, y, w) {
    c.rect({x, y, w: w || 0.7, h: 0.045, fill: t.color.accent});
  }
  function head(c, t, s) {
    c.text(s.kicker || 'PAPER READING', {x: MX(t), y: t.grid.kickerY, w: CW(t), h: 0.24,
      size: t.size.kicker, bold: true, color: t.color.muted, charSpacing: 2});
    c.text(s.title, {x: MX(t), y: 0.88, w: CW(t), h: 0.5, size: t.size.title, bold: true,
      color: t.color.ink, heading: true});
    c.line({x1: MX(t), y1: t.grid.ruleY, x2: W(t) - MX(t), y2: t.grid.ruleY,
      color: t.color.rule, w: 0.75});
  }
  function foot(c, t, s) {
    c.line({x1: MX(t), y1: t.grid.footerY - 0.2, x2: W(t) - MX(t), y2: t.grid.footerY - 0.2,
      color: t.color.rule, w: 0.5});
    // No default paper name: the deck supplies the footer, or there is none.
    if (s.footLeft) c.text(s.footLeft, {x: MX(t), y: t.grid.footerY - 0.1,
      w: 8, h: 0.22, size: t.size.footer, color: t.color.faint});
    if (s.page) c.text(`${s.page} / ${s.total || 10}`, {x: W(t) - MX(t) - 1.4,
      y: t.grid.footerY - 0.1, w: 1.4, h: 0.22, size: t.size.footer,
      color: t.color.faint, align: 'right'});
  }
  function card(c, t, x, y, w, h, o) {
    c.rect({x, y, w, h, fill: o.fill || t.color.frame, radius: 0.06,
      line: o.line || null, lineW: 0.5});
    if (o.top) c.rect({x, y, w, h: 0.05, fill: o.top});
  }
  function hbars(c, t, s) {
    const {x, y, w, h} = s.box, data = s.data;
    const max = Math.max(...data.map((d) => d.value)) * 1.08;
    const rowH = h / data.length;
    data.forEach((d, i) => {
      const yy = y + i * rowH;
      c.text(d.label, {x, y: yy, w: 2.0, h: 0.28, size: 12.5,
        color: d.ours ? t.color.ink : t.color.muted, bold: !!d.ours});
      const bx = x + 2.1, bw = w - 3.0;
      c.rect({x: bx, y: yy + 0.02, w: bw, h: 0.2, fill: t.color.frame, radius: 0.03});
      c.rect({x: bx, y: yy + 0.02, w: Math.max(0.08, bw * d.value / max), h: 0.2,
        fill: d.ours ? t.color.accent : t.color.ghost, radius: 0.03});
      c.text(String(d.value), {x: bx + bw + 0.16, y: yy - 0.02, w: 0.8, h: 0.3,
        size: 14, bold: !!d.ours, color: d.ours ? t.color.accent : t.color.muted});
    });
  }

  return {
    head, foot, card, hbars,
    cover(c, t, s) {
      c.background(t.color.bg);
      c.text(s.kicker, {x: MX(t), y: 1.02, w: CW(t), h: 0.26, size: t.size.kicker,
        bold: true, color: t.color.muted, charSpacing: 2.2});
      c.text(s.title, {x: MX(t), y: 2.24, w: CW(t) - 1.2, h: 1.2, size: t.size.cover,
        bold: true, color: t.color.primaryDark, lineSpacing: 1.22, heading: true});
      marker(c, t, MX(t), 3.76, 0.7);
      c.text(s.subtitle, {x: MX(t), y: 4.06, w: CW(t) - 2.4, h: 0.9, size: t.size.subtitle,
        color: t.color.muted, lineSpacing: 1.5});
      c.text(s.meta, {x: MX(t), y: 6.42, w: 7, h: 0.26, size: 11, color: t.color.faint});
      c.text(s.authors, {x: W(t) - MX(t) - 4.2, y: 6.42, w: 4.2, h: 0.26, size: 11,
        color: t.color.faint, align: 'right'});
      c.notes(s.notes);
    },
    outline(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      s.items.forEach((it, i) => {
        const y = 1.9 + i * 1.14;
        c.text(String(i + 1).padStart(2, '0'), {x: MX(t), y: y + 0.04, w: 0.66, h: 0.34,
          size: 14, bold: true, color: t.color.accent});
        c.text(it.t, {x: MX(t) + 0.78, y, w: CW(t) - 2.4, h: 0.42, size: 20,
          color: t.color.ink, heading: true});
        if (it.note) c.text(it.note, {x: MX(t) + 0.78, y: y + 0.46, w: CW(t) - 2.4,
          h: 0.3, size: 12.5, color: t.color.muted});
        c.line({x1: MX(t) + 0.78, y1: y + 0.92, x2: W(t) - MX(t), y2: y + 0.92,
          color: t.color.rule, w: 0.5});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    section(c, t, s) {
      c.background(t.color.bg);
      marker(c, t, MX(t), 2.5, 0.7);
      c.text(`PART ${String(s.index).padStart(2, '0')}`, {x: MX(t), y: 2.78, w: 6, h: 0.28,
        size: 11, bold: true, color: t.color.accent, charSpacing: 3});
      c.text(s.title, {x: MX(t), y: 3.16, w: CW(t), h: 0.94, size: t.size.section,
        bold: true, color: t.color.primaryDark, heading: true});
      c.text(s.note || '', {x: MX(t), y: 4.28, w: CW(t) * 0.8, h: 0.5, size: 15,
        color: t.color.muted});
      c.notes(s.notes);
    },
    // Hero：一句主张 + 三张数字卡（punch / stats 语言）
    claim(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      c.text(s.claim, {x: MX(t), y: 1.94, w: CW(t) - 0.8, h: 1.16, size: 27,
        color: t.color.ink, lineSpacing: 1.42, heading: true});
      const gap = 0.34, n = s.metrics.length;
      const bw = (CW(t) - gap * (n - 1)) / n;
      s.metrics.forEach((m, i) => {
        const x = MX(t) + i * (bw + gap);
        card(c, t, x, 3.6, bw, 2.1, {top: m.hot ? t.color.accent : null});
        c.text(m.v, {x: x + 0.26, y: 3.94, w: bw - 0.5, h: 0.66, size: 30, bold: true,
          color: m.hot ? t.color.accent : t.color.ink});
        c.text(m.k, {x: x + 0.26, y: 4.72, w: bw - 0.5, h: 0.74, size: 12.5,
          color: t.color.muted, lineSpacing: 1.4});
      });
      if (s.source) c.text(s.source, {x: MX(t), y: 6.1, w: CW(t), h: 0.24,
        size: t.size.source, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    // Spread：左解释、右三张堆叠卡
    method(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const lw = CW(t) * 0.43;
      c.text(s.claim, {x: MX(t), y: 1.94, w: lw, h: 1.3, size: 22,
        color: t.color.ink, lineSpacing: 1.45, heading: true});
      let y = 3.5;
      s.bullets.forEach((b) => {
        c.rect({x: MX(t), y: y + 0.13, w: 0.07, h: 0.07, fill: t.color.accent});
        const lines = Math.max(1, Math.ceil(ems(b) * 15 / 72 / (lw - 0.3)));
        c.text(b, {x: MX(t) + 0.24, y, w: lw - 0.3, h: 0.34 * lines + 0.12,
          size: 15, color: t.color.body, lineSpacing: 1.4});
        y += 0.34 * lines + 0.32;
      });
      const rx = MX(t) + lw + 0.68, rw = CW(t) - lw - 0.68;
      s.stages.forEach((st, i) => {
        const yy = 1.94 + i * 1.48;
        card(c, t, rx, yy, rw, 1.26, {top: i === s.hot ? t.color.accent : null});
        c.text(`0${i + 1}`, {x: rx + 0.3, y: yy + 0.2, w: 0.5, h: 0.24, size: 10,
          bold: true, color: i === s.hot ? t.color.accent : t.color.faint});
        c.text(st.t, {x: rx + 0.3, y: yy + 0.48, w: rw - 0.6, h: 0.34, size: 16,
          bold: true, color: t.color.ink});
        c.text(st.d, {x: rx + 0.3, y: yy + 0.88, w: rw - 0.6, h: 0.3, size: 12,
          color: t.color.muted});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    result(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      c.text(s.big, {x: MX(t), y: 2.06, w: 4.3, h: 1.24, size: t.size.bigNumber,
        bold: true, color: t.color.accent, heading: true});
      c.text(s.bigLabel, {x: MX(t), y: 3.38, w: 4.3, h: 0.34, size: 15,
        bold: true, color: t.color.ink});
      c.text(s.bigNote, {x: MX(t), y: 3.86, w: 5.05, h: 1.1, size: 12,
        color: t.color.muted, lineSpacing: 1.5});
      hbars(c, t, {box: {x: 6.0, y: 2.22, w: W(t) - MX(t) - 6.0, h: 2.4}, data: s.data});
      c.line({x1: 6.0, y1: 5.08, x2: W(t) - MX(t), y2: 5.08, color: t.color.rule, w: 0.75});
      c.text(s.caption, {x: 6.0, y: 5.28, w: W(t) - MX(t) - 6.0, h: 0.5,
        size: t.size.caption, color: t.color.faint, lineSpacing: 1.35});
      foot(c, t, s); c.notes(s.notes);
    },
    table(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const y0 = 2.06, rh = 0.82, x0 = MX(t);
      const xs = []; let acc = x0;
      s.widths.forEach((w) => { xs.push(acc); acc += w; });
      const right = x0 + s.widths.reduce((a, b) => a + b, 0);
      c.line({x1: x0, y1: y0 - 0.2, x2: right, y2: y0 - 0.2, color: t.color.ink, w: 1.1});
      s.cols.forEach((cl, i) => c.text(cl, {x: xs[i], y: y0, w: s.widths[i], h: 0.28,
        size: 10, bold: true, color: t.color.faint, charSpacing: 1.4,
        align: i === 0 ? 'left' : 'right'}));
      c.line({x1: x0, y1: y0 + 0.42, x2: right, y2: y0 + 0.42, color: t.color.rule, w: 0.75});
      s.rows.forEach((r, i) => {
        const y = y0 + 0.6 + i * rh;
        if (r.ours) c.rect({x: x0 - 0.16, y: y - 0.1, w: right - x0 + 0.32, h: rh - 0.08,
          fill: t.color.accentSoft, radius: 0.05});
        r.cells.forEach((cell, j) => c.text(cell, {x: xs[j], y, w: s.widths[j], h: 0.36,
          size: 15, bold: !!r.ours, color: r.ours ? t.color.primaryDark : t.color.body,
          align: j === 0 ? 'left' : 'right'}));
        c.line({x1: x0, y1: y + rh - 0.18, x2: right, y2: y + rh - 0.18,
          color: t.color.rule, w: 0.5});
      });
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.6 + s.rows.length * rh + 0.2,
        w: CW(t), h: 0.44, size: 11, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    // 2×2 卡片网格
    summary(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const gap = 0.32, bw = (CW(t) - gap) / 2, bh = 1.94;
      s.cards.forEach((cd, i) => {
        const x = MX(t) + (i % 2) * (bw + gap), y = 1.94 + Math.floor(i / 2) * (bh + gap);
        card(c, t, x, y, bw, bh, {top: i === 3 ? t.color.accent : null});
        c.text(cd.label, {x: x + 0.3, y: y + 0.26, w: bw - 0.6, h: 0.3, size: 11,
          bold: true, color: i === 3 ? t.color.accent : t.color.primary, charSpacing: 1.6});
        c.text(cd.text, {x: x + 0.3, y: y + 0.72, w: bw - 0.6, h: 1.0, size: 15,
          color: t.color.body, lineSpacing: 1.48});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    thanks(c, t, s) {
      c.background(t.color.primary);
      marker(c, t, MX(t), 2.42, 0.7);
      c.text(s.title || '谢谢', {x: MX(t), y: 2.8, w: CW(t), h: 1.0, size: 46,
        bold: true, color: t.color.onPrimary, heading: true});
      c.text(s.line || '把「随机读」当成可预测事件，而不只是等待。',
        {x: MX(t), y: 4.02, w: CW(t) * 0.8, h: 0.5, size: 17, color: t.color.onPrimaryMuted});
      c.text(s.contact || '', {x: MX(t), y: 6.42, w: CW(t), h: 0.26, size: 10,
        color: t.color.onPrimaryMuted});
      c.notes(s.notes);
    },
  };
};
