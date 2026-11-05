// Build sample decks for every style preset.
//   node assets/build-style-samples.js [outDir]
// Writes <outDir>/<style>-sample.pptx and <outDir>/<style>/NN-<archetype>.svg
// (SVG previews can be turned into PNG with: python scripts/svg_preview.py <outDir>)
// All content is a fictional placeholder paper; figures are placeholders.

const fs = require('node:fs');
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const {loadTokens, PptxCanvas, SvgCanvas, drawSlide, writeDeck} = require('./style-presets');

const FIG = path.join(__dirname, '..', 'styles', '_sample-figures');
const fig = (n) => path.join(FIG, n);

// One speaking cue per archetype. Samples exist to show the layout, but they
// also have to be legal decks: check_deck.py fails any slide without notes, so
// a sample build used to produce nine decks that failed the skill's own gate.
const NOTE_BY_TYPE = {
  cover: '开场 30 秒：这篇论文解决什么问题、为什么值得听；不要念标题。',
  questions: '先抛三个问题，停一秒；说明本次只回答其中第几个。',
  section: '章节过渡：一句话把主线问题接回来，不展开细节。',
  buildSteps: '从上一页的流程出发，只指新增的那一步，其余保持不变。',
  figureNotes: '先指图讲结构，再逐条落到图上的部位；结论句留到最后。',
  equation: '左边是理想、右边是实际；逐项对应，说明近似发生在哪里。',
  result: '只讲一个数字：谁的、在什么条件下、相对谁。',
  closing: '留三个开放问题，最后一个指向我们组能做的方向。',
  outline: '用 20 秒过一遍四节，点明第三节是重点。',
  paperGlance: '一页交代背景、难点、做法；图只作锚点，不逐点念。',
  method: '讲清三步，明确指出哪一步是本文新增的。',
  summary: '结论按重要性排序；讨论问题留给听众回答。',
  thanks: '道谢后停住等提问；不要在这里重复结论。',
  statement: '一句主张配一个数字；限定条件放进注里，不口头补。',
  focus: '把注意力收在一条流程上，高亮当前阶段。',
  figure: '指图说结论；实验条件写进图注，不逐条念。',
  insights: '三条洞见并列：先给判断，再给证据。',
  code: '只讲高亮的那一行，其余代码是背景。',
  resultRatio: '倍数类结论要说明分母是什么，否则不可信。',
  banner: '把前面三条收敛成一句可复述的话。',
  blocks: '问题与定理分块给；记号第一次出现时必须解释。',
  symbols: '颜色即记号；同一颜色在后续图里含义不变。',
  explain: '先看图上的双峰，再解释双峰为什么意味着可分。',
  hero: '主张先行，图作证据；不要逐点念图注。',
  chips: '四件事并列，各一句；最后一件是成本约束。',
  quote: '引用只用来停顿，不展开；说完把话交回主线。',
  toc: '目录页交代章节与所处位置，高亮的是当前章。',
  chapter: '章节页只报编号与标题，停半秒再翻页。',
  figureConclusion: '先讲机制一句，再指图给结果，最后落到「好处」。',
  contributions: '三项按发表状态排，指明哪项是第一作者工作。',
  read: '论文速读：结论先行，再补方法与数字。',
  references: '参考文献只列三条，说明都能查证。',
  claim: '主张页：一句可核验的主张 + 2–3 个同源数字，出处写清楚。',
  twoCol: '左栏给主张、右栏给流程；两栏读的是同一个论证，不要各说各的。',
  part: '分区页只报编号与标题，一句话说清本节要回答的问题。',
  bands: '三条横条按「现状 → 代价 → 关键观察」排；最后一条才是重点，别平均使力。',
  table: '表格只回答一个问题：多花的代价换回了什么；本文行加重，表下写实验条件。',
};

const sampleNote = (spec) => spec.notes
  || NOTE_BY_TYPE[spec.type]
  || `本页演示 ${spec.type} 版式：先给结论，再给证据；内容为占位。`;

