'use strict';
// Violet · 国内组会 / 中期（学院模板系）
// 蒸馏自 thubeamer 公开示例的三件套：满版页眉带、紫底白字块标题、居中「图 N：」图注。
// 契约同仓库其余预设，由 assets/style-presets-stylekit.js 注册。

module.exports = function makeViolet({pageNo}) {
  const W = (t) => t.slide.w;
  const H = (t) => t.slide.h;
  const MX = (t) => t.grid.marginX;
  const CW = (t) => W(t) - 2 * MX(t);
  const ems = (s) => [...String(s || '')].reduce((a, ch) => a + (/[\u4E00-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);
  const textW = (s, sz) => ems(s) * sz / 72;

  // 页眉带：满版紫底 + 左标题 + 右元信息；下沿 0.05in 深紫细线
  function head(c, t, s) {
    c.rect({x: 0, y: 0, w: W(t), h: t.grid.barH, fill: t.color.primary});
    c.rect({x: 0, y: t.grid.barH, w: W(t), h: 0.05, fill: t.color.primaryDark});
    c.text(s.title, {x: MX(t), y: 0, w: W(t) - 2 * MX(t) - 3.9, h: t.grid.barH, size: t.size.title,
      bold: true, color: t.color.onPrimary, valign: 'middle', heading: true});
    c.text(s.headRight || '', {x: W(t) - MX(t) - 3.9, y: 0, w: 3.9, h: t.grid.barH, size: 9.5,
      color: 'DCC6E0', align: 'right', valign: 'middle'});
  }

  function foot(c, t, s) {
    c.line({x1: MX(t), y1: t.grid.footerY - 0.18, x2: W(t) - MX(t), y2: t.grid.footerY - 0.18,
      color: t.color.rule, w: 0.5});
    c.text(s.footLeft || '系统组组会 · 汇报人 张××', {x: MX(t), y: t.grid.footerY - 0.06, w: 8, h: 0.22,
      size: t.size.footer, color: t.color.faint});
    if (s.page) c.text(`${s.page} / ${s.total || 10}`, {x: W(t) - MX(t) - 1.4, y: t.grid.footerY - 0.06,
      w: 1.4, h: 0.22, size: t.size.footer, color: t.color.faint, align: 'right'});
  }

  // 块标题：紫底白字，宽度随文字伸缩——这是本预设最强的识别符号
  function block(c, t, x, y, label, w) {
    const bw = w || Math.min(CW(t), textW(label, t.size.barTitle) + 0.52);
    c.rect({x, y, w: bw, h: 0.42, fill: t.color.primary, radius: 0.03});
    c.text(label, {x: x + 0.22, y, w: bw - 0.3, h: 0.42, size: t.size.barTitle, bold: true,
      color: t.color.onPrimary, valign: 'middle', heading: true});
    return bw;
  }

  function dots(c, t, x, y, n) {
    for (let i = 0; i < n; i++) c.ellipse({x: x + i * 0.14, y, w: 0.075, h: 0.075, fill: t.color.primary});
  }

  // ① ② ③ 序号徽章
  function badge(c, t, x, y, n) {
    c.ellipse({x, y, w: 0.3, h: 0.3, fill: t.color.primary});
    c.text(String(n), {x, y, w: 0.3, h: 0.3, size: 11, bold: true, color: t.color.onPrimary,
      align: 'center', valign: 'middle'});
  }

  function bars(c, t, s) {
    const {x, y, w, h} = s.box;
    const data = s.data;
    const max = Math.max(...data.map((d) => d.value)) * 1.2;
    const base = y + h - 0.5;
    const slot = w / data.length;
    const bw = Math.min(1.55, slot * 0.46);
    c.line({x1: x, y1: base, x2: x + w, y2: base, color: t.color.muted, w: 0.75});
    data.forEach((d, i) => {
      const cx = x + slot * (i + 0.5);
      const bh = Math.max(0.05, (d.value / max) * (h - 1.1));
      c.rect({x: cx - bw / 2, y: base - bh, w: bw, h: bh, fill: d.ours ? t.color.primary : t.color.primaryLight,
        line: d.ours ? t.color.primary : t.color.rule, lineW: 0.75});
      c.text(String(d.value), {x: cx - 0.7, y: base - bh - 0.38, w: 1.4, h: 0.3, size: 15, bold: true,
        color: d.ours ? t.color.primaryDark : t.color.muted, align: 'center'});
      c.text(d.label, {x: cx - slot / 2, y: base + 0.12, w: slot, h: 0.26, size: 11.5,
        color: t.color.body, align: 'center'});
    });
  }

  return {
    head, foot, block, bars,

    cover(c, t, s) {
      c.background(t.color.bg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.55, fill: t.color.primary});
      c.text(s.kicker, {x: MX(t), y: 0, w: 8, h: 0.55, size: 11, color: 'EAD8EE', valign: 'middle'});
      c.text(s.date, {x: W(t) - MX(t) - 3, y: 0, w: 3, h: 0.55, size: 10, color: 'EAD8EE',
        align: 'right', valign: 'middle'});
      c.text(s.title, {x: MX(t), y: 1.66, w: CW(t) - 0.9, h: 1.4, size: t.size.cover, bold: true,
        color: t.color.text, lineSpacing: 1.25, heading: true});
      c.text(s.subtitle, {x: MX(t), y: 2.9, w: CW(t) - 1.6, h: 0.8, size: t.size.subtitle,
        color: t.color.muted, lineSpacing: 1.4});
      c.rect({x: MX(t), y: 3.92, w: 4.6, h: 0.035, fill: t.color.primary});
      s.meta.forEach((m, i) => {
        const y = 4.28 + i * 0.5;
        c.text(m.k, {x: MX(t), y, w: 1.3, h: 0.28, size: 11, color: t.color.faint});
        c.text(m.v, {x: MX(t) + 1.35, y: y - 0.03, w: 6, h: 0.32, size: 14.5, color: t.color.body});
      });
      c.line({x1: MX(t), y1: 6.36, x2: W(t) - MX(t), y2: 6.36, color: t.color.rule, w: 0.5});
      c.text(s.foot, {x: MX(t), y: 6.5, w: CW(t), h: 0.26, size: 9.5, color: t.color.faint});
      c.notes(s.notes);
    },

    outline(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      block(c, t, MX(t), 1.28, '汇报提纲');
      s.items.forEach((it, i) => {
        const y = 2.16 + i * 1.1;
        const label = typeof it === 'string' ? it : it.t;
        const note = typeof it === 'string' ? null : it.note;
        badge(c, t, MX(t) + 0.05, y + 0.02, i + 1);
        c.text(label, {x: MX(t) + 0.56, y: y - 0.02, w: CW(t) - 2.6, h: 0.4, size: 18,
          color: t.color.body, heading: true});
        if (note) c.text(note, {x: MX(t) + 0.56, y: y + 0.42, w: CW(t) - 2.6, h: 0.28,
          size: 12, color: t.color.faint});
        c.line({x1: MX(t) + 0.56, y1: y + 0.86, x2: W(t) - MX(t), y2: y + 0.86, color: t.color.primaryLight, w: 1});
      });
      foot(c, t, s); c.notes(s.notes);
    },

    // 章节页：淡紫满版 + 居中；上下各一条紫细线，是 beamer 的「分节」语汇
    section(c, t, s) {
      c.background(t.color.sectionBg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.55, fill: t.color.primary});
      c.text(`PART ${String(s.index).padStart(2, '0')}`, {x: 0, y: 2.62, w: W(t), h: 0.3, size: 12,
        bold: true, color: t.color.primary, align: 'center', charSpacing: 4});
      c.text(s.title, {x: 0, y: 3.02, w: W(t), h: 0.8, size: t.size.section, bold: true,
        color: t.color.text, align: 'center', heading: true});
      c.text(s.note || '', {x: 0, y: 3.94, w: W(t), h: 0.4, size: 14, color: t.color.muted, align: 'center'});
      c.line({x1: W(t) / 2 - 3.1, y1: 4.52, x2: W(t) / 2 + 3.1, y2: 4.52, color: t.color.primary, w: 0.75});
      c.line({x1: W(t) / 2 - 3.1, y1: 2.3, x2: W(t) / 2 + 3.1, y2: 2.3, color: t.color.primary, w: 0.75});
      c.notes(s.notes);
    },

    // 左文右图（或左图右文）：块标题 + 要点 + 居中图注
    twoCol(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const lw = s.ratio || 0.46;
      const wx = MX(t), ww = CW(t) * lw - 0.25;
      const rx = MX(t) + CW(t) * lw + 0.25, rw = CW(t) * (1 - lw) - 0.25;
      block(c, t, wx, 1.24, s.blockLabel);
      c.text(s.claim, {x: wx, y: 1.86, w: ww, h: 1.3, size: 21, color: t.color.text,
        lineSpacing: 1.45, heading: true});
      let y = 3.22;
      const inner = ww - 0.22;
      s.bullets.forEach((b) => {
        const lines = Math.max(1, Math.ceil(textW(b, 15.5) / inner));
        const bh = lines * 0.32 + 0.1;
        dots(c, t, wx + 0.02, y + 0.14, 1);
        c.text(b, {x: wx + 0.22, y, w: inner, h: bh, size: 15.5, color: t.color.body, lineSpacing: 1.4});
        y += bh + 0.3;
      });
      if (s.note) c.text(s.note, {x: wx, y: 6.2, w: ww, h: 0.4, size: 11.5, color: t.color.faint, lineSpacing: 1.3});
      // 右侧图示：三段纵向流程（本预设唯一自绘图语汇：实心/描边方块 + 箭头）
      const bx = rx, bw = rw, bh = 1.0, gap = 0.52;
      s.stages.forEach((st, i) => {
        const yy = 1.5 + i * (bh + gap);
        c.rect({x: bx, y: yy, w: bw, h: bh, fill: i === s.hot ? t.color.primary : t.color.frame,
          line: t.color.primary, lineW: i === s.hot ? 1 : 0.75});
        c.text(st.t, {x: bx + 0.24, y: yy + 0.12, w: bw - 0.48, h: 0.34, size: 15, bold: true,
          color: i === s.hot ? t.color.onPrimary : t.color.primaryDark});
        c.text(st.d, {x: bx + 0.24, y: yy + 0.48, w: bw - 0.48, h: 0.42, size: 12,
          color: i === s.hot ? 'F0DFF3' : t.color.muted, lineSpacing: 1.25});
        if (i < s.stages.length - 1) {
          c.line({x1: bx + bw / 2, y1: yy + bh + 0.08, x2: bx + bw / 2, y2: yy + bh + gap - 0.08,
            color: t.color.primary, w: 1, arrow: true});
        }
      });
      foot(c, t, s); c.notes(s.notes);
    },

    result(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      block(c, t, MX(t), 1.24, '实验结果');
      c.text(s.claim, {x: MX(t), y: 1.9, w: 4.9, h: 0.9, size: 19, color: t.color.body, lineSpacing: 1.4});
      c.text(s.big, {x: MX(t), y: 2.96, w: 4.6, h: 0.9, size: t.size.bigNumber, bold: true,
        color: t.color.primaryDark, heading: true});
      c.text(s.bigLabel, {x: MX(t), y: 3.9, w: 4.6, h: 0.3, size: 14, color: t.color.body});
      c.text(s.bigNote, {x: MX(t), y: 4.32, w: 4.5, h: 0.9, size: 12, color: t.color.muted, lineSpacing: 1.45});
      bars(c, t, {box: {x: 5.62, y: 1.9, w: W(t) - MX(t) - 5.62, h: 3.9}, data: s.data});
      c.text(s.caption, {x: 5.62, y: 6.06, w: W(t) - MX(t) - 5.62, h: 0.28, size: t.size.caption,
        color: t.color.muted, align: 'center'});
      foot(c, t, s); c.notes(s.notes);
    },

    table(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      block(c, t, MX(t), 1.24, s.blockLabel || '对比结果');
      const x0 = MX(t), y0 = 2.0, rh = 0.9;
      const xs = []; let acc = x0;
      s.widths.forEach((w) => { xs.push(acc); acc += w; });
      const right = x0 + s.widths.reduce((a, b) => a + b, 0);
      c.rect({x: x0, y: y0, w: right - x0, h: 0.58, fill: t.color.primary});
      s.cols.forEach((cl, i) => {
        c.text(cl, {x: xs[i] + 0.14, y: y0, w: s.widths[i] - 0.24, h: 0.58, size: 12, bold: true,
          color: t.color.onPrimary, valign: 'middle', align: i === 0 ? 'left' : 'right'});
      });
      s.rows.forEach((r, i) => {
        const y = y0 + 0.58 + i * rh;
        if (r.ours) c.rect({x: x0, y, w: right - x0, h: rh, fill: t.color.primaryLight});
        r.cells.forEach((cell, j) => {
          c.text(cell, {x: xs[j] + 0.14, y, w: s.widths[j] - 0.24, h: rh, size: 13.5,
            bold: !!r.ours, color: t.color.body, valign: 'middle', align: j === 0 ? 'left' : 'right'});
        });
        c.line({x1: x0, y1: y + rh, x2: right, y2: y + rh, color: t.color.rule, w: 0.5});
      });
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.58 + s.rows.length * rh + 0.24, w: CW(t),
        h: 0.5, size: 11, color: t.color.faint, lineSpacing: 1.35});
      foot(c, t, s); c.notes(s.notes);
    },

    summary(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const bw = CW(t);
      let yy = 1.24;
      s.blocks.forEach((b) => {
        const ph = 0.66 + b.items.length * 0.36 + 0.16;
        c.rect({x: MX(t), y: yy, w: bw, h: ph, fill: t.color.frame});
        block(c, t, MX(t), yy + 0.16, b.label);
        c.text(b.items, {x: MX(t) + 0.26, y: yy + 0.68, w: bw - 0.5,
          h: ph - 0.6, size: 14.5, color: t.color.body, lineSpacing: 1.4, paraSpaceBefore: 5});
        yy += ph + 0.22;
      });
      foot(c, t, s); c.notes(s.notes);
    },

    thanks(c, t, s) {
      c.background(t.color.sectionBg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.55, fill: t.color.primary});
      c.text('THANKS FOR YOUR ATTENTION!', {x: 0, y: 2.86, w: W(t), h: 0.7, size: 30, italic: true,
        color: t.color.primaryDark, align: 'center', heading: true, fontFace: 'Georgia'});
      c.line({x1: W(t) / 2 - 0.9, y1: 3.72, x2: W(t) / 2 + 0.9, y2: 3.72, color: t.color.primary, w: 1});
      c.text('Q & A', {x: 0, y: 3.94, w: W(t), h: 0.6, size: 30, color: t.color.text, align: 'center'});
      c.text(s.contact, {x: 0, y: 6.36, w: W(t), h: 0.3, size: 11, color: t.color.muted, align: 'center'});
      c.notes(s.notes);
    },
  };
};
