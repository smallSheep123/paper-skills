// 9 original presets, v3: each style has its own composition per page type
// (example / spatial / temporal / cost), not one skeleton in different colours.
const {W, H} = require('./canvas');
const K = require('./kit');
const {SRC, PAPER, VENUE, A, B, COST, EX} = require('./content');

const SANS = 'Noto Sans SC', SERIF = 'Noto Serif SC', INTER = 'Inter', FIRA = 'Fira Sans', MONO = 'JetBrains Mono', PAG = 'TeX Gyre Pagella';
const FULL = (x, y) => [(x - 188) / 627, (y - 140) / 472];
const F = {cut1: FULL(775, 253), cut2: FULL(735, 397), check: FULL(787, 458), cross: FULL(485, 465), strike: FULL(752, 318),
  right: [FULL(522, 186)[0], FULL(522, 186)[1], FULL(810, 492)[0], FULL(810, 492)[1]], t2L: [FULL(370, 200)[0], FULL(370, 200)[1], FULL(516, 330)[0], FULL(516, 330)[1]]};
const ratio = (r) => (r.a / r.b).toFixed(1) + '×';
const short = (k) => k.replace(' · ', ' ');

// ---------------------------------------------------------------- domestic: duel of quotes / crops + numbered list / strip + ledger / normalised bars
const domestic = (() => {
  const S = {blue: '1F4E9A', light: 'EAF1FB', text: '1F2329', muted: '5F6670', red: 'C8102E', rule: 'C9D3E3'};
  const frame = (c, pre, title, n) => {
    c.bg('FFFFFF');
    c.rect({x: 0, y: 0, w: W, h: 0.12, fill: S.blue});
    c.rect({x: 0.5, y: 0.42, w: 0.09, h: 0.62, fill: S.blue});
    c.text(pre, {x: 0.72, y: 0.36, w: 6, h: 0.3, size: 13, color: S.blue, font: SANS, bold: true});
    c.text(title, {x: 0.72, y: 0.62, w: 12, h: 0.5, size: 23, color: S.text, font: SANS, bold: true, acc: S.red});
    c.line({x1: 0.5, y1: 1.22, x2: W - 0.5, y2: 1.22, color: S.rule, lw: 1});
    c.text('AgentPrune 组会汇报', {x: 0.5, y: 7.1, w: 4, h: 0.25, size: 10, color: S.muted, font: SANS});
    c.text(String(n), {x: W - 1.5, y: 7.1, w: 1, h: 0.25, size: 10, color: S.muted, font: INTER, align: 'right'});
  };
  const head = (c, x, y, w, t) => { c.rect({x, y, w, h: 0.42, fill: S.blue}); c.text(t, {x: x + 0.15, y, w: w - 0.3, h: 0.42, size: 14, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'}); };
  const pts = (c, x, y, w, items, h) => {
    head(c, x, y, w, h);
    let yy = y + 0.6;
    items.forEach((t, i) => {
      c.rect({x, y: yy + 0.04, w: 0.28, h: 0.28, fill: S.light, line: S.blue, lw: 1});
      c.text(String(i + 1), {x, y: yy + 0.04, w: 0.28, h: 0.28, size: 11, color: S.blue, font: INTER, bold: true, align: 'center', valign: 'middle'});
      c.text(t, {x: x + 0.4, y: yy, w: w - 0.4, h: 1.0, size: 14, color: S.text, font: SANS, lh: 1.3});
      yy += 1.12;
    });
  };
  const concl = (c, txt, pre = '结论：') => {
    c.rect({x: 0.5, y: 6.38, w: W - 1, h: 0.55, fill: S.light});
    c.rect({x: 0.5, y: 6.38, w: 0.08, h: 0.55, fill: S.red});
    c.text(pre + txt, {x: 0.75, y: 6.38, w: W - 1.4, h: 0.55, size: pre === '注：' ? 13 : 15, color: S.text, font: SANS, valign: 'middle', acc: S.red, accBold: true});
  };
  const q = {font: SANS, enFont: INTER, text: S.text, muted: S.muted, size: 17, zhSize: 13};
  return {name: 'domestic', label: '国内组会', pages: [
    (c) => {
      frame(c, '二、例题 · 读懂图 4', '图 4 例题：Thinker 1 的“n < 24”传给了 Thinker 2，总结者最终答 [[8]]', 7);
      head(c, 0.5, 1.42, 4.0, '题目');
      c.text(EX.q, {x: 0.6, y: 1.95, w: 3.8, h: 0.75, size: 17, color: S.text, font: SANS, bold: true, lh: 1.3});
      c.text(EX.qEn, {x: 0.6, y: 2.7, w: 3.8, h: 0.5, size: 10.5, color: S.muted, font: INTER, lh: 1.2});
      head(c, 0.5, 3.35, 4.0, '角色');
      EX.roles.forEach((r, i) => c.text(['**' + r.k + '**：' + r.d], {x: 0.6, y: 3.9 + i * 0.75, w: 3.8, h: 0.7, size: 13.5, color: S.text, font: SANS, lh: 1.3}));
      c.text('图中限制的源头：Thinker 1 原文', {x: 0.6, y: 5.45, w: 3.8, h: 0.3, size: 11.5, color: S.blue, font: SANS, bold: true});
      c.text('“…because n should be smaller than 24.”', {x: 0.6, y: 5.75, w: 3.8, h: 0.4, size: 13, color: S.red, font: INTER, bold: true});
      [[4.8, '原拓扑 · Thinker 2', EX.t2b, false], [8.85, '剪枝后 · Thinker 2', EX.t2a, true]].forEach(([x, h, t, cut]) => {
        c.rect({x, y: 1.42, w: 3.98, h: 4.75, fill: 'FFFFFF', line: S.rule, lw: 1});
        c.rect({x, y: 1.42, w: 3.98, h: 0.42, fill: cut ? S.red : S.light});
        c.text(h, {x: x + 0.15, y: 1.42, w: 3.7, h: 0.42, size: 14, color: cut ? 'FFFFFF' : S.blue, font: SANS, bold: true, valign: 'middle'});
        K.quote(c, {x: x + 0.22, y: 2.05, w: 3.55, h: 3}, t, {...q, who: false, strikeColor: cut ? '9AA0A6' : S.red, strike: cut ? S.red : null, answer: S.red, accent: cut ? S.red : S.blue});
      });
      concl(c, EX.caveat, '注：');
      c.notes('来源：' + EX.src + '。' + EX.math.join('；'));
    },
    (c) => {
      frame(c, '三、方法 · 3.1 空间剪枝', '剪掉 [[2 条]]对话内消息，总结者的答案由 8 变为 12', 8);
      const gl = K.figure(c, A.left, {x: 0.5, y: 1.42, w: 3.95, h: 4.3}, 'top', {line: S.rule, lw: 1});
      const gr = K.figure(c, A.right, {x: 4.6, y: 1.42, w: 3.95, h: 4.3}, 'top', {line: S.rule, lw: 1});
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.2, S.red, 2.25); K.badge(c, {x: p.x - 0.36, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.15}); });
      c.text('图 4（局部）  左：原拓扑，答 8；右：剪枝后，答 12；①② 为被剪掉的两条边', {x: 0.5, y: 5.82, w: 8.0, h: 0.3, size: 11, color: S.muted, font: SANS});
      pts(c, 8.85, 1.42, 4.0, [A.points[1], A.points[2], '① T1→T2、② T1→总结者被剪掉，Thinker 2 不再沿用“n 不超过 24”'], '要点');
      concl(c, '附录 I.4：被剪掉的多是[[误导 / 恶意]]或[[冗余]]的消息');
      c.notes('来源：' + SRC.f4);
    },
    (c) => {
      frame(c, '三、方法 · 3.2 时间剪枝', '上一轮 4 条发言只带 2 条进下一轮，图 4 示例 token 从 [[7,295]] 降到 [[3,425]]', 9);
      const g = K.figure(c, B.temporal, {x: 0.5, y: 1.45, w: 12.33, h: 1.78}, 'top', {line: S.rule, lw: 1});
      const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 12, ring: 0.2};
      K.callout(c, K.at(g, B.pruned[0]), {x: 5.6, y: 3.45, w: 1.7, h: 0.36}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 9.05, y: 3.45, w: 1.7, h: 0.36}, '剪掉', cs);
      K.callout(c, K.at(g, B.kept[1]), {x: 11.0, y: 3.45, w: 1.83, h: 0.36}, '保留', {...cs, stroke: S.blue, line: S.blue, color: S.blue});
      c.text('图 4（局部）  左：原拓扑；右：AgentPrune 后的“发言历史”', {x: 0.5, y: 3.88, w: 6, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      K.ledger(c, {x: 0.6, y: 4.25, w: 6.4, h: 1.95}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.red, rule: S.rule});
      pts(c, 7.6, 4.25, 5.23, B.points.slice(0, 2), '要点');
      concl(c, '对话间（跨轮）开销降得最多：[[5,036 → 1,944]]（−61.4%）');
      c.notes('来源：' + SRC.f4 + '；' + B.ledgerNote);
    },
    (c) => {
      frame(c, '四、实验 · 4.3 即插即用', '接入 GPTSwarm 后，GSM8K 成本 $234.76 → [[$57.17]]，准确率还高了 0.84', 18);
      c.rect({x: 0.75, y: 1.5, w: 0.25, h: 0.16, fill: 'B8C4D6'}); c.text('接入前', {x: 1.05, y: 1.43, w: 1, h: 0.3, size: 11, color: S.muted, font: SANS});
      c.rect({x: 1.85, y: 1.5, w: 0.25, h: 0.16, fill: S.red}); c.text('接入 AgentPrune 后', {x: 2.15, y: 1.43, w: 2, h: 0.3, size: 11, color: S.muted, font: SANS});
      K.hbars(c, {x: 0.5, y: 1.85, w: 7.9, h: 4.1}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'B8C4D6', after: S.red, fmt: K.money, labelW: 2.35, noNote: true});
      c.text('图：据表 3 重绘，API 成本（美元），5 个 gpt-4 agent；条长以接入前为 100%', {x: 0.5, y: 5.95, w: 7.5, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      pts(c, 8.85, 1.42, 4.0, COST.points, '要点');
      concl(c, '数据集越大省得越多，而效果基本不掉');
      c.notes('来源：' + SRC.t3 + '；$177.58、28.1%–72.8% 见 §4.3 与摘要');
    },
  ]};
})();