// The six style-kit presets (graphite / violet / bandgrid / folio / nocturne /
// mosaic) were distilled against one placeholder paper, SPARQ, so that only the
// layout language differs between them. Kept in one object here: six copies of
// the same numbers is how sample decks start contradicting each other.
const KIT = {
  en: {
    kicker: 'OSDI 2026 · PAPER READING',
    title: 'SPARQ: Speculative\nPrefetching for\nVector Index Scans',
    subtitle: 'A query batch already reveals which lists come next — score the current one while the next one is still in flight.',
    authors: 'L. CHEN · M. ITO · R. GUPTA',
    affil: 'UC Berkeley · Microsoft Research',
    meta: '汇报人 张×× · 2026.11',
    outline: ['Why vector scans stall', 'Design: prefetch inside the batch', 'Evaluation on SIFT1B', 'Limits and discussion'],
    section1: {index: 1, word: 'Motivation', line: 'IVF 扫描的瓶颈不在算力，而在随机读的等待。'},
    section2: {index: 2, word: 'Design', line: '把「下一个要读的簇」提前到当前簇还在打分的时候。'},
  },
  zh: {
    title: 'SPARQ：为向量索引扫描做投机预取',
    subtitle: '一批查询本身就暴露了「下一批要读哪个簇」——当前簇还在打分时，下一簇已经在路上。',
    outline: [
      {t: '背景与动机', note: '向量检索为什么会被 I/O 卡住'},
      {t: '设计与实现', note: '把预取塞进查询批次内部'},
      {t: '实验结果', note: '延迟、吞吐与内存的三方权衡'},
      {t: '局限与讨论', note: '什么负载下这套方法会失效'},
    ],
    motive: {
      claim: '每次查询要摸 40 个候选簇，其中 61% 的时间在等 SSD。',
      bullets: [
        '倒排索引把向量切成 4096 簇，查询只扫最近 40 个',
        '簇内连续读、簇间随机读，延迟死在 40 次跳转上',
        '批次内部的下一个簇号，在打分之前就已确定',
      ],
      stages: [
        {t: '40 个候选簇', d: 'nprobe = 40，约占全库 1%'},
        {t: '簇间随机读', d: '4 KB 粒度，队列深度不足'},
        {t: '算力空转等待', d: 'SIMD 打分被 I/O 拖住'},
      ],
      hot: 1,
    },
    method: {
      claim: '把「下一个要读的簇」提前到当前簇还在打分的时候。',
      bullets: [
        '预取：打分前算出下一批簇号，提前下发读',
        '剪枝：复用 PQ 距离表，淘汰簇立刻释放',
        '回填：DMA 与 SIMD 打分重叠，队列深度 8',
      ],
      stages: [
        {t: '预取候选簇', d: '提前下发读请求'},
        {t: '打分与剪枝', d: '淘汰簇立即释放'},
        {t: '异步回填', d: '与打分重叠'},
      ],
      hot: 0,
    },
    result: {
      claim: '同一召回率下，p95 延迟从 128 ms 降到 53 ms。',
      big: '2.4×', bigLabel: 'p95 延迟下降倍数',
      bigNote: 'SIFT1B，recall@10 = 0.95，nprobe = 40，单节点 32 核。\n对照为同召回率下的最优配置。',
      caption: '图 3：同一召回率下的 p95 延迟（论文 Table 2 重绘）',
    },
    table: {
      cols: ['系统', 'p95 (ms)', 'QPS', 'recall@10', '内存 (GB)'],
      widths: [3.5, 2.1, 1.9, 2.1, 2.05],
      rows: [
        {cells: ['IVF-Flat', '128', '780', '0.95', '32.0']},
        {cells: ['DiskANN', '96', '1040', '0.95', '46.0']},
        {cells: ['SPARQ（本文）', '53', '1260', '0.95', '34.5'], ours: true},
      ],
      note: '测试集 SIFT1B，单节点 32 核 / 256 GB，nprobe 各自调到相同 recall@10 的最优值。',
    },
    summaryBlocks: [
      {label: '主要贡献', items: ['把随机读识别为向量检索的真瓶颈，而不是距离计算', '利用批次内部的簇号可预测性，预取覆盖 78% 的随机读']},
      {label: '局限与边界', items: ['单批次查询数 < 8 时预取窗口不足，收益降到 1.2×', '依赖 SSD 队列深度 ≥ 4，机械盘与远端存储未验证']},
      {label: '讨论', items: ['能否把同样的预取思路用到图索引（DiskANN）的邻居扩展上？']},
    ],
    thanks: 'SPARQ · OSDI 2026 · 汇报人：张××',
  },
};

