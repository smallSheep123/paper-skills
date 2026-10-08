// Every string and number here is taken from the paper (Zhang et al., ICLR 2025) or computed from it.
const path = require('node:path');
const C = (n) => path.join(__dirname, 'crops', n + '.png');

const SRC = {
  f4: 'Figure 4 · Zhang et al., ICLR 2025',
  t3: '据 Table 3 重绘 · 5 个 gpt-4 agent · Zhang et al., ICLR 2025',
  f6: '据 Figure 6 重绘 · MMLU，提示攻击 · Zhang et al., ICLR 2025',
  multi: 'Table 1 / 3、Figure 5 / 6、附录 H.1 · Zhang et al., ICLR 2025',
  eq: '式 (7)(8)(12) · Zhang et al., ICLR 2025',
};
const PAPER = 'Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems';
const VENUE = 'Zhang et al. · ICLR 2025';

const A = {
  title: '剪掉 2 条对话内消息，总结者的答案从错误的 8 变成正确的 12',
  short: '剪掉两条消息，答案反而对了',
  kicker: '空间剪枝 · 对话内',
  points: [
    '对话内（空间）通信：同一轮里 agent 之间传递的消息',
    '每条边配一个可学习分数（掩码 S^{S}），与系统效用一起优化',
    '训练 K′ 轮后按 TopK 一次性剪掉 p% 的边（式 12），之后拓扑固定',
  ],
  example: '示例中 6 条边剪掉 2 条；Thinker 2 不再沿用“n 不能超过 24”这一前提',
  left: C('f4_sp_left'), right: C('f4_sp_right'), full: C('f4_full'),
  // annotation anchors, fractions of the crop
  cut1: [0.88, 0.22], cut2: [0.74, 0.69], strike: [0.80, 0.43], check: [0.92, 0.89], cross: [0.89, 0.91],
  c1: '① 剪掉 Thinker 1 → Thinker 2', c2: '② 剪掉 Thinker 1 → Summarizer',
  c3: '不再沿用“n 不能超过 24”', cL: '原拓扑：答 8（错）', cR: '剪枝后：答 12（对）',
  // redrawn graph (from Figure 4): nodes and edges of the spatial topology
  nodes: {T1: 'Thinker 1', T2: 'Thinker 2', T3: 'Thinker 3', S: 'Summarizer'},
  edges: [['T1', 'T2', 1], ['T1', 'T3', 0], ['T1', 'S', 2], ['T2', 'T3', 0], ['T2', 'S', 0], ['T3', 'S', 0]], // n>0 = pruned (callout id)
};

const B = {
  title: '上一轮 4 条发言只带 2 条进下一轮，图 4 示例 token 从 7,295 降到 3,425',
  short: '7,295 → 3,425',
  kicker: '时间剪枝 · 对话间',
  points: [
    '对话间（时间）通信：上一轮的发言是否写进下一轮的提示词',
    '同样由可学习掩码 S^{T} 打分，与空间剪枝一起一次性完成',
    '对话间开销降得最多：5,036 → 1,944（−61.4%）',
  ],
  temporal: C('f4_temporal'), tokens: C('f4_tokens'),
  pruned: [[0.58, 0.38], [0.80, 0.38]], kept: [[0.68, 0.38], [0.92, 0.36]],
  ledger: [
    {k: '对话内', a: '2,259', b: '1,481', d: '−34.4%', fa: 2259, fb: 1481},
    {k: '对话间', a: '5,036', b: '1,944', d: '−61.4%', fa: 5036, fb: 1944},
    {k: '合计', a: '7,295', b: '3,425', d: '−53.0%', fa: 7295, fb: 3425},
  ],
  ledgerNote: '按图 4 底部算式：对话内 378×3+432×2+261 → 378+402×2+299；对话间 (378+432+261+188)×4 → (299+187)×4',
  history: {before: ['Answer 1', 'Answer 2', 'Answer 3', 'Conclusion'], keep: [false, false, true, true]},
  eq7: C('eq7'), eq8: C('eq8'), eq12: C('eq12'), tL: C('f4_temporal_L'), tR: C('f4_temporal_R'),
};

const COST = {
  title: '接入 GPTSwarm 后，GSM8K 的 API 成本从 $234.76 降到 $57.17，精度还高了 0.84',
  short: '$234.76 → $57.17',
  rows: [
    {k: 'GSM8K · GPTSwarm', a: 234.76, b: 57.17, pa: '89.74', pb: '90.58', dp: '+0.84'},
    {k: 'HumanEval · GPTSwarm', a: 57.49, b: 29.80, pa: '88.49', pb: '88.96', dp: '+0.47'},
    {k: 'MMLU · GPTSwarm', a: 47.60, b: 23.05, pa: '83.98', pb: '83.05', dp: '−0.93'},
    {k: 'GSM8K · AutoGen', a: 73.21, b: 59.60, pa: '90.06', pb: '92.85', dp: '+2.79'},
    {k: 'HumanEval · AutoGen', a: 8.828, b: 7.342, pa: '85.41', pb: '86.65', dp: '+1.24'},
    {k: 'MMLU · AutoGen', a: 7.537, b: 6.093, pa: '82.13', pb: '82.78', dp: '+0.65'},
  ],
  points: [
    '6 组实验中 5 组精度上升，唯一下降的是 MMLU · GPTSwarm（−0.93）',
    'prompt token 降 28.1%–72.8%；GSM8K · GPTSwarm 一组省下 $177.58',
    '数据集越大越省：GSM8K 约 8.5K 条，单次评测成本最高',
  ],
};

const ATK = {
  title: '受到提示攻击时，接入 AgentPrune 的系统几乎不掉点',
  short: '−5.9 → −0.2',
  rows: [
    {k: '完全图', a: 83.1, b: 78.4, ours: false}, {k: 'AgentPrune-C', a: 84.7, b: 83.9, ours: true},
    {k: 'GPTSwarm', a: 84.0, b: 82.6, ours: false}, {k: 'GPTSwarm + AP', a: 83.0, b: 83.2, ours: true},
    {k: 'AutoGen', a: 82.1, b: 76.2, ours: false}, {k: 'AutoGen + AP', a: 82.7, b: 82.5, ours: true},
  ],
  points: [
    'AutoGen 受攻击掉 5.9 分，接入后只掉 0.2（82.7 → 82.5）',
    '完全图掉 4.7 分；剪枝后的 AgentPrune-C 只掉 0.8',
    '附录 I.4：被剪的多是误导 / 恶意（图 38）或冗余消息（图 39）',
  ],
};

const BENTO = [
  {big: '89.72', unit: 'vs 87.02', label: '6 个基准平均精度，最强基线 PHP 为 87.02', src: 'Table 1'},
  {big: '$5.6', unit: 'vs $43.56', label: 'MMLU 上超过 GPTSwarm 精度所需成本，GPTSwarm 要 $43.56', src: '附录 H.1'},
  {big: '28.1–72.8%', unit: '', label: '接入 AutoGen / GPTSwarm 后 prompt token 降幅', src: 'Table 3'},
  {big: '< 40%', unit: '', label: 'HumanEval、GSM8K 上 token 不到 DyLAN 的 40%', src: '§4.2'},
  {big: '$177.58', unit: '', label: 'GSM8K + GPTSwarm 一组省下的 API 成本', src: '§4.3'},
  {big: '−0.2', unit: 'vs −5.9', label: '受攻击时 AutoGen 接入后只掉 0.2 分', src: 'Figure 6'},
];

module.exports = {SRC, PAPER, VENUE, A, B, COST, ATK, BENTO};
