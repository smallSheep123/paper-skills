// Toolchain fixture, NOT a reusable presentation design or evidence of a paper review.
const path = require('node:path');
const fs = require('node:fs');
const {createDeck, addNotes} = require('./ppt-helpers');
async function main() {
  const out = path.resolve(process.argv[2] || 'smoke.pptx');
  if (fs.existsSync(out)) throw new Error(`Refusing to overwrite ${out}`);
  const font = process.env.PAPER_PPT_TEST_FONT || 'Microsoft YaHei';
  const deck = createDeck({title: 'Paper Skills Toolchain Test', fontZh: font});
  const slide = deck.addSlide();
  slide.background = {color: 'FFFFFF'};
  slide.addText('论文汇报 · 工具链自测', {x: 0.7, y: 0.6, w: 11.9, h: 0.7,
    fontFace: font, fontSize: 32, bold: true, color: '1F3A66', margin: 0});
  slide.addText('① 中文与英文 English  ② 数字 96%  ③ 符号 → −',
    {x: 0.7, y: 2.0, w: 11.9, h: 0.7, fontFace: font, fontSize: 22, color: '232A31', margin: 0});
  slide.addText('这不是论文结论，也不是视觉已通过的模板。',
    {x: 0.7, y: 3.2, w: 11.9, h: 0.6, fontFace: font, fontSize: 22, color: '232A31', margin: 0});
  slide.addText('请实际查看渲染图，确认字体、字符和版面。',
    {x: 0.7, y: 4.5, w: 11.9, h: 0.6, fontFace: font, fontSize: 22, color: '232A31', margin: 0});
  addNotes(slide, '此页只测试可编辑文本、中文字符、演讲备注和渲染链路。不是论文汇报质量验收。');
  await deck.writeFile({fileName: out});
  console.log(out);
}
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {main};
