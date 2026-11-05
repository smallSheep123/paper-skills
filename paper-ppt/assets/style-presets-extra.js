'use strict';
// Seven more presets distilled from ~100 public academic decks (see references/slide-style-atlas.md).
// Same contract as international/domestic: tokens in styles/<name>/tokens.json, archetypes below,
// every archetype is drawn through the canvas API so it renders to PPTX and to the SVG preview.

const {imageDimensions} = require('./image-geometry');
const K = require('./layout-kit');

module.exports = function makePresets({sourceLine, pageNo}) {
  const W = (t) => t.slide.w;
  const ems = (text) => [...String(text || '')].reduce((a, ch) => a + (/[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? 1 : 0.55), 0);
  // largest size <= max at which text fits on one line of width w (never below min)
  const fitSize = (text, w, max, min = 10) => Math.max(min, Math.min(max, Math.floor(w * 72 / Math.max(1, ems(text)))));
  const aspect = (file) => { try { const d = imageDimensions(file); return d.w / d.h; } catch (e) { return null; } };
  const bullets = (items) => items.map((p) => (typeof p === 'string' ? {text: p, bullet: true} : {bullet: true, ...p}));

  // generic diagram row: boxes with one active, the rest ghosted (focus-dim builds)
  function focusRow(c, t, s, y, opts = {}) {
    const n = s.blocks.length; const gap = 0.5; const x0 = opts.x0 || 1.1; const span = W(t) - 2 * x0;
    const bw = (span - gap * (n - 1)) / n; const bh = opts.h || 1.25;
    s.blocks.forEach((label, i) => {
      const on = i === s.active; const x = x0 + i * (bw + gap);
      c.rect({x, y, w: bw, h: bh, radius: 0.1, fill: on ? (opts.onFill || t.color.primary) : (opts.offFill || null),
        line: on ? (opts.onLine || t.color.primary) : t.color.ghost, lineW: on ? 2 : 1});
      c.text(label, {x, y, w: bw, h: bh, size: t.size.small + 2, bold: on, align: 'center', valign: 'middle',
        color: on ? (opts.onText || 'FFFFFF') : t.color.ghost, heading: true});
      if (i < n - 1) c.line({x1: x + bw + 0.06, y1: y + bh / 2, x2: x + bw + gap - 0.06, y2: y + bh / 2, color: t.color.ghost, w: 1.25, arrow: true});
    });
  }

  // ================= keynote-minimal =================
  // Apple-Keynote / Google-Slides talk: bold headline + one-line claim, very few words, one big visual.
  const keynoteMinimal = {
    head(c, t, s) {
      const x = t.grid.marginX;
      c.text(s.title, {x, y: t.grid.titleY, w: W(t) - 2 * x, h: 0.62, size: t.size.title, bold: true, color: t.color.text, heading: true, valign: 'bottom'});
      if (s.claim) c.text(s.claim, {x, y: t.grid.titleY + 0.66, w: W(t) - 2 * x, h: 0.4, size: t.size.subtitle, bold: true, color: t.color.body});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.text(s.title, {x: 0.9, y: 1.7, w: 11.0, h: 2.2, size: t.size.cover, bold: true, color: t.color.text, heading: true, valign: 'bottom'});
      if (s.subtitle) c.text(s.subtitle, {x: 0.9, y: 4.0, w: 11.0, h: 0.6, size: t.size.subtitle + 4, color: t.color.muted});
      c.rect({x: 0.9, y: 4.85, w: 1.2, h: 0.08, fill: t.color.accent});
      c.text([{text: s.authors, bold: true}, {text: s.venue}], {x: 0.9, y: 5.15, w: 11, h: 1.0, size: t.size.small, color: t.color.body, paraSpaceBefore: 4});
      c.notes(s.notes);
    },
    // a single observation in a big highlight card, one number in accent
    statement(c, t, s) {
      this.head(c, t, s);
      if (s.points) c.text(bullets(s.points), {x: 1.0, y: 1.75, w: 11.3, h: 1.3, size: t.size.small, color: t.color.body, paraSpaceBefore: 4});
      c.rect({x: 1.0, y: 3.25, w: 11.3, h: 2.6, radius: 0.18, fill: t.color.highlight, line: t.color.highlightLine, lineW: 1});
      c.text(s.statement, {x: 1.3, y: 3.25, w: 10.7, h: 2.6, size: 26, color: t.color.text, align: 'center', valign: 'middle', lineSpacing: 1.3});
    },
    // same diagram on consecutive slides; only the active block is solid
    focus(c, t, s) {
      this.head(c, t, s);
      focusRow(c, t, s, 3.0);
      if (s.caption) c.text(s.caption, {x: 1.1, y: 4.75, w: 11.1, h: 0.9, size: t.size.body, color: t.color.body, align: 'center'});
    },
    figure(c, t, s) {
      this.head(c, t, s);
      const top = 1.75; const h = s.caption ? 4.6 : 5.0;
      c.image(s.figure, {x: 1.2, y: top, w: 10.9, h, alt: s.figureAlt});
      if (s.caption) c.text(s.caption, {x: 1.2, y: top + h + 0.1, w: 10.9, h: 0.4, size: t.size.small, color: t.color.muted, align: 'center'});
    },
    // Two-column duel: chart on the left, a verdict table on the right, split by a hairline.
    // Distilled from Eden/S3-FIFO: the reader compares two claims, not one figure with bullets.
    // rows: [{k, v, on}] — `on` boxes the row in accent (the winner).
    duel(c, t, s) {
      this.head(c, t, s);
      const top = 1.62; const bottom = t.grid.contentBottom - 0.45; const split = 7.0;
      K.divide(c, split, top, bottom, t.color.rule, 1);
      K.columnHead(c, 0.85, top, 5.6, s.leftHead || 'Performance', {size: 17, color: t.color.muted, ruleColor: t.color.rule});
      K.columnHead(c, split + 0.45, top, 5.0, s.rightHead || 'Cost', {size: 17, color: t.color.muted, ruleColor: t.color.rule});
      K.figure(c, t, s.figure, {x: 0.85, y: top + 0.62, w: 5.6, h: bottom - top - 0.72, frame: false});
      const rows = s.rows || [];
      const rh = Math.min(1.05, (bottom - top - 0.7) / Math.max(1, rows.length));
      rows.forEach((r, i) => {
        const y = top + 0.62 + i * (rh + 0.12);
        if (r.on) c.rect({x: split + 0.35, y: y - 0.04, w: 5.15, h: rh + 0.02, line: t.color.accent, lineW: 2});
        c.text(r.k, {x: split + 0.5, y, w: 2.65, h: rh, size: 19, color: r.on ? t.color.accent : t.color.body, valign: 'middle'});
        c.text(r.v, {x: split + 3.1, y, w: 2.25, h: rh, size: 25, bold: true, color: r.on ? t.color.accent : t.color.text, align: 'right', valign: 'middle'});
      });
      if (s.note) c.text(s.note, {x: 0.85, y: bottom + 0.08, w: 5.6, h: 0.35, size: t.size.caption, color: t.color.muted});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Edge-to-edge figure, one sentence underneath. The page is the picture.
    figureFull(c, t, s) {
      c.text(s.title, {x: 0.6, y: 0.3, w: 12.1, h: 0.6, size: t.size.title, bold: true, color: t.color.text, heading: true});
      if (s.claim) c.text(s.claim, {x: 0.6, y: 0.92, w: 12.1, h: 0.36, size: t.size.subtitle, bold: true, color: t.color.body});
      const top = s.claim ? 1.4 : 1.05;
      const lineH = s.line ? 0.85 : 0.25;
      K.figure(c, t, s.figure, {x: 0.35, y: top, w: 12.63, h: t.grid.contentBottom - top - lineH, frame: false});
      if (s.line) c.text(s.line, {x: 0.6, y: t.grid.contentBottom - 0.6, w: 12.1, h: 0.6, size: 21, bold: true, color: t.color.text, valign: 'middle'});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    section(c, t, s) {
      c.text(s.kicker || '', {x: 0.9, y: 2.4, w: 11, h: 0.5, size: t.size.small, bold: true, color: t.color.accent, charSpacing: 2});
      c.text(s.title, {x: 0.9, y: 2.9, w: 11.5, h: 1.6, size: t.size.section, bold: true, color: t.color.text, heading: true});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // numbered takeaways, huge digits
    closing(c, t, s) {
      this.head(c, t, s);
      s.points.forEach((p, i) => {
        const y = 1.95 + i * 1.45;
        c.text(String(i + 1), {x: 1.0, y, w: 0.9, h: 1.1, size: 54, bold: true, color: t.color.accent, heading: true, valign: 'middle'});
        c.text(p, {x: 2.1, y, w: 10.0, h: 1.1, size: t.size.body + 2, color: t.color.text, valign: 'middle'});
      });
    },
  };

  // ================= systems-talk =================
  // NSDI/OSDI/SOSP style: contribution tracker, accumulating insight chips, ratio-annotated results, dark code slides.
  const systemsTalk = {
    tracker(c, t, s) {
      if (!s.tracker) return;
      const n = s.tracker.length; const y = t.slide.h - 0.42; const segW = W(t) / n;
      s.tracker.forEach((label, i) => {
        const on = i === s.stage;
        c.rect({x: i * segW, y, w: segW, h: 0.42, fill: on ? t.color.sym[i % t.color.sym.length] : t.color.frame});
        c.text(label, {x: i * segW, y, w: segW, h: 0.42, size: 12, bold: on, color: on ? 'FFFFFF' : t.color.muted, align: 'center', valign: 'middle'});
      });
    },
    head(c, t, s) {
      const x = t.grid.marginX;
      c.text(s.title, {x, y: t.grid.titleY, w: W(t) - 2 * x, h: 0.75, size: t.size.title, bold: true, color: t.color.text, heading: true, valign: 'middle'});
      // Source line: above the tracker when there is one, else on the footer line (visual-review §8 needs it on result pages).
      if (s.source) {
        const sw = W(t) - 2 * x - (s.tracker ? 0 : 1.1);
        c.text(s.source, {x, y: s.tracker ? t.slide.h - 0.42 - 0.34 : t.grid.footerY, w: sw, h: 0.3, size: fitSize(s.source, sw, t.size.source), color: t.color.muted});
      }
      this.tracker(c, t, s); if (!s.tracker) pageNo(c, t, s.page); c.notes(s.notes);
    },
    // cover: kicker (e.g. "论文精读 · 一句话中文题"), title, authors (any length), venue, presenter line
    cover(c, t, s) {
      c.rect({x: 0, y: 0, w: 0.28, h: t.slide.h, fill: t.color.ours});
      if (s.kicker) c.text(s.kicker, {x: 0.9, y: 0.75, w: 11.4, h: 0.5, size: t.size.subtitle, bold: true, color: t.color.primary});
      const titleLines = Math.max(1, Math.ceil(ems(s.title) * t.size.cover / 72 / 11.4));
      const titleSize = titleLines > 2 ? Math.round(t.size.cover * 0.8) : t.size.cover;
      c.text(s.title, {x: 0.9, y: 1.3, w: 11.4, h: 2.3, size: titleSize, bold: true, color: t.color.text, heading: true, valign: 'bottom'});
      const aSize = t.size.small; const aLines = Math.max(1, Math.ceil(ems(s.authors) * aSize / 72 / 11.4));
      const aH = aLines * aSize * 1.35 / 72 + 0.1;
      c.text(s.authors, {x: 0.9, y: 3.75, w: 11.4, h: aH, size: aSize, color: t.color.body});
      c.text(s.venue, {x: 0.9, y: 3.85 + aH, w: 11.4, h: 0.4, size: t.size.small, bold: true, color: t.color.ours});
      if (s.presenter) c.text(s.presenter, {x: 0.9, y: 6.45, w: 11.4, h: 0.4, size: t.size.small, color: t.color.muted});
      if (s.link) { c.rect({x: 0.9, y: 5.4, w: 3.6, h: 0.5, radius: 0.25, fill: t.color.frame}); c.text(s.link, {x: 0.9, y: 5.4, w: 3.6, h: 0.5, size: 14, color: t.color.body, align: 'center', valign: 'middle', mono: true}); }
      c.notes(s.notes);
    },
    // left: figure; right column: Insight #1..#k stacked, current one coloured, earlier ones kept in grey
    // wide figures (aspect > 1.8) go full width on top with the insight cards in a row underneath
    insights(c, t, s) {
      this.head(c, t, s);
      const label = (i) => (s.insightLabel ? `${s.insightLabel} ${i + 1}` : `Insight #${i + 1}`);
      // card colour = the tracker stage it belongs to (ins.stage, default the slide's stage), so it never
      // borrows another stage's colour; current: 'all' highlights every card
      const cardCol = (ins, i) => t.color.sym[(ins.stage != null ? ins.stage : (s.stage != null ? s.stage : i)) % t.color.sym.length];
      const tintOf = (ins, i) => t.color.tint[(ins.stage != null ? ins.stage : (s.stage != null ? s.stage : i)) % t.color.tint.length];
      const ar = aspect(s.figure);
      if (ar && ar > 1.8) {
        const m = t.grid.marginX; const fw = W(t) - 2 * m;
        const bottomY = s.tracker ? t.slide.h - 0.42 - 0.45 : t.grid.footerY - 0.1;
        const fh = Math.min(fw / ar, bottomY - 1.3 - 0.3 - 1.15);   // leave >= 1.15 in for the cards
        c.image(s.figure, {x: m, y: 1.3, w: fw, h: fh, alt: s.figureAlt});
        const n = s.insights.length; const gap = 0.25; const cw = (fw - gap * (n - 1)) / n; const cy = 1.3 + fh + 0.3;
        const ch = Math.min(1.5, bottomY - cy);
        s.insights.forEach((ins, i) => {
          if (s.current !== 'all' && i > s.current) return;
          const on = s.current === 'all' || i === s.current; const col = cardCol(ins, i); const x = m + i * (cw + gap);
          c.rect({x, y: cy, w: cw, h: ch, radius: 0.1, fill: on ? tintOf(ins, i) : t.color.frame, line: on ? col : null, lineW: 1.5});
          c.text([{text: `${label(i)}  ${ins.head}`, bold: true, color: on ? col : t.color.muted}, {text: ins.body, size: 14, color: on ? t.color.body : t.color.muted}],
            {x: x + 0.15, y: cy + 0.1, w: cw - 0.3, h: ch - 0.2, size: 16, valign: 'middle'});
        });
        return;
      }
      c.image(s.figure, {x: t.grid.marginX, y: 1.4, w: 6.2, h: 4.9, alt: s.figureAlt});
      const x = 7.3; const w = W(t) - t.grid.marginX - x; const h = 1.0;
      s.insights.forEach((ins, i) => {
        if (s.current !== 'all' && i > s.current) return;
        const on = s.current === 'all' || i === s.current; const y = 1.45 + i * (h + 0.18); const col = cardCol(ins, i);
        c.rect({x, y, w, h, radius: 0.1, fill: on ? tintOf(ins, i) : t.color.frame, line: on ? col : null, lineW: 1.5});
        // label is localisable: insightLabel: '洞察' gives "洞察 1"; previous cards stay readable (muted, not faint)
        c.text([{text: `${label(i)}  ${ins.head}`, bold: true, color: on ? col : t.color.muted}, {text: ins.body, size: 15, color: on ? t.color.body : t.color.muted}],
          {x: x + 0.2, y, w: w - 0.4, h, size: 17, valign: 'middle', align: 'left'});
      });
    },
    // result figure + a big "N.N×" arrow annotation and a "better →" axis hint
    resultRatio(c, t, s) {
      this.head(c, t, s);
      const m = t.grid.marginX; const bottom = s.tracker ? t.slide.h - 0.42 - 0.42 : t.grid.footerY - 0.1;
      const ar = aspect(s.figure);
      if (ar && ar > 2.2) {
        // Wide figure (e.g. one row of a multi-panel plot): full width on top, ratio panel right under it.
        const fw = W(t) - 2 * m; const fh = Math.min(fw / ar, bottom - 1.35 - 1.3);
        c.image(s.figure, {x: m, y: 1.3, w: fw, h: fh, alt: s.figureAlt});
        const y = 1.3 + fh + 0.25;
        const rh = Math.max(1.1, bottom - y);
        c.text(s.ratio, {x: m, y, w: 3.2, h: 1.1, size: 48, bold: true, color: t.color.ours, heading: true, valign: 'middle'});
        c.text(s.ratioLabel, {x: m + 3.3, y, w: 3.9, h: 1.1, size: t.size.small, color: t.color.body, valign: 'middle'});
        const cond = [s.better && {text: s.better, bold: true, color: t.color.muted}, s.condition && {text: s.condition, color: t.color.muted}].filter(Boolean);
        if (cond.length) c.text(cond, {x: m + 7.4, y, w: W(t) - m - (m + 7.4), h: Math.min(rh, 1.6), size: 13, valign: 'top'});
        return;
      }
      c.image(s.figure, {x: m, y: 1.35, w: 8.3, h: bottom - 1.35, alt: s.figureAlt});
      const x = 9.3; const w = W(t) - m - x;
      c.line({x1: x + 0.2, y1: 3.9, x2: x + 0.2, y2: 2.0, color: t.color.ours, w: 3, arrow: true});
      c.text(s.ratio, {x: x + 0.45, y: 1.9, w: w - 0.45, h: 1.0, size: 48, bold: true, color: t.color.ours, heading: true});
      c.text(s.ratioLabel, {x: x + 0.45, y: 2.95, w: w - 0.45, h: 0.9, size: t.size.small, color: t.color.body});
      if (s.better) c.text(s.better, {x, y: 4.3, w, h: 0.4, size: 13, bold: true, color: t.color.muted});
      if (s.condition) c.text(s.condition, {x, y: 4.9, w, h: 1.2, size: 13, color: t.color.muted});
    },
    // dark full-bleed code with one callout bubble
    code(c, t, s) {
      c.background(t.color.dark);
      c.text(s.title, {x: t.grid.marginX, y: 0.35, w: 12, h: 0.7, size: t.size.title - 4, bold: true, color: 'FFFFFF', heading: true});
      c.text(s.lines.map((l) => ({text: l})), {x: 0.9, y: 1.5, w: 8.6, h: 4.8, size: 16, color: 'D8DEE9', mono: true, lineSpacing: 1.35});
      // line pitch = size × 1.2 (font line height) × lineSpacing, in inches
      const pitch = 16 * 1.2 * 1.35 / 72;
      if (s.hl != null) c.rect({x: 0.75, y: 1.5 + s.hl * pitch + 0.06, w: 8.4, h: pitch, line: t.color.callout, lineW: 1.5});
      c.rect({x: 9.4, y: 1.6, w: 3.3, h: 1.4, radius: 0.12, fill: t.color.callout});
      c.text(s.callout, {x: 9.55, y: 1.6, w: 3.0, h: 1.4, size: 15, bold: true, color: t.color.dark, valign: 'middle'});
      if (s.footer) c.text(s.footer, {x: 0.9, y: 6.5, w: 11, h: 0.4, size: 13, color: t.color.callout});
      this.tracker(c, t, s); c.notes(s.notes);
    },
    // full-width takeaway banner under a figure
    banner(c, t, s) {
      this.head(c, t, s);
      c.image(s.figure, {x: 1.2, y: 1.35, w: 10.9, h: 4.15, alt: s.figureAlt});
      c.rect({x: 0, y: 5.75, w: W(t), h: 0.8, fill: t.color.ours});
      c.text(s.takeaway, {x: 0.6, y: 5.75, w: W(t) - 1.2, h: 0.8, size: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'});
    },
    // Numbered stage pipeline: one row of stages, each with its own note, current stage in
    // its stage colour. Systems papers use this to show "what we changed" without a figure.
    // stages: [{label, note}]; active: index
    pipeline(c, t, s) {
      this.head(c, t, s);
      const top = 1.6; const n = s.stages.length; const gap = 0.3;
      const bw = (W(t) - 2 * t.grid.marginX - gap * (n - 1)) / n; const bh = 1.3;
      const col = t.color.sym[(s.stage != null ? s.stage : 0) % t.color.sym.length];
      s.stages.forEach((st, i) => {
        const x = t.grid.marginX + i * (bw + gap); const on = i === s.active;
        c.rect({x, y: top, w: bw, h: bh, radius: 0.08, fill: on ? col : t.color.frame, line: on ? col : t.color.rule, lineW: on ? 2 : 1});
        c.text(String(i + 1).padStart(2, '0'), {x: x + 0.14, y: top + 0.1, w: 0.6, h: 0.3, size: 12, bold: true, color: on ? 'FFFFFF' : t.color.faint, font: t.fonts.mono[0]});
        c.text(st.label, {x: x + 0.14, y: top + 0.42, w: bw - 0.28, h: 0.5, size: 16, bold: true, color: on ? 'FFFFFF' : t.color.text, valign: 'middle'});
        if (i < n - 1) c.line({x1: x + bw + 0.04, y1: top + bh / 2, x2: x + bw + gap - 0.04, y2: top + bh / 2, color: t.color.muted, w: 1.5, arrow: true});
        if (st.note) c.text(st.note, {x, y: top + bh + 0.18, w: bw, h: 1.5, size: 13, color: on ? t.color.body : t.color.muted, lineSpacing: 1.35});
      });
      if (s.takeaway) {
        const y = top + bh + 1.8;
        c.rect({x: t.grid.marginX, y, w: W(t) - 2 * t.grid.marginX, h: 0.7, fill: t.color.tint[(s.stage != null ? s.stage : 0) % t.color.tint.length]});
        c.text(s.takeaway, {x: t.grid.marginX + 0.2, y, w: W(t) - 2 * t.grid.marginX - 0.4, h: 0.7, size: 17, bold: true, color: t.color.text, valign: 'middle'});
      }
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Results table with the reader's own row highlighted and a ratio column. Systems decks
    // report a table when the claim is "cheaper at equal quality", not a single ratio.
    results(c, t, s) {
      this.head(c, t, s);
      const m = t.grid.marginX; const w = W(t) - 2 * m;
      if (s.headline) c.text(s.headline, {x: m, y: 1.35, w, h: 0.4, size: 18, color: t.color.body});
      const top = s.headline ? 1.85 : 1.5;
      const rows = [s.columns].concat(s.rows);
      c.table(rows, {x: m, y: top, w, h: s.height || 3.6, size: s.size || 14, header: true,
        highlight: [s.highlight || 1], highlightFill: t.color.tint[(s.stage != null ? s.stage : 0) % t.color.tint.length],
        highlightCols: s.highlightCols || [], numAlign: 'right'});
      if (s.note) c.text(s.note, {x: m, y: top + (s.height || 3.6) + 0.12, w, h: 0.5, size: 13, color: t.color.muted, lineSpacing: 1.3});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
  };

  // ================= theory-beamer =================
  // Metropolis-like: dark frame title + progress line, typed blocks, colour per symbol.
  const theoryBeamer = {
    head(c, t, s) {
      c.rect({x: 0, y: 0, w: W(t), h: 0.95, fill: t.color.dark});
      c.text(s.title, {x: 0.5, y: 0, w: W(t) - 1, h: 0.95, size: t.size.title, color: 'FFFFFF', heading: true, valign: 'middle'});
      const p = s.progress == null ? 0 : s.progress;
      c.rect({x: 0, y: 0.95, w: W(t), h: 0.05, fill: t.color.frame}); c.rect({x: 0, y: 0.95, w: W(t) * p, h: 0.05, fill: t.color.accent});
      const foot = s.source || s.footer;   // same field name as the other presets; footer kept for old scripts
      if (foot) c.text(foot, {x: 0.5, y: 7.05, w: 11.3, h: 0.3, size: 11, color: t.color.muted});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.text(s.title, {x: 0.9, y: 2.0, w: 11.5, h: 1.4, size: t.size.cover, color: t.color.text, heading: true, valign: 'bottom'});
      if (s.subtitle) c.text(s.subtitle, {x: 0.9, y: 3.45, w: 11.5, h: 0.5, size: t.size.subtitle, color: t.color.muted});
      c.rect({x: 0.9, y: 4.15, w: 11.5, h: 0.03, fill: t.color.accent});
      c.text([{text: s.authors}, {text: s.venue, color: t.color.muted}], {x: 0.9, y: 4.4, w: 11.5, h: 1, size: t.size.small, color: t.color.body, paraSpaceBefore: 4});
      c.notes(s.notes);
    },
    section(c, t, s) {
      c.text(s.title, {x: 1.5, y: 2.9, w: 10.3, h: 0.9, size: t.size.section, color: t.color.text, heading: true, valign: 'bottom'});
      c.rect({x: 1.5, y: 3.95, w: 10.3, h: 0.04, fill: t.color.frame}); c.rect({x: 1.5, y: 3.95, w: 10.3 * (s.progress || 0), h: 0.04, fill: t.color.accent});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // typed blocks: kind -> fixed colour (Theorem/Definition/Question/Example)
    blocks(c, t, s) {
      this.head(c, t, s);
      let y = 1.35;
      // block height follows its text (rough width estimate) unless b.h is given; refuses to run past the footer
      // text may be a string or a paragraph array (strings / {text} / {runs}); every paragraph and every \n line
      // wraps on its own, so count lines per line and add paragraph spacing
      const estH = (text, size) => {
        const paras = (Array.isArray(text) ? text : [text]).map((p) => (typeof p === 'string' ? {text: p} : p));
        let hIn = 0;   // each paragraph at its own size (p.size), else the block size
        paras.forEach((p) => {
          const sz = p.size || size; const str = p.runs ? p.runs.map((r) => r.text).join('') : (p.text || '');
          const lines = String(str).split('\n').reduce((m, line) => m + Math.max(1, Math.ceil(ems(line) * sz / 72 / 11.2)), 0);
          hIn += lines * sz * 1.2 / 72;
        });
        return 0.42 + 0.22 + hIn + (paras.length - 1) * 0.05;
      };
      s.blocks.forEach((b) => {
        const col = t.color.block[b.kind] || t.color.dark; const h = b.h || estH(b.text, t.size.body);
        if (y + h > t.grid.footerY - 0.05) throw new Error(`blocks: "${b.kind}" block ends at ${(y + h).toFixed(2)} in, below the footer; shorten the text or split the slide`);
        c.rect({x: 0.8, y, w: 11.7, h: 0.42, fill: col});
        c.text(b.kind + (b.name ? ` (${b.name})` : ''), {x: 0.95, y, w: 11.4, h: 0.42, size: 16, bold: true, color: 'FFFFFF', valign: 'middle'});
        c.rect({x: 0.8, y: y + 0.42, w: 11.7, h: h - 0.42, fill: t.color.blockBody});
        c.text(b.text, {x: 0.95, y: y + 0.52, w: 11.4, h: h - 0.6, size: t.size.body, color: t.color.text, valign: 'top'});
        y += h + 0.25;
      });
    },
    // equation with every symbol in its own colour + a legend of the same colours.
    // equationAsset: one asset, or an ARRAY of pieces of a split equation (math-equations.md 拆式) placed left to right;
    // labels (optional, same length as the pieces): [{text, sym}] drawn under each piece in the body font.
    symbols(c, t, s) {
      this.head(c, t, s);
      const m = 0.8; const W0 = W(t) - 2 * m; let y = 1.35;
      if (s.equationAsset) {
        const pieces = Array.isArray(s.equationAsset) ? s.equationAsset : [s.equationAsset];
        const pad = (a) => (a.representation === 'native' ? 0.2 : 0);
        const H = Math.max(...pieces.map((a) => a.heightIn + 2 * pad(a))) + 0.02;
        const total = pieces.reduce((sum, a) => sum + a.widthIn + 2 * pad(a), 0);
        if (total > W0) throw new Error(`symbols: equation needs ${total.toFixed(2)} in, slide has ${W0.toFixed(2)}; split it over two rows or slides`);
        let x = m + (W0 - total) / 2; const placed = [];
        pieces.forEach((a, i) => {
          const w = a.widthIn + 2 * pad(a);
          c.equation(a, {x, y, w, h: H});
          const lb = s.labels && s.labels[i];
          if (lb && lb.text) {
            const col = lb.sym ? t.color.sym[lb.sym - 1] : t.color.muted;
            c.rect({x: x + 0.05, y: y + H + 0.04, w: w - 0.1, h: 0.04, fill: col});
            // label width from its text; a label that would touch the previous one drops to a second row
            const lw = Math.max(w, ems(lb.text) * 14 / 72 + 0.2); const lx = x + w / 2 - lw / 2;
            const row = placed.some((q) => q.row === 0 && lx < q.x + q.w + 0.1 && q.x < lx + lw + 0.1) ? 1 : 0;
            if (row && placed.some((q) => q.row === 1 && lx < q.x + q.w + 0.1 && q.x < lx + lw + 0.1)) throw new Error(`symbols: label "${lb.text}" overlaps its neighbours on both rows; shorten it`);
            placed.push({x: lx, w: lw, row});
            if (row) c.line({x1: x + w / 2, y1: y + H + 0.1, x2: x + w / 2, y2: y + H + 0.5, color: col, w: 1});
            c.text(lb.text, {x: lx, y: y + H + 0.1 + row * 0.42, w: lw, h: 0.4, size: 14, bold: true, color: col, align: 'center'});
          }
          x += w;
        });
        y += H + (s.labels ? (placed.some((q) => q.row) ? 1.0 : 0.6) : 0.3);
      } else {
        if (/[_^]|\\frac|\\sum|\\int/.test(s.equation)) throw new Error('symbols: pass equationAsset from math_assets.py; text formulas are not allowed (math-equations.md)');
        c.text(s.equation, {x: m, y: 1.6, w: W0, h: 1.2, size: 34, color: t.color.text, align: 'center', valign: 'middle', font: t.fonts.math});
        y = 3.1;
      }
      const legend = s.legend || []; const bottom = t.grid.footerY - (s.note ? 0.65 : 0.15);
      const rowH = legend.length ? Math.min(0.75, (bottom - y) / legend.length) : 0;
      if (legend.length && rowH < 0.45) throw new Error(`symbols: ${legend.length} legend rows do not fit under the equation; move some to the notes or the next slide`);
      legend.forEach((lg, i) => {
        const ly = y + i * rowH; const col = t.color.sym[lg.sym - 1];
        c.rect({x: 3.2, y: ly + (rowH - 0.42) / 2, w: 0.42, h: 0.42, fill: col, radius: 0.05});
        c.text(lg.text, {x: 3.85, y: ly, w: 8.2, h: rowH, size: t.size.body, color: t.color.body, valign: 'middle'});
      });
      if (s.note) c.text(s.note, {x: m, y: t.grid.footerY - 0.6, w: W0, h: 0.5, size: 15, italic: true, color: t.color.muted, align: 'center'});
    },
    outline(c, t, s) {
      this.head(c, t, {...s, title: s.title || 'Outline'});
      s.items.forEach((it, i) => {
        const on = i === s.current;
        c.text(`${i + 1}.  ${it}`, {x: 1.6, y: 1.8 + i * 0.85, w: 10, h: 0.7, size: 24, color: on ? t.color.accent : (i < s.current ? t.color.faint : t.color.text), bold: on, heading: true, valign: 'middle'});
      });
    },
    // Two-column block mosaic (Yasuda): a stack of small outline blocks on the left, one
    // large block on the right, and a coloured conclusion chip fed by an arrow.
    // left: [{kind, name, text}]; right: {kind, name, text}; conclusion: string
    mosaic(c, t, s) {
      this.head(c, t, s);
      const top = 1.5; const bottom = t.grid.contentBottom;
      const lw = 4.9; const rx = 5.95; const rw = W(t) - t.grid.marginX - rx;
      const outline = (x, y, w, h, b, big) => {
        const col = t.color.block[b.kind] || t.color.dark;
        c.rect({x, y, w, h, radius: 0.14, fill: 'FFFFFF', line: col, lineW: big ? 3 : 2});
        c.text([{text: b.kind + (b.name ? ` (${b.name})` : ''), bold: true, color: col},
          {text: b.text, size: big ? 16 : 14.5, color: t.color.text}],
          {x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.2, size: big ? 19 : 16, valign: 'middle', lineSpacing: 1.35});
      };
      const left = s.left || [];
      const chipH = s.conclusion ? 0.85 : 0;
      const avail = bottom - top - chipH - 0.55 - 0.18 * Math.max(0, left.length - 1);
      const gap = 0.18;
      let y = top;
      left.forEach((b, i) => {
        const h = b.h || Math.max(0.9, Math.min(1.7, avail / Math.max(1, left.length)));
        outline(t.grid.marginX, y, lw, h, b, false);
        y += h + gap;
      });
      if (s.right) outline(rx, top, rw, bottom - top - chipH - 0.55, s.right, true);
      if (s.conclusion) {
        const cy = bottom - chipH;
        c.line({x1: rx - 0.55, y1: cy - 0.22, x2: rx - 0.1, y2: cy - 0.22, color: t.color.accent, w: 2, arrow: true});
        c.rect({x: rx, y: cy, w: rw, h: chipH, radius: 0.1, line: t.color.accent, lineW: 2.5, fill: 'FFFFFF'});
        c.text(s.conclusion, {x: rx + 0.2, y: cy, w: rw - 0.4, h: chipH, size: 17, bold: true, color: t.color.accent, valign: 'middle'});
      }
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Numbered derivation ladder: step labels in the left gutter, one line of math per step,
    // hairline between steps, boxed result at the bottom. For "show the algebra" pages.
    // steps: [{label, expr, note}]
    derivation(c, t, s) {
      this.head(c, t, s);
      const top = 1.5; const bottom = t.grid.contentBottom;
      const n = s.steps.length; const resH = s.result ? 0.9 : 0;
      const rowH = Math.min(1.35, (bottom - top - resH - 0.2) / Math.max(1, n));
      s.steps.forEach((st, i) => {
        const y = top + i * rowH;
        c.text(`(${i + 1})`, {x: t.grid.marginX, y, w: 0.5, h: 0.4, size: 13, bold: true, color: t.color.accent, font: t.fonts.mono[0]});
        c.text(st.label || '', {x: t.grid.marginX, y: y + 0.32, w: 1.35, h: rowH - 0.4, size: 12, color: t.color.muted, lineSpacing: 1.3});
        c.text(st.expr, {x: t.grid.marginX + 1.5, y: y + 0.02, w: 8.4, h: 0.5, size: s.size || 19, color: t.color.text});
        if (st.note) c.text(st.note, {x: t.grid.marginX + 1.5, y: y + 0.48, w: 8.4, h: rowH - 0.55, size: 13, color: t.color.muted, lineSpacing: 1.35});
        if (i < n - 1) c.line({x1: t.grid.marginX, y1: y + rowH - 0.06, x2: W(t) - t.grid.marginX, y2: y + rowH - 0.06, color: t.color.frame, w: 1});
      });
      if (s.result) {
        const y = bottom - resH;
        c.rect({x: t.grid.marginX, y, w: W(t) - 2 * t.grid.marginX, h: resH, radius: 0.1, fill: t.color.blockBody, line: t.color.accent, lineW: 2.5});
        c.text(s.result, {x: t.grid.marginX + 0.25, y, w: W(t) - 2 * t.grid.marginX - 0.5, h: resH, size: 20, bold: true, color: t.color.text, valign: 'middle'});
      }
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Closing page for a theory talk (Yasuda/Fuernsinn): one centred Corollary card,
    // then the three consequences laid out as equal columns, each carrying its own
    // symbol colour. Not a stack of blocks and not the numbered derivation ladder.
    // claim: string; consequences: [{name, text}]
    verdict(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX, w = W(t) - 2 * mx;
      c.rect({x: mx + 0.7, y: 1.45, w: w - 1.4, h: 1.5, radius: 0.14,
        fill: t.color.blockBody, line: t.color.accent, lineW: 2.5});
      c.text([{text: 'Corollary　', bold: true, color: t.color.accent},
        {text: s.claim || '', bold: true, color: t.color.text}],
        {x: mx + 1.0, y: 1.45, w: w - 2.0, h: 1.5, size: 21, valign: 'middle', lineSpacing: 1.35});
      const cs = (s.consequences || []).slice(0, 3);
      const cols = K.columns({x: mx, y: 3.35, w, h: 2.35}, Math.max(1, cs.length), 0.35);
      cs.forEach((q, i) => {
        const col = t.color.sym[i % t.color.sym.length];
        c.rect({x: cols[i].x, y: cols[i].y, w: cols[i].w, h: 2.35, radius: 0.12,
          fill: 'FFFFFF', line: col, lineW: 2});
        c.text(`${i + 1}`, {x: cols[i].x + 0.2, y: cols[i].y + 0.14, w: 0.6, h: 0.6,
          size: 30, bold: true, color: col, font: t.fonts.mono[0]});
        c.text([{text: q.name, bold: true, color: col},
          {text: q.text, size: 14.5, color: t.color.text}],
          {x: cols[i].x + 0.2, y: cols[i].y + 0.85, w: cols[i].w - 0.4, h: 1.3,
            size: 16, valign: 'top', lineSpacing: 1.35});
      });
      c.rect({x: mx, y: t.grid.contentBottom - 0.12, w, h: 0.06, fill: t.color.accent});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
  };

  // ================= dark-tech =================
  const darkTech = {
    head(c, t, s) {
      c.text(s.title, {x: t.grid.marginX, y: t.grid.titleY, w: W(t) - 2 * t.grid.marginX, h: 0.8, size: t.size.title, color: t.color.text, heading: true, valign: 'middle'});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.rect({x: 0, y: 0, w: W(t), h: t.slide.h * 0.62, fill: t.color.accent});
      c.rect({x: 0, y: t.slide.h * 0.62, w: W(t), h: t.slide.h * 0.38, fill: t.color.accent2});
      c.text(s.kicker || '', {x: 0.9, y: 0.6, w: 11, h: 0.4, size: 14, bold: true, color: t.color.bgDeep});
      c.text(s.title, {x: 0.9, y: 1.2, w: 10.8, h: 3.2, size: t.size.cover, bold: true, color: t.color.bgDeep, heading: true, valign: 'middle'});
      c.text([{text: s.authors, bold: true}, {text: s.venue}], {x: 0.9, y: 5.2, w: 11, h: 1.2, size: t.size.small + 2, color: t.color.bgDeep, paraSpaceBefore: 4});
      c.notes(s.notes);
    },
    section(c, t, s) {
      c.text(s.number || '', {x: 0.9, y: 1.42, w: 4, h: 1.95, size: 96, color: t.color.ghost, heading: true, weight: '200'});
      c.text(s.title, {x: 0.9, y: 3.2, w: 11.5, h: 1.4, size: t.size.section, color: t.color.text, heading: true, weight: '300'});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    focus(c, t, s) {
      this.head(c, t, s);
      focusRow(c, t, s, 3.0, {onFill: t.color.bgRaised, onLine: t.color.text, onText: t.color.text, offFill: null});
      if (s.caption) c.text(s.caption, {x: 1.1, y: 4.8, w: 11.1, h: 0.9, size: t.size.body, color: t.color.muted, align: 'center'});
    },
    // One idea per row, thin type, huge index. Bach/Kakao rhythm: no boxes, only rhythm.
    // items: [{text, note}]
    steps(c, t, s) {
      this.head(c, t, s);
      const top = 1.55; const bottom = t.grid.contentBottom - 0.1;
      const n = s.items.length; const rowH = (bottom - top) / n;
      s.items.forEach((it, i) => {
        const y = top + i * rowH;
        if (i) c.line({x1: t.grid.marginX, y1: y - 0.06, x2: W(t) - t.grid.marginX, y2: y - 0.06, color: t.color.frame, w: 1});
        c.text(String(i + 1).padStart(2, '0'), {x: t.grid.marginX, y: y + 0.12, w: 1.0, h: 0.7, size: 34, color: i === (s.active != null ? s.active : n - 1) ? t.color.accent : t.color.faint, font: t.fonts.mono[0]});
        c.text(it.text, {x: t.grid.marginX + 1.15, y: y + 0.1, w: 9.6, h: rowH - 0.5, size: s.size || 24, color: i === (s.active != null ? s.active : n - 1) ? t.color.text : t.color.body, valign: 'middle', lineSpacing: 1.3});
        if (it.note) c.text(it.note, {x: t.grid.marginX + 11.0, y: y + 0.1, w: 1.6, h: rowH - 0.4, size: 12, color: t.color.muted, valign: 'middle',
          align: 'right', font: t.fonts.mono[0], lineSpacing: 1.3});
      });
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // White inset card holding a paper figure, with N leader-line annotations fanning out to
    // the right. Jason Wei signature: annotation, not a bullet list.
    // notes: [{f: [fx, fy], text}]
    annotated(c, t, s) {
      this.head(c, t, s);
      const card = {x: t.grid.marginX, y: 1.5, w: 8.0, h: t.grid.contentBottom - 1.55};
      c.rect({x: card.x, y: card.y, w: card.w, h: card.h, fill: 'FFFFFF', radius: 0.05});
      const img = K.figure(c, t, s.figure, {x: card.x + 0.1, y: card.y + 0.1, w: card.w - 0.2, h: card.h - 0.2, frame: false});
      const notes = s.notes || [];
      const lx = 8.95; const lw = W(t) - t.grid.marginX - lx;
      const pitch = Math.min(1.55, (card.h - 0.2) / Math.max(1, notes.length));
      notes.forEach((nt, i) => {
        const by = card.y + 0.15 + i * pitch;
        const box = {x: lx, y: by, w: lw, h: Math.min(0.85, pitch - 0.15)};
        const p = K.at(img, nt.f);
        K.callout(c, p, box, nt.text, {color: t.color.accent, line: t.color.accent, fill: null, size: 12.5, lineW: 1.5, radius: 0.04});
      });
      if (notes.length) c.line({x1: lx - 0.12, y1: card.y + 0.15, x2: lx - 0.12, y2: card.y + 0.15 + (notes.length - 1) * pitch + 0.6, color: t.color.accent, w: 1});
      if (s.caption) c.text(s.caption, {x: card.x, y: card.y + card.h + 0.08, w: card.w, h: 0.32, size: t.size.caption, color: t.color.muted});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
    // figure on dark with one accent annotation
    explain(c, t, s) {
      this.head(c, t, s);
      c.rect({x: t.grid.marginX, y: 1.45, w: 8.0, h: 4.9, radius: 0.08, fill: 'FFFFFF'});
      c.image(s.figure, {x: t.grid.marginX + 0.15, y: 1.6, w: 7.7, h: 4.6, alt: s.figureAlt});
      c.line({x1: 9.75, y1: 3.0, x2: 8.95, y2: 3.0, color: t.color.accent, w: 2, arrow: true});
      c.text(s.annotation, {x: 9.9, y: 2.3, w: 2.9, h: 2.0, size: t.size.body, color: t.color.accent, valign: 'middle'});
    },
    statement(c, t, s) {
      c.text(s.statement, {x: 1.2, y: 1.6, w: 10.9, h: 3.4, size: 40, color: t.color.text, heading: true, align: 'center', valign: 'middle', weight: '300'});
      if (s.by) c.text(s.by, {x: 1.2, y: 5.2, w: 10.9, h: 0.5, size: t.size.small, color: t.color.accent2, align: 'center'});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Two-state split. Bach's black/white alternation: two large thin-type numbers
    // divided by one hairline, no module chain and no arrows. Use for before/after
    // comparisons where the point IS the difference between two values.
    // sides: [{label, value, note}]; conclusion: string
    versus(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX, w = W(t) - 2 * mx;
      const mid = mx + w / 2, top = 1.45, bottom = t.grid.contentBottom - 0.6;
      c.rect({x: mx, y: top, w: w / 2 - 0.12, h: bottom - top, fill: t.color.bgRaised});
      c.line({x1: mid, y1: top, x2: mid, y2: bottom, color: t.color.accent, w: 2});
      (s.sides || []).slice(0, 2).forEach((sd, i) => {
        const x = i === 0 ? mx : mid + 0.12, sw = w / 2 - 0.24;
        const col = i ? t.color.accent : t.color.faint;
        c.text(sd.label || '', {x: x + 0.35, y: top + 0.3, w: sw - 0.7, h: 0.4, size: 14, bold: true, color: i ? t.color.accent : t.color.muted, charSpacing: 1.5});
        c.text(sd.value, {x: x + 0.35, y: top + 1.0, w: sw - 0.7, h: 2.0, size: 84, color: col, heading: true, weight: '200', valign: 'middle'});
        c.text(sd.note || '', {x: x + 0.35, y: top + 3.15, w: sw - 0.7, h: 1.0, size: 17, color: t.color.body, lineSpacing: 1.4});
      });
      if (s.conclusion) c.text(s.conclusion, {x: mx, y: bottom + 0.12, w, h: 0.45, size: 16, color: t.color.text, align: 'center'});
      sourceLine(c, t, s.source); pageNo(c, t, s.page); c.notes(s.notes);
    },
  };

  // ================= editorial =================
  const editorial = {
    head(c, t, s) {
      c.text(s.title, {x: t.grid.marginX, y: t.grid.titleY, w: W(t) - 2 * t.grid.marginX, h: 0.8, size: t.size.title, italic: true, color: t.color.text, heading: true, valign: 'middle'});
      if (s.subtitle) c.text(s.subtitle, {x: t.grid.marginX + 0.3, y: t.grid.titleY + 0.8, w: 11, h: 0.5, size: t.size.subtitle, color: t.color.body, heading: true});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.image(s.figure, {x: 1.2, y: 0.5, w: 10.9, h: 4.6, alt: s.figureAlt});
      c.text(s.title, {x: 1, y: 5.25, w: 11.3, h: 0.8, size: t.size.cover, color: t.color.text, heading: true, align: 'center', charSpacing: 1.5});
      c.text(s.authors, {x: 1, y: 6.1, w: 11.3, h: 0.45, size: t.size.small, bold: true, color: t.color.body, heading: true, align: 'center'});
      c.notes(s.notes);
    },
    hero(c, t, s) {
      this.head(c, t, s);
      const top = s.subtitle ? 1.85 : 1.45;
      c.image(s.figure, {x: 1.4, y: top, w: 10.5, h: 6.75 - top - 0.55, alt: s.figureAlt});
      if (s.caption) c.text(s.caption, {x: 1.4, y: 6.3, w: 10.5, h: 0.45, size: t.size.small, italic: true, color: t.color.muted, heading: true, align: 'center'});
    },
    // Magazine plate: a white panel holds figure + two annotations, a caption strip with the
    // paper title, and the prose runs underneath (Hearst). Reads as an article, not a slide.
    // notes: [{head, body}]
    panel(c, t, s) {
      this.head(c, t, s);
      const card = {x: 1.45, y: 1.5, w: 10.43, h: 4.25};
      c.rect({x: card.x, y: card.y, w: card.w, h: card.h, fill: 'FFFFFF', line: t.color.rule, lineW: 1});
      K.figure(c, t, s.figure, {x: card.x + 0.3, y: card.y + 0.28, w: 5.5, h: card.h - 0.95, frame: false});
      const nx = card.x + 6.05; const nw = card.w - 6.35;
      (s.notes || []).forEach((nt, i) => {
        const y = card.y + 0.3 + i * 1.28;
        c.line({x1: nx, y1: y - 0.1, x2: nx + nw, y2: y - 0.1, color: t.color.rule, w: 1});
        c.text(nt.head, {x: nx, y, w: nw, h: 0.32, size: 13.5, bold: true, color: t.color.text, heading: true});
        c.text(nt.body, {x: nx, y: y + 0.34, w: nw, h: 0.9, size: 13, color: t.color.body, heading: true, lineSpacing: 1.35});
      });
      const stripY = card.y + card.h - 0.52;
      c.rect({x: card.x, y: stripY, w: card.w, h: 0.52, fill: t.color.inkStrip || t.color.text});
      c.text(s.paper || s.caption || '', {x: card.x + 0.25, y: stripY, w: card.w - 0.5, h: 0.52, size: 11.5, color: 'FFFFFF', heading: true, valign: 'middle', charSpacing: 0.6});
      if (s.prose) c.text(s.prose, {x: 1.45, y: card.y + card.h + 0.35, w: 10.43, h: 1.5, size: 16.5, color: t.color.text, heading: true, lineSpacing: 1.5});
      c.notes(s.notes);
    },
    // Essay page: drop cap + a wide serif measure, numbered notes in the outer margin.
    // notes: [string]
    essay(c, t, s) {
      this.head(c, t, {...s, title: s.title});
      const top = s.subtitle ? 2.05 : 1.55;
      const lead = String(s.text || '');
      const first = lead.slice(0, 1); const rest = lead.slice(1);
      // Drop cap must fit its own box: a 66pt CJK glyph is ~0.92in wide and needs ~1.3in
      // of line box. 92pt overflowed into the measure and printed on top of the body copy.
      c.text(first, {x: 0.62, y: top - 0.16, w: 1.0, h: 1.45, size: 66, color: t.color.accent, heading: true, valign: 'middle'});
      // Keep the measure clear of the margin-note column (starts at 8.55in).
      c.text(rest, {x: 1.72, y: top, w: 6.45, h: 3.05, size: 16.5, color: t.color.text, heading: true, lineSpacing: 1.6});
      if (s.pull) {
        c.line({x1: 1.62, y1: top + 4.0, x2: 3.0, y2: top + 4.0, color: t.color.accent, w: 2});
        c.text(s.pull, {x: 1.62, y: top + 4.15, w: 6.2, h: 1.0, size: 20, italic: true, color: t.color.accent, heading: true, lineSpacing: 1.4});
      }
      const mx = 8.55; const mw = W(t) - t.grid.marginX - mx;
      (s.notes || []).forEach((nt, i) => {
        const y = top + i * 1.55;
        c.text(String(i + 1), {x: mx, y, w: 0.4, h: 0.35, size: 12, bold: true, color: t.color.accent, heading: true});
        c.text(nt, {x: mx + 0.45, y: y + 0.02, w: mw - 0.45, h: 1.2, size: 13, color: t.color.body, heading: true, lineSpacing: 1.4});
        c.line({x1: mx, y1: y + 1.3, x2: mx + mw, y2: y + 1.3, color: t.color.rule, w: 1});
      });
      // `notes` here is the array of margin annotations, not speaker notes.
      c.notes(s.speakerNotes);
    },
    quote(c, t, s) {
      // 120pt glyph needs ~2.3in of line box; a 1.6in box makes PPT clip the quote mark.
      c.text('\u201C', {x: 1.1, y: 0.9, w: 1.5, h: 2.4, size: 120, color: t.color.accent, heading: true});
      c.text(s.quote, {x: 1.9, y: 1.9, w: 9.6, h: 2.8, size: 32, italic: true, color: t.color.text, heading: true, lineSpacing: 1.3});
      c.rect({x: 1.9, y: 5.0, w: 1.0, h: 0.04, fill: t.color.accent});
      c.text(s.by, {x: 1.9, y: 5.2, w: 9.6, h: 0.5, size: t.size.small, color: t.color.body});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // 2x2 concept chips: coloured disc + label pill (no clip-art icons)
    chips(c, t, s) {
      this.head(c, t, s);
      s.items.forEach((it, i) => {
        const x = 1.6 + (i % 2) * 5.4; const y = 2.0 + Math.floor(i / 2) * 2.1; const col = t.color.sym[i % t.color.sym.length];
        c.ellipse({x, y, w: 1.25, h: 1.25, fill: t.color.tint[i % t.color.tint.length]});
        c.text(String(i + 1), {x, y, w: 1.25, h: 1.25, size: 30, color: col, heading: true, align: 'center', valign: 'middle', italic: true});
        c.text([{text: it.head, bold: true, color: t.color.text}, {text: it.body, size: 15, color: t.color.body}], {x: x + 1.5, y: y - 0.05, w: 3.6, h: 1.35, size: 20, valign: 'middle', heading: true});
      });
    },
    section(c, t, s) {
      c.text(s.title, {x: 1, y: 2.6, w: 11.3, h: 1.4, size: t.size.section, italic: true, color: t.color.text, heading: true, align: 'center', valign: 'middle'});
      c.rect({x: 6.17, y: 4.2, w: 1.0, h: 0.04, fill: t.color.accent});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
  };

  // ================= defense-cn =================
  // 国内答辩 / 正式学术报告：校色标题带、编号标题、底部章节箭头导航、提纲回显、红色结论框。
  const defenseCn = {
    nav(c, t, s) {
      if (!s.chapters) return;
      const n = s.chapters.length; const y = t.slide.h - 0.36; const w = W(t) / n;
      s.chapters.forEach((ch, i) => c.chevron({x: i * w, y, w: w + 0.08, h: 0.36, first: i === 0, fill: i === s.chapter ? t.color.primary : (i < s.chapter ? t.color.primaryMid : t.color.primaryLight)}));
      s.chapters.forEach((ch, i) => c.text(ch, {x: i * w + 0.15, y, w: w - 0.2, h: 0.36, size: 11, bold: i === s.chapter, color: i <= s.chapter ? 'FFFFFF' : t.color.muted, align: 'center', valign: 'middle'}));
    },
    head(c, t, s) {
      c.rect({x: 0, y: 0, w: W(t), h: 0.95, fill: t.color.primary});
      c.rect({x: 0, y: 0.95, w: W(t), h: 0.06, fill: t.color.primaryMid});
      c.text(s.title, {x: 0.55, y: 0, w: W(t) - 2.2, h: 0.95, size: t.size.title, bold: true, color: 'FFFFFF', valign: 'middle'});
      c.ellipse({x: W(t) - 1.25, y: 0.12, w: 0.72, h: 0.72, line: 'FFFFFF', lineW: 1.25});
      c.text('校徽', {x: W(t) - 1.25, y: 0.12, w: 0.72, h: 0.72, size: 10, color: 'FFFFFF', align: 'center', valign: 'middle'});
      this.nav(c, t, s);
      if (s.page != null) c.text(String(s.page), {x: W(t) - 1.0, y: t.slide.h - 0.78, w: 0.6, h: 0.3, size: 11, color: t.color.faint, align: 'right'});
      c.notes(s.notes);
    },
    cover(c, t, s) {
      c.rect({x: 0, y: 0, w: W(t), h: 4.7, fill: t.color.primary});
      c.rect({x: 0, y: 4.7, w: W(t), h: 0.08, fill: t.color.primaryMid});
      c.text(s.org || '', {x: 0.8, y: 0.45, w: 8, h: 0.6, size: 20, bold: true, color: 'FFFFFF'});
      c.text(s.kind || '博士学位论文答辩', {x: W(t) - 4.6, y: 0.45, w: 3.8, h: 0.6, size: 18, color: 'FFFFFF', align: 'right'});
      c.text(s.title, {x: 0.8, y: 1.4, w: 11.7, h: 2.0, size: t.size.cover, bold: true, color: 'FFFFFF', valign: 'middle', align: 'center'});
      if (s.titleEn) c.text(s.titleEn, {x: 0.8, y: 3.45, w: 11.7, h: 0.8, size: 15, color: t.color.primaryLight, align: 'center'});
      const info = s.info || [];
      info.forEach(([k, v], i) => {
        const y = 5.05 + i * 0.5;
        c.text(`${k}：`, {x: 4.2, y, w: 1.6, h: 0.45, size: 17, color: t.color.muted, align: 'right', valign: 'middle'});
        c.text(v, {x: 5.9, y, w: 5, h: 0.45, size: 17, bold: true, color: t.color.text, valign: 'middle'});
      });
      c.notes(s.notes);
    },
    toc(c, t, s) {
      this.head(c, t, {...s, title: s.title || '汇报提纲'});
      c.rect({x: 2.3, y: 1.6, w: 0.05, h: s.items.length * 0.9, fill: t.color.primaryLight});
      s.items.forEach((it, i) => {
        const on = i === s.current; const y = 1.55 + i * 0.9;
        c.ellipse({x: 2.1, y: y + 0.17, w: 0.45, h: 0.45, fill: on ? t.color.accent : (s.current != null && i < s.current ? t.color.faint : t.color.primary)});
        c.text(it, {x: 2.9, y, w: 9, h: 0.8, size: 22, bold: on, color: on ? t.color.accent : (s.current != null && i !== s.current ? t.color.faint : t.color.text), valign: 'middle'});
      });
    },
    chapter(c, t, s) {
      c.rect({x: 0, y: 0, w: 4.3, h: t.slide.h, fill: t.color.primary});
      c.text(s.number, {x: 0, y: 2.4, w: 4.3, h: 1.6, size: 44, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'});
      c.text(s.title, {x: 5.0, y: 2.6, w: 7.8, h: 1.0, size: t.size.section, bold: true, color: t.color.primary, valign: 'middle'});
      if (s.subtitle) c.text(s.subtitle, {x: 5.0, y: 3.6, w: 7.8, h: 0.6, size: t.size.subtitle, color: t.color.muted});
      this.nav(c, t, s); c.notes(s.notes);
    },
    // figure + boxed "结论：" line with red keyword + one red key sentence
    figureConclusion(c, t, s) {
      this.head(c, t, s);
      if (s.lead) c.text(s.lead, {x: 0.6, y: 1.2, w: 12.1, h: 0.6, size: t.size.small + 1, color: t.color.body, valign: 'middle'});
      const top = s.lead ? 1.85 : 1.3;
      c.image(s.figure, {x: 1.2, y: top, w: 10.9, h: 5.85 - top - 1.0, alt: s.figureAlt});
      const y = 5.85 - 0.85;
      c.rect({x: 1.2, y, w: 10.9, h: 0.75, line: t.color.primary, lineW: 1.5, fill: 'FFFFFF'});
      c.text(`**${s.label || '结论'}：**${s.conclusion}`, {x: 1.4, y, w: 10.5, h: 0.75, size: t.size.body - 1, color: t.color.text, valign: 'middle'});
    },
    contributions(c, t, s) {
      this.head(c, t, {...s, title: s.title || '主要创新点'});
      const n = s.items.length; const w = (W(t) - 1.2 - 0.4 * (n - 1)) / n;
      s.items.forEach((it, i) => {
        const x = 0.6 + i * (w + 0.4);
        c.rect({x, y: 1.5, w, h: 0.7, fill: t.color.primary});
        c.text(`创新点${'一二三四'[i]}`, {x, y: 1.5, w, h: 0.7, size: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'});
        c.rect({x, y: 2.2, w, h: 2.9, fill: t.color.frame});
        c.text([{text: it.head, bold: true, color: t.color.primary}, {text: it.body, size: 15}, {text: it.pub, size: 12, color: t.color.muted}], {x: x + 0.2, y: 2.35, w: w - 0.4, h: 3.4, size: 18, color: t.color.body, paraSpaceBefore: 10});
      });
    },
    // Narrative-then-band page (Fudan defence): a claim line, the numbered points as running
    // text, one full-width figure band, and a row of panel labels under it.
    // steps: [string]; panels: [string]
    figureBand(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX; const w = W(t) - 2 * mx;
      let y = 1.15;
      if (s.lead) { c.text(s.lead, {x: mx, y, w, h: 0.5, size: 15, color: t.color.body, lineSpacing: 1.3}); y += 0.55; }
      const steps = s.steps || [];
      steps.forEach((st, i) => {
        c.text(`(${i + 1})`, {x: mx, y: y + i * 0.245, w: 0.45, h: 0.24, size: 12.5, bold: true, color: t.color.primary});
        c.text(st, {x: mx + 0.45, y: y + i * 0.245, w: w - 0.45, h: 0.24, size: 12.5, color: t.color.body});
      });
      const bandTop = y + steps.length * 0.245 + 0.12;
      const labelH = s.panels && s.panels.length ? 0.3 : 0;
      const band = {x: mx, y: bandTop, w, h: 6.78 - labelH - bandTop};
      K.figure(c, t, s.figure, band, {fill: 'FFFFFF', line: t.color.rule, lineW: 1, pad: 0.1});
      (s.panels || []).forEach((p, i, arr) => {
        const slot = w / arr.length;
        c.text(p, {x: mx + i * slot, y: band.y + band.h + 0.02, w: slot, h: labelH, size: 11.5, color: t.color.muted, align: 'center'});
      });
      this.nav(c, t, s); c.notes(s.notes);
    },
    // Comparison matrix: candidate methods x properties, the reader's row highlighted and
    // closed with the red conclusion bar. Defence committees read this page as a checklist.
    // columns: [string]; rows: [[string]]; highlight: row index (1-based incl. header)
    matrix(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX; const w = W(t) - 2 * mx;
      const rows = [s.columns].concat(s.rows);
      const h = s.height || 3.5;
      c.table(rows, {x: mx, y: 1.3, w, h, size: 14, header: true,
        highlight: [s.highlight || s.rows.length], highlightFill: t.color.primaryLight, highlightCols: [0]});
      const cy = 1.3 + h + 0.35;
      c.rect({x: mx, y: cy, w, h: 0.72, line: t.color.accent, lineW: 1.5});
      c.text(`**结论：**${s.conclusion || ''}`, {x: mx + 0.2, y: cy, w: w - 0.4, h: 0.72, size: 15, color: t.color.text, valign: 'middle'});
      if (s.note) c.text(s.note, {x: mx, y: cy + 0.82, w, h: 0.32, size: 11.5, color: t.color.muted});
      this.nav(c, t, s); c.notes(s.notes);
    },
    // Two cases side by side, each with its own framed figure and numbered verdict,
    // closed by the red conclusion bar. Defence committees read this as "before / after"
    // evidence; unlike figureConclusion (one centred figure) and matrix (a checklist).
    // cases: [{label, figure, caption, note}]
    casePair(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX, w = W(t) - 2 * mx;
      const cases = (s.cases || []).slice(0, 2);
      const gap = 0.5, cw = (w - gap) / Math.max(1, cases.length);
      const top = 1.35, figH = 3.15;
      cases.forEach((cs, i) => {
        const x = mx + i * (cw + gap);
        c.rect({x, y: top, w: cw, h: 0.44, fill: i ? t.color.primaryMid : t.color.primary});
        c.text(cs.label, {x: x + 0.12, y: top, w: cw - 0.24, h: 0.44,
          size: 14, bold: true, color: 'FFFFFF', valign: 'middle'});
        K.figure(c, t, cs.figure, {x, y: top + 0.52, w: cw, h: figH},
          {fill: 'FFFFFF', line: t.color.rule, lineW: 1});
        c.text(cs.caption || '', {x, y: top + 0.52 + figH + 0.06, w: cw, h: 0.32,
          size: 11.5, color: t.color.muted, align: 'center'});
        if (cs.note) c.text(cs.note, {x, y: top + 0.52 + figH + 0.42, w: cw, h: 0.55,
          size: 13, color: t.color.body, lineSpacing: 1.3});
      });
      c.line({x1: mx + w / 2, y1: top + 0.52, x2: mx + w / 2, y2: top + 0.52 + figH,
        color: t.color.rule, w: 1});
      const cy = t.grid.contentBottom - 0.72;
      c.rect({x: mx, y: cy, w, h: 0.68, line: t.color.accent, lineW: 1.5});
      c.text(`**结论：**${s.conclusion || ''}`, {x: mx + 0.2, y: cy, w: w - 0.4, h: 0.68,
        size: 15, color: t.color.text, valign: 'middle'});
      this.nav(c, t, s); c.notes(s.notes);
    },
  };

  // ================= jp-gothic =================
  // 日本/韓国の技術発表：heavy gothic, black left bar, paper header line, one accent colour, conclusion banner.
  const jpGothic = {
    head(c, t, s) {
      const x = t.grid.marginX;
      if (s.paper) c.text(s.paper, {x: x + 0.3, y: 0.22, w: 12, h: 0.32, size: 12, bold: true, color: t.color.muted});
      c.rect({x, y: 0.58, w: 0.12, h: 0.62, fill: t.color.text});
      c.text(s.title, {x: x + 0.3, y: 0.55, w: W(t) - 2 * x - 2.2, h: 0.7, size: t.size.title, bold: true, color: t.color.text, heading: true, valign: 'middle'});
      if (s.badge) { c.rect({x: W(t) - 2.2, y: 0.3, w: 1.65, h: 0.55, radius: 0.08, fill: t.color.frame}); c.text(s.badge, {x: W(t) - 2.2, y: 0.3, w: 1.65, h: 0.55, size: 18, bold: true, color: t.color.text, align: 'center', valign: 'middle'}); }
      if (s.optional) { c.rect({x: W(t) - 2.0, y: 0.95, w: 1.3, h: 0.42, fill: t.color.sticker}); c.text(s.optional, {x: W(t) - 2.0, y: 0.95, w: 1.3, h: 0.42, size: 14, bold: true, color: t.color.text, align: 'center', valign: 'middle'}); }
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.text(s.title, {x: 0.8, y: 1.5, w: 11.7, h: 2.2, size: t.size.cover, bold: true, color: t.color.text, heading: true, align: 'center', valign: 'middle'});
      c.text(s.authors, {x: 0.8, y: 4.2, w: 11.7, h: 0.6, size: 22, color: t.color.text, align: 'center'});
      c.text(s.venue, {x: 0.8, y: 5.3, w: 11.7, h: 0.4, size: 14, color: t.color.faint, align: 'center'});
      c.notes(s.notes);
    },
    // bullets with arrow sub-points + one figure; underline-style emphasis via accent colour
    read(c, t, s) {
      this.head(c, t, s);
      const paras = [];
      s.points.forEach((p) => { paras.push({text: p.text, bullet: true, bold: !!p.bold}); (p.sub || []).forEach((q) => paras.push({text: `\u2192 ${q}`, indent: 2, size: t.size.small})); });
      c.text(paras, {x: 0.9, y: 1.5, w: 11.5, h: 1.9, size: t.size.body, color: t.color.text, paraSpaceBefore: 4});
      c.image(s.figure, {x: 1.5, y: 3.45, w: 10.3, h: (s.conclusion ? 2.6 : 3.3), alt: s.figureAlt});
      if (s.conclusion) this.banner(c, t, s.conclusion);
    },
    banner(c, t, text) {
      c.rect({x: 0.6, y: 6.2, w: W(t) - 1.2, h: 0.62, fill: t.color.text});
      c.text(text, {x: 0.8, y: 6.2, w: W(t) - 1.6, h: 0.62, size: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'});
    },
    section(c, t, s) {
      c.rect({x: 0.6, y: 3.05, w: 0.16, h: 1.0, fill: t.color.accent});
      c.text(s.title, {x: 1.0, y: 2.95, w: 11, h: 1.2, size: t.size.section, bold: true, color: t.color.text, heading: true, valign: 'middle'});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    references(c, t, s) {
      this.head(c, t, {...s, title: s.title || '参考文献'});
      c.text(s.items.map((r) => ({text: r})), {x: 0.9, y: 1.5, w: 11.6, h: 5.2, size: 14, color: t.color.body, paraSpaceBefore: 8});
    },
    // Dense handout spread (kantoCV / yokoi): figure with a speech bubble on the left, a dark
    // inset panel of examples on the right, numbered points underneath, chips at the bottom.
    // points: [string]; examples: [{left, right}]; chips: [string]
    dense(c, t, s) {
      this.head(c, t, s);
      const fig = K.figure(c, t, s.figure, {x: t.grid.marginX, y: 1.42, w: 6.0, h: 3.35}, {fill: 'FFFFFF', line: t.color.rule, lineW: 1, pad: 0.08});
      if (s.bubble) {
        K.callout(c, K.at(fig, s.bubbleAt || [0.22, 0.2]), {x: t.grid.marginX + 0.12, y: 1.2, w: 2.7, h: 0.55},
          s.bubble, {fill: t.color.frame, line: t.color.text, color: t.color.text, size: 12, lineW: 1.25, radius: 0.12});
      }
      const px = 6.9; const pw = W(t) - t.grid.marginX - px;
      c.rect({x: px, y: 1.42, w: pw, h: 3.35, fill: t.color.text});
      const ex = s.examples || [];
      ex.forEach((e, i) => {
        const y = 1.55 + i * 0.5;
        if (e.on) c.rect({x: px + 0.12, y: y - 0.02, w: pw - 0.24, h: 0.42, fill: t.color.sticker});
        c.text(e.left, {x: px + 0.2, y, w: pw * 0.46, h: 0.42, size: 10.5, color: e.on ? t.color.text : 'E8E8E8', lineSpacing: 1.15});
        c.text(e.right || '', {x: px + pw * 0.48, y, w: pw * 0.48, h: 0.42, size: 10.5, color: e.on ? t.color.text : 'E8E8E8', lineSpacing: 1.15});
      });
      (s.points || []).forEach((p, i) => {
        c.text(`${i + 1}. ${p}`, {x: t.grid.marginX, y: 4.85 + i * 0.55, w: 6.0, h: 0.52, size: 13.5, color: t.color.text, lineSpacing: 1.25});
      });
      const chips = (s.chips || []).slice(0, 3);
      chips.forEach((ch, i) => {
        const cw = (pw - 0.16 * (chips.length - 1)) / Math.max(1, chips.length);
        c.rect({x: px + i * (cw + 0.16), y: 4.85, w: cw, h: 0.62, fill: i === chips.length - 1 ? t.color.primary : t.color.frame});
        c.text(ch, {x: px + i * (cw + 0.16) + 0.08, y: 4.85, w: cw - 0.16, h: 0.62, size: 11.5, bold: true,
          color: i === chips.length - 1 ? 'FFFFFF' : t.color.text, align: 'center', valign: 'middle', lineSpacing: 1.15});
      });
      if (s.conclusion) {
        c.rect({x: t.grid.marginX, y: 6.3, w: W(t) - 2 * t.grid.marginX, h: 0.6, fill: t.color.text});
        c.text(s.conclusion, {x: t.grid.marginX + 0.2, y: 6.3, w: W(t) - 2 * t.grid.marginX - 0.4, h: 0.6, size: 17, bold: true, color: 'FFFFFF', valign: 'middle'});
      }
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Formula page: the expression in a band, then three columns (symbols / steps / reading),
    // closed by coloured chips. The Japanese handout convention: everything visible at once.
    // legend: [{k, v}]; steps: [string]; chips: [string]
    formula(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX; const w = W(t) - 2 * mx;
      c.rect({x: mx, y: 1.4, w, h: 0.95, fill: t.color.frame});
      c.rect({x: mx, y: 1.4, w: 0.09, h: 0.95, fill: t.color.primary});
      c.text(s.formula, {x: mx + 0.3, y: 1.4, w: w - 0.6, h: 0.95, size: 22, color: t.color.text, valign: 'middle', align: 'center'});
      const cols = K.columns({x: mx, y: 2.55, w, h: 3.0}, 3, 0.4);
      cols.forEach((col, i) => {
        c.rect({x: col.x, y: col.y, w: col.w, h: 0.34, fill: t.color.text});
        c.text((s.heads || ['符号', '推导', '读法'])[i], {x: col.x + 0.1, y: col.y, w: col.w - 0.2, h: 0.34, size: 12.5, bold: true, color: 'FFFFFF', valign: 'middle'});
      });
      (s.legend || []).forEach((lg, i) => {
        c.text(`**${lg.k}**　${lg.v}`, {x: cols[0].x, y: 3.0 + i * 0.42, w: cols[0].w, h: 0.4, size: 12, color: t.color.body});
      });
      (s.steps || []).forEach((st, i) => {
        c.text(`${i + 1}. ${st}`, {x: cols[1].x, y: 3.0 + i * 0.62, w: cols[1].w, h: 0.6, size: 12.5, color: t.color.body, lineSpacing: 1.3});
      });
      (s.reading || []).forEach((rd, i) => {
        c.text(rd, {x: cols[2].x, y: 3.0 + i * 0.62, w: cols[2].w, h: 0.6, size: 12.5, color: t.color.body, lineSpacing: 1.3});
      });
      const chips = s.chips || [];
      chips.forEach((ch, i) => {
        const cw = (w - 0.2 * (chips.length - 1)) / Math.max(1, chips.length);
        c.rect({x: mx + i * (cw + 0.2), y: 5.85, w: cw, h: 0.6, fill: i === chips.length - 1 ? t.color.primary : t.color.sticker});
        c.text(ch, {x: mx + i * (cw + 0.2), y: 5.85, w: cw, h: 0.6, size: 14, bold: true,
          color: i === chips.length - 1 ? 'FFFFFF' : t.color.text, align: 'center', valign: 'middle'});
      });
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Before/after spread (JP handout convention): two tall labelled columns joined by a
    // central arrow, changed rows marked with the yellow sticker, black conclusion banner.
    // Structurally different from formula (one band + three columns) and dense (figure +
    // dark inset). heads: [string, string]; rows: [{left, right, changed}]
    beforeAfter(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX, w = W(t) - 2 * mx;
      const heads = s.heads || ['変更前', '変更後'];
      const gap = 1.15, cw = (w - gap) / 2, top = 1.45, rowH = 0.82;
      [0, 1].forEach((i) => {
        const x = mx + i * (cw + gap);
        c.rect({x, y: top, w: cw, h: 0.5, fill: t.color.text});
        c.text(heads[i], {x: x + 0.15, y: top, w: cw - 0.3, h: 0.5,
          size: 15, bold: true, color: 'FFFFFF', valign: 'middle'});
      });
      const rows = (s.rows || []).slice(0, 5);
      rows.forEach((r, i) => {
        const y = top + 0.62 + i * rowH;
        if (r.changed) {
          c.rect({x: mx, y, w: cw, h: rowH - 0.08, fill: t.color.sticker});
          c.rect({x: mx + cw + gap, y, w: cw, h: rowH - 0.08, fill: t.color.sticker});
        } else {
          c.rect({x: mx, y, w: cw, h: rowH - 0.08, fill: t.color.frame});
          c.rect({x: mx + cw + gap, y, w: cw, h: rowH - 0.08, fill: t.color.frame});
        }
        c.text(r.left, {x: mx + 0.18, y, w: cw - 0.36, h: rowH - 0.08,
          size: 13.5, color: t.color.text, valign: 'middle', lineSpacing: 1.25});
        c.text(r.right, {x: mx + cw + gap + 0.18, y, w: cw - 0.36, h: rowH - 0.08,
          size: 13.5, bold: !!r.changed, color: t.color.text, valign: 'middle', lineSpacing: 1.25});
        c.line({x1: mx + cw + 0.16, y1: y + (rowH - 0.08) / 2,
          x2: mx + cw + gap - 0.16, y2: y + (rowH - 0.08) / 2,
          color: r.changed ? t.color.primary : t.color.rule, w: r.changed ? 2.5 : 1.25, arrow: true});
      });
      if (s.conclusion) this.banner(c, t, s.conclusion);
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    // Closing spread: huge outlined numbers down the left gutter, one takeaway each,
    // black conclusion banner. A summary, not the figure-driven dense/read pages.
    // points: [string]
    takeaways(c, t, s) {
      this.head(c, t, s);
      const mx = t.grid.marginX, w = W(t) - 2 * mx;
      const pts = (s.points || []).slice(0, 3);
      const rowH = Math.min(1.35, (t.grid.contentBottom - 1.6) / Math.max(1, pts.length));
      pts.forEach((p, i) => {
        const y = 1.55 + i * rowH;
        c.text(String(i + 1).padStart(2, '0'), {x: mx, y, w: 1.45, h: rowH - 0.15,
          size: 54, bold: true, color: i === pts.length - 1 ? t.color.primary : t.color.ghost, heading: true, valign: 'middle'});
        c.rect({x: mx + 1.6, y: y + 0.12, w: w - 1.6, h: rowH - 0.35, fill: t.color.frame});
        c.text(p, {x: mx + 1.85, y: y + 0.12, w: w - 2.1, h: rowH - 0.35,
          size: 18, bold: true, color: t.color.text, valign: 'middle', lineSpacing: 1.3});
      });
      if (s.conclusion) this.banner(c, t, s.conclusion);
      pageNo(c, t, s.page); c.notes(s.notes);
    },
  };

  return {
    'keynote-minimal': keynoteMinimal,
    'systems-talk': systemsTalk,
    'theory-beamer': theoryBeamer,
    'dark-tech': darkTech,
    editorial,
    'defense-cn': defenseCn,
    'jp-gothic': jpGothic,
  };
};
