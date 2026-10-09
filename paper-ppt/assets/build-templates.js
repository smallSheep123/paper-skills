// Build a fill-in base template (template.pptx) for every style preset.
//   node assets/build-templates.js [outRoot]      (default: styles/)
// Writes <outRoot>/<style>/template.pptx and <outRoot>/<style>/template-preview/NN-<type>.svg
//
// Each template page keeps the preset's real layout but replaces sample text with
// bracketed placeholders saying WHAT belongs there, and the speaker notes carry the
// page's content contract from references/page-content-guide.md.
// Templates are a starting point for humans or AI; paper-ppt still redesigns per paper.

const fs = require('node:fs');
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const {loadTokens, PptxCanvas, SvgCanvas, drawSlide, writeDeck} = require('./style-presets');
const {SAMPLES} = require('./build-style-samples');

const LANG = {domestic: 'zh', 'defense-cn': 'zh', 'jp-gothic': 'ja'};

// Placeholder wording per field. {n} = 1-based index inside an array.
const PH = {
  zh: {
    title: '【结论式标题 + [[关键词]]】', coverTitle: '【论文 / 报告标题】', sectionTitle: '【章节名】', paperTitle: '【论文原标题】', titleZh: '【中文意译 / 副标题】', titleEn: '【英文题目】',
    subtitle: '【副标题：这一部分要回答的问题】', paperMeta: '【会议/期刊 年份 · 作者 · 单位】', presenter: '【汇报人】', group: '【课题组】组会', date: '【日期】',
    authors: '【作者 · 单位】', venue: '【会议/期刊 年份】', org: '【学校 · 学院】', kind: '【学位论文答辩 / 开题 / 中期】',
    item: '【第 {n} 项，≤10 字】', point: '【要点 {n}，含 [[关键词]]】', step: '模块 {n}', block: '模块 {n}', chapter: '第{n}章',
    goal: '【目标：≤25 字】', challenge: '【难点：≤25 字】', solution: '【方法一句话：≤25 字】', caption: '图 X  【图注：说明看哪里】',
    tag: '[出处]', source: '图源：【论文 Fig./Table 编号】', number: '+X%', numberLabel: '【比较条件：相对谁、什么设置】', condition: '【实验条件：数据、种子、硬件】',
    conclusion: '【结论：≤30 字，含 [[关键数字]]】', discussion: '【讨论问题 {n}】', conclusionItem: '【结论 {n}】', lead: '【导语：这页做了什么，≤40 字】',
    label: '结论', head: '【要点 {n}】', body: '【一句话解释】', pub: '[对应成果]', footer: '【课题组】组会 · 【汇报人】', takeaway: '【一句话 takeaway】',
    number_section: '0X', prefix: 'X、', explain: '【这一页新增了什么】', annotation: '【看图要点】', statement: '【一句陈述 + [[关键数字]]】', claim: '【结论副标题】',
    quote: '【一句引语或设计目标】', by: '【出处】', kicker: '【PART X】', callout: '【代码关键行的含义】', paper: '【论文标题 [作者+, 会议\'年]】', badge: '00:00', optional: '参考',
    ratio: 'X×', ratioLabel: '【相对基线的提升】', better: '越低越好 ↓', link: '【开源链接】', note: '【符号说明】', ref: '[{n}] 【作者. 标题. 会议 年份.】',
    infoValue: '【填写】',
  },
  en: {
    title: '<Claim of this slide + [[keyword]]>', coverTitle: '<Paper / talk title>', sectionTitle: '<Section name>', subtitle: '<Question this part answers>', authors: '<Authors · Affiliation>', venue: '<Venue Year>',
    presenter: '<Presented by name>', item: '<Item {n}, ≤5 words>', point: '<Point {n}: ≤15 words>', step: 'Step {n}', block: 'Block {n}',
    caption: '<Caption: what to look at>', tag: '[Source]', source: 'Figure: <paper Fig./Table no.>', number: '+X%', numberLabel: '<compared to what, under which setting>',
    condition: '<Conditions: data, seeds, hardware>', head: '<Point {n}>', body: '<one-line explanation>', takeaway: '<One-line takeaway>', footer: '<Talk title · Speaker>',
    explain: '<What is new on this slide>', annotation: '<What to notice in the figure>', statement: '<One statement with the [[key number]]>', claim: '<Claim subtitle>',
    quote: '<A quote or design goal>', by: '<Attribution>', kicker: 'PART X', callout: '<What the highlighted line does>', ratio: 'X×', ratioLabel: '<improvement over baseline>',
    better: 'lower is better ↓', link: '<code / project link>', note: '<Symbol legend note>', ref: '[{n}] <Author. Title. Venue Year.>', conclusion: '<Conclusion with [[key number]]>',
    lead: '<Lead: what this slide does>', label: 'Takeaway', number_section: '0X', paper: '<Paper title [Author+, Venue\'YY]>', badge: '00:00', optional: 'Optional', pub: '[Publication]',
    infoValue: '<fill in>', titleEn: '<English title>', org: '<University · School>', kind: '<Defense / Proposal>', chapter: 'Ch. {n}', discussion: '<Discussion question {n}>',
    conclusionItem: '<Conclusion {n}>', goal: '<Goal>', challenge: '<Challenge>', solution: '<Approach in one line>', paperTitle: '<Paper title>', titleZh: '<Subtitle>',
    paperMeta: '<Venue Year · Authors · Affiliation>', group: '<Group> meeting', date: '<Date>', prefix: '', 
  },
  ja: {
    title: '【結論タイトル + [[キーワード]]】', coverTitle: '【発表タイトル】', sectionTitle: '【セクション名】', subtitle: '【このパートの問い】', authors: '【著者 · 所属】', venue: '【会議 年月】', item: '【項目 {n}】',
    point: '【要点 {n}：一文で】', caption: '【図の見どころ】', tag: '[出典]', source: '図：【論文の図表番号】', conclusion: '結論：【一文で】', paper: '【論文タイトル [著者+, 会議\'年]】',
    badge: '00:00', optional: '参考', ref: '[{n}] 【著者. タイトル. 会議 年.】', head: '【要点 {n}】', body: '【一行説明】', step: 'ステップ {n}', block: 'ブロック {n}',
  },
};
for (const k of Object.keys(PH.en)) { if (!(k in PH.ja)) PH.ja[k] = PH.en[k]; if (!(k in PH.zh)) PH.zh[k] = PH.en[k]; }