const KIT_STATEMENT = {
  claim: '每次查询要摸 40 个候选簇，其中 61% 的时间在等 SSD。',
  claimNote: '倒排文件索引把向量切成 4096 个簇，查询只扫最近的 40 个。簇内是连续读，簇间是随机读——延迟就死在这 40 次跳转上。',
  metrics: [
    {v: '128 ms', k: 'p95 延迟（SIFT1B，nprobe = 40）', hot: true},
    {v: '61%', k: '请求时间花在等待随机读上'},
    {v: '40 / 4096', k: '每查询访问的簇数 / 全库簇数，簇间是随机读'},
  ],
};

const KIT_RESULT_EN = {
  big: '2.4×', bigLabel: 'p95 延迟下降倍数',
  bigNote: 'SIFT1B，recall@10 = 0.95，nprobe = 40，单节点 32 核。\n对照为同召回率下的最优配置。',
  axis: 'P95 QUERY LATENCY (MS) — LOWER IS BETTER',
  data: [
    {label: 'IVF-Flat', value: 128},
    {label: 'DiskANN', value: 96},
    {label: 'SPARQ', value: 53, ours: true},
  ],
  caption: '图 3　同一召回率下的 p95 延迟（论文 Table 2 重绘，仅用论文标注值）',
};

// The three "second round" presets (folio / nocturne / mosaic) narrow the four
// summary blocks to four cards: contribution, evidence, boundary, next step.
const KIT_SUMMARY_CARDS = [
  {label: '背景与贡献', text: KIT.zh.summaryBlocks[0].items[0]},
  {label: '已验证', text: KIT.zh.summaryBlocks[0].items[1]},
  {label: '局限与边界', text: KIT.zh.summaryBlocks[1].items[0]},
  {label: '讨论 / 下一步', text: KIT.zh.summaryBlocks[2].items[0]},
];
const KIT_SUMMARY_ITEMS = [
  KIT.zh.summaryBlocks[0].items[0],
  KIT.zh.summaryBlocks[1].items[0],
  KIT.zh.summaryBlocks[2].items[0],
];