// ---------------------------------------------------------------- international: zoomed crops / one big crop + inset / stacked token bar / dumbbell
const international = (() => {
  const S = {navy: '14213D', acc: 'E85D04', text: '1B1B1B', muted: '6B7280', faint: '9CA3AF', rule: 'E5E7EB', tint: 'FFF4EC', green: '16A34A'};
  const frame = (c, title, tag) => {
    c.bg('FFFFFF');
    c.text(title, {x: 0.6, y: 0.4, w: 10.6, h: 1.0, size: 26, color: S.navy, font: SANS, bold: true, acc: S.acc, lh: 1.15, valign: 'middle'});
    c.text(tag, {x: 11.2, y: 0.5, w: 1.55, h: 0.3, size: 11, color: S.faint, font: INTER, align: 'right'});
  };
  const src = (c, t) => c.text(t, {x: 0.6, y: 7.05, w: 9, h: 0.25, size: 10, color: S.faint, font: INTER});
  const cs = {stroke: S.acc, fill: S.acc, line: S.acc, color: 'FFFFFF', font: SANS, size: 12, ring: 0.2, r: 0.06};
  return {name: 'international', label: '海外组会', pages: [
    (c) => {
      frame(c, '同一位 Thinker 2：收到 Thinker 1 的限制答 8，收不到答 [[12]]', '[Fig. 4]');
      c.text('题目  ' + EX.q, {x: 0.6, y: 1.5, w: 12.1, h: 0.4, size: 16, color: S.text, font: SANS, bold: true});
      c.text(EX.qEn + '   ·   3 个 Thinker 各自作答，Summarizer 汇总', {x: 0.6, y: 1.9, w: 12.1, h: 0.3, size: 11, color: S.muted, font: INTER});
      [[2.45, EX.t2Before, EX.t2b, false], [4.6, EX.t2After, EX.t2a, true]].forEach(([y, img, t, cut]) => {
        const g = K.figure(c, img, {x: 0.6, y, w: 2.4, h: 2.0}, 'left', {line: S.rule, lw: 1});
        c.line({x1: g.x + g.w + 0.1, y1: y + 1.0, x2: 3.55, y2: y + 1.0, color: cut ? S.acc : S.faint, lw: 2, arrow: true});
        c.text(t.who, {x: 3.75, y: y + 0.02, w: 5, h: 0.3, size: 12, color: cut ? S.acc : S.muted, font: SANS, bold: true});
        K.quote(c, {x: 3.75, y: y + 0.38, w: 6.0, h: 1.6}, t, {font: SANS, enFont: INTER, text: S.text, muted: S.muted, who: false, size: 17, zh: false, strikeColor: cut ? S.faint : S.acc, strike: cut ? S.acc : null, answer: cut ? S.acc : S.text});
      });
      c.rect({x: 10.1, y: 2.45, w: 2.65, h: 4.15, fill: S.tint, r: 0.06});
      c.text(['据图', '被剪的 Thinker 1 → 2 带着“n < 24”', '', '剪枝后 Thinker 3 也写道：“Answer 1 set n<24, which is not reasonable.”'], {x: 10.3, y: 2.6, w: 2.3, h: 3.9, size: 13, color: S.text, font: SANS, lh: 1.35, bold: false});
      c.text('注：' + EX.caveat, {x: 0.6, y: 6.7, w: 12.1, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      src(c, EX.src);
    },
    (c) => {
      frame(c, '剪掉 2 条对话内消息，总结者的答案由 8 变为 [[12]]', '[Fig. 4]');
      const gr = K.figure(c, A.right, {x: 3.4, y: 1.55, w: 5.6, h: 5.35}, 'top');
      const gl = K.figure(c, A.left, {x: 0.6, y: 1.6, w: 2.5, h: 2.6}, 'top-left', {line: S.rule, lw: 1});
      c.text('原拓扑（答 8）', {x: 0.6, y: gl.y + gl.h + 0.08, w: 2.5, h: 0.3, size: 12, color: S.muted, font: SANS, align: 'center'});
      c.line({x1: 1.85, y1: gl.y + gl.h + 0.45, x2: 1.85, y2: 5.2, color: S.faint, lw: 1.5, arrow: true});
      c.text('AgentPrune 剪枝后（答 12）→', {x: 0.6, y: 5.35, w: 2.7, h: 0.6, size: 13, color: S.acc, font: SANS, bold: true});
      K.callout(c, K.at(gr, A.cut1), {x: 9.4, y: 1.75, w: 3.35, h: 0.4}, A.c1, cs);
      K.callout(c, K.at(gr, A.cut2), {x: 9.4, y: 3.4, w: 3.35, h: 0.4}, A.c2, cs);
      c.text(['怎么剪', '每条边一个可学习分数 S^{S}，训练 K′ 轮后按 TopK 一次性剪掉 p%'], {x: 9.4, y: 4.5, w: 3.35, h: 1.6, size: 14, color: S.text, font: SANS, lh: 1.35});
      src(c, SRC.f4);
    },
    (c) => {
      frame(c, '跨轮历史是大头：剪枝前占 69%，剪掉后总 token 降到 [[3,425]]', '[Fig. 4]');
      const g = K.figure(c, B.temporal, {x: 0.6, y: 1.6, w: 12.1, h: 1.75}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.2, y: 3.55, w: 1.6, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 8.7, y: 3.55, w: 1.6, h: 0.34}, '剪掉', cs);
      K.stack(c, {x: 0.6, y: 4.3, w: 12.1}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.acc, intra: 'C7CDD6', inter: '6B7280', intraAfter: 'FCD9C2', interAfter: S.acc, bh: 0.62, gap: 0.3, inText: (i, j) => (j === 1 ? 'FFFFFF' : S.text)});
      src(c, SRC.f4 + ' · token 由图中算式求和（对话间 5,036 / 7,295 = 69%）');
    },
    (c) => {
      frame(c, '接入后只花原来的 24%–83%，GSM8K · GPTSwarm 最省', '[Table 3]');
      c.text('API 成本：接入前 = 100%（灰点），接入 AgentPrune 后（橙点）', {x: 0.6, y: 1.55, w: 8, h: 0.3, size: 12, color: S.muted, font: SANS});
      c.text('效果变化', {x: 11.35, y: 1.55, w: 1.4, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true, align: 'right'});
      K.dumbbell(c, {x: 0.6, y: 2.0, w: 12.15, h: 4.6}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, grid: S.rule, line: 'FBD5BD', before: '9CA3AF', after: S.acc, labelW: 2.9, rightW: 1.6,
        right: (r, b) => c.text(r.dp + ' ' + r.m, {x: b.x, y: b.y, w: b.w, h: b.h, size: 13, bold: true, color: r.dp.startsWith('+') ? S.green : 'DC2626', font: INTER, align: 'right', valign: 'middle'})});
      src(c, SRC.t3 + ' · HumanEval 为 pass@1，其余为准确率');
    },
  ]};
})();

