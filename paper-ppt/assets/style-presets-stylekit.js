'use strict';
// The six style-kit presets: graphite / violet / bandgrid / folio / nocturne / mosaic.
//
// Each one keeps its prototypes in `styles/<name>/prototypes.js`, next to the
// tokens.json and STYLE.md it belongs to, so a style stays one self-contained
// directory. This module only wires them into `PRESETS`; it adds no behaviour
// and changes nothing about the nine presets that came before.
//
// tokens.json `name` must match the key returned here — `drawSlide()` picks the
// prototype set by `tokens.name`.

const path = require('node:path');
const STYLES = path.join(__dirname, '..', 'styles');

module.exports = function makeStyleKitPresets({sourceLine, pageNo}) {
  const names = ['graphite', 'violet', 'bandgrid', 'folio', 'nocturne', 'mosaic'];
  const out = {};
  for (const name of names) {
    out[name] = require(path.join(STYLES, name, 'prototypes.js'))({sourceLine, pageNo});
  }
  return out;
};