const KEEP = new Set(['type', 'figure', 'kind_block']);
const ARRAY_KEY = {items: 'item', points: 'point', steps: 'step', blocks: 'block', chapters: 'chapter', tracker: null, conclusions: 'conclusionItem', discussion: 'discussion', lines: null, sub: 'point', legend: null, labels: null};

function ph(lang, key, n) {
  const s = PH[lang][key] ?? PH[lang].point;
  return s.replace('{n}', String(n));
}

function fillString(lang, key, value, n, spec) {
  if (KEEP.has(key)) return value;
  if (spec.type === 'references' && key === 'item') return ph(lang, 'ref', n);
  if (key === 'title' && spec.type === 'cover') return ph(lang, 'coverTitle');
  if (key === 'title' && ['section', 'chapter'].includes(spec.type)) return ph(lang, 'sectionTitle');
  if (key === 'number' && /^\d+$/.test(value)) return value;
  if (key === 'number' || key === 'kind') return spec.type === 'cover' && key === 'kind' ? ph(lang, 'kind') : (key === 'number' && ['section', 'chapter'].includes(spec.type) ? (lang === 'zh' && spec.type === 'chapter' ? '第X章' : '0X') : ph(lang, key));
  return ph(lang, key, n);
}

function fill(lang, spec) {
  const out = {};
  for (const [k, v] of Object.entries(spec)) {
    if (KEEP.has(k) || typeof v === 'number' || typeof v === 'boolean') { out[k] = v; continue; }
    if (typeof v === 'string') { out[k] = fillString(lang, k, v, 1, spec); continue; }
    if (Array.isArray(v)) {
      const elemKey = ARRAY_KEY[k];
      if (elemKey === null) { out[k] = k === 'tracker' ? (lang === 'en' ? ['Motivation', 'Design', 'Evaluation'] : v) : v; continue; }
      if (k === 'info') { out[k] = v.map(([a]) => [a, PH[lang].infoValue]); continue; }
      out[k] = v.map((e, i) => {
        if (typeof e === 'string') return fillString(lang, elemKey || 'point', e, i + 1, spec);
        if (e && typeof e === 'object') {
          const o = {};
          for (const [ek, ev] of Object.entries(e)) {
            if (ek === 'kind' || typeof ev !== 'string' && !Array.isArray(ev)) o[ek] = ev;
            else if (Array.isArray(ev)) o[ek] = ev.map((x, j) => ph(lang, 'point', j + 1));
            else o[ek] = ek === 'text' ? ph(lang, spec.type === 'blocks' ? 'body' : 'point', i + 1) : ph(lang, ek, i + 1);
          }
          return o;
        }
        return e;
      });
      continue;
    }
    out[k] = v;
  }
  return out;
}