// ---------------------------------------------------------------- keynote-minimal: one idea per slide
const keynote = (() => {
  const S = {text: '111111', muted: '8A8A8A', acc: 'FF3B30'};
  return {name: 'keynote-minimal', label: '极简 Keynote', pages: [
    (c) => {
      c.bg('FFFFFF');
      c.text('图 4 的例题', {x: 0.9, y: 1.0, w: 6, h: 0.5, size: 20, color: S.muted, font: SANS});
      c.text(EX.q, {x: 0.9, y: 1.6, w: 11.5, h: 1.2, size: 44, color: S.text, font: SANS, bold: true});
      c.text('3 个 Thinker 各自作答，总结者汇总。', {x: 0.9, y: 2.95, w: 11.5, h: 0.6, size: 24, color: S.text, font: SANS});
      c.text('8', {x: 0.9, y: 3.9, w: 2.5, h: 2.0, size: 130, color: 'C7C7C7', font: INTER, bold: true});
      c.text('原拓扑', {x: 0.95, y: 5.9, w: 2.5, h: 0.4, size: 18, color: S.muted, font: SANS});
      c.text('→', {x: 3.2, y: 4.3, w: 1.5, h: 1.4, size: 80, color: S.muted, font: INTER, align: 'center'});
      c.text('12', {x: 4.8, y: 3.9, w: 4, h: 2.0, size: 130, color: S.acc, font: INTER, bold: true});
      c.text('剪掉两条消息后', {x: 4.85, y: 5.9, w: 4, h: 0.4, size: 18, color: S.acc, font: SANS, bold: true});
      c.text(EX.caveat, {x: 0.9, y: 6.7, w: 11.5, h: 0.35, size: 11, color: S.muted, font: SANS});
      c.notes(EX.src + '。' + EX.math.join('；'));
    },
    (c) => {
      c.bg('FFFFFF');
      const g = K.figure(c, A.full, {x: 0, y: 0, w: 9.97, h: 7.5}, 'left');
      K.spotlight(c, g, F.right, 'FFFFFF', 0.72);
      K.ring(c, K.at(g, F.cut1), 0.28, S.acc, 3.5);
      K.ring(c, K.at(g, F.cut2), 0.28, S.acc, 3.5);
      c.text(['剪掉两条消息，', '答案变了。'], {x: 10.2, y: 2.6, w: 3.1, h: 1.8, size: 28, color: S.text, font: SANS, bold: true, lh: 1.25});
      c.text('8 → 12', {x: 10.3, y: 4.5, w: 2.9, h: 0.6, size: 30, color: S.acc, font: INTER, bold: true});
      c.text(SRC.f4, {x: 10.3, y: 6.95, w: 2.9, h: 0.3, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg('FFFFFF');
      c.text('图 4 示例 · token', {x: 0.8, y: 0.9, w: 6, h: 0.5, size: 20, color: S.muted, font: SANS});
      c.text('7,295 → [[3,425]]', {x: 0.8, y: 1.4, w: 11.8, h: 2.0, size: 96, color: S.text, font: INTER, bold: true, acc: S.acc});
      c.text('只把上一轮 4 条发言中的 2 条带进下一轮', {x: 0.8, y: 3.45, w: 11, h: 0.5, size: 20, color: S.text, font: SANS});
      K.figure(c, B.temporal, {x: 0.8, y: 4.45, w: 11.7, h: 1.8}, 'left');
      c.text(SRC.f4, {x: 0.8, y: 6.95, w: 6, h: 0.3, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg('FFFFFF');
      c.text('GSM8K · GPTSwarm 的 API 成本', {x: 0.8, y: 1.2, w: 11, h: 0.5, size: 22, color: S.muted, font: SANS});
      c.text('$234.76', {x: 0.8, y: 1.9, w: 5.2, h: 1.6, size: 78, color: 'C7C7C7', font: INTER, bold: true});
      c.text('$57.17', {x: 7.3, y: 1.9, w: 5.4, h: 1.6, size: 78, color: S.acc, font: INTER, bold: true});
      c.text('→', {x: 5.95, y: 1.95, w: 1.3, h: 1.4, size: 64, color: S.muted, font: INTER, align: 'center'});
      c.text('准确率 89.74 → 90.58', {x: 7.35, y: 3.6, w: 5.8, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      c.line({x1: 0.8, y1: 4.75, x2: 12.5, y2: 4.75, color: 'E5E5E5', lw: 1});
      c.text('另外 5 组：成本都下降，效果 4 组上升、1 组下降 0.93（MMLU · GPTSwarm）。', {x: 0.8, y: 5.0, w: 11.7, h: 0.5, size: 18, color: S.text, font: SANS});
      c.text(SRC.t3, {x: 0.8, y: 6.95, w: 8, h: 0.3, size: 9, color: S.muted, font: INTER});
      c.notes('六组完整数据见表 3；HumanEval 为 pass@1。');
    },
  ]};
})();

// ---------------------------------------------------------------- systems-talk: causal chain / algorithm box + crop / ledger + ratio / ratio bars
const systems = (() => {
  const S = {navy: '1F3A5F', ours: 'E4572E', text: '1A1A1A', muted: '555555', base: '8A99AD', rule: 'D9D9D9', dark: '1E2633', tint: 'FDE8E2', panel: 'F4F6F9'};
  const frame = (c, stage, title) => {
    c.bg('FFFFFF');
    ['例题', '方法', '实验'].forEach((s, i) => {
      c.rect({x: 0.6 + i * 1.25, y: 0.3, w: 1.15, h: 0.3, fill: i === stage ? S.navy : 'EEF1F4', r: 0.05});
      c.text(s, {x: 0.6 + i * 1.25, y: 0.3, w: 1.15, h: 0.3, size: 11, color: i === stage ? 'FFFFFF' : S.muted, font: SANS, bold: i === stage, align: 'center', valign: 'middle'});
    });
    c.text(title, {x: 0.6, y: 0.75, w: 12.1, h: 0.6, size: 25, color: S.text, font: SANS, bold: true, acc: S.ours});
  };
  const insight = (c, items) => {
    c.rect({x: 0, y: 6.45, w: W, h: 1.05, fill: S.dark});
    items.forEach((t, i) => {
      const x = 0.6 + i * 4.15;
      c.text('Insight ' + (i + 1), {x, y: 6.55, w: 3.9, h: 0.28, size: 11, color: 'F6C343', font: INTER, bold: true});
      c.text(t, {x, y: 6.83, w: 3.95, h: 0.6, size: 13, color: 'FFFFFF', font: SANS, lh: 1.2});
    });
  };
  const node = (c, x, y, w, h, who, body, hot) => {
    c.rect({x, y, w, h, fill: hot ? S.tint : S.panel, line: hot ? S.ours : S.rule, lw: 1.5, r: 0.08});
    c.text(who, {x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.3, size: 13, color: hot ? S.ours : S.navy, font: SANS, bold: true});
    c.text(body, {x: x + 0.2, y: y + 0.5, w: w - 0.4, h: h - 0.6, size: 14, color: S.text, font: INTER, lh: 1.3});
  };
  const cs = {stroke: S.ours, fill: S.tint, line: S.ours, color: S.ours, font: SANS, size: 12, ring: 0.2, r: 0.05};
  return {name: 'systems-talk', label: '系统顶会报告', pages: [
    (c) => {
      frame(c, 0, '错误沿一条边传播：Thinker 1 → Thinker 2 → 总结者答 [[8]]');
      c.text('Q：' + EX.q + '   （' + EX.qEn + '）', {x: 0.6, y: 1.45, w: 12.1, h: 0.35, size: 13, color: S.muted, font: SANS});
      node(c, 0.6, 2.0, 3.6, 2.2, 'Thinker 1', '“…because n should be [[smaller than 24]].”'.replace('[[', '').replace(']]', ''), true);
      node(c, 4.85, 2.0, 3.6, 2.2, 'Thinker 2（读到 Answer 1）', '“…n=1,2,4,…,20, because n should not be greater than 24. The answer is 8.”', true);
      node(c, 9.1, 2.0, 3.6, 2.2, 'Summarizer', '“The three thinkers’ answers are 5,8,8 … the answer to the problem is 8.”', false);
      [[4.2, 4.85], [8.45, 9.1]].forEach(([a, b]) => c.line({x1: a + 0.05, y1: 3.15, x2: b - 0.05, y2: 3.15, color: S.ours, lw: 3, arrow: true}));
      c.rect({x: 0.6, y: 4.6, w: 12.1, h: 1.5, fill: 'FFFFFF', line: S.navy, lw: 1.5, r: 0.08});
      c.text('剪掉 T1 → T2 之后', {x: 0.85, y: 4.72, w: 4, h: 0.3, size: 13, color: S.navy, font: SANS, bold: true});
      c.text('Thinker 2 删去这条限制，n 取到 40，答 12；Thinker 3 写道“Answer 1 set n<24, which is not reasonable.”；总结者答 12（图中标为正确）。', {x: 0.85, y: 5.08, w: 11.6, h: 0.9, size: 14, color: S.text, font: SANS, lh: 1.35});
      insight(c, ['原拓扑 3 个回答是 5、8、8，总结者取 8', '“12”需允许负奇数；只取正奇数是 6', '关键不在消息多少，而在哪条该传']);
      c.notes(EX.src + '。' + EX.math.join('；'));
    },
    (c) => {
      frame(c, 1, '空间剪枝：学一个边分数，训练后一次性剪掉 [[p%]]');
      c.rect({x: 0.6, y: 1.55, w: 5.4, h: 4.65, fill: S.dark, r: 0.08});
      c.text('Algorithm（简化自 Alg. 1）', {x: 0.85, y: 1.7, w: 5, h: 0.3, size: 13, color: 'F6C343', font: INTER, bold: true});
      c.text(['1  给每条对话内边一个分数 S^{S}', '2  按 S 采样通信图，跑一轮，得到效用 φ', '3  策略梯度更新 S，并加低秩约束', '4  训练 K′ 轮后：按 TopK 保留 (1−p%) 的边', '5  之后拓扑固定，不再训练'], {x: 0.85, y: 2.25, w: 5.0, h: 3.9, size: 16, color: 'FFFFFF', font: MONO, lh: 2.0, cjk: SANS});
      const gr = K.figure(c, A.right, {x: 6.4, y: 1.55, w: 4.4, h: 4.65}, 'top-left');
      K.callout(c, K.at(gr, A.cut1), {x: 10.95, y: 1.8, w: 1.8, h: 0.55}, ['① 剪掉', 'T1 → T2'], cs);
      K.callout(c, K.at(gr, A.cut2), {x: 10.95, y: 3.9, w: 1.8, h: 0.55}, ['② 剪掉', 'T1 → 总结者'], cs);
      insight(c, ['只训练前 K′ 轮，后续查询零额外开销', '示例 6 条边剪掉 2 条，答案 8 → 12', '附录 I.4：被剪的多是误导或冗余消息']);
    },
    (c) => {
      frame(c, 1, '跨轮历史只留 2 条，示例 token 降 [[53%]]');
      const g = K.figure(c, B.temporal, {x: 0.6, y: 1.5, w: 12.1, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.4, y: 3.5, w: 1.5, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 8.8, y: 3.5, w: 1.5, h: 0.34}, '剪掉', cs);
      K.ledger(c, {x: 0.6, y: 4.0, w: 7.6, h: 2.25}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.ours, rule: S.rule, size: 16, lastSize: 20});
      c.rect({x: 8.9, y: 4.05, w: 3.8, h: 2.15, fill: S.tint, r: 0.08});
      c.text('2.1×', {x: 8.9, y: 4.15, w: 3.8, h: 1.1, size: 60, color: S.ours, font: INTER, bold: true, align: 'center'});
      c.text('token 降到 1/2.1（7,295 → 3,425）', {x: 9.05, y: 5.35, w: 3.5, h: 0.7, size: 13, color: S.text, font: SANS, align: 'center'});
      insight(c, ['跨轮开销最大：5,036 → 1,944（−61.4%）', '时间边由 S^{T} 打分，与空间边一起剪', '两类边共用“掩码 + TopK”同一套流程']);
    },
    (c) => {
      frame(c, 2, '数据集越大越省：GSM8K · GPTSwarm 便宜了 [[4.1×]]');
      c.text('API 成本（美元）', {x: 0.6, y: 1.5, w: 4, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true});
      c.text('便宜', {x: 7.9, y: 1.5, w: 0.9, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true, align: 'right'});
      K.hbars(c, {x: 0.6, y: 1.85, w: 8.2, h: 4.45}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: S.base, after: S.ours, fmt: K.money, labelW: 2.4, extraW: 0.9,
        extra: (r, b) => c.text(ratio(r), {x: b.x, y: b.y, w: 0.9, h: b.h, size: 16, bold: true, color: S.ours, font: INTER, align: 'right', valign: 'middle'})});
      c.rect({x: 9.3, y: 1.9, w: 3.45, h: 4.3, fill: S.panel, r: 0.08});
      c.text(['GSM8K · GPTSwarm', '$234.76 → $57.17', '准确率 89.74 → 90.58'], {x: 9.5, y: 2.1, w: 3.1, h: 1.4, size: 15, color: S.text, font: SANS, lh: 1.45, paraGap: 2});
      c.text('MMLU · GPTSwarm 是 6 组中唯一掉点的（83.98 → 83.05）', {x: 9.5, y: 3.8, w: 3.1, h: 1.0, size: 13, color: S.muted, font: SANS, lh: 1.3});
      c.text('Ratio = 接入前 / 接入后成本', {x: 9.5, y: 5.6, w: 3.1, h: 0.4, size: 11, color: S.muted, font: SANS});
      insight(c, ['prompt token 降 28.1%–72.8%', '6 组中 5 组效果上升（HumanEval 为 pass@1）', 'GSM8K 约 8.5K 条，规模越大省得越多']);
    },
  ]};
})();

// ---------------------------------------------------------------- theory-beamer: formal problem / eq + graph / token formula / booktabs
const metropolis = (() => {
  const S = {bar: '23373B', orange: 'EB811B', text: '23373B', muted: '6B7B7E', bg: 'FAFAFA', block: 'EDEFF0', green: '14B03D'};
  const frame = (c, title, p, n) => {
    c.bg(S.bg);
    c.rect({x: 0, y: 0, w: W, h: 0.95, fill: S.bar});
    c.text(title, {x: 0.55, y: 0, w: 12, h: 0.95, size: 24, color: 'FFFFFF', font: FIRA, valign: 'middle'});
    c.rect({x: 0, y: 0.95, w: W * p, h: 0.05, fill: S.orange});
    c.text(String(n), {x: W - 1.2, y: 7.05, w: 0.8, h: 0.3, size: 11, color: S.muted, font: FIRA, align: 'right'});
  };
  const block = (c, x, y, w, h, head, body, alert, size = 14) => {
    c.rect({x, y, w, h: 0.42, fill: alert ? S.orange : S.bar});
    c.text(head, {x: x + 0.15, y, w: w - 0.3, h: 0.42, size: 14, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'});
    c.rect({x, y: y + 0.42, w, h: h - 0.42, fill: S.block});
    c.text(body, {x: x + 0.18, y: y + 0.55, w: w - 0.36, h: h - 0.6, size, color: S.text, font: SANS, lh: 1.4, acc: S.orange, accBold: true});
  };
  return {name: 'theory-beamer', label: '现代 Metropolis 理论风', pages: [
    (c) => {
      frame(c, '例题：图 4 在解什么题', 0.3, 7);
      block(c, 0.8, 1.35, 5.9, 1.75, 'Problem', [EX.q, EX.qEn], false, 15);
      block(c, 0.8, 3.3, 5.9, 1.55, 'Setting', ['3 个 Thinker 各自作答，Summarizer 汇总给出最终答案'], false);
      block(c, 0.8, 5.05, 5.9, 1.75, 'Remark', ['图中把 [[12]] 标为正确；这需要允许数列含负奇数，只取正奇数时答案是 6'], true);
      block(c, 7.0, 1.35, 5.55, 3.5, 'Solution sketch', EX.math, false, 14);
      block(c, 7.0, 5.05, 5.55, 1.75, 'Thinker 2 的错误', ['沿用 Thinker 1 的“n < 24”，只数到 n = 20，答 8'], false);
      c.notes(EX.src);
    },
    (c) => {
      frame(c, '空间剪枝：把 0/1 通信图松弛成可学习的掩码', 0.42, 8);
      const g = K.figure(c, B.eq7, {x: 0.8, y: 1.35, w: 11.4, h: 0.85});
      const box = (x0, x1, col) => c.rect({x: g.x + x0 * g.w - 0.05, y: g.y - 0.05, w: (x1 - x0) * g.w + 0.1, h: g.h + 0.1, line: col, lw: 2.25, r: 0.06});
      box(0.675, 0.828, S.orange); box(0.835, 0.99, '2E86DE');
      c.text('空间（对话内）', {x: g.x + 0.68 * g.w, y: g.y + g.h + 0.12, w: 2.1, h: 0.3, size: 13, color: S.orange, font: SANS, bold: true});
      c.text('时间（对话间）', {x: g.x + 0.845 * g.w, y: g.y + g.h + 0.12, w: 2.1, h: 0.3, size: 13, color: '2E86DE', font: SANS, bold: true});
      c.text('式 (7)', {x: 0.8, y: g.y + g.h + 0.12, w: 2, h: 0.3, size: 11, color: S.muted, font: SANS});
      block(c, 0.8, 2.95, 6.2, 2.15, '符号', ['A^{S}、A^{T}：原系统给定的 0/1 邻接矩阵', 'S^{S}、S^{T}：可学习的连续掩码，越大越重要', '⊙：逐元素相乘'], false);
      block(c, 0.8, 5.3, 6.2, 1.45, '训练完之后', ['按 S 的大小保留 (1 − p%) 的边，其余一次性剪掉（式 12）'], true);
      const gs = K.graph(c, {x: 7.6, y: 3.05, w: 5.0, h: 3.0}, A, {font: SANS, edge: S.bar, cut: S.orange, node: 'FFFFFF', nodeLine: S.bar, nodeText: S.text, nodeW: 1.45, nodeH: 0.5, nodeSize: 12, nodeR: 0.05});
      Object.values(gs).forEach((p) => K.ring(c, p, 0.18, S.orange, 2));
      c.text('图 4 示例的空间图（重绘）：虚线为被剪掉的 2 条边', {x: 7.6, y: 6.2, w: 5.0, h: 0.5, size: 11, color: S.muted, font: SANS, lh: 1.2});
    },
    (c) => {
      frame(c, '时间剪枝：跨轮项带 ×4，剪它收益最大', 0.5, 9);
      block(c, 0.8, 1.35, 11.75, 1.6, '图 4 底部的 token 算式（原图）', [''], false);
      K.figure(c, B.tokens, {x: 1.0, y: 1.95, w: 11.35, h: 0.85});
      block(c, 0.8, 3.2, 5.7, 3.55, 'Computation', ['对话内：378×3+432×2+261 = 2,259', '→ 378+402×2+299 = 1,481', '对话间：(378+432+261+188)×4 = 5,036', '→ (299+187)×4 = 1,944'], false, 14);
      block(c, 6.85, 3.2, 5.7, 3.55, 'Result', ['合计 7,295 → [[3,425]]（−53.0%）', '对话间一项占剪枝前的 69%，是主要来源', '时间边与空间边一样由掩码打分、一次性剪掉'], true, 14);
    },
    (c) => {
      frame(c, '即插即用：成本全部下降，效果 5/6 组上升', 0.82, 18);
      K.table(c, {x: 0.8, y: 1.45, w: 11.75, h: 4.5}, [
        {h: '框架 · 数据集', w: 0.26, fn: r => short(r.k)}, {h: '指标', w: 0.1, key: 'm'},
        {h: '成本 前', w: 0.13, fn: r => K.money(r.a), num: true, align: 'right'}, {h: '成本 后', w: 0.13, fn: r => K.money(r.b), num: true, align: 'right', color: () => S.orange, bold: () => true},
        {h: '效果 前', w: 0.12, key: 'pa', num: true, align: 'right'}, {h: '效果 后', w: 0.12, key: 'pb', num: true, align: 'right'},
        {h: 'Δ', w: 0.14, key: 'dp', num: true, align: 'right', color: r => (r.dp.startsWith('+') ? S.green : 'C0392B'), bold: () => true}],
        COST.rows, {font: SANS, numFont: FIRA, text: S.text, muted: S.muted, rule: S.bar, top: 1.75, mid: 0.75, bottom: 1.75, size: 14, headSize: 13});
      c.text('Table 3（节选）· 5 个 gpt-4 agent；API 成本单位为美元；HumanEval 为 pass@1，其余为准确率', {x: 0.8, y: 6.1, w: 11.7, h: 0.3, size: 11, color: S.muted, font: SANS});
      c.text(SRC.t3, {x: 0.8, y: 7.05, w: 8, h: 0.3, size: 10, color: S.muted, font: SANS});
    },
  ]};
})();

// ---------------------------------------------------------------- dark-tech: terminal log / spotlight / stat cards / remaining-cost columns
const dark = (() => {
  const S = {bg: '0B0F14', panel: '131A22', text: 'E6EDF3', muted: '8B98A5', cyan: '22D3EE', pink: 'F472B6', green: '4ADE80', rule: '26313D'};
  const frame = (c, kicker, title) => {
    c.bg(S.bg);
    c.text(kicker, {x: 0.6, y: 0.4, w: 6, h: 0.3, size: 12, color: S.cyan, font: MONO, cs: 1});
    c.text(title, {x: 0.6, y: 0.75, w: 12.1, h: 0.65, size: 26, color: S.text, font: SANS, bold: true, acc: S.cyan});
  };
  const cs = {stroke: S.cyan, fill: S.bg, line: S.cyan, color: S.cyan, font: SANS, size: 12, ring: 0.22, r: 0.05};
  return {name: 'dark-tech', label: '暗色科技', pages: [
    (c) => {
      frame(c, '// EXAMPLE · FIGURE 4', '一条消息带错前提，总结者答 [[8]]');
      c.rect({x: 0.6, y: 1.6, w: 12.1, h: 4.9, fill: S.panel, line: S.rule, r: 0.06});
      ['FF5F57', 'FEBC2E', '28C840'].forEach((col, i) => c.ellipse({x: 0.85 + i * 0.28, y: 1.78, w: 0.16, h: 0.16, fill: col}));
      c.text('agents.log', {x: 1.8, y: 1.72, w: 3, h: 0.28, size: 11, color: S.muted, font: MONO});
      const L = [
        ['question ', EX.qEn, S.muted],
        ['thinker_1', '“…because n should be smaller than 24.”', S.pink],
        ['thinker_2', '“…n=1,2,4,…,20, because n should not be greater than 24. The answer is 8.”', S.pink],
        ['summary  ', 'answer = 8', S.text],
        ['# pruned ', 'thinker_1 → thinker_2,  thinker_1 → summarizer', S.cyan],
        ['thinker_2', '“…n=1,2,4,…,40. The answer is 12.”', S.green],
        ['thinker_3', '“Answer 1 set n<24, which is not reasonable.”', S.green],
        ['summary  ', 'answer = 12   (marked correct in Fig. 4)', S.green],
      ];
      L.forEach(([k, v, col], i) => {
        c.text('$ ' + k, {x: 0.9, y: 2.2 + i * 0.5, w: 2.0, h: 0.4, size: 14, color: S.muted, font: MONO});
        c.text(v, {x: 2.95, y: 2.2 + i * 0.5, w: 9.6, h: 0.4, size: 14, color: col, font: MONO});
      });
      c.text(EX.q + ' ' + EX.caveat, {x: 0.6, y: 6.62, w: 12.1, h: 0.5, size: 11.5, color: S.muted, font: SANS, lh: 1.3});
      c.text(EX.src, {x: 0.6, y: 7.18, w: 8, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
    (c) => {
      frame(c, '// METHOD · SPATIAL PRUNING', '剪掉 2 条消息，答案从 8 变成 [[12]]');
      const g = K.figure(c, A.full, {x: 0.6, y: 1.6, w: 7.6, h: 5.5}, 'top-left', {fill: 'FFFFFF', pad: 0.06, r: 0.04});
      K.spotlight(c, g, F.right, S.bg, 0.72);
      K.callout(c, K.at(g, F.cut1), {x: 8.65, y: 1.75, w: 3.0, h: 0.4}, A.c1.replace('Thinker ', 'T'), cs);
      K.callout(c, K.at(g, F.cut2), {x: 8.65, y: 3.25, w: 3.4, h: 0.4}, A.c2.replace('Thinker ', 'T'), cs);
      c.text(['S^{S}：每条对话内边一个可学习分数', '训练 K′ 轮 → TopK 一次性剪 p%', '6 条边 → 4 条边'], {x: 8.65, y: 4.7, w: 4.2, h: 1.5, size: 13, color: S.muted, font: SANS, lh: 1.5});
      c.text(SRC.f4, {x: 8.65, y: 7.18, w: 4, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
    (c) => {
      frame(c, '// METHOD · TEMPORAL PRUNING', '图 4 示例 token：7,295 → [[3,425]]');
      const g = K.figure(c, B.temporal, {x: 0.6, y: 1.65, w: 12.1, h: 1.8}, 'top', {fill: 'FFFFFF', pad: 0.06, r: 0.04});
      K.spotlight(c, g, [0.5, 0, 1, 1], S.bg, 0.65);
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.6, y: 3.7, w: 1.4, h: 0.36}, '剪掉', {...cs, stroke: S.pink, line: S.pink, color: S.pink});
      K.callout(c, K.at(g, B.pruned[1]), {x: 9.2, y: 3.7, w: 1.4, h: 0.36}, '剪掉', {...cs, stroke: S.pink, line: S.pink, color: S.pink});
      B.ledger.forEach((r, i) => {
        const x = 0.6 + i * 4.1;
        c.rect({x, y: 4.45, w: 3.85, h: 2.4, fill: S.panel, line: S.rule, r: 0.06});
        c.text(r.k, {x: x + 0.25, y: 4.6, w: 3.4, h: 0.35, size: 14, color: S.muted, font: SANS});
        c.text(r.b, {x: x + 0.25, y: 5.0, w: 3.4, h: 0.9, size: 44, color: i === 2 ? S.cyan : S.text, font: INTER, bold: true});
        c.text('剪枝前 ' + r.a + '   ' + r.d, {x: x + 0.25, y: 6.05, w: 3.4, h: 0.35, size: 13, color: S.muted, font: SANS});
      });
      c.text(SRC.f4 + ' · token 由图中算式求和', {x: 0.6, y: 7.18, w: 8, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
    (c) => {
      frame(c, '// RESULTS · PLUG-IN COST', '接入后只剩原成本的 [[24%–83%]]');
      const bx = 0.9, by = 1.85, bw = 8.6, bh = 4.6; const gw = bw / 6;
      [0, 50, 100].forEach(p => { const y = by + bh - bh * p / 100; c.line({x1: bx, y1: y, x2: bx + bw, y2: y, color: S.rule, lw: 0.75, dash: p !== 0}); c.text(p + '%', {x: bx - 0.6, y: y - 0.13, w: 0.5, h: 0.26, size: 10, color: S.muted, font: MONO, align: 'right'}); });
      COST.rows.forEach((r, i) => {
        const p = 100 * r.b / r.a; const x = bx + i * gw + gw * 0.2; const w = gw * 0.6;
        c.rect({x, y: by, w, h: bh, fill: S.panel, line: S.rule, lw: 0.75});
        c.rect({x, y: by + bh - bh * p / 100, w, h: bh * p / 100, fill: i === 0 ? S.cyan : '155E75'});
        c.text(Math.round(p) + '%', {x: x - 0.2, y: by + bh - bh * p / 100 - 0.36, w: w + 0.4, h: 0.3, size: 15, color: i === 0 ? S.cyan : S.text, font: INTER, bold: true, align: 'center'});
        const kk = r.k.split(' · ');
        c.text([kk[0], kk[1]], {x: x - 0.35, y: by + bh + 0.08, w: w + 0.7, h: 0.5, size: 10.5, color: S.muted, font: SANS, align: 'center', lh: 1.15});
      });
      c.text(['柱高 = 接入后成本 / 接入前', '空心部分 = 省下的'], {x: 9.9, y: 1.85, w: 3, h: 0.7, size: 12, color: S.muted, font: SANS, lh: 1.4});
      [['GSM8K · GPTSwarm', '$234.76 → $57.17'], ['效果', '6 组中 5 组上升'], ['prompt token', '−28.1% ~ −72.8%']].forEach(([a, b], i) => {
        c.rect({x: 9.9, y: 2.85 + i * 1.25, w: 0.06, h: 1.0, fill: S.cyan});
        c.text(a, {x: 10.1, y: 2.85 + i * 1.25, w: 2.8, h: 0.35, size: 12, color: S.muted, font: SANS});
        c.text(b, {x: 10.1, y: 3.2 + i * 1.25, w: 2.8, h: 0.5, size: 17, color: S.text, font: INTER, bold: true});
      });
      c.text(SRC.t3 + ' · HumanEval 为 pass@1', {x: 0.6, y: 7.18, w: 9, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
  ]};
})();

// ---------------------------------------------------------------- editorial: pull quote / numbered notes / prose + ledger / big numbers
const editorial = (() => {
  const S = {bg: 'F7F3EC', ink: '1E1B18', muted: '7A7066', red: 'B83A2E', rule: 'CFC6B8'};
  const frame = (c, kicker, title) => {
    c.bg(S.bg);
    c.text(kicker, {x: 0.7, y: 0.45, w: 6, h: 0.3, size: 11, color: S.red, font: SANS, bold: true, cs: 2});
    c.line({x1: 0.7, y1: 0.85, x2: W - 0.7, y2: 0.85, color: S.ink, lw: 1.5});
    c.text(title, {x: 0.7, y: 0.98, w: 12, h: 0.9, size: 30, color: S.ink, font: SERIF, bold: true, lh: 1.15});
  };
  const note = (c, x, y, w, n, t) => {
    K.badge(c, {x: x + 0.2, y: y + 0.2}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 12, r: 0.19});
    c.text(t, {x: x + 0.52, y, w: w - 0.52, h: 1.0, size: 13.5, color: S.ink, font: SERIF, lh: 1.35});
  };
  return {name: 'editorial', label: '杂志编辑风', pages: [
    (c) => {
      frame(c, 'EXAMPLE · 图 4 的故事', '一句“n 小于 24”，把答案带偏了');
      c.text('“', {x: 0.55, y: 1.75, w: 1.2, h: 1.5, size: 110, color: S.red, font: PAG, bold: true});
      c.text('Answer 1 set n<24, which is not reasonable.', {x: 1.5, y: 2.2, w: 6.4, h: 1.6, size: 30, color: S.ink, font: PAG, italic: true, lh: 1.2});
      c.text('— Thinker 3，剪枝之后', {x: 1.5, y: 3.9, w: 6, h: 0.4, size: 14, color: S.red, font: SERIF, bold: true});
      c.line({x1: 8.4, y1: 2.0, x2: 8.4, y2: 6.6, color: S.rule, lw: 1});
      c.text(['题目', EX.q], {x: 8.75, y: 2.0, w: 3.9, h: 1.0, size: 14, color: S.ink, font: SERIF, lh: 1.4});
      c.text(['原拓扑里', 'Thinker 1 认为 n 应小于 24；Thinker 2 读到后照搬，只数到 n = 20，答 8；总结者也答 8。'], {x: 8.75, y: 3.15, w: 3.9, h: 1.7, size: 14, color: S.ink, font: SERIF, lh: 1.4});
      c.text(['剪掉两条边后', 'Thinker 2 删去这条限制，答 12；总结者答 12（图中标为正确）。'], {x: 8.75, y: 4.95, w: 3.9, h: 1.4, size: 14, color: S.ink, font: SERIF, lh: 1.4});
      c.line({x1: 1.5, y1: 4.75, x2: 4.5, y2: 4.75, color: S.rule, lw: 1});
      c.text(EX.caveat, {x: 1.5, y: 4.9, w: 6.4, h: 1.0, size: 12.5, color: S.muted, font: SERIF, italic: true, lh: 1.4});
      c.text(EX.src, {x: 0.7, y: 7.08, w: 8, h: 0.25, size: 9.5, color: S.muted, font: SERIF});
    },
    (c) => {
      frame(c, 'METHOD · 空间剪枝', '少传两条消息，答案变了');
      const gl = K.figure(c, A.left, {x: 4.3, y: 2.05, w: 4.1, h: 4.95}, 'top');
      const gr = K.figure(c, A.right, {x: 8.55, y: 2.05, w: 4.1, h: 4.95}, 'top');
      [[gr, A.cut1, 1], [gr, A.cut2, 2], [gr, A.strike, 3]].forEach(([g, f, n]) => { const p = K.at(g, f); K.ring(c, p, 0.2, S.red, 2); K.badge(c, {x: p.x - 0.32, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16}); });
      note(c, 0.7, 2.1, 3.3, 1, '剪掉 Thinker 1 发给 Thinker 2 的回答');
      note(c, 0.7, 3.1, 3.3, 2, '剪掉 Thinker 1 发给总结者的回答');
      note(c, 0.7, 4.1, 3.3, 3, 'Thinker 2 删去“n 不超过 24”，答 12');
      c.line({x1: 0.7, y1: 5.3, x2: 4.0, y2: 5.3, color: S.rule, lw: 1});
      c.text('每条边一个可学习分数，训练 K′ 轮后一次性剪掉 p%。', {x: 0.7, y: 5.45, w: 3.3, h: 0.8, size: 12, color: S.muted, font: SERIF, italic: true, lh: 1.3});
      c.text('Fig. 4（局部）· Zhang et al., ICLR 2025', {x: 4.3, y: 7.08, w: 6, h: 0.25, size: 9.5, color: S.muted, font: SERIF});
    },
    (c) => {
      frame(c, 'METHOD · 时间剪枝', '跨轮只带两条发言，token 少一半');
      const g = K.figure(c, B.temporal, {x: 0.7, y: 2.0, w: 11.93, h: 1.75}, 'top');
      K.badge(c, K.at(g, B.pruned[0]), 1, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.17});
      K.badge(c, K.at(g, B.pruned[1]), 2, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.17});
      c.text('Fig. 4（局部）左为原系统，右为剪枝后；①② 为被剪掉的两条历史发言', {x: 0.7, y: g.y + g.h + 0.06, w: 9, h: 0.3, size: 11, color: S.muted, font: SERIF, italic: true});
      c.text(['上一轮的发言原本都会写进下一轮的提示词。AgentPrune 给每条“跨轮边”也配一个可学习分数 S^{T}，和空间边一起剪。', '例子里 4 条发言只留下 Answer 3 与 Conclusion。'], {x: 0.7, y: 4.3, w: 5.2, h: 2.2, size: 15, color: S.ink, font: SERIF, lh: 1.5, paraGap: 6});
      c.text('“对话间开销从 5,036 降到 1,944。”', {x: 0.7, y: 6.25, w: 5.6, h: 0.6, size: 18, color: S.red, font: SERIF, bold: true});
      K.ledger(c, {x: 6.5, y: 4.25, w: 6.13, h: 2.55}, B.ledger, {font: SERIF, numFont: SERIF, text: S.ink, muted: S.muted, accent: S.red, rule: S.ink, size: 16, lastSize: 21});
      c.text('Fig. 4 · token 由图中算式求和', {x: 5.75, y: 7.08, w: 6, h: 0.25, size: 9.5, color: S.muted, font: SERIF});
    },
    (c) => {
      frame(c, 'RESULTS · 即插即用', '接到现成框架上，账单少了四分之三');
      [['$177.58', '省下的 API 成本', 'GSM8K · GPTSwarm：$234.76 → $57.17'], ['24%', '只剩原成本的', '同一组；是 6 组中降得最多的'], ['5 / 6', '组效果上升', '唯一下降：MMLU · GPTSwarm −0.93'], ['28.1–72.8%', 'prompt token 降幅', '接入 AutoGen 与 GPTSwarm']].forEach(([big, unit, label], i) => {
        const x = 0.7 + i * 3.05;
        c.line({x1: x, y1: 2.15, x2: x + 2.8, y2: 2.15, color: S.ink, lw: 1});
        c.text(big, {x, y: 2.3, w: 2.95, h: 1.0, size: i === 3 ? 34 : 42, color: i === 0 ? S.red : S.ink, font: SERIF, bold: true});
        c.text(unit, {x, y: 3.35, w: 2.8, h: 0.35, size: 14, color: S.muted, font: SERIF});
        c.text(label, {x, y: 3.8, w: 2.75, h: 1.0, size: 13.5, color: S.ink, font: SERIF, lh: 1.35});
      });
      c.line({x1: 0.7, y1: 5.2, x2: W - 0.7, y2: 5.2, color: S.rule, lw: 1});
      c.text('六组实验里，AgentPrune 每一组都降低了成本；效果在五组里上升（HumanEval 用 pass@1，其余用准确率）。数据集越大，省下的越多：GSM8K 约 8.5K 条，单次评测最贵。', {x: 0.7, y: 5.4, w: 11.9, h: 1.3, size: 15, color: S.ink, font: SERIF, lh: 1.5});
      c.text(SRC.t3, {x: 0.7, y: 7.08, w: 8, h: 0.25, size: 9.5, color: S.muted, font: SERIF});
    },
  ]};
})();

// ---------------------------------------------------------------- defense-cn: formal table of quotes / crops + side panel / strip + ledger / formal table
const defense = (() => {
  const S = {red: '9E1B32', text: '222222', muted: '666666', rule: 'D8D8D8', tint: 'F7EEF0', gold: 'B8860B'};
  const CH = ['研究背景', '例题', '方法', '实验', '讨论'];
  const frame = (c, ch, title, n) => {
    c.bg('FFFFFF');
    c.rect({x: 0, y: 0, w: W, h: 0.45, fill: S.red});
    CH.forEach((t, i) => c.text(t, {x: 3.3 + i * 2.0, y: 0, w: 2.0, h: 0.45, size: 12, color: i === ch ? 'FFFFFF' : 'E7B8C1', font: SANS, bold: i === ch, align: 'center', valign: 'middle'}));
    c.text('AgentPrune · ICLR 2025', {x: 0.4, y: 0, w: 3, h: 0.45, size: 12, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'});
    c.rect({x: 3.3 + ch * 2.0 + 0.5, y: 0.38, w: 1.0, h: 0.07, fill: S.gold});
    c.text(title, {x: 0.5, y: 0.7, w: 12.3, h: 0.6, size: 24, color: S.red, font: SANS, bold: true});
    c.line({x1: 0.5, y1: 1.38, x2: W - 0.5, y2: 1.38, color: S.red, lw: 1.25});
    c.text(String(n), {x: W - 1.3, y: 7.1, w: 0.8, h: 0.25, size: 10, color: S.muted, font: INTER, align: 'right'});
  };
  const side = (c, x, y, w, h, head, items) => {
    c.rect({x, y, w, h, fill: S.tint});
    c.rect({x, y, w, h: 0.45, fill: S.red});
    c.text(head, {x: x + 0.2, y, w, h: 0.45, size: 14, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'});
    c.text(items.map(t => '■ ' + t), {x: x + 0.2, y: y + 0.6, w: w - 0.4, h: h - 0.7, size: 14, color: S.text, font: SANS, lh: 1.4, paraGap: 6});
  };
  const concl = (c, t, pre = '结论  ') => { c.rect({x: 0.5, y: 6.45, w: W - 1, h: 0.5, fill: 'FFFFFF', line: S.red, lw: 1.25}); c.text(pre + t, {x: 0.7, y: 6.45, w: W - 1.4, h: 0.5, size: pre === '注  ' ? 12.5 : 15, color: S.red, font: SANS, bold: pre !== '注  ', valign: 'middle'}); };
  const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 12, ring: 0.2};
  return {name: 'defense-cn', label: '答辩 / 正式汇报', pages: [
    (c) => {
      frame(c, 1, '2.1 例题与角色：图 4 解的是一道计数题', 7);
      c.rect({x: 0.5, y: 1.6, w: 12.33, h: 0.9, fill: S.tint});
      c.text('题目', {x: 0.7, y: 1.6, w: 1.0, h: 0.9, size: 15, color: S.red, font: SANS, bold: true, valign: 'middle'});
      c.text([EX.q, EX.qEn], {x: 1.7, y: 1.66, w: 10.9, h: 0.8, size: 15, color: S.text, font: SANS, lh: 1.3, valign: 'middle'});
      const rows = [
        {a: 'Thinker 1', b: '“…because n should be smaller than 24.”', d: '提出限制'},
        {a: 'Thinker 2（原拓扑）', b: '“…n=1,2,4,…,20, because n should not be greater than 24. The answer is 8.”', d: '沿用，答 8'},
        {a: 'Thinker 2（剪枝后）', b: '“…n=1,2,4,…,40. The answer is 12.”', d: '删去，答 12'},
        {a: 'Summarizer', b: '汇总 3 个回答：原拓扑答 8，剪枝后答 12', d: '最终答案'},
      ];
      K.table(c, {x: 0.5, y: 2.75, w: 12.33, h: 3.5}, [{h: '角色', w: 0.2, key: 'a', bold: () => true}, {h: '图中原文（摘录）', w: 0.64, key: 'b'}, {h: '作用', w: 0.16, key: 'd', color: () => S.red, bold: () => true}],
        rows, {font: SANS, text: S.text, muted: 'FFFFFF', headFill: S.red, headColor: 'FFFFFF', rule: S.red, rowRule: S.rule, size: 13.5, headSize: 13});
      concl(c, EX.caveat, '注  ');
      c.notes(EX.src + '。' + EX.math.join('；'));
    },
    (c) => {
      frame(c, 2, '3.1 空间剪枝：剪掉 2 条对话内消息，答案由 8 变为 12', 8);
      const gl = K.figure(c, A.left, {x: 0.5, y: 1.55, w: 3.95, h: 4.75}, 'top');
      const gr = K.figure(c, A.right, {x: 4.6, y: 1.55, w: 3.95, h: 4.75}, 'top');
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.2, S.red, 2.25); K.badge(c, {x: p.x - 0.36, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.15}); });
      side(c, 8.85, 1.55, 4.0, 4.75, '方法说明', ['每条对话内边一个可学习分数 S^{S}，与系统效用一起优化', '训练 K′ 轮后按 TopK 一次性剪 p%（式 12）', '图中 ① T1→T2、② T1→总结者 被剪掉']);
      concl(c, '附录 I.4：被剪掉的多是误导 / 恶意或冗余消息');
    },
    (c) => {
      frame(c, 2, '3.2 时间剪枝：只把有用的历史带入下一轮', 9);
      const g = K.figure(c, B.temporal, {x: 0.5, y: 1.6, w: 12.33, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.5, y: 3.6, w: 1.5, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 9.0, y: 3.6, w: 1.5, h: 0.34}, '剪掉', cs);
      K.ledger(c, {x: 0.6, y: 4.1, w: 7.4, h: 2.15}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.red, rule: S.rule});
      side(c, 8.4, 4.05, 4.43, 2.25, '计算依据', ['由图 4 底部算式求和', '对话间一项在算式中带 ×4']);
      concl(c, '图 4 示例：token 由 7,295 降至 3,425（−53.0%）');
    },
    (c) => {
      frame(c, 3, '4.3 即插即用：接入现有框架后成本显著下降', 18);
      K.table(c, {x: 0.5, y: 1.6, w: 12.33, h: 4.6}, [
        {h: '框架', w: 0.14, fn: r => r.k.split(' · ')[1]}, {h: '数据集', w: 0.14, fn: r => r.k.split(' · ')[0]}, {h: '指标', w: 0.1, key: 'm'},
        {h: '接入前成本', w: 0.14, fn: r => K.money(r.a), num: true, align: 'right'}, {h: '接入后成本', w: 0.14, fn: r => K.money(r.b), num: true, align: 'right', color: () => S.red, bold: () => true},
        {h: '降幅', w: 0.1, fn: K.pct, num: true, align: 'right', bold: () => true}, {h: '效果 前 → 后', w: 0.24, fn: r => r.pa + ' → ' + r.pb + '（' + r.dp + '）', num: true, align: 'right'}],
        COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: 'FFFFFF', headFill: S.red, headColor: 'FFFFFF', rule: S.red, zebra: S.tint, size: 14, headSize: 13, hl: (r, j) => j === 0, hlFill: 'F3DADF'});
      concl(c, '6 组成本全部下降，效果 5 组上升；规模越大的数据集省得越多');
      c.notes(SRC.t3 + '；HumanEval 为 pass@1');
    },
  ]};
})();

// ---------------------------------------------------------------- jp-gothic: dense 3-column handout pages
const jp = (() => {
  const S = {navy: '0F2C59', teal: '0E7C86', text: '222222', muted: '666666', hl: 'FFF3A3', rule: 'BFC8D6', red: 'D7263D'};
  const frame = (c, title, n) => {
    c.bg('FFFFFF');
    c.text(PAPER + '  [Zhang+, ICLR’25]', {x: 0.45, y: 0.18, w: 11, h: 0.28, size: 10, color: S.muted, font: INTER});
    c.text(title, {x: 0.45, y: 0.5, w: 12.4, h: 0.6, size: 24, color: S.navy, font: SANS, bold: true, acc: S.teal});
    c.rect({x: 0.45, y: 1.13, w: 12.43, h: 0.05, fill: S.navy});
    c.rect({x: 0.45, y: 1.18, w: 4.0, h: 0.05, fill: S.teal});
    c.text(String(n), {x: W - 1.0, y: 7.15, w: 0.6, h: 0.25, size: 10, color: S.muted, font: INTER, align: 'right'});
  };
  const est = (str, size, ww) => Math.max(1, Math.ceil([...str].reduce((a, ch) => a + (/[\u2E80-\uFFEF]/.test(ch) ? 1 : 0.55), 0) * size / 72 / ww));
  const list = (c, x, y, w, items) => {
    let yy = y;
    items.forEach((it) => {
      const [t, subs = []] = Array.isArray(it) ? it : [it];
      c.text('● ' + t, {x, y: yy, w, h: 0.7, size: 15, color: S.text, font: SANS, bold: true, lh: 1.25, acc: S.teal});
      yy += est('● ' + t, 15, w) * 0.37 + 0.05;
      subs.forEach((s) => { c.text('– ' + s, {x: x + 0.3, y: yy, w: w - 0.3, h: 0.6, size: 13, color: S.muted, font: SANS, lh: 1.25}); yy += est('– ' + s, 13, w - 0.3) * 0.32 + 0.04; });
      yy += 0.1;
    });
  };
  const colHead = (c, x, y, w, t) => { c.rect({x, y, w, h: 0.36, fill: S.navy}); c.text(t, {x: x + 0.12, y, w: w - 0.24, h: 0.36, size: 13, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'}); };
  const concl = (c, t) => { c.rect({x: 0.45, y: 6.5, w: 12.43, h: 0.55, fill: S.hl}); c.text('⇒ ' + t, {x: 0.6, y: 6.5, w: 12.1, h: 0.55, size: 16, color: S.text, font: SANS, bold: true, valign: 'middle'}); };
  const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 11.5, ring: 0.19};
  return {name: 'jp-gothic', label: '日式研究室', pages: [
    (c) => {
      frame(c, '例题：图 4 的题目与[[角色]]', 7);
      colHead(c, 0.45, 1.4, 3.9, '题目');
      c.text([EX.q, EX.qEn], {x: 0.55, y: 1.85, w: 3.7, h: 1.4, size: 14, color: S.text, font: SANS, lh: 1.35});
      colHead(c, 0.45, 3.3, 3.9, '角色');
      list(c, 0.5, 3.75, 3.85, EX.roles.map(r => [r.k, [r.d]]));
      colHead(c, 4.55, 1.4, 4.4, '原文（图 4 摘录）');
      [EX.t1, EX.t2b, EX.t3a].forEach((t, i) => {
        const y = 1.85 + i * 1.5;
        c.text(t.who, {x: 4.6, y, w: 4.3, h: 0.28, size: 12, color: S.teal, font: SANS, bold: true});
        c.text('“' + (t.en || (t.pre + ' ' + t.strike + ' ' + t.post)) + '”', {x: 4.6, y: y + 0.3, w: 4.3, h: 1.1, size: 12, color: S.text, font: INTER, lh: 1.25});
      });
      colHead(c, 9.15, 1.4, 3.73, '补充：答案为什么是 12');
      c.text(EX.math, {x: 9.22, y: 1.85, w: 3.6, h: 3.4, size: 12.5, color: S.text, font: SANS, lh: 1.4, paraGap: 4});
      c.text('图中把 12 标为正确，前提是允许负奇数。', {x: 9.22, y: 5.4, w: 3.6, h: 0.8, size: 12.5, color: S.red, font: SANS, bold: true, lh: 1.3});
      concl(c, '原拓扑：Thinker 1 的 n < 24 传给 Thinker 2，总结者答 8');
      c.notes(EX.src);
    },
    (c) => {
      frame(c, '方法①：用[[空间剪枝]]去掉对话内的消息', 8);
      list(c, 0.5, 1.45, 4.9, [['对象：同一轮内 agent 之间的消息', ['每条边一个可学习分数 S^{S}']], ['学习：掩码与系统效用一起优化', ['策略梯度（式 9–10）+ 核范数（式 11）']], ['剪枝：训练 K′ 轮后按 TopK 一次性剪 p%', ['之后拓扑固定']]]);
      const gl = K.figure(c, A.left, {x: 5.55, y: 1.4, w: 3.6, h: 4.95}, 'top');
      const gr = K.figure(c, A.right, {x: 9.25, y: 1.4, w: 3.6, h: 4.95}, 'top');
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.19, S.red, 2); K.badge(c, {x: p.x - 0.34, y: p.y - 0.28}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 10, r: 0.14}); });
      c.text('左：原拓扑（答 8）  右：剪枝后（答 12）  ①② 被剪的边  Fig. 4', {x: 5.55, y: 6.17, w: 7.3, h: 0.28, size: 10.5, color: S.muted, font: SANS, align: 'center'});
      concl(c, '剪掉 2 条边后，示例答案由 8 变为 12（Fig. 4）');
    },
    (c) => {
      frame(c, '方法②：用[[时间剪枝]]精简上一轮的历史', 9);
      colHead(c, 0.45, 1.4, 6.1, '原图：发言历史（左剪枝前 / 右剪枝后）');
      const g = K.figure(c, B.temporal, {x: 0.45, y: 1.85, w: 6.1, h: 1.0}, 'top');
      colHead(c, 0.45, 3.05, 6.1, '原图：token 算式');
      K.figure(c, B.tokens, {x: 0.45, y: 3.5, w: 6.1, h: 0.4}, 'top');
      list(c, 0.5, 4.15, 6.0, [['4 条发言只保留 2 条', ['Answer 3 与 Conclusion 进入下一轮']], ['对话间一项带 ×4，占剪枝前 69%']]);
      colHead(c, 6.75, 1.4, 6.13, '求和结果');
      K.ledger(c, {x: 6.85, y: 1.9, w: 5.95, h: 2.4}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.teal, rule: S.rule, size: 14, lastSize: 17});
      c.text(B.ledgerNote, {x: 6.85, y: 4.5, w: 5.95, h: 1.4, size: 11.5, color: S.muted, font: SANS, lh: 1.35});
      concl(c, '图 4 示例 token：7,295 → 3,425（−53.0%）');
    },
    (c) => {
      frame(c, '实验：[[即插即用]]，直接降低现有框架的成本', 18);
      K.hbars(c, {x: 0.5, y: 1.5, w: 7.6, h: 4.85}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'C5CED9', after: S.teal, fmt: K.money, labelW: 2.35});
      list(c, 8.4, 1.5, 4.45, [['设置：5 个 gpt-4 agent', ['AutoGen / GPTSwarm × 3 数据集']], ['成本：GSM8K · GPTSwarm', ['$234.76 → $57.17，省 $177.58']], ['效果：6 组中 5 组上升', ['HumanEval 为 pass@1，其余为准确率', '唯一下降：MMLU · GPTSwarm −0.93']]]);
      concl(c, '数据集越大，省得越多（Table 3）');
    },
  ]};
})();

module.exports = [domestic, international, keynote, systems, metropolis, dark, editorial, defense, jp];
