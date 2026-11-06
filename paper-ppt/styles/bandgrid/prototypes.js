'use strict';
// Band Grid · 中文论文分享 / 文献综述
// 蒸馏自南科大 paper-share 模板：满版页眉带、PART 分区页、横向「标签块 + 内容」带、橙色重点档。
// 契约同仓库其余预设，由 assets/style-presets-stylekit.js 注册。

module.exports = function makeBandgrid({pageNo}) {
  const W = (t) => t.slide.w;
  const MX = (t) => t.grid.marginX;
  const CW = (t) => W(t) - 2 * MX(t);
  const CHIP = (t) => t.grid.chipW;
  const ems = (s) => [...String(s || '')].reduce((a, ch) => a + (/[\u4E00-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);
  const textW = (s, sz) => ems(s) * sz / 72;

  function head(c, t, s) {
    c.rect({x: 0, y: 0, w: W(t), h: t.grid.barH, fill: t.color.primary});
    c.rect({x: 0, y: t.grid.barH, w: W(t), h: 0.035, fill: t.color.primaryDark});
    c.text(s.title, {x: MX(t), y: 0, w: W(t) - 2 * MX(t) - 3.2, h: t.grid.barH, size: t.size.title,
      bold: true, color: t.color.onPrimary, valign: 'middle', heading: true});
    c.text(s.headRight || '论文分享 · 系统组', {x: W(t) - MX(t) - 3.2, y: 0, w: 3.2, h: t.grid.barH,
      size: 10, color: t.color.onPrimaryMuted, align: 'right', valign: 'middle'});
    if (s.note) c.text(s.note, {x: MX(t), y: t.grid.barH + 0.16, w: CW(t) * 0.8, h: 0.28,
      size: 12.5, color: t.color.muted});
  }

  function foot(c, t, s) {
    c.line({x1: MX(t), y1: t.grid.footerY - 0.2, x2: W(t) - MX(t), y2: t.grid.footerY - 0.2,
      color: t.color.rule, w: 0.5});
    c.text(s.footLeft || '系统组 · 张××', {x: MX(t), y: t.grid.footerY - 0.08, w: 8, h: 0.22,
      size: t.size.footer, color: t.color.faint});
    if (s.page) c.text(`${s.page} / ${s.total || 10}`, {x: W(t) - MX(t) - 1.4, y: t.grid.footerY - 0.08,
      w: 1.4, h: 0.22, size: t.size.footer, color: t.color.faint, align: 'right'});
  }

  // 基本单元：左侧标签块 + 右侧内容带；accent=true 时整条转成橙色重点档
  function band(c, t, o) {
    const x = o.x !== undefined ? o.x : MX(t);
    const w = o.w || CW(t);
    const lines = Math.max(1, Math.ceil(textW(o.text, t.size.body) / (w - CHIP(t) - 0.7)));
    const h = o.h || Math.max(0.7, 0.36 + lines * 0.3);
    c.rect({x, y: o.y, w: CHIP(t), h, fill: o.accent ? t.color.accent : t.color.primaryLight});
    c.text(o.label, {x: x + 0.2, y: o.y, w: CHIP(t) - 0.32, h, size: t.size.chip, bold: true,
      color: o.accent ? t.color.onPrimary : t.color.primary, valign: 'middle', heading: true});
    c.rect({x: x + CHIP(t) + 0.1, y: o.y, w: w - CHIP(t) - 0.1, h,
      fill: o.accent ? t.color.accentLight : t.color.frame});
    c.text(o.text, {x: x + CHIP(t) + 0.3, y: o.y, w: w - CHIP(t) - 0.55, h, size: t.size.body,
      color: t.color.body, valign: 'middle', lineSpacing: 1.35});
    return o.y + h + t.grid.bandGap;
  }

  function bars(c, t, s) {
    const {x, y, w, h} = s.box;
    const data = s.data;
    const max = Math.max(...data.map((d) => d.value)) * 1.2;
    const base = y + h - 0.5;
    const slot = w / data.length;
    const bw = Math.min(1.5, slot * 0.44);
    c.line({x1: x, y1: base, x2: x + w, y2: base, color: t.color.primary, w: 0.75});
    data.forEach((d, i) => {
      const cx = x + slot * (i + 0.5);
      const bh = Math.max(0.05, (d.value / max) * (h - 1.1));
      c.rect({x: cx - bw / 2, y: base - bh, w: bw, h: bh,
        fill: d.ours ? t.color.accent : t.color.ghost});
      c.text(String(d.value), {x: cx - 0.7, y: base - bh - 0.38, w: 1.4, h: 0.3, size: 15, bold: true,
        color: d.ours ? t.color.accent : t.color.primary, align: 'center'});
      c.text(d.label, {x: cx - slot / 2, y: base + 0.12, w: slot, h: 0.26, size: 11.5,
        color: t.color.body, align: 'center'});
    });
  }

  return {
    head, foot, band, bars,

    cover(c, t, s) {
      c.background(t.color.bg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.9, fill: t.color.primary});
      c.text(s.kicker, {x: MX(t), y: 0, w: CW(t) - 3.4, h: 0.9, size: 11.5, bold: true,
        color: t.color.onPrimary, valign: 'middle', charSpacing: 1.6});
      c.text(s.date, {x: W(t) - MX(t) - 3.2, y: 0, w: 3.2, h: 0.9, size: 10.5,
        color: t.color.onPrimaryMuted, align: 'right', valign: 'middle'});
      c.text(s.title, {x: MX(t), y: 1.52, w: CW(t) - 0.6, h: 1.1, size: t.size.cover, bold: true,
        color: t.color.text, lineSpacing: 1.24, heading: true});
      c.text(s.subtitle, {x: MX(t), y: 2.76, w: CW(t) - 1.2, h: 0.8, size: t.size.subtitle,
        color: t.color.muted, lineSpacing: 1.45});
      let y = 3.72;
      y = band(c, t, {y, label: '论文出处', text: s.venue});
      y = band(c, t, {y, label: '作者', text: s.authors});
      y = band(c, t, {y, label: '一句话结论', text: s.takeaway, accent: true});
      c.text(s.foot, {x: MX(t), y: 6.5, w: CW(t), h: 0.26, size: 9.5, color: t.color.faint});
      c.notes(s.notes);
    },

    outline(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      let y = 1.5;
      s.items.forEach((it, i) => {
        y = band(c, t, {y, h: 0.86, label: it.label || `PART ${i + 1}`, text: it.text});
      });
      c.text(s.hint || '', {x: MX(t), y: y + 0.12, w: CW(t), h: 0.3, size: 11.5, color: t.color.faint});
      foot(c, t, s); c.notes(s.notes);
    },

    part(c, t, s) {
      c.background(t.color.bg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.72, fill: t.color.primary});
      c.text(`PART ${String(s.index).padStart(2, '0')}`, {x: 0, y: 2.42, w: W(t), h: 0.3, size: 12.5,
        bold: true, color: t.color.accent, align: 'center', charSpacing: 5});
      c.text(s.title, {x: 0, y: 2.86, w: W(t), h: 0.8, size: t.size.section, bold: true,
        color: t.color.text, align: 'center', heading: true});
      c.text(s.note || '', {x: 0, y: 3.78, w: W(t), h: 0.34, size: 14, color: t.color.muted, align: 'center'});
      c.rect({x: W(t) / 2 - 1.6, y: 4.42, w: 3.2, h: 0.045, fill: t.color.primary});
      c.notes(s.notes);
    },

    // 标签带页：一页 2–3 条，最后一条通常用 accent 收口
    bands(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const n = s.rows.length;
      const gap = t.grid.bandGap;
      const avail = t.grid.contentBottom - 1.62 - (s.aside ? 1.35 : 0);
      const even = Math.min(1.15, (avail - gap * (n - 1)) / n);
      let y = 1.62;
      s.rows.forEach((r) => { y = band(c, t, {y, h: Math.max(0.7, even), ...r}); });
      if (s.aside) {
        c.rect({x: MX(t), y: y + 0.18, w: 0.06, h: 0.62, fill: t.color.primary});
        c.text(s.aside, {x: MX(t) + 0.24, y: y + 0.14, w: CW(t) - 0.3, h: 0.7, size: 12.5,
          color: t.color.muted, lineSpacing: 1.4});
      }
      foot(c, t, s); c.notes(s.notes);
    },

    // 三步流水线：横向三条带 + 箭头，本文关键环节用 accent
    method(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const n = s.stages.length;
      const gap = 0.5;
      const bw = (CW(t) - gap * (n - 1)) / n;
      const y = 2.0, bh = 1.96;
      s.stages.forEach((st, i) => {
        const x = MX(t) + i * (bw + gap);
        const hot = i === s.hot;
        c.rect({x, y, w: bw, h: bh, fill: hot ? t.color.accentLight : t.color.primaryLight});
        c.rect({x, y, w: bw, h: 0.06, fill: hot ? t.color.accent : t.color.primary});
        c.text(String(i + 1), {x: x + 0.24, y: y + 0.24, w: 0.4, h: 0.34, size: 13, bold: true,
          color: hot ? t.color.accent : t.color.primary});
        c.text(st.t, {x: x + 0.24, y: y + 0.62, w: bw - 0.48, h: 0.36, size: 16.5, bold: true,
          color: t.color.text, heading: true});
        c.text(st.d, {x: x + 0.24, y: y + 1.06, w: bw - 0.48, h: 0.66, size: 12.5,
          color: t.color.muted, lineSpacing: 1.3});
        if (i < n - 1) {
          c.line({x1: x + bw + 0.1, y1: y + bh / 2, x2: x + bw + gap - 0.1, y2: y + bh / 2,
            color: t.color.primary, w: 1, arrow: true});
        }
      });
      c.rect({x: MX(t), y: 4.58, w: CW(t), h: 0.02, fill: t.color.rule});
      c.text(s.takeaway, {x: MX(t), y: 4.82, w: CW(t) * 0.94, h: 0.6, size: 17, color: t.color.body, lineSpacing: 1.4});
      if (s.aside) c.text(s.aside, {x: MX(t), y: 5.62, w: CW(t), h: 0.5, size: 12, color: t.color.muted});
      foot(c, t, s); c.notes(s.notes);
    },

    result(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      c.text(s.big, {x: MX(t), y: 1.86, w: 4.4, h: 0.94, size: t.size.bigNumber, bold: true,
        color: t.color.accent, heading: true});
      c.text(s.bigLabel, {x: MX(t), y: 2.86, w: 4.3, h: 0.32, size: 14, color: t.color.text});
      c.text(s.bigNote, {x: MX(t), y: 3.3, w: 4.5, h: 1.2, size: 11.5, color: t.color.muted, lineSpacing: 1.5});
      bars(c, t, {box: {x: 5.3, y: 1.86, w: W(t) - MX(t) - 5.3, h: 3.9}, data: s.data});
      c.text(s.caption, {x: 5.3, y: 6.02, w: W(t) - MX(t) - 5.3, h: 0.28, size: t.size.caption,
        color: t.color.muted, align: 'center'});
      foot(c, t, s); c.notes(s.notes);
    },

    table(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      const x0 = MX(t), y0 = 1.62, rh = 0.78;
      const xs = []; let acc = x0;
      s.widths.forEach((w) => { xs.push(acc); acc += w; });
      const right = x0 + s.widths.reduce((a, b) => a + b, 0);
      c.rect({x: x0, y: y0, w: right - x0, h: 0.52, fill: t.color.primary});
      s.cols.forEach((cl, i) => {
        c.text(cl, {x: xs[i] + 0.16, y: y0, w: s.widths[i] - 0.3, h: 0.52, size: 12.5, bold: true,
          color: t.color.onPrimary, valign: 'middle', align: i === 0 ? 'left' : 'right'});
      });
      s.rows.forEach((r, i) => {
        const y = y0 + 0.52 + i * rh;
        if (r.ours) c.rect({x: x0, y, w: right - x0, h: rh, fill: t.color.accentLight});
        else if (i % 2 === 1) c.rect({x: x0, y, w: right - x0, h: rh, fill: t.color.frame});
        r.cells.forEach((cell, j) => {
          c.text(cell, {x: xs[j] + 0.16, y, w: s.widths[j] - 0.3, h: rh, size: 14,
            bold: !!r.ours, color: r.ours ? t.color.accent : t.color.body, valign: 'middle',
            align: j === 0 ? 'left' : 'right'});
        });
      });
      c.line({x1: x0, y1: y0 + 0.52 + s.rows.length * rh, x2: right, y2: y0 + 0.52 + s.rows.length * rh,
        color: t.color.primary, w: 0.75});
      if (s.tableNote) c.text(s.tableNote, {x: x0, y: y0 + 0.52 + s.rows.length * rh + 0.24, w: CW(t),
        h: 0.5, size: 11, color: t.color.faint, lineSpacing: 1.35});
      foot(c, t, s); c.notes(s.notes);
    },

    summary(c, t, s) {
      c.background(t.color.bg);
      head(c, t, s);
      let y = band(c, t, {y: 1.6, label: '核心结论', text: s.conclusion, accent: true});
      y += 0.16;
      c.text('遗留问题', {x: MX(t), y, w: 2, h: 0.3, size: 12, bold: true, color: t.color.primary,
        charSpacing: 1.2});
      y += 0.42;
      // Spread the questions over the space that is actually left instead of
      // stacking them at a fixed 0.52in pitch, which left the bottom third of
      // the page empty. Centred, and capped so three items never look like a
      // sparse agenda.
      const n = s.questions.length;
      const room = t.grid.contentBottom - y;
      const step = Math.max(0.52, Math.min(1.15, room / Math.max(n, 1)));
      const top = y + 0.12;
      s.questions.forEach((q, i) => {
        const yy = top + i * step;
        c.rect({x: MX(t) + 0.02, y: yy + 0.13, w: 0.075, h: 0.075, fill: t.color.primary});
        c.text(q, {x: MX(t) + 0.24, y: yy, w: CW(t) - 0.3, h: 0.4, size: 15, color: t.color.body, lineSpacing: 1.35});
      });
      foot(c, t, s); c.notes(s.notes);
    },

    thanks(c, t, s) {
      c.background(t.color.bg);
      c.rect({x: 0, y: 0, w: W(t), h: 0.72, fill: t.color.primary});
      c.text('THANKS', {x: 0, y: 2.6, w: W(t), h: 0.5, size: 13, bold: true, color: t.color.accent,
        align: 'center', charSpacing: 6});
      c.text(s.title || '谢谢，请批评指正', {x: 0, y: 3.12, w: W(t), h: 0.8, size: 32, bold: true,
        color: t.color.text, align: 'center', heading: true});
      c.rect({x: W(t) / 2 - 1.4, y: 4.12, w: 2.8, h: 0.045, fill: t.color.primary});
      c.text(s.line || '欢迎讨论：预取窗口与 SSD 队列深度的关系', {x: 0, y: 4.38, w: W(t), h: 0.36,
        size: 14, color: t.color.muted, align: 'center'});
      c.text(s.contact, {x: 0, y: 6.4, w: W(t), h: 0.3, size: 10.5, color: t.color.faint, align: 'center'});
      c.notes(s.notes);
    },
  };
};