// Content contract per archetype, short form of references/page-content-guide.md §2.
const CONTRACT = {
  cover: '封面：论文原标题(+中文意译)、会议/年份、作者单位、汇报人与日期。读别人论文时汇报人与作者分开写。不要放摘要。',
  outline: '提纲：≤5 项，每项 ≤10 字；后续章节页回显并高亮当前项。10 页以内可省。', toc: '提纲：与论文章节一一对应，后续每章前回显并高亮当前章。',
  questions: '问题式提纲：用 2–4 个问题组织全场，每部分开头高亮当前问题。',
  section: '章节页：章节号 + 这一部分要回答的问题。停留 10–20 秒。', chapter: '章节页：章号 + 章名 + 本章要解决的问题；底部导航高亮当前章。',
  paperGlance: '一页看懂：目标 / 难点 / 方法一句话 / 主结果一个数，配论文总览图。单独拿出去也能看懂论文做了什么。',
  method: '方法细节：它解决什么问题 → 怎么做 → 为什么有效。图占 ≥50%，≤4 条要点，公式只留 1 个核心式。',
  buildSteps: '方法总览/逐步构建：同一张主图在后续页复用，只高亮当前模块；说明这一页新增了什么。',
  figureNotes: '图 + 要点：标题写结论；要点只解释图里看不出的东西；注明图源。', figure: '图页：标题写结论，副标题写一句解释；图注说明看哪里。',
  equation: '公式页：一个核心式，逐项标注符号含义；推导放备份页。', symbols: '符号配色：每个对象一个颜色，后续文字和图里保持一致。',
  blocks: '定理/问题/例子色块：先问题、再结论（定理）、再例子；证明放备份页。',
  result: '主结果：标题 = 结论 + 关键数字；标出基线、方向（↑/↓）、比较条件与 Table/Fig 出处。一页只证明一件事。',
  resultRatio: '结果比值：一个大数字（如 9.6×）+ 比较对象 + 越高/越低越好 + 实验条件。', banner: '结论横幅：图 + 底部一句 takeaway。',
  insights: 'Insight 卡：动机→设计逐页累积，当前卡高亮；顶部/底部追踪条显示所处阶段。', code: '代码页：≤8 行，高亮关键一行，旁边写这行的意义。',
  statement: '陈述页：一个反直觉观察或结论 + 一个支撑数字。', focus: '聚焦页：主图中当前讲的模块高亮、其余变暗。', explain: '解释页：一张图 + 一句看图要点。',
  hero: '主视觉页：一图一句话，适合动机或概念引入。', chips: '要点卡片：3–4 个并列要点，每个标题 + 一行解释。', quote: '引语页：一句话的设计目标或观点，注明出处。',
  figureConclusion: '图 + 结论框：导语说这页做了什么，结论框写一句含关键数字的结论。', contributions: '创新点/成果：3–4 条，每条对应一章与发表成果。',
  read: '读论文页：顶部论文出处，要点 ≤3 条，底部黑色结论横幅。', references: '参考文献：只列正文引用过的，格式统一。',
  summary: '总结 + 讨论：3 条结论回扣贡献页 + 2–3 个具体讨论问题。', closing: '结尾：takeaway / 局限 / 开放问题，不要只写“谢谢”。',
  thanks: '致谢 / Q&A：可与总结或讨论页合并。',
};

async function main() {
  const outRoot = path.resolve(process.argv[2] || path.join(__dirname, '..', 'styles'));
  for (const [name, slides] of Object.entries(SAMPLES)) {
    const lang = LANG[name] || 'en';
    const t = loadTokens(name);
    const deck = new pptxgen();
    deck.layout = t.slide.layout;
    deck.title = `${t.label} template`;
    const dir = path.join(outRoot, name);
    const prev = path.join(dir, 'template-preview');
    fs.mkdirSync(prev, {recursive: true});
    slides.forEach((spec, i) => {
      const filled = fill(lang, spec);
      const slide = deck.addSlide();
      drawSlide(new PptxCanvas(slide, t), t, filled);
      slide.addNotes(`[${spec.type}] ${CONTRACT[spec.type] || ''}\n详见 references/page-content-guide.md`);
      const svg = new SvgCanvas(t);
      drawSlide(svg, t, filled);
      fs.writeFileSync(path.join(prev, `${String(i + 1).padStart(2, '0')}-${spec.type}.svg`), svg.toSVG());
    });
    const file = path.join(dir, 'template.pptx');
    await writeDeck(deck, file);
    console.log(`wrote ${file} (${slides.length} slides)`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = {fill, CONTRACT};
