'use strict';
// Graphite · 高对比系统讲座（蒸馏自 CMU 15-445 / Andy Pavlo 公开课件）
// 契约与仓库其余预设一致：tokens 在 styles/graphite/tokens.json，原型全部走 canvas API，
// 因此同一份代码既渲染 PPTX 也可渲染 SVG 预览。由 ../assets/style-presets-stylekit.js 注册。

module.exports = function makeGraphite({pageNo}) {
  const W = (t) => t.slide.w;
  const MX = (t) => t.grid.marginX;
  const CW = (t) => W(t) - 2 * MX(t);
  const caps = (s) => (/[\u4E00-\u9FFF]/.test(String(s)) ? String(s) : String(s).toUpperCase());

  // 页眉：kicker + 全大写标题 + 通栏细线。graphite 的全部「装饰」就是这条线。
  function head(c, t, s) {
    c.text(caps(s.kicker || 'PAPER READING'), {
      x: MX(t), y: t.grid.kickerY, w: CW(t), h: 0.22,
      size: t.size.kicker, bold: true, color: t.color.accent, charSpacing: 2.2, heading: true,
    });
    c.text(caps(s.title), {
      x: MX(t), y: t.grid.titleY, w: CW(t), h: t.grid.titleH,
      size: t.size.title, bold: true, color: t.color.ink, charSpacing: 1.1, heading: true,
    });
    c.line({x1: MX(t), y1: t.grid.ruleY, x2: W(t) - MX(t), y2: t.grid.ruleY, color: t.color.rule, w: 0.75});
    if (s.note) {
      c.text(s.note, {x: MX(t), y: t.grid.ruleY + 0.08, w: CW(t) * 0.72, h: 0.26,
        size: t.size.small, color: t.color.muted});
    }
  }

  function foot(c, t, s) {
    const y = t.grid.footerY;
    if (s.source) {
      c.text(caps(s.source), {x: MX(t), y: y - 0.38, w: 9, h: 0.2, size: 8.5,
        color: t.color.faint, charSpacing: 1.4});
    }
    // No paper name is baked in: a deck that passes no footLeft gets no footer,
    // rather than someone else's title on every page.
    if (s.footLeft) {
      c.text(caps(s.footLeft), {
        x: MX(t), y, w: 7, h: 0.2, size: t.size.footer, color: t.color.faint, charSpacing: 1.6});
    }
    if (s.page) {
      c.text(`${String(s.page).padStart(2, '0')} / ${String(s.total || 10).padStart(2, '0')}`, {
        x: W(t) - MX(t) - 1.4, y, w: 1.4, h: 0.2, size: t.size.footer, color: t.color.faint,
        align: 'right', charSpacing: 1.6});
    }
  }

  // 要点行：每条上面一条发丝线，左对齐，无项目符号圆点——用「行」本身做分隔。
  function rows(c, t, items, o) {
    const x = o.x, w = o.w, y0 = o.y;
    const gap = o.gap || 1.16;
    items.forEach((it, i) => {
      const y = y0 + i * gap;
      c.line({x1: x, y1: y - 0.16, x2: x + w, y2: y - 0.16, color: t.color.rule, w: 0.5});
      c.text(it.t, {x, y, w, h: 0.4, size: o.size || t.size.body, color: t.color.body, heading: true, lineSpacing: 1.15});
      if (it.d) c.text(it.d, {x, y: y + 0.44, w, h: 0.3, size: t.size.small, color: t.color.muted, lineSpacing: 1.2});
    });
  }

  // 柱状对比：无网格、无图例、直接标数；对照中灰，本文 accent。
  function bars(c, t, s) {
    const {x, y, w, h} = s.box;
    const data = s.data;                    // [{label, value, ours}]
    const max = Math.max(...data.map((d) => d.value)) * 1.18;
    const base = y + h - 0.42;
    const n = data.length;
    const slot = w / n;
    const bw = Math.min(1.5, slot * 0.44);
    c.line({x1: x, y1: base, x2: x + w, y2: base, color: t.color.ink, w: 1});
    data.forEach((d, i) => {
      const cx = x + slot * (i + 0.5);
      const bh = Math.max(0.05, (d.value / max) * (h - 1.05));
      c.rect({x: cx - bw / 2, y: base - bh, w: bw, h: bh, fill: d.ours ? t.color.accent : t.color.ghost});
      c.text(s.fmt ? s.fmt(d.value) : String(d.value), {
        x: cx - 0.9, y: base - bh - 0.42, w: 1.8, h: 0.34, size: 18, bold: true,
        color: d.ours ? t.color.accent : t.color.body, align: 'center'});
      c.text(d.label, {x: cx - slot / 2, y: base + 0.1, w: slot, h: 0.28, size: 11.5,
        color: d.ours ? t.color.ink : t.color.muted, align: 'center', bold: !!d.ours});
    });
  }

  return {
    head, foot,

    cover(c, t, s) {
      c.background(t.color.ink);
      c.text(caps(s.kicker), {x: MX(t), y: 0.66, w: 9, h: 0.24, size: t.size.kicker + 1, bold: true,
        color: t.color.accent, charSpacing: 2.6});
      // 标题按行估算宽度，放不下先缩字号（不低于 32pt），避免溢出压到副标题
      const est = (txt, sz) => [...String(txt)].reduce((a, ch) => a + (/[\u4E00-\u9FFF]/.test(ch) ? 1 : 0.6), 0) * sz / 72;
      const maxW = 9.6;
      let size = t.size.cover;
      const rawLines = s.title.split('\n');
      while (size > 32 && Math.max(...rawLines.map((l) => est(caps(l), size))) > maxW) size -= 1;
      const lh = size * 1.06 / 72 + 0.04;
      const titleTop = 1.86;
      const ruleY = titleTop + rawLines.length * lh + 0.2;
      c.text(rawLines.map((ln) => ({text: caps(ln), size, bold: true, color: t.color.onDark})), {
        x: MX(t), y: titleTop, w: maxW, h: rawLines.length * lh * 1.14, size, lineSpacing: 1.06, charSpacing: 0.8, heading: true});
      c.rect({x: MX(t), y: ruleY, w: 1.55, h: 0.055, fill: t.color.accent});
      c.text(s.subtitle, {x: MX(t), y: ruleY + 0.28, w: 8.9, h: 0.9, size: t.size.subtitle,
        color: t.color.onDarkMuted, lineSpacing: 1.35});
      c.line({x1: 10.72, y1: 1.86, x2: 10.72, y2: ruleY + 1.2, color: t.color.hairDark, w: 0.75});
      c.text(caps(s.authors), {x: MX(t), y: 6.24, w: 7, h: 0.24, size: 9.5, color: t.color.onDarkMuted, charSpacing: 1.8});
      c.text(s.meta, {x: 10.72 - 0.02, y: 6.24, w: 1.76, h: 0.24, size: 9.5, color: t.color.onDarkMuted, align: 'right'});
      c.text(s.affil, {x: MX(t), y: ruleY + 1.22, w: 8.9, h: 0.24, size: 10, color: t.color.onDarkMuted, charSpacing: 0.6});
      c.notes(s.notes);
    },

    outline(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      s.items.forEach((it, i) => {
        const y = 2.05 + i * 1.16;
        c.text(String(i + 1).padStart(2, '0'), {x: MX(t), y: y + 0.04, w: 0.62, h: 0.3,
          size: 12, bold: true, color: t.color.accent, charSpacing: 1.4});
        c.text(it, {x: MX(t) + 0.62, y, w: CW(t) - 3.2, h: 0.52, size: 24, color: t.color.ink, heading: true});
        c.line({x1: MX(t) + 0.62, y1: y + 0.72, x2: W(t) - MX(t), y2: y + 0.72, color: t.color.rule, w: 0.5});
      });
      foot(c, t, s); c.notes(s.notes);
    },

    section(c, t, s) {
      c.background(t.color.ink);
      c.text(String(s.index).padStart(2, '0'), {x: MX(t), y: 1.02, w: 2, h: 0.26, size: 11, bold: true,
        color: t.color.accent, charSpacing: 3});
      c.text(caps(s.word), {x: MX(t), y: 2.42, w: CW(t), h: 1.68, size: t.size.section, bold: true,
        color: t.color.onDark, charSpacing: 1.2, heading: true});
      c.text(s.line, {x: MX(t), y: 4.16, w: CW(t) * 0.78, h: 0.4, size: 15, color: t.color.onDarkMuted});
      c.line({x1: MX(t), y1: 6.28, x2: W(t) - MX(t), y2: 6.28, color: t.color.hairDark, w: 0.75});
      c.notes(s.notes);
    },

    // 一句主张 + 右侧三个可核验数字
    statement(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      c.text(s.claim, {x: MX(t), y: 2.02, w: 7.55, h: 1.9, size: 32, color: t.color.ink,
        lineSpacing: 1.28, heading: true});
      if (s.claimNote) c.text(s.claimNote, {x: MX(t), y: 4.18, w: 7.2, h: 1.2, size: 16,
        color: t.color.muted, lineSpacing: 1.5});
      const xr = 9.05, wr = W(t) - MX(t) - xr;
      s.metrics.forEach((m, i) => {
        const y = 2.28 + i * 1.5;
        c.line({x1: xr, y1: y - 0.12, x2: xr + wr, y2: y - 0.12, color: t.color.rule, w: 0.75});
        c.text(m.v, {x: xr, y, w: wr, h: 0.62, size: 30, bold: true, color: m.hot ? t.color.accent : t.color.ink});
        c.text(m.k, {x: xr, y: y + 0.62, w: wr, h: 0.5, size: 12, color: t.color.muted, lineSpacing: 1.25});
      });
      foot(c, t, s); c.notes(s.notes);
    },

    // 三阶段流水线（细线方框 + 箭头）+ 时间重叠条：一个论证，两层证据
    method(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const n = s.stages.length;
      const gap = 0.78;
      const bw = (CW(t) - gap * (n - 1)) / n;
      const y = 2.1, bh = 1.62;
      s.stages.forEach((st, i) => {
        const x = MX(t) + i * (bw + gap);
        c.text(`STAGE ${i + 1}`, {x, y: y - 0.32, w: bw, h: 0.2, size: 9, bold: true,
          color: i === s.hot ? t.color.accent : t.color.muted, charSpacing: 2.2});
        c.rect({x, y, w: bw, h: bh, fill: 'FFFFFF', line: i === s.hot ? t.color.accent : t.color.ghost,
          lineW: i === s.hot ? 1.6 : 1});
        c.text(st.t, {x: x + 0.26, y: y + 0.24, w: bw - 0.52, h: 0.36, size: 18, bold: true,
          color: t.color.ink, lineSpacing: 1.1});
        c.text(st.d, {x: x + 0.26, y: y + 0.74, w: bw - 0.52, h: 0.74, size: 12.5,
          color: t.color.muted, lineSpacing: 1.35});
        if (i < n - 1) {
          c.line({x1: x + bw + 0.14, y1: y + bh / 2, x2: x + bw + gap - 0.14, y2: y + bh / 2,
            color: t.color.ink, w: 1.1, arrow: true});
        }
      });
      c.line({x1: MX(t), y1: 4.14, x2: W(t) - MX(t), y2: 4.14, color: t.color.rule, w: 0.75});
      c.text(s.takeaway, {x: MX(t), y: 4.3, w: CW(t) * 0.92, h: 0.5, size: 19,
        color: t.color.body, lineSpacing: 1.3});
      // 时间轴：I/O 与打分错位重叠，证明「重叠」而不只是「更快」
      const lx = MX(t), lw = 0.95, tx = MX(t) + 1.25, tw = 6.9, ly = 5.2, lh = 0.24;
      const U = tw / 5.6;
      const seg = (t0, t1, yy, col) => c.rect({x: tx + t0 * U, y: yy, w: (t1 - t0) * U - 0.06, h: lh, fill: col});
      c.text('COMPUTE', {x: lx, y: ly - 0.02, w: lw + 0.3, h: 0.24, size: 8.5, bold: true,
        color: t.color.muted, charSpacing: 1.4});
      c.text('I/O READ', {x: lx, y: ly + lh + 0.28, w: lw + 0.3, h: 0.24, size: 8.5, bold: true,
        color: t.color.muted, charSpacing: 1.4});
      [[0, 1.5], [1.6, 3.1], [3.2, 4.7]].forEach(([a, b]) => seg(a, b, ly, t.color.ink));
      [[0.8, 2.3], [2.4, 3.9], [4.0, 5.5]].forEach(([a, b]) => seg(a, b, ly + lh + 0.3, t.color.ghost));
      c.text('TIME →', {x: tx + 5.55 * U - 0.5, y: ly + 2 * lh + 0.4, w: 1.2, h: 0.2, size: 8, color: t.color.faint, charSpacing: 1.6});
      c.text(s.timeNote, {x: tx, y: ly + 2 * lh + 0.72, w: 9.4, h: 0.34, size: 11.5,
        color: t.color.muted, lineSpacing: 1.3});
      foot(c, t, s); c.notes(s.notes);
    },

    result(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      c.text(s.big, {x: MX(t), y: 2.24, w: 4.1, h: 1.46, size: t.size.bigNumber, bold: true,
        color: t.color.accent, heading: true});
      c.text(s.bigLabel, {x: MX(t), y: 3.52, w: 3.9, h: 0.34, size: 15, color: t.color.ink});
      c.text(s.bigNote, {x: MX(t), y: 3.96, w: 3.9, h: 1.2, size: 12, color: t.color.muted, lineSpacing: 1.45});
      c.text(s.axis, {x: 5.3, y: 2.06, w: 7.1, h: 0.24, size: 10, color: t.color.muted, charSpacing: 1.6});
      bars(c, t, {box: {x: 5.3, y: 2.36, w: 7.09, h: 3.9}, data: s.data, fmt: s.fmt});
      c.text(s.caption, {x: 5.3, y: 6.42, w: 7.09, h: 0.24, size: 10, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },

    // booktabs 式表格：只有横线，ours 行用 accent 竖标 + 加粗
    table(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const cols = s.cols; const x0 = MX(t); const y0 = 2.0; const rh = 0.86;
      const widths = s.widths;
      const xs = []; let acc = x0;
      widths.forEach((ww) => { xs.push(acc); acc += ww; });
      const right = x0 + widths.reduce((a, b) => a + b, 0);
      c.line({x1: x0, y1: y0 - 0.16, x2: right, y2: y0 - 0.16, color: t.color.ink, w: 1.4});
      cols.forEach((cl, i) => {
        c.text(caps(cl), {x: xs[i], y: y0, w: widths[i], h: 0.26, size: 9.5, bold: true,
          color: t.color.faint, charSpacing: 1.6, align: i === 0 ? 'left' : 'right'});
      });
      c.line({x1: x0, y1: y0 + 0.4, x2: right, y2: y0 + 0.4, color: t.color.ink, w: 1});
      s.rows.forEach((r, i) => {
        const y = y0 + 0.62 + i * rh;
        if (r.ours) c.rect({x: x0 - 0.3, y: y + 0.06, w: 0.09, h: rh - 0.2, fill: t.color.accent});
        r.cells.forEach((cell, j) => {
          c.text(cell, {x: xs[j], y, w: widths[j], h: 0.32, size: 15.5, bold: !!r.ours,
            color: r.ours ? t.color.ink : t.color.body, align: j === 0 ? 'left' : 'right'});
        });
        c.line({x1: x0, y1: y + rh - 0.14, x2: right, y2: y + rh - 0.14, color: t.color.rule, w: 0.5});
      });
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.62 + s.rows.length * rh + 0.28, w: CW(t),
        h: 0.5, size: 11, color: t.color.faint, lineSpacing: 1.35});
      foot(c, t, s); c.notes(s.notes);
    },

    summary(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      s.items.forEach((it, i) => {
        const y = 2.15 + i * 1.62;
        c.text(`0${i + 1}`, {x: MX(t), y: y + 0.08, w: 0.7, h: 0.3, size: 11, bold: true,
          color: t.color.accent, charSpacing: 1.4});
        c.text(it, {x: MX(t) + 0.7, y, w: CW(t) - 0.7, h: 0.86, size: 23, color: t.color.ink,
          lineSpacing: 1.3, heading: true});
        if (i < s.items.length - 1) {
          c.line({x1: MX(t) + 0.7, y1: y + 1.24, x2: W(t) - MX(t), y2: y + 1.24, color: t.color.rule, w: 0.5});
        }
      });
      foot(c, t, s); c.notes(s.notes);
    },

    thanks(c, t, s) {
      c.background(t.color.ink);
      c.text(caps(s.title || 'THANK YOU'), {x: MX(t), y: 2.7, w: CW(t), h: 1.1, size: 56, bold: true,
        color: t.color.onDark, charSpacing: 2});
      c.rect({x: MX(t), y: 3.98, w: 1.55, h: 0.055, fill: t.color.accent});
      c.text(s.line, {x: MX(t), y: 4.26, w: CW(t) * 0.8, h: 0.4, size: 15, color: t.color.onDarkMuted});
      c.text(s.contact || '', {x: MX(t), y: 6.3, w: 7, h: 0.24, size: 9.5, color: t.color.onDarkMuted, charSpacing: 1.6});
      c.notes(s.notes);
    },
  };
};
