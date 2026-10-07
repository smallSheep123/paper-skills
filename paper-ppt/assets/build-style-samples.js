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
  'keynote-minimal': [
    {type: 'cover', title: 'ExampleNet: Routing Tokens Is All You Need?', subtitle: 'Per-token depth at equal compute', authors: 'A. Author · B. Author · C. Author', venue: 'Placeholder Venue 2026'},
    {type: 'statement', title: 'Observation', claim: 'Most tokens never needed the deep path', points: ['Easy tokens: predicted correctly after 4 of 24 layers', 'Holds across all 6 placeholder datasets'], statement: 'Share of tokens solved by layer 4: [[72%]] (mean over 6 datasets)', page: 2},
    {type: 'section', kicker: 'PART 2', title: 'How does the router decide?', page: 3},
    {type: 'focus', title: 'ExampleNet design', claim: 'Only routed tokens pay for depth', blocks: ['Tokens', 'Encoder', 'Router', 'Deep path', 'Decoder'], active: 2, caption: 'The router scores every token; the top-k go deep.', page: 4},
    {type: 'figure', title: 'Equal-compute comparison', claim: 'ExampleNet wins at every budget above 2 GPU-days', figure: fig('fig-result.png'), caption: 'Placeholder data, 3 seeds', page: 5},
    {type: 'closing', title: 'Takeaways', points: ['Depth can be a per-token budget', 'A tiny router learns it without labels', 'Gains are largest at mid-range compute'], page: 6},
  ],
  'systems-talk': [
    {type: 'cover', title: 'ExampleFS: Placement-Aware Storage for Hot Racks', authors: 'A. Author, B. Author, C. Author', venue: 'NSDI 2026 (placeholder)', link: 'github.com/example/examplefs'},
    {type: 'insights', title: 'Why existing placement is not enough', tracker: ['Motivation', 'Design', 'Evaluation'], stage: 0, figure: fig('fig-overview.png'), current: 1, insights: [{head: 'Hotspots persist', body: 'Hours, not seconds: reactive control is too late'}, {head: 'Supply ≠ demand', body: 'Uplink capacity is ignored by the scheduler'}, {head: 'Small fix suffices', body: 'Score racks by spare uplink'}]},
    {type: 'insights', title: 'Design principle: place by spare uplink', tracker: ['Motivation', 'Design', 'Evaluation'], stage: 1, figure: fig('fig-method.png'), current: 2, insights: [{head: 'Hotspots persist', body: 'Hours, not seconds'}, {head: 'Supply ≠ demand', body: 'Uplink capacity is ignored'}, {head: 'Small fix suffices', body: 'Score racks by spare uplink'}]},
    {type: 'code', title: 'The whole change is one scoring term', tracker: ['Motivation', 'Design', 'Evaluation'], stage: 1, lines: ['def score(rack, task):', '    s = cpu_fit(rack, task) + mem_fit(rack, task)', '    s -= alpha * uplink_util(rack)   # new', '    return s', '', 'best = max(racks, key=lambda r: score(r, task))'], hl: 2, callout: 'one new term: penalise hot uplinks', footer: 'Placeholder code, not from any system'},
    {type: 'resultRatio', title: 'Hot racks drop by an order of magnitude', tracker: ['Motivation', 'Design', 'Evaluation'], stage: 2, figure: fig('fig-result.png'), ratio: '9.6×', ratioLabel: 'fewer hot racks than the default scheduler', better: 'lower is better ↓', condition: 'Placeholder numbers; fleet trace, 30 days.'},
    {type: 'banner', title: 'Where the gain comes from', tracker: ['Motivation', 'Design', 'Evaluation'], stage: 2, figure: fig('fig-overview.png'), takeaway: 'Placement, not congestion control, removes persistent hotspots'},
  ],
  'theory-beamer': [
    {type: 'cover', title: 'Sketching for ℓp Regression', subtitle: 'Oblivious subspace embeddings, revisited', authors: 'A. Author (joint work with B. Author)', venue: 'Placeholder Seminar · 2026'},
    {type: 'outline', items: ['Problem and prior work', 'Our embedding', 'Lower bound', 'Open questions'], current: 1, progress: 0.25, page: 2},
    {type: 'section', title: 'Our embedding', progress: 0.4, page: 3},
    {type: 'blocks', title: 'Main result', progress: 0.5, footer: 'A. Author · Sketching for ℓp regression', page: 4, blocks: [{kind: 'Question', text: 'Can an oblivious sketch preserve every ℓp norm with only poly(d) rows?', h: 1.2}, {kind: 'Theorem', name: 'informal', text: 'Yes: a random {{1:S}} with O(d log d) rows gives ‖{{1:S}}{{2:A}}{{3:x}}‖ ≈ ‖{{2:A}}{{3:x}}‖ for all {{3:x}}.', h: 1.5}, {kind: 'Example', text: 'For p = 2 this recovers the classic Johnson–Lindenstrauss bound.', h: 1.2}]},
    {type: 'symbols', title: 'One colour per object', progress: 0.6, page: 5, equation: '{{1:S}} · ( {{2:A}} {{3:x}} − {{4:b}} )  ≈  {{1:S}}{{2:A}} {{3:x}} − {{1:S}}{{4:b}}', legend: [{sym: 1, text: 'S — the sketch (r × n, r ≪ n)'}, {sym: 2, text: 'A — original instance (n rows)'}, {sym: 3, text: 'x — the unknown, never sketched'}, {sym: 4, text: 'b — targets, sketched with the same S'}], note: 'The same four colours are used in every later figure.'},
  ],
  'dark-tech': [
    {type: 'cover', kicker: 'PLACEHOLDER CONF 2026', title: 'How ExampleNet Learns to Skip Layers', authors: 'A. Author', venue: 'Example Lab'},
    {type: 'section', number: '02', title: 'Architecture', page: 2},
    {type: 'focus', title: 'Basic architecture', blocks: ['Vision encoder', 'Router', 'Language model'], active: 1, caption: 'Everything else is frozen; only the router is trained.', page: 3},
    {type: 'explain', title: 'Router scores are bimodal', figure: fig('fig-result.png'), annotation: 'Two clusters: tokens either clearly need depth or clearly don\u2019t', page: 4},
    {type: 'statement', statement: 'Depth should be spent where the uncertainty is.', by: '— the one idea of this talk', page: 5},
  ],
  editorial: [
    {type: 'cover', title: 'ILLUSTRATING EXAMPLENET', authors: 'A. Author', figure: fig('fig-overview.png')},
    {type: 'section', title: 'Why depth should vary', page: 2},
    {type: 'hero', title: 'Really, route the tokens!', subtitle: 'A fixed depth never fits every token.', figure: fig('fig-method.png'), caption: 'Fig. 2 — placeholder illustration', page: 3},
    {type: 'chips', title: 'Four things a router must do', items: [{head: 'Estimate', body: 'how hard a token is'}, {head: 'Budget', body: 'a fixed compute pool'}, {head: 'Stay stable', body: 'no collapse to one path'}, {head: 'Be cheap', body: 'under 1% of the FLOPs'}], page: 4},
    {type: 'quote', quote: 'A model should think longer only about the hard parts.', by: 'Paraphrased design goal (placeholder)', page: 5},
  ],
  'defense-cn': [
    {type: 'cover', org: 'XX 大学 · XX 学院', kind: '博士学位论文答辩', title: '面向大规模数据中心的热点感知资源放置方法研究', titleEn: 'Hotspot-Aware Resource Placement for Large-Scale Datacenters (placeholder)', info: [['答辩人', '<姓名>'], ['专业', '计算机科学与技术'], ['导师', '<导师> 教授'], ['日期', '2026 年 X 月 X 日']]},
    {type: 'toc', items: ['研究背景与意义', '热点成因测量分析', '热点感知的任务放置', '热点感知的数据放置', '总结与展望'], current: 2, chapters: ['研究背景', '测量分析', '任务放置', '数据放置', '总结展望'], chapter: 2, page: 2},
    {type: 'chapter', number: '第三章', title: '热点感知的任务放置', subtitle: '主动放置 + 被动迁移', chapters: ['研究背景', '测量分析', '任务放置', '数据放置', '总结展望'], chapter: 2},
    {type: 'figureConclusion', title: '3.2 放置打分函数与迁移机制', lead: '在原有打分中加入机架上行利用率惩罚项，并对持续过热的机架触发任务迁移。', figure: fig('fig-method.png'), label: '好处', conclusion: '改动极小、无需改网络，热点机架数量下降 [[约 90%]]（占位数字）。', chapters: ['研究背景', '测量分析', '任务放置', '数据放置', '总结展望'], chapter: 2, page: 18},
    {type: 'contributions', items: [{head: '热点测量', body: '首次给出全网 ToR 热点的分布与持续时间', pub: '[第一作者, XXX 2025]'}, {head: '任务放置', body: '提出带上行惩罚的主动放置与迁移', pub: '[第一作者, XXX 2026]'}, {head: '数据放置', body: '按机架容量放置数据块，降低读延迟', pub: '[共一, XXX 2026]'}], chapters: ['研究背景', '测量分析', '任务放置', '数据放置', '总结展望'], chapter: 4, page: 40},
  ],
  'jp-gothic': [
    {type: 'cover', title: '言語モデルの[[内部機序]]：解析と解釈', authors: '著者 A，著者 B，著者 C', venue: '2026-03, 研究会（プレースホルダ）'},
    {type: 'section', title: 'ニューロン分析', page: 2},
    {type: 'read', paper: 'ExampleNet: Routing Tokens Is All You Need? [Author+, Venue\u201926]', title: 'ルーターは[[難しいトークン]]だけを深層へ送る', badge: '13:00', points: [{text: '各トークンにスコアを付け，上位 k 個だけが深い経路を通る', sub: ['ラベル不要で本体と同時に学習']}, {text: '同じ計算量で精度が [[+4.4 pt]] 向上（プレースホルダ）'}], figure: fig('fig-method.png'), conclusion: '結論：深さはトークン単位の予算として扱える', page: 3},
    {type: 'read', paper: 'Appendix', title: '補足：ルーターの崩壊を防ぐ正則化', optional: '参考', points: [{text: '負荷分散損失で一部の経路への集中を防ぐ'}], figure: fig('fig-result.png'), page: 4},
    {type: 'references', items: ['[1] A. Author et al. ExampleNet. Venue 2026.', '[2] B. Author et al. Early exit networks. Venue 2024.', '[3] C. Author et al. Mixture of depths. Venue 2025.'], page: 5},
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
