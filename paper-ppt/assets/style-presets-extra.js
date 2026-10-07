'use strict';
// Seven more presets distilled from ~100 public academic decks (see references/slide-style-atlas.md).
// Same contract as international/domestic: tokens in styles/<name>/tokens.json, archetypes below,
// every archetype is drawn through the canvas API so it renders to PPTX and to the SVG preview.

module.exports = function makePresets({sourceLine, pageNo}) {
  const W = (t) => t.slide.w;
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
      this.tracker(c, t, s); if (!s.tracker) pageNo(c, t, s.page); c.notes(s.notes);
    },
    cover(c, t, s) {
      c.rect({x: 0, y: 0, w: 0.28, h: t.slide.h, fill: t.color.ours});
      c.text(s.title, {x: 0.9, y: 1.6, w: 11.4, h: 1.9, size: t.size.cover, bold: true, color: t.color.text, heading: true, valign: 'bottom'});
      c.text(s.authors, {x: 0.9, y: 3.75, w: 11.4, h: 0.5, size: t.size.subtitle, color: t.color.body});
      c.text(s.venue, {x: 0.9, y: 4.3, w: 11.4, h: 0.4, size: t.size.small, bold: true, color: t.color.ours});
      if (s.link) { c.rect({x: 0.9, y: 5.4, w: 3.6, h: 0.5, radius: 0.25, fill: t.color.frame}); c.text(s.link, {x: 0.9, y: 5.4, w: 3.6, h: 0.5, size: 14, color: t.color.body, align: 'center', valign: 'middle', mono: true}); }
      c.notes(s.notes);
    },
    // left: figure; right column: Insight #1..#k stacked, current one coloured, earlier ones kept in grey
    insights(c, t, s) {
      this.head(c, t, s);
      c.image(s.figure, {x: t.grid.marginX, y: 1.4, w: 6.2, h: 4.9, alt: s.figureAlt});
      const x = 7.3; const w = W(t) - t.grid.marginX - x; const h = 1.0;
      s.insights.forEach((ins, i) => {
        if (i > s.current) return;
        const on = i === s.current; const y = 1.45 + i * (h + 0.18); const col = t.color.sym[i % t.color.sym.length];
        c.rect({x, y, w, h, radius: 0.1, fill: on ? t.color.tint[i % t.color.tint.length] : t.color.frame, line: on ? col : null, lineW: 1.5});
        c.text([{text: `Insight #${i + 1}  ${ins.head}`, bold: true, color: on ? col : t.color.muted}, {text: ins.body, size: 13, color: on ? t.color.body : t.color.faint}],
          {x: x + 0.2, y, w: w - 0.4, h, size: 17, valign: 'middle', align: 'center'});
      });
    },
    // result figure + a big "N.N×" arrow annotation and a "better →" axis hint
    resultRatio(c, t, s) {
      this.head(c, t, s);
      c.image(s.figure, {x: t.grid.marginX, y: 1.35, w: 8.3, h: 5.0, alt: s.figureAlt});
      const x = 9.3; const w = W(t) - t.grid.marginX - x;
      c.line({x1: x + 0.2, y1: 3.9, x2: x + 0.2, y2: 2.0, color: t.color.ours, w: 3, arrow: true});
      c.text(s.ratio, {x: x + 0.45, y: 1.9, w: w - 0.45, h: 1.0, size: 48, bold: true, color: t.color.ours, heading: true});
      c.text(s.ratioLabel, {x: x + 0.45, y: 2.95, w: w - 0.45, h: 0.9, size: t.size.small, color: t.color.body});
      if (s.better) c.text(s.better, {x, y: 4.3, w, h: 0.4, size: 13, bold: true, color: t.color.muted});
      if (s.condition) c.text(s.condition, {x, y: 4.9, w, h: 1.2, size: 12, color: t.color.faint});
    },
    // dark full-bleed code with one callout bubble
    code(c, t, s) {
      c.background(t.color.dark);
      c.text(s.title, {x: t.grid.marginX, y: 0.35, w: 12, h: 0.7, size: t.size.title - 4, bold: true, color: 'FFFFFF', heading: true});
      c.text(s.lines.map((l) => ({text: l})), {x: 0.9, y: 1.5, w: 8.6, h: 4.8, size: 16, color: 'D8DEE9', mono: true, lineSpacing: 1.35});
      if (s.hl != null) c.rect({x: 0.75, y: 1.5 + s.hl * 0.3 - 0.03, w: 8.4, h: 0.32, line: t.color.callout, lineW: 1.5});
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
  };

  // ================= theory-beamer =================
  // Metropolis-like: dark frame title + progress line, typed blocks, colour per symbol.
  const theoryBeamer = {
    head(c, t, s) {
      c.rect({x: 0, y: 0, w: W(t), h: 0.95, fill: t.color.dark});
      c.text(s.title, {x: 0.5, y: 0, w: W(t) - 1, h: 0.95, size: t.size.title, color: 'FFFFFF', heading: true, valign: 'middle'});
      const p = s.progress == null ? 0 : s.progress;
      c.rect({x: 0, y: 0.95, w: W(t), h: 0.05, fill: t.color.frame}); c.rect({x: 0, y: 0.95, w: W(t) * p, h: 0.05, fill: t.color.accent});
      if (s.footer) c.text(s.footer, {x: 0.5, y: 7.05, w: 9, h: 0.3, size: 11, color: t.color.faint});
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
      s.blocks.forEach((b) => {
        const col = t.color.block[b.kind] || t.color.dark; const h = b.h || 1.35;
        c.rect({x: 0.8, y, w: 11.7, h: 0.42, fill: col});
        c.text(b.kind + (b.name ? ` (${b.name})` : ''), {x: 0.95, y, w: 11.4, h: 0.42, size: 16, bold: true, color: 'FFFFFF', valign: 'middle'});
        c.rect({x: 0.8, y: y + 0.42, w: 11.7, h: h - 0.42, fill: t.color.blockBody});
        c.text(b.text, {x: 0.95, y: y + 0.47, w: 11.4, h: h - 0.52, size: t.size.body, color: t.color.text, valign: 'middle'});
        y += h + 0.25;
      });
    },
    // equation with every symbol in its own colour + a legend of the same colours
    symbols(c, t, s) {
      this.head(c, t, s);
      c.text(s.equation, {x: 0.8, y: 1.6, w: 11.7, h: 1.2, size: 34, color: t.color.text, align: 'center', valign: 'middle', font: t.fonts.math});
      s.legend.forEach((lg, i) => {
        const y = 3.3 + i * 0.75; const col = t.color.sym[lg.sym - 1];
        c.rect({x: 3.2, y: y + 0.12, w: 0.42, h: 0.42, fill: col, radius: 0.05});
        c.text(lg.text, {x: 3.85, y, w: 7.5, h: 0.66, size: t.size.body, color: t.color.body, valign: 'middle'});
      });
      if (s.note) c.text(s.note, {x: 0.8, y: 6.2, w: 11.7, h: 0.5, size: 15, italic: true, color: t.color.muted, align: 'center'});
    },
    outline(c, t, s) {
      this.head(c, t, {...s, title: s.title || 'Outline'});
      s.items.forEach((it, i) => {
        const on = i === s.current;
        c.text(`${i + 1}.  ${it}`, {x: 1.6, y: 1.8 + i * 0.85, w: 10, h: 0.7, size: 24, color: on ? t.color.accent : (i < s.current ? t.color.faint : t.color.text), bold: on, heading: true, valign: 'middle'});
      });
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
      c.text(s.number || '', {x: 0.9, y: 1.5, w: 4, h: 1.6, size: 96, color: t.color.ghost, heading: true, weight: '200'});
      c.text(s.title, {x: 0.9, y: 3.2, w: 11.5, h: 1.4, size: t.size.section, color: t.color.text, heading: true, weight: '300'});
      pageNo(c, t, s.page); c.notes(s.notes);
    },
    focus(c, t, s) {
      this.head(c, t, s);
      focusRow(c, t, s, 3.0, {onFill: t.color.bgRaised, onLine: t.color.text, onText: t.color.text, offFill: null});
      if (s.caption) c.text(s.caption, {x: 1.1, y: 4.8, w: 11.1, h: 0.9, size: t.size.body, color: t.color.muted, align: 'center'});
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
    quote(c, t, s) {
      c.text('\u201C', {x: 1.1, y: 0.9, w: 1.5, h: 1.6, size: 120, color: t.color.accent, heading: true});
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
