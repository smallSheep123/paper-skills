// Read intrinsic dimensions before placing an image. The target box is not
// the image's aspect ratio: passing both as identical dimensions stretches it.
const fs = require('node:fs');

function imageDimensions(file) {
  const b = fs.readFileSync(file);
  if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return {w: b.readUInt32BE(16), h: b.readUInt32BE(20)};
  }
  if (b.length >= 10 && b.toString('ascii', 0, 3) === 'GIF') {
    return {w: b.readUInt16LE(6), h: b.readUInt16LE(8)};
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 4 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      while (b[i] === 0xff) i++;
      const marker = b[i++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = b.readUInt16BE(i);
      if (length < 2 || i + length > b.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return {w: b.readUInt16BE(i + 5), h: b.readUInt16BE(i + 3)};
      }
      i += length;
    }
  }
  const svg = b.toString('utf8');
  if (/<svg\b/i.test(svg)) {
    const viewBox = svg.match(/viewBox\s*=\s*["']\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)[ ,]+([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*["']/i);
    if (viewBox) return {w: Number(viewBox[3]), h: Number(viewBox[4])};
    const w = svg.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i);
    const h = svg.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i);
    if (w && h) return {w: Number(w[1]), h: Number(h[1])};
  }
  throw new Error(`Cannot read image dimensions: ${file}. Use PNG/JPEG/GIF or an SVG with a viewBox.`);
}

function containGeometry(file, box) {
  for (const key of ['x', 'y', 'w', 'h']) {
    if (!Number.isFinite(box[key])) throw new TypeError(`Invalid image box: ${key}`);
  }
  if (box.w <= 0 || box.h <= 0) throw new RangeError('Image box must have positive dimensions');
  const size = imageDimensions(file);
  if (!(size.w > 0 && size.h > 0)) throw new RangeError('Image dimensions must be positive');
  const scale = Math.min(box.w / size.w, box.h / size.h);
  const w = size.w * scale, h = size.h * scale;
  return {x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h};
}

module.exports = {imageDimensions, containGeometry};
