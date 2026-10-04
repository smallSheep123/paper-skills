// Optional low-level drawing helpers. No layouts, slide planner, or write side effects.
// The AI author chooses each page's content, geometry and visual expression.
const pptxgen = require('pptxgenjs');
const fs = require('node:fs');

function createDeck(options = {}) {
  const deck = new pptxgen();
  deck.layout = 'LAYOUT_WIDE';
  deck.author = options.author || 'Paper Reading';
  deck.title = options.title || 'Paper Presentation';
  deck.lang = options.lang || 'zh-CN';
  deck.theme = {
    headFontFace: options.fontZh || 'Microsoft YaHei',
    bodyFontFace: options.fontZh || 'Microsoft YaHei',
    lang: options.lang || 'zh-CN',
  };
  return deck;
}

function containImage(deck, slide, file, box, altText = '') {
  if (!fs.existsSync(file)) throw new Error(`Image not found: ${file}`);
  for (const key of ['x', 'y', 'w', 'h']) {
    if (!Number.isFinite(box[key])) throw new TypeError(`Invalid image box: ${key}`);
  }
  if (box.w <= 0 || box.h <= 0) throw new RangeError('Image box must have positive dimensions');
  slide.addImage({path: file, ...box, sizing: {type: 'contain', w: box.w, h: box.h}, altText});
}

function addNotes(slide, text) {
  if (typeof text !== 'string' || !text.trim()) throw new TypeError('Speaker notes cannot be empty');
  slide.addNotes(text);
}

module.exports = {createDeck, containImage, addNotes};