// folio / nocturne / mosaic run one page sequence over the same content; only
// the cover kicker and two figure notes differ, because their tokens spend the
// accent differently (nocturne keeps gold to six CJK characters or fewer).
function kitNarrowSample(name) {
  const z = KIT.zh;
  const kicker = name === 'nocturne' ? 'SYSTEMS TALK / OSDI 2026' : '论文分享 · 系统组周会';
  const pages = [
    {type: 'cover', kicker, title: z.title, subtitle: z.subtitle,
      meta: '汇报人：张××　2026.11.04', authors: 'L. Chen · M. Ito · R. Gupta',
      takeaway: '批次内部的簇号可预测，预取能把 p95 延迟压到 53 ms。',
      chip1: '论文分享', chip2: '系统组周会', chip3: '2026', page: 1},
    {type: 'outline', kicker: 'AGENDA', title: '汇报提纲', items: z.outline, page: 2},
    {type: 'section', index: 1, title: '动机', note: KIT.en.section1.line, page: 3},
    {type: 'claim', kicker: 'MOTIVATION', title: '一、瓶颈不在算力，而在 40 次随机跳转',
      claim: KIT_STATEMENT.claim, claimNote: KIT_STATEMENT.claimNote, metrics: KIT_STATEMENT.metrics,
      source: '来源：论文 §2.1 与 Fig. 2；SIFT1B / nprobe = 40 实测', page: 4},
    {type: 'section', index: 2, title: '设计', note: KIT.en.section2.line, page: 5},
    {type: 'method', kicker: 'DESIGN', title: '二、方法：预取、剪枝、回填三步重叠',
      claim: z.method.claim, bullets: z.method.bullets, stages: z.method.stages, hot: z.method.hot,
      takeaway: '关键不是把 I/O 做快，而是让 I/O 和计算落在同一段时间里。', page: 6},
    {type: 'result', kicker: 'EVALUATION', title: '三、结果：同等召回率下 p95 降到 53 ms',
      big: z.result.big, bigLabel: z.result.bigLabel, bigNote: z.result.bigNote,
      data: KIT_RESULT_EN.data, caption: z.result.caption, source: 'Table 2 · §5.2', page: 7},
    {type: 'table', kicker: 'EVALUATION', title: '三、结果：多花 2.5 GB 内存换 75 ms',
      cols: z.table.cols, widths: z.table.widths, rows: z.table.rows, tableNote: z.table.note, page: 8},
    {type: 'summary', kicker: 'CONCLUSION', title: '四、小结：贡献、边界与待验证的问题',
      cards: KIT_SUMMARY_CARDS, items: KIT_SUMMARY_ITEMS, page: 9},
    {type: 'thanks', title: '谢谢，欢迎讨论', line: '预取窗口与 SSD 队列深度的关系',
      contact: z.thanks, page: 10},
  ];
  return pages;
}

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
    {type: 'read', paper: 'ExampleNet: Routing Tokens Is All You Need? [Author+, Venue\u201926]', title: 'ルーターは[[難しいトークン]]だけを深層へ送る', badge: '13:00', points: [{text: '各トークンにスコアを付け，上位 k 個が深い経路を通る', sub: ['ラベル不要で本体と同時に学習']}, {text: '同計算量で精度が [[+4.4 pt]] 向上（仮値）'}], figure: fig('fig-method.png'), conclusion: '結論：深さはトークン単位の予算として扱える', page: 3},
    {type: 'read', paper: 'Appendix', title: '補足：ルーターの崩壊を防ぐ正則化', optional: '参考', points: [{text: '負荷分散損失で一部の経路への集中を防ぐ'}], figure: fig('fig-result.png'), page: 4},
    {type: 'references', items: ['[1] A. Author et al. ExampleNet. Venue 2026.', '[2] B. Author et al. Early exit networks. Venue 2024.', '[3] C. Author et al. Mixture of depths. Venue 2025.'], page: 5},
  ],
  // ---- the six style-kit presets ------------------------------------------
  graphite: [
    {type: 'cover', kicker: KIT.en.kicker, title: KIT.en.title, subtitle: KIT.en.subtitle,
      authors: KIT.en.authors, affil: KIT.en.affil, meta: KIT.en.meta, page: 1},
    {type: 'outline', kicker: 'AGENDA', title: 'This talk in four lines', items: KIT.en.outline, page: 2},
    {type: 'section', index: 1, word: KIT.en.section1.word, line: KIT.en.section1.line, page: 3},
    {type: 'statement', kicker: 'MOTIVATION', title: 'Every query pays for 40 random hops',
      claim: KIT_STATEMENT.claim, claimNote: KIT_STATEMENT.claimNote, metrics: KIT_STATEMENT.metrics,
      source: '§2.1 · Fig. 2', page: 4},
    {type: 'section', index: 2, word: KIT.en.section2.word, line: KIT.en.section2.line, page: 5},
    {type: 'method', kicker: 'DESIGN', title: 'Overlap the next fetch with the current score',
      stages: KIT.zh.method.stages, hot: 0, takeaway: '关键不是把 I/O 做快，而是让 I/O 和计算落在同一段时间里。',
      timeNote: 'I/O 与计算错位半个簇：每个簇的等待被下一个簇的计算吸收。', page: 6},
    {type: 'result', kicker: 'EVALUATION', title: '2.4× lower p95 at the same recall',
      ...KIT_RESULT_EN, source: 'Table 2 · §5.2', page: 7},
    {type: 'table', kicker: 'EVALUATION', title: 'The extra 2.5 GB buys 75 ms',
      cols: KIT.zh.table.cols, widths: [3.9, 2.05, 1.9, 2.0, 1.95], rows: KIT.zh.table.rows,
      tableNote: KIT.zh.table.note, page: 8},
    {type: 'summary', kicker: 'CONCLUSION', title: 'Three things to remember',
      items: ['随机读是向量检索的真瓶颈，不是距离计算。', '批次内部的簇号可预测，预取窗口覆盖 78% 的随机读。',
        '同等召回率下 p95 压到 53 ms，内存只多 8%。'], page: 9},
    {type: 'thanks', title: 'Thank you', line: 'Questions · 讨论', contact: KIT.zh.thanks, page: 10},
  ],
  violet: [
    {type: 'cover', kicker: '论文分享 · 系统组周会', date: '2026.11.04', title: KIT.zh.title,
      subtitle: KIT.zh.subtitle,
      meta: [{k: '汇报人', v: '张××'}, {k: '导师', v: '×× 教授'}, {k: '单位', v: '×× 大学 计算机学院 · 系统组'}],
      foot: '论文：SPARQ (OSDI 2026) · L. Chen, M. Ito, R. Gupta', page: 1},
    {type: 'outline', title: '汇报提纲', headRight: '张×× · 2026.11.04 · 2/10', items: KIT.zh.outline, page: 2},
    {type: 'section', index: 1, title: '背景与动机', note: '向量检索为什么会被 I/O 卡住', page: 3},
    {type: 'twoCol', title: '一、问题：40 次随机跳转吃掉六成时间', headRight: '张×× · 2026.11.04 · 4/10',
      blockLabel: '问题在哪', claim: KIT.zh.motive.claim, bullets: KIT.zh.motive.bullets,
      stages: KIT.zh.motive.stages, hot: KIT.zh.motive.hot, note: '来源：论文 §2.1，Fig. 2', page: 4},
    {type: 'section', index: 2, title: '设计与实现', note: '把预取塞进查询批次内部', page: 5},
    {type: 'twoCol', title: '二、方法：预取、剪枝、回填三步重叠', headRight: '张×× · 2026.11.04 · 6/10',
      blockLabel: '怎么做的', claim: KIT.zh.method.claim, bullets: KIT.zh.method.bullets,
      stages: KIT.zh.method.stages, hot: KIT.zh.method.hot, note: '来源：论文 §3.2，Fig. 4', page: 6},
    {type: 'result', title: '三、结果：同等召回率下 p95 降到 53 ms', headRight: '张×× · 2026.11.04 · 7/10',
      claim: KIT.zh.result.claim, big: KIT.zh.result.big, bigLabel: KIT.zh.result.bigLabel,
      bigNote: KIT.zh.result.bigNote, data: KIT_RESULT_EN.data, caption: KIT.zh.result.caption, page: 7},
    {type: 'table', title: '三、结果：多花 2.5 GB 内存换 75 ms', headRight: '张×× · 2026.11.04 · 8/10',
      blockLabel: '代价与收益', cols: KIT.zh.table.cols, widths: KIT.zh.table.widths,
      rows: KIT.zh.table.rows, tableNote: KIT.zh.table.note, page: 8},
    {type: 'summary', title: '四、小结：三条结论与一个问题', headRight: '张×× · 2026.11.04 · 9/10',
      blocks: KIT.zh.summaryBlocks, page: 9},
    {type: 'thanks', contact: KIT.zh.thanks, page: 10},
  ],
  bandgrid: [
    {type: 'cover', kicker: '论文分享 · 系统组周会', date: '2026.11.04', title: KIT.zh.title,
      subtitle: KIT.zh.subtitle, venue: 'OSDI 2026 · 会议论文（12 页，含附录）',
      authors: 'L. Chen（一作）· M. Ito · R. Gupta　UC Berkeley / MSR',
      takeaway: '批次内部的簇号可预测，预取能把 p95 延迟压到 53 ms。',
      foot: '汇报人：张××　·　2026 年 11 月 4 日', page: 1},
    {type: 'outline', title: '汇报提纲：一篇论文的四次转折', headRight: '张×× · 4/10',
      items: [
        {label: 'PART 1', text: '背景与动机：向量检索为什么会被 I/O 卡住'},
        {label: 'PART 2', text: '设计与实现：把预取塞进查询批次内部'},
        {label: 'PART 3', text: '实验结果：延迟、吞吐与内存的三方权衡'},
        {label: 'PART 4', text: '局限与讨论：什么负载下这套方法会失效'},
      ], hint: '每一节结束回到这张提纲，标出当前进度。', page: 2},
    {type: 'part', index: 1, title: '背景与动机', note: '（本节回答：瓶颈到底在算力还是在 I/O）', page: 3},
    {type: 'bands', title: '一、瓶颈不在算力，而在 40 次随机跳转', headRight: '张×× · 4/10',
      rows: [
        {label: '扫描方式', text: '倒排索引把向量切成 4096 个簇，查询只扫最近 40 个；簇内连续读，簇间随机读。'},
        {label: '代价', text: '40 次跳转里，61% 的请求时间花在等待 4 KB 随机读返回。'},
        {label: '关键观察', text: '下一个要读的簇号，在打分开始之前就已经确定——它来自同一批查询。', accent: true},
      ], aside: '来源：论文 §2.1 与 Fig. 2；数字为 SIFT1B、nprobe = 40 下的实测。', page: 4},
    {type: 'part', index: 2, title: '设计与实现', note: '（本节回答：怎么让 I/O 和计算同时发生）', page: 5},
    {type: 'method', title: '二、方法：预取、剪枝、回填三步重叠', headRight: '张×× · 6/10',
      stages: KIT.zh.method.stages, hot: 0,
      takeaway: '关键不是把 I/O 做快，而是让 I/O 和计算落在同一段时间里。',
      aside: '预取窗口 = 下一批簇号出现的时间差；窗口覆盖 78% 的随机读。', page: 6},
    {type: 'result', title: '三、结果：同等召回率下 p95 降到 53 ms', headRight: '张×× · 7/10',
      big: KIT.zh.result.big, bigLabel: KIT.zh.result.bigLabel, bigNote: KIT.zh.result.bigNote,
      data: KIT_RESULT_EN.data, caption: KIT.zh.result.caption, page: 7},
    {type: 'table', title: '三、结果：多花 2.5 GB 内存换 75 ms', headRight: '张×× · 8/10',
      cols: KIT.zh.table.cols, widths: KIT.zh.table.widths, rows: KIT.zh.table.rows,
      tableNote: KIT.zh.table.note, page: 8},
    {type: 'summary', title: '四、小结：一条结论，三个待验证的问题', headRight: '张×× · 9/10',
      conclusion: '随机读是向量检索的真瓶颈；把预取塞进批次内部，能在同等召回率下把 p95 压到 53 ms。',
      questions: [
        '单批次查询数少于 8 时预取窗口不足，收益降到 1.2×——小批量场景怎么办？',
        '同样的思路能否迁移到图索引（DiskANN）的邻居扩展？',
        '依赖 SSD 队列深度 ≥ 4，远端存储与机械盘未验证。',
      ], page: 9},
    {type: 'thanks', contact: KIT.zh.thanks, page: 10},
  ],
  folio: kitNarrowSample('folio'),
  nocturne: kitNarrowSample('nocturne'),
  mosaic: kitNarrowSample('mosaic'),
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
    slides.forEach((rawSpec, i) => {
      const spec = {...rawSpec, notes: sampleNote(rawSpec)};
      drawSlide(new PptxCanvas(deck.addSlide(), t), t, spec);
      const svg = new SvgCanvas(t);
      drawSlide(svg, t, spec);
      fs.writeFileSync(path.join(svgDir, `${String(i + 1).padStart(2, '0')}-${spec.type}.svg`), svg.toSVG());
    });
    const file = path.join(outDir, `${name}-sample.pptx`);
    await writeDeck(deck, file);
    console.log(`wrote ${file} (${slides.length} slides) + svg previews in ${svgDir}`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = {SAMPLES};
