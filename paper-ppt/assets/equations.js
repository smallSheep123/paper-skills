// Measured equation placement. Never squeeze a formula into a smaller box.
const fs = require('node:fs');

function loadEquations(manifest) {
  const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (data.schema !== 1) throw new Error('Unsupported math manifest');
  return data.equations;
}

function equationGeometry(asset, box, align = 'center') {
  if (!asset || !['svg', 'native'].includes(asset.representation)) throw new Error('Prepare a LaTeX equation first');
  if (![box.x, box.y, box.w, box.h, asset.widthIn, asset.heightIn].every(Number.isFinite) || box.w <= 0 || box.h <= 0) throw new Error('Invalid math box');
  if (!['left', 'center', 'right'].includes(align)) throw new Error('Invalid math alignment');
  // Native Cambria Math and TeX have different metrics. Reserve room without
  // reducing font size. The reserved box also keeps nearby labels away.
  const pad = asset.representation === 'native' ? 0.20 : 0;
  if (asset.widthIn + pad * 2 > box.w || asset.heightIn + pad * 2 > box.h) {
    throw new Error(`Equation ${asset.id} does not fit at ${asset.fontSize} pt: needs ${
      (asset.widthIn + pad * 2).toFixed(2)} × ${(asset.heightIn + pad * 2).toFixed(2)} in. Widen the box, split the equation or move it to another slide.`);
  }
  const x = align === 'left' ? box.x + pad : align === 'right' ? box.x + box.w - asset.widthIn - pad : box.x + (box.w - asset.widthIn) / 2;
  const y = box.y + (box.h - asset.heightIn) / 2;
  return {x, y, w: asset.widthIn, h: asset.heightIn,
    nativeBox: {x: box.x, y: box.y, w: box.w, h: box.h}};
}

function addEquation(slide, asset, box, options = {}) {
  const align = options.align || 'center';
  const g = equationGeometry(asset, box, align);
  slide.addImage({path: asset.png, x: g.x, y: g.y, w: g.w, h: g.h,
    objectName: `equation-${asset.id}`,
    altText: 'paper-ppt-math:' + JSON.stringify({id: asset.id, latex: asset.latex,
      fontSize: asset.fontSize, align, nativeBox: g.nativeBox})});
  return g;
}

module.exports = {loadEquations, equationGeometry, addEquation};
