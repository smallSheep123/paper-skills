'use strict';
// Mosaic · Bento 卡片（青绿＋品红）—— 蒸馏自 sci-brain-slides 0.1.0 vibrant / cards / callouts / band（2026）。
// 签名：圆角卡片网格、卡片顶边主色、四种低饱和 callout、满版青绿章节页；全扁平无阴影。
module.exports = function makeMosaic({pageNo}) {
  const W = (t) => t.slide.w, MX = (t) => t.grid.marginX, CW = (t) => W(t) - 2 * MX(t);
  const R = (t) => t.grid.cardRadius;

  function head(c, t, s) {
    c.text(s.kicker || 'PAPER READING', {x: MX(t), y: 0.52, w: CW(t), h: 0.24,
      size: t.size.kicker, bold: true, color: t.color.primary, charSpacing: 2});
    c.text(s.title, {x: MX(t), y: 0.82, w: CW(t), h: 0.5, size: t.size.title, bold: true,
      color: t.color.ink, heading: true});
    c.rect({x: MX(t), y: 1.42, w: 0.7, h: 0.05, fill: t.color.primary});
  }
  function foot(c, t, s) {
    c.text(s.footLeft || 'SPARQ · OSDI 2026 · 组会汇报', {x: MX(t), y: t.grid.footerY - 0.06,
      w: 8, h: 0.22, size: t.size.footer, color: t.color.faint});
    if (s.page) c.text(`${s.page} / ${s.total || 10}`,
      {x: W(t) - MX(t) - 1.4, y: t.grid.footerY - 0.06, w: 1.4, h: 0.22,
        size: t.size.footer, color: t.color.faint, align: 'right'});
  }
  function card(c, t, x, y, w, h, o) {
    c.rect({x, y, w, h, fill: o.fill || t.color.frame, radius: R(t),
      line: o.line || t.color.rule, lineW: 0.5});
    if (o.top) c.rect({x, y, w, h: 0.06, fill: o.top});
  }
  function chip(c, t, x, y, text, fill, color) {
    const w = Math.max(1.05, [...String(text)].reduce((a, ch) => a +
      (/[\u4E00-\u9FFF]/.test(ch) ? 1 : 0.56), 0) * 12 / 72 + 0.44);
    c.rect({x, y, w, h: 0.36, fill, radius: 0.18});
    c.text(text, {x: x + 0.18, y, w: w - 0.3, h: 0.36, size: 11.5, bold: true,
      color, valign: 'middle'});
    return x + w + 0.16;
  }
  function hbars(c, t, s) {
    const {x, y, w} = s.box, data = s.data, rowH = 0.86;
    const max = Math.max(...data.map((d) => d.value)) * 1.08;
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
    head, foot, card, chip, hbars,
    cover(c, t, s) {
      c.background(t.color.bg);
      let cx = chip(c, t, MX(t), 0.92, s.chip1 || '论文分享',
        t.color.primarySoft, t.color.primaryDark);
      cx = chip(c, t, cx, 0.92, s.chip2 || '系统组周会', t.color.accentSoft, t.color.accent);
      chip(c, t, cx, 0.92, s.chip3 || '2026', t.color.frame, t.color.muted);
      c.text(s.title, {x: MX(t), y: 2.06, w: CW(t) - 1.2, h: 1.14,
        size: t.size.cover, bold: true, color: t.color.ink, lineSpacing: 1.24, heading: true});
      c.text(s.subtitle, {x: MX(t), y: 3.5, w: CW(t) - 2.6, h: 0.94,
        size: t.size.subtitle, color: t.color.muted, lineSpacing: 1.5});
      card(c, t, MX(t), 4.86, CW(t), 1.06, {fill: t.color.primarySoft, top: t.color.primary});
      c.text('一句话结论', {x: MX(t) + 0.3, y: 5.06, w: 2.2, h: 0.26, size: 10.5,
        bold: true, color: t.color.primaryDark, charSpacing: 1.4});
      c.text(s.takeaway || '批次内部的簇号可预测，预取能把 p95 延迟压到 53 ms。',
        {x: MX(t) + 0.3, y: 5.38, w: CW(t) - 0.7, h: 0.4, size: 15.5,
          color: t.color.primaryDark, bold: true});
      c.text(s.meta || '', {x: MX(t), y: 6.44, w: 7, h: 0.26, size: 10.5, color: t.color.faint});
      c.notes(s.notes);
    },
    // 2×2 Bento
    outline(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const gap = t.grid.gutter, bw = (CW(t) - gap) / 2, bh = 2.1;
      s.items.forEach((it, i) => {
        const x = MX(t) + (i % 2) * (bw + gap), y = 1.76 + Math.floor(i / 2) * (bh + gap);
        card(c, t, x, y, bw, bh, {top: i === 3 ? t.color.accent : t.color.primary});
        c.text(`PART ${String(i + 1).padStart(2, '0')}`, {x: x + 0.3, y: y + 0.28,
          w: bw - 0.6, h: 0.26, size: 10, bold: true,
          color: i === 3 ? t.color.accent : t.color.primary, charSpacing: 2});
        c.text(it.t, {x: x + 0.3, y: y + 0.7, w: bw - 0.6, h: 0.72, size: 18,
          bold: true, color: t.color.ink, lineSpacing: 1.3});
        if (it.note) c.text(it.note, {x: x + 0.3, y: y + 1.5, w: bw - 0.6, h: 0.4,
          size: 12, color: t.color.muted});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    section(c, t, s) {
      c.background(t.color.primary);
      c.text(`PART ${String(s.index).padStart(2, '0')}`, {x: MX(t), y: 2.24, w: CW(t),
        h: 0.3, size: 12, bold: true, color: t.color.accentSoft, charSpacing: 4});
      c.text(s.title, {x: MX(t), y: 2.76, w: CW(t), h: 0.98, size: t.size.section,
        bold: true, color: t.color.onPrimary, heading: true});
      c.text(s.note || '', {x: MX(t), y: 3.98, w: CW(t) * 0.8, h: 0.5, size: 15,
        color: t.color.primarySoft});
      c.rect({x: MX(t), y: 4.72, w: 1.1, h: 0.05, fill: t.color.onPrimary});
      c.notes(s.notes);
    },
    // 1 大卡 + 2 小卡
    claim(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const gap = t.grid.gutter, bw = CW(t) * 0.56, sw = CW(t) - bw - gap;
      card(c, t, MX(t), 1.76, bw, 4.24, {fill: t.color.primarySoft, top: t.color.primary});
      c.text('关键观察', {x: MX(t) + 0.34, y: 2.06, w: bw - 0.68, h: 0.3, size: 11,
        bold: true, color: t.color.primaryDark, charSpacing: 1.8});
      c.text(s.claim, {x: MX(t) + 0.34, y: 2.58, w: bw - 0.68, h: 1.6, size: 23,
        bold: true, color: t.color.ink, lineSpacing: 1.46, heading: true});
      c.text(s.claimNote || '', {x: MX(t) + 0.34, y: 4.5, w: bw - 0.68, h: 1.1,
        size: 13, color: t.color.muted, lineSpacing: 1.5});
      // 2 or 3 numbers both fit: the stack keeps the same total height, so a
      // third metric shrinks the cards instead of being dropped. Quietly
      // discarding one of the numbers this page exists to show is worse than a
      // tighter card.
      const metrics = s.metrics || [];
      const three = metrics.length > 2;
      const mh = three ? (4.24 - gap * (metrics.length - 1)) / metrics.length : 2.06;
      metrics.forEach((m, i) => {
        const x = MX(t) + bw + gap, y = 1.76 + i * (mh + gap);
        card(c, t, x, y, sw, mh, {top: m.hot ? t.color.accent : null});
        c.text(m.v, {x: x + 0.3, y: y + (three ? 0.14 : 0.36), w: sw - 0.6, h: 0.6,
          size: three ? 22 : 30, bold: true, color: m.hot ? t.color.accent : t.color.primary});
        c.text(m.k, {x: x + 0.3, y: y + (three ? 0.6 : 1.12), w: sw - 0.6,
          h: three ? mh - 0.68 : 0.72, size: three ? 11 : 12,
          color: t.color.muted, lineSpacing: 1.35});
      });
      if (s.source) c.text(s.source, {x: MX(t), y: 6.24, w: CW(t), h: 0.24,
        size: t.size.source, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    method(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const gap = t.grid.gutter, n = s.stages.length;
      const bw = (CW(t) - gap * (n - 1)) / n, y = 1.86, bh = 2.36;
      s.stages.forEach((st, i) => {
        const x = MX(t) + i * (bw + gap);
        card(c, t, x, y, bw, bh, {top: i === s.hot ? t.color.accent : t.color.primary});
        c.text(String(i + 1).padStart(2, '0'), {x: x + 0.28, y: y + 0.3, w: 0.6,
          h: 0.32, size: 14, bold: true,
          color: i === s.hot ? t.color.accent : t.color.primary});
        c.text(st.t, {x: x + 0.28, y: y + 0.82, w: bw - 0.56, h: 0.4, size: 17,
          bold: true, color: t.color.ink});
        c.text(st.d, {x: x + 0.28, y: y + 1.34, w: bw - 0.56, h: 0.82, size: 12,
          color: t.color.muted, lineSpacing: 1.42});
        if (i < n - 1) c.line({x1: x + bw + 0.04, y1: y + bh / 2, x2: x + bw + gap - 0.04,
          y2: y + bh / 2, color: t.color.primary, w: 1, arrow: true});
      });
      card(c, t, MX(t), 4.56, CW(t), 1.16, {fill: t.color.accentSoft, top: t.color.accent});
      c.text(s.takeaway || s.claim, {x: MX(t) + 0.32, y: 4.84, w: CW(t) - 0.64,
        h: 0.6, size: 16.5, bold: true, color: t.color.ink, lineSpacing: 1.4});
      foot(c, t, s); c.notes(s.notes);
    },
    result(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      card(c, t, MX(t), 1.82, 4.5, 3.62, {fill: t.color.accentSoft, top: t.color.accent});
      c.text(s.big, {x: MX(t) + 0.32, y: 2.16, w: 3.9, h: 1.14, size: t.size.bigNumber,
        bold: true, color: t.color.accent, heading: true});
      c.text(s.bigLabel, {x: MX(t) + 0.32, y: 3.38, w: 3.9, h: 0.32, size: 14.5,
        bold: true, color: t.color.ink});
      c.text(s.bigNote, {x: MX(t) + 0.32, y: 3.84, w: 4.24, h: 1.28, size: 11.5,
        color: t.color.muted, lineSpacing: 1.5});
      const rx = MX(t) + 4.82;
      card(c, t, rx, 1.82, CW(t) - 4.82, 3.62, {fill: t.color.frame, top: null});
      hbars(c, t, {box: {x: rx + 0.32, y: 2.26, w: CW(t) - 4.82 - 0.64}, data: s.data});
      c.text(s.caption, {x: rx + 0.32, y: 4.86, w: CW(t) - 4.82 - 0.64, h: 0.44,
        size: t.size.caption, color: t.color.faint, lineSpacing: 1.3});
      foot(c, t, s); c.notes(s.notes);
    },
    table(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const y0 = 1.78, rh = 0.8, x0 = MX(t);
      const xs = []; let acc = x0;
      s.widths.forEach((w) => { xs.push(acc); acc += w; });
      const right = x0 + s.widths.reduce((a, b) => a + b, 0);
      c.rect({x: x0, y: y0, w: right - x0, h: 0.56, fill: t.color.primary, radius: R(t)});
      s.cols.forEach((cl, i) => c.text(cl, {x: xs[i] + 0.14, y: y0, w: s.widths[i] - 0.28,
        h: 0.56, size: 12, bold: true, color: t.color.onPrimary, valign: 'middle',
        align: i === 0 ? 'left' : 'right'}));
      s.rows.forEach((r, i) => {
        const y = y0 + 0.56 + i * rh;
        c.rect({x: x0, y, w: right - x0, h: rh,
          fill: r.ours ? t.color.accentSoft : (i % 2 ? t.color.frame : t.color.bg)});
        r.cells.forEach((cell, j) => c.text(cell, {x: xs[j] + 0.14, y,
          w: s.widths[j] - 0.28, h: rh, size: 14, bold: !!r.ours,
          color: r.ours ? t.color.accent : t.color.body, valign: 'middle',
          align: j === 0 ? 'left' : 'right'}));
      });
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.56 + s.rows.length * rh + 0.24,
        w: CW(t), h: 0.44, size: 11, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },
    // 四色 callout
    summary(c, t, s) {
      c.background(t.color.bg); head(c, t, s);
      const keys = ['calloutContext', 'calloutVerified', 'calloutLimit', 'calloutTakeaway'];
      const bars = ['378ADD', '0C9487', 'BE175C', '7C5FDB'];
      const gap = t.grid.gutter, bw = (CW(t) - gap) / 2, bh = 2.04;
      s.cards.forEach((cd, i) => {
        const x = MX(t) + (i % 2) * (bw + gap), y = 1.76 + Math.floor(i / 2) * (bh + gap);
        c.rect({x, y, w: bw, h: bh, fill: t.color[keys[i % 4]], radius: R(t)});
        c.rect({x, y, w: 0.065, h: bh, fill: bars[i % 4]});
        c.text(cd.label, {x: x + 0.32, y: y + 0.26, w: bw - 0.6, h: 0.3, size: 11.5,
          bold: true, color: bars[i % 4], charSpacing: 1.4});
        c.text(cd.text, {x: x + 0.32, y: y + 0.72, w: bw - 0.62, h: 1.1,
          size: 14.5, color: t.color.body, lineSpacing: 1.48});
      });
      foot(c, t, s); c.notes(s.notes);
    },
    thanks(c, t, s) {
      c.background(t.color.primary);
      c.text('THANKS / Q & A', {x: MX(t), y: 1.9, w: CW(t), h: 0.34, size: 12,
        bold: true, color: t.color.accentSoft, charSpacing: 4});
      c.text(s.title || '谢谢，请批评指正', {x: MX(t), y: 2.7, w: CW(t), h: 1.0,
        size: 42, bold: true, color: t.color.onPrimary, heading: true});
      c.rect({x: MX(t), y: 4.0, w: 1.1, h: 0.05, fill: t.color.onPrimary});
      c.text(s.line || '欢迎讨论：预取窗口与 SSD 队列深度的关系',
        {x: MX(t), y: 4.34, w: CW(t) * 0.8, h: 0.44, size: 16, color: t.color.primarySoft});
      c.text(s.contact || '', {x: MX(t), y: 6.4, w: CW(t), h: 0.26, size: 10.5,
        color: t.color.primarySoft});
      c.notes(s.notes);
    },
  };
};
