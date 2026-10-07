// Optional Academic Evidence composition; not a shared layout policy.
function equationContent(c, t, s) {
  if (!Array.isArray(s.equations) || !s.equations.length) {
    throw new Error('equation pages require prepared equations; raw LaTeX in lines is not a rendered formula. See references/math-equations.md');
  }
  const top = s.contentY || t.grid.contentY + 0.35;
  const bottom = s.points?.length ? 5.25 : t.grid.contentBottom - 0.25;
  const gap = 0.35;
  const rows = s.equations.map(row => ({...row,
    h: row.asset.heightIn + (row.asset.representation === 'native' ? 0.40 : 0.08),
    captionH: row.caption ? 0.52 : 0}));
  const needed = rows.reduce((n, row) => n + row.h + row.captionH, 0) + gap * (rows.length - 1);
  if (needed > bottom - top) throw new Error('Equation page is too tall: split the derivation or move explanations to another slide');
  let y = top + (bottom - top - needed) / 2;
  for (const row of rows) {
    c.equation(row.asset, {x: 1.05, y, w: t.slide.w - 2.10, h: row.h}, {align: row.align || 'center'});
    if (row.caption) c.text(row.caption, {x: 1.05, y: y + row.h + 0.12,
      w: t.slide.w - 2.10, h: 0.40, size: t.size.body,
      color: t.color.note || t.color.primary, align: 'center'});
    y += row.h + row.captionH + gap;
  }
  if (s.points?.length) c.text(s.points.map(text => ({text, bullet: true})), {
    x: 1.05, y: 5.55, w: t.slide.w - 2.10, h: 1.0,
    size: t.size.body, color: t.color.body, paraSpaceBefore: 8});
}


module.exports = {equationContent};
