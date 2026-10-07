// Build sample decks for every style preset.
//   node assets/build-style-samples.js [outDir]
// Writes <outDir>/<style>-sample.pptx and <outDir>/<style>/NN-<archetype>.svg
// (SVG previews can be turned into PNG with: python scripts/svg_preview.py <outDir>)
// All content is a fictional placeholder paper; figures are placeholders.

const fs = require('node:fs');
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const {loadTokens, PptxCanvas, SvgCanvas, drawSlide} = require('./style-presets');

const FIG = path.join(__dirname, '..', 'styles', '_sample-figures');
const fig = (n) => path.join(FIG, n);

const SAMPLES = {
  international: [
    {type: 'cover', title: 'ExampleNet: Routing Tokens Is All You Need?', authors: 'A. Author, B. Author, C. Author · Example University', venue: 'Placeholder Venue 2026', presenter: 'Paper reading · presented by <name>'},
    {type: 'questions', title: 'Three questions this paper answers', items: ['Why do dense models waste compute on easy tokens?', 'Can a router learn which tokens need depth?', 'Does it still win at equal compute?'], current: 1, page: 2},
    {type: 'section', title: 'Can a router learn which tokens need depth?', subtitle: 'Q2 · Method', page: 3},
    {type: 'buildSteps', title: 'Only routed tokens pay for the [[deep path]]', steps: ['Tokens', 'Encoder', 'Router', 'Deep path', 'Decoder'], active: 3, explain: 'Same pipeline as the previous slide; only the [[deep path]] is new.', page: 4},
    {type: 'figureNotes', title: 'The router decides depth per token, not per sequence', tag: '[Author+, Venue 2026]', figure: fig('fig-method.png'), points: ['Easy tokens skip the deep path', 'Router is trained jointly, no labels', 'Memory is shared across steps'], takeaway: 'Depth becomes a per-token budget', source: 'Figure: placeholder, not from any paper', page: 5},
    {type: 'equation', title: 'What we want vs. what we compute', lines: ['want:   y = f_L( ... f_1(x) )   for every token', 'do:       y = r(x) · f_deep(x) + (1 − r(x)) · f_shallow(x)'], labels: [{from: [6.7, 3.15], to: [6.2, 4.1], text: 'router score r(x)'}, {from: [9.6, 3.15], to: [10.1, 4.1], text: 'cheap path'}], points: ['r(x) is a scalar in [0, 1]; top-k tokens take the deep path'], page: 6},
    {type: 'result', title: 'At equal compute, ExampleNet is [[+4.4 points]] better', tag: '[Table 2]', figure: fig('fig-result.png'), number: '+4.4', numberLabel: 'accuracy at 8 GPU-days vs. best baseline', condition: 'Placeholder numbers. Same data, same schedule, 3 seeds.', source: 'Figure: placeholder data', page: 7},
    {type: 'closing', title: 'Looking ahead…', points: ['Is per-token depth the right unit, or per-region?', 'Router collapse at scale is not studied', 'What would an end-to-end learned budget look like?'], page: 8},
  ],
  domestic: [
    {type: 'cover', paperTitle: 'ExampleNet: Routing Tokens Is All You Need?', titleZh: '按 token 路由计算深度的高效模型', paperMeta: 'Placeholder Venue 2026 · A. Author 等 · Example University', presenter: '<姓名>', group: '<课题组> 组会', date: '2026 年 10 月'},
    {type: 'outline', items: ['研究背景与动机', '方法：按 token 路由', '实验结果', '总结与讨论'], footer: '<课题组> 组会 · <姓名>', page: 2},
    {type: 'section', number: '02', title: '方法：按 token 路由', subtitle: '核心问题：哪些 token 值得更深的计算？', footer: '<课题组> 组会 · <姓名>', page: 3},
    {type: 'paperGlance', prefix: '二、', title: '一页看懂：按 token [[分配计算深度]]', tag: '[Example Univ., Venue 2026]', goal: '在同等算力下提升模型精度', challenge: '稠密模型对简单 token 也走完整深度，浪费算力', solution: '轻量 [[路由器]] 只把困难 token 送入深层路径', figure: fig('fig-overview.png'), caption: '整体流程（示意图，占位）', footer: '<课题组> 组会 · <姓名>', page: 4},
    {type: 'method', prefix: '二、', title: '方法：路由器决定 token 走 [[深层]] 还是浅层', tag: '[Author 等, 2026]', figure: fig('fig-method.png'), caption: '图 2  方法框架（示意图，占位）', points: ['编码器输出后，[[路由器]]为每个 token 打分', '得分前 k 的 token 进入深层路径', '路由器与主干 [[联合训练]]，无需额外标注', '记忆模块在各步之间共享'], footer: '<课题组> 组会 · <姓名>', page: 5},
    {type: 'result', prefix: '三、', title: '实验：同等算力下精度提升 [[4.4 个百分点]]', tag: '[Table 2]', figure: fig('fig-result.png'), caption: '图 4  精度–算力曲线（占位数据）', number: '+4.4 pp', numberLabel: '8 GPU-days 时相对最佳基线', points: ['同数据、同训练轮数', '3 个随机种子取平均', '数字为占位示例'], footer: '<课题组> 组会 · <姓名>', page: 6},
    {type: 'summary', conclusions: ['按 token 分配深度可在同算力下提升精度', '路由器无需额外标注即可学习', '收益在中等算力区间最明显'], discussion: ['大规模下路由是否会塌缩？', '能否迁移到我们组的 <任务>？', '与早退（early exit）方法相比优劣？'], footer: '<课题组> 组会 · <姓名>', page: 7},
    {type: 'thanks', footer: '<课题组> 组会 · <姓名>', page: 8},
  ],
};

async function main() {
  const outDir = path.resolve(process.argv[2] || 'style-samples');
  fs.mkdirSync(outDir, {recursive: true});
  for (const [name, slides] of Object.entries(SAMPLES)) {
    const t = loadTokens(name);
    const deck = new pptxgen();
    deck.layout = t.slide.layout;
    deck.title = `${t.label} sample`;
    const svgDir = path.join(outDir, name);
    fs.mkdirSync(svgDir, {recursive: true});
    slides.forEach((spec, i) => {
      drawSlide(new PptxCanvas(deck.addSlide(), t), t, spec);
      const svg = new SvgCanvas(t);
      drawSlide(svg, t, spec);
      fs.writeFileSync(path.join(svgDir, `${String(i + 1).padStart(2, '0')}-${spec.type}.svg`), svg.toSVG());
    });
    const file = path.join(outDir, `${name}-sample.pptx`);
    await deck.writeFile({fileName: file});
    console.log(`wrote ${file} (${slides.length} slides) + svg previews in ${svgDir}`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = {SAMPLES};
