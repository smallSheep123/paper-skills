// The 9 original presets, repaired: each keeps its visual identity but now uses
// processed figures (split, cropped, annotated) and its own signature layouts.
const {W, H} = require('./canvas');
const K = require('./kit');
const {SRC, PAPER, VENUE, A, B, COST, ATK, BENTO} = require('./content');

const SANS = 'Noto Sans SC', SERIF = 'Noto Serif SC', INTER = 'Inter', FIRA = 'Fira Sans', MONO = 'JetBrains Mono';
// full Figure 4 anchors (paper small-page coords -> fraction of f4_full)
const FULL = (x, y) => [(x - 188) / 627, (y - 140) / 472];
const F = {cut1: FULL(775, 253), cut2: FULL(735, 397), check: FULL(787, 458), cross: FULL(485, 465), strike: FULL(752, 318),
  right: [FULL(522, 186)[0], FULL(522, 186)[1], FULL(810, 492)[0], FULL(810, 492)[1]], left: [FULL(233, 186)[0], FULL(233, 186)[1], FULL(516, 492)[0], FULL(516, 492)[1]]};
const ratio = (r) => (r.a / r.b).toFixed(1) + '×';

// ---------------------------------------------------------------- domestic
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
  const pts = (c, x, y, w, items, head) => {
    c.rect({x, y, w, h: 0.42, fill: S.blue});
    c.text(head, {x: x + 0.15, y, w: w - 0.3, h: 0.42, size: 14, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'});
    let yy = y + 0.6;
    items.forEach((t, i) => {
      c.rect({x, y: yy + 0.04, w: 0.28, h: 0.28, fill: S.light, line: S.blue, lw: 1});
      c.text(String(i + 1), {x, y: yy + 0.04, w: 0.28, h: 0.28, size: 11, color: S.blue, font: INTER, bold: true, align: 'center', valign: 'middle'});
      c.text(t, {x: x + 0.4, y: yy, w: w - 0.4, h: 0.85, size: 14, color: S.text, font: SANS, lh: 1.3});
      yy += 0.92;
    });
  };
  const concl = (c, txt, y = 6.38) => {
    c.rect({x: 0.5, y, w: W - 1, h: 0.55, fill: S.light});
    c.rect({x: 0.5, y, w: 0.08, h: 0.55, fill: S.red});
    c.text('结论：' + txt, {x: 0.75, y, w: W - 1.4, h: 0.55, size: 15, color: S.text, font: SANS, valign: 'middle', acc: S.red, accBold: true});
  };
  const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 12, ring: 0.2};
  return {name: 'domestic', label: '国内组会', pages: [
    (c) => {
      frame(c, '三、方法 · 3.1 空间剪枝', '剪掉 [[2 条]]对话内消息，总结者的答案从错误的 8 变成正确的 12', 8);
      const gl = K.figure(c, A.left, {x: 0.5, y: 1.42, w: 3.95, h: 4.3}, 'top', {line: S.rule, lw: 1});
      const gr = K.figure(c, A.right, {x: 4.6, y: 1.42, w: 3.95, h: 4.3}, 'top', {line: S.rule, lw: 1});
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.2, S.red, 2.25); K.badge(c, {x: p.x - 0.36, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.15}); });
      K.ring(c, K.at(gl, A.cross), 0.25, S.red);
      c.text('图 4（局部）  左：原拓扑，答 8（错）；右：剪枝后，答 12（对）。①② 为被剪掉的两条边', {x: 0.5, y: 5.82, w: 8.0, h: 0.3, size: 11, color: S.muted, font: SANS});
      pts(c, 8.85, 1.42, 4.0, [A.points[0], A.points[1], A.points[2], '① T1 → T2、② T1 → 总结者被剪；Thinker 2 不再沿用“n 不能超过 24”'], '要点');
      concl(c, '剪掉的是[[冗余甚至带偏的消息]]，不是有用信息');
      c.notes('来源：' + SRC.f4);
    },
    (c) => {
      frame(c, '三、方法 · 3.2 时间剪枝', '上一轮 4 条发言只带 2 条进下一轮，一轮 token 从 [[7,295]] 降到 [[3,425]]', 9);
      const g = K.figure(c, B.temporal, {x: 0.5, y: 1.45, w: 12.33, h: 1.78}, 'top', {line: S.rule, lw: 1});
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
      frame(c, '四、实验 · 4.3 即插即用', '接入 GPTSwarm 后，GSM8K 成本 $234.76 → [[$57.17]]，精度还高了 0.84', 18);
      c.rect({x: 0.75, y: 1.5, w: 0.25, h: 0.16, fill: 'B8C4D6'}); c.text('接入前', {x: 1.05, y: 1.43, w: 1, h: 0.3, size: 11, color: S.muted, font: SANS});
      c.rect({x: 1.85, y: 1.5, w: 0.25, h: 0.16, fill: S.red}); c.text('接入 AgentPrune 后', {x: 2.15, y: 1.43, w: 2, h: 0.3, size: 11, color: S.muted, font: SANS});
      K.hbars(c, {x: 0.5, y: 1.85, w: 7.9, h: 4.1}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'B8C4D6', after: S.red, fmt: K.money, labelW: 2.35, boldFirst: true});
      c.text('图：据表 3 重绘，API 成本（美元），5 个 gpt-4 agent', {x: 0.5, y: 5.95, w: 7.5, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      pts(c, 8.85, 1.42, 4.0, COST.points, '要点');
      concl(c, '数据集越大省得越多，而精度基本不掉');
      c.notes('来源：' + SRC.t3 + '；$177.58、28.1%–72.8% 见 §4.3 与摘要');
    },
  ]};
})();

// ---------------------------------------------------------------- international
const international = (() => {
  const S = {navy: '14213D', acc: 'E85D04', text: '1B1B1B', muted: '6B7280', faint: '9CA3AF', rule: 'E5E7EB', tint: 'FFF4EC'};
  const frame = (c, title, tag) => {
    c.bg('FFFFFF');
    c.text(title, {x: 0.6, y: 0.4, w: 10.6, h: 1.0, size: 26, color: S.navy, font: SANS, bold: true, acc: S.acc, lh: 1.15, valign: 'middle'});
    c.text(tag, {x: 11.2, y: 0.5, w: 1.55, h: 0.3, size: 11, color: S.faint, font: INTER, align: 'right'});
  };
  const src = (c, t) => c.text(t, {x: 0.6, y: 7.05, w: 9, h: 0.25, size: 10, color: S.faint, font: INTER});
  const notes = (c, x, y, w, heads) => {
    let yy = y;
    heads.forEach(([h, b]) => {
      c.text(h, {x, y: yy, w, h: 0.3, size: 13, color: S.acc, font: SANS, bold: true});
      c.text(b, {x, y: yy + 0.33, w, h: 0.9, size: 14, color: S.text, font: SANS, lh: 1.3});
      yy += 1.35;
    });
  };
  const cs = {stroke: S.acc, fill: S.acc, line: S.acc, color: 'FFFFFF', font: SANS, size: 12, ring: 0.2, r: 0.06};
  return {name: 'international', label: '海外组会', pages: [
    (c) => {
      frame(c, '剪掉 2 条对话内消息，总结者的答案从错误的 8 变成正确的 [[12]]', '[Fig. 4]');
      const gl = K.figure(c, A.left, {x: 0.6, y: 1.6, w: 3.9, h: 5.2}, 'top');
      const gr = K.figure(c, A.right, {x: 4.75, y: 1.6, w: 3.9, h: 5.2}, 'top');
      c.text('原拓扑', {x: gl.x, y: gl.y + gl.h + 0.05, w: gl.w, h: 0.3, size: 12, color: S.muted, font: SANS, align: 'center'});
      c.text('AgentPrune 剪枝后', {x: gr.x, y: gr.y + gr.h + 0.05, w: gr.w, h: 0.3, size: 12, color: S.acc, font: SANS, align: 'center', bold: true});
      K.callout(c, K.at(gr, A.cut1), {x: 9.05, y: 1.7, w: 3.6, h: 0.38}, A.c1, cs);
      K.callout(c, K.at(gr, A.cut2), {x: 9.05, y: 2.3, w: 3.6, h: 0.38}, A.c2, cs);
      K.ring(c, K.at(gl, A.cross), 0.26, S.acc);
      K.ring(c, K.at(gr, A.check), 0.26, '16A34A');
      notes(c, 9.05, 3.05, 3.7, [['怎么判断', '每条边一个可学习分数 S^{S}，与系统效用一起优化'], ['何时剪', '训练 K′ 轮后按 TopK 一次性剪掉 p%，之后拓扑固定'], ['这个例子', 'Thinker 2 不再沿用“n 不能超过 24”，答案由 8 变 12']]);
      src(c, SRC.f4);
    },
    (c) => {
      frame(c, '上一轮 4 条发言只带 2 条进下一轮，一轮 token 从 7,295 降到 [[3,425]]', '[Fig. 4]');
      const g = K.figure(c, B.temporal, {x: 0.6, y: 1.65, w: 12.1, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.2, y: 3.7, w: 1.6, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 8.7, y: 3.7, w: 1.6, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.kept[0]), {x: 10.9, y: 3.7, w: 1.8, h: 0.34}, '保留 Answer 3', {...cs, fill: '16A34A', line: '16A34A', stroke: '16A34A'});
      K.ledger(c, {x: 0.6, y: 4.35, w: 7.2, h: 2.3}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.acc, rule: S.rule, size: 16, lastSize: 20});
      notes(c, 8.5, 4.35, 4.2, [['跨轮开销降得最多', '对话间 5,036 → 1,944（−61.4%），对话内 −34.4%'], ['同一个掩码框架', '时间边由 S^{T} 打分，与空间边一起剪']]);
      src(c, SRC.f4 + ' · token 由图中算式求和');
    },
    (c) => {
      frame(c, '接入 GPTSwarm 后，GSM8K 的 API 成本从 $234.76 降到 [[$57.17]]，精度还高了 0.84', '[Table 3]');
      c.text('API 成本（美元）', {x: 0.6, y: 1.55, w: 4, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true});
      c.text('精度变化', {x: 7.65, y: 1.55, w: 1.2, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true, align: 'right'});
      K.hbars(c, {x: 0.6, y: 1.9, w: 8.3, h: 4.9}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'D1D5DB', after: S.acc, fmt: K.money, labelW: 2.4, extraW: 0.95, boldFirst: true,
        extra: (r, b) => c.text(r.dp, {x: b.x, y: b.y, w: 0.95, h: b.h, size: 14, bold: true, color: r.dp.startsWith('+') ? '16A34A' : 'DC2626', font: INTER, align: 'right', valign: 'middle'})});
      notes(c, 9.35, 1.9, 3.4, [['越大越省', 'GSM8K 一组省下 $177.58，是 6 组中最多的'], ['几乎不掉点', '6 组中 5 组精度上升，唯一下降 0.93'], ['token', 'prompt token 降 28.1%–72.8%']]);
      src(c, SRC.t3);
    },
  ]};
})();

// ---------------------------------------------------------------- keynote-minimal (true minimal: image ≥ 70% or one big number with evidence)
const keynote = (() => {
  const S = {text: '111111', muted: '8A8A8A', acc: 'FF3B30'};
  return {name: 'keynote-minimal', label: '极简 Keynote', pages: [
    (c) => {
      c.bg('FFFFFF');
      const g = K.figure(c, A.full, {x: 0, y: 0, w: 9.97, h: 7.5}, 'left');
      K.spotlight(c, g, F.right, 'FFFFFF', 0.72);
      K.ring(c, K.at(g, F.cut1), 0.28, S.acc, 3.5);
      K.ring(c, K.at(g, F.cut2), 0.28, S.acc, 3.5);
      c.text('剪掉两条消息，\n答案反而对了。'.split('\n'), {x: 10.2, y: 2.6, w: 3.1, h: 1.8, size: 28, color: S.text, font: SANS, bold: true, lh: 1.25});
      c.text('8（错）→ 12（对）', {x: 10.3, y: 4.5, w: 2.9, h: 0.4, size: 16, color: S.acc, font: SANS, bold: true});
      c.text(SRC.f4, {x: 10.3, y: 6.95, w: 2.9, h: 0.3, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg('FFFFFF');
      c.text('一轮 token', {x: 0.8, y: 0.9, w: 6, h: 0.5, size: 20, color: S.muted, font: SANS});
      c.text('7,295 → [[3,425]]', {x: 0.8, y: 1.4, w: 11.8, h: 2.0, size: 96, color: S.text, font: INTER, bold: true, acc: S.acc});
      c.text('只把上一轮 4 条发言中的 2 条带进下一轮', {x: 0.8, y: 3.45, w: 11, h: 0.5, size: 20, color: S.text, font: SANS});
      const g = K.figure(c, B.temporal, {x: 0.8, y: 4.45, w: 11.7, h: 1.8}, 'left');
      c.text(SRC.f4, {x: 0.8, y: 6.95, w: 6, h: 0.3, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg('FFFFFF');
      c.text('接到现有系统上，成本直接打折。', {x: 0.8, y: 0.55, w: 11.5, h: 0.7, size: 30, color: S.text, font: SANS, bold: true});
      K.hbars(c, {x: 0.8, y: 1.6, w: 11.7, h: 5.0}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'E5E5E5', after: S.acc, fmt: K.money, labelW: 2.7, labelSize: 14, valSize: 13});
      c.text(SRC.t3, {x: 0.8, y: 6.95, w: 8, h: 0.3, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- systems-talk
const systems = (() => {
  const S = {navy: '1F3A5F', ours: 'E4572E', text: '1A1A1A', muted: '555555', base: '8A99AD', rule: 'D9D9D9', dark: '1E2633', tint: 'FDE8E2'};
  const frame = (c, stage, title) => {
    c.bg('FFFFFF');
    ['动机', '方法', '实验'].forEach((s, i) => {
      c.rect({x: 0.6 + i * 1.25, y: 0.3, w: 1.15, h: 0.3, fill: i === stage ? S.navy : 'EEF1F4', r: 0.05});
      c.text(s, {x: 0.6 + i * 1.25, y: 0.3, w: 1.15, h: 0.3, size: 11, color: i === stage ? 'FFFFFF' : S.muted, font: SANS, bold: i === stage, align: 'center', valign: 'middle'});
    });
    c.text(title, {x: 0.6, y: 0.75, w: 12.1, h: 0.6, size: 25, color: S.text, font: SANS, bold: true, acc: S.ours});
  };
  const chip = (c, x, y, t, ours) => { c.rect({x, y, w: 2.6, h: 0.36, fill: ours ? S.ours : S.base, r: 0.18}); c.text(t, {x, y, w: 2.6, h: 0.36, size: 12, color: 'FFFFFF', font: SANS, bold: true, align: 'center', valign: 'middle'}); };
  const insight = (c, items) => {
    c.rect({x: 0, y: 6.45, w: W, h: 1.05, fill: S.dark});
    items.forEach((t, i) => {
      const x = 0.6 + i * 4.15;
      c.text('Insight ' + (i + 1), {x, y: 6.55, w: 3.9, h: 0.28, size: 11, color: 'F6C343', font: INTER, bold: true});
      c.text(t, {x, y: 6.83, w: 3.95, h: 0.6, size: 13, color: 'FFFFFF', font: SANS, lh: 1.2});
    });
  };
  const cs = {stroke: S.ours, fill: S.tint, line: S.ours, color: S.ours, font: SANS, size: 12, ring: 0.2, r: 0.05};
  return {name: 'systems-talk', label: '系统顶会报告', pages: [
    (c) => {
      frame(c, 1, '剪掉 2 条对话内消息，答案从 8 变成 [[12]]：冗余通信在帮倒忙');
      chip(c, 0.6, 1.55, 'Baseline · 6 条边', false); chip(c, 6.9, 1.55, 'AgentPrune · 4 条边', true);
      const gl = K.figure(c, A.left, {x: 0.6, y: 2.0, w: 4.2, h: 4.3}, 'top-left');
      const gr = K.figure(c, A.right, {x: 6.9, y: 2.0, w: 4.2, h: 4.3}, 'top-left');
      c.text('→', {x: 5.0, y: 3.6, w: 1.6, h: 0.9, size: 48, color: S.ours, font: INTER, bold: true, align: 'center'});
      K.callout(c, K.at(gr, A.cut1), {x: 11.1, y: 2.2, w: 1.95, h: 0.55}, '① 剪掉\nT1 → T2'.split('\n'), cs);
      K.callout(c, K.at(gr, A.cut2), {x: 11.1, y: 4.1, w: 1.95, h: 0.55}, '② 剪掉\nT1 → 总结者'.split('\n'), cs);
      c.text('答 8（错）', {x: gl.x + gl.w - 1.5, y: gl.y + gl.h - 0.32, w: 1.5, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true, align: 'right'});
      c.text('答 12（对）', {x: gr.x + gr.w - 1.5, y: gr.y + gr.h - 0.32, w: 1.5, h: 0.3, size: 12, color: S.ours, font: SANS, bold: true, align: 'right'});
      insight(c, ['每条边一个可学习分数 S^{S}，与系统效用一起优化', '训练 K′ 轮后按 TopK 一次性剪 p%，之后拓扑固定', '被剪的 T1→T2 曾把“n 小于 24”传给 Thinker 2']);
    },
    (c) => {
      frame(c, 1, '跨轮历史只留 2 条，一轮 token 降 [[53%]]');
      const g = K.figure(c, B.temporal, {x: 0.6, y: 1.5, w: 12.1, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.4, y: 3.5, w: 1.5, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 8.8, y: 3.5, w: 1.5, h: 0.34}, '剪掉', cs);
      chip(c, 0.6, 3.5, 'Baseline', false); chip(c, 3.3, 3.5, 'AgentPrune', true);
      K.ledger(c, {x: 0.6, y: 4.0, w: 7.6, h: 2.25}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.ours, rule: S.rule, size: 16, lastSize: 20});
      c.rect({x: 8.9, y: 4.05, w: 3.8, h: 2.15, fill: S.tint, r: 0.08});
      c.text('2.1×', {x: 8.9, y: 4.15, w: 3.8, h: 1.1, size: 60, color: S.ours, font: INTER, bold: true, align: 'center'});
      c.text('每轮 token 少 2.1 倍（7,295 / 3,425）', {x: 9.05, y: 5.35, w: 3.5, h: 0.7, size: 13, color: S.text, font: SANS, align: 'center'});
      insight(c, ['跨轮开销最大：5,036 → 1,944（−61.4%）', '时间边由 S^{T} 打分，与空间边一起剪', '空间、时间两类边共用“掩码 + TopK”同一套流程']);
    },
    (c) => {
      frame(c, 2, '数据集越大越省：GSM8K · GPTSwarm 便宜了 [[4.1×]]');
      c.text('API 成本（美元）', {x: 0.6, y: 1.5, w: 4, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true});
      c.text('便宜', {x: 7.9, y: 1.5, w: 0.9, h: 0.3, size: 12, color: S.muted, font: SANS, bold: true, align: 'right'});
      K.hbars(c, {x: 0.6, y: 1.85, w: 8.2, h: 4.45}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: S.base, after: S.ours, fmt: K.money, labelW: 2.4, extraW: 0.9, boldFirst: true,
        extra: (r, b) => c.text(ratio(r), {x: b.x, y: b.y, w: 0.9, h: b.h, size: 16, bold: true, color: S.ours, font: INTER, align: 'right', valign: 'middle'})});
      c.rect({x: 9.3, y: 1.9, w: 3.45, h: 4.3, fill: 'F6F7F9', r: 0.08});
      c.text(['GSM8K · GPTSwarm', '$234.76 → $57.17', '精度 89.74 → 90.58'], {x: 9.5, y: 2.1, w: 3.1, h: 1.4, size: 15, color: S.text, font: SANS, lh: 1.45, paraGap: 2});
      c.text('MMLU · GPTSwarm 是 6 组中唯一掉点的（83.98 → 83.05）', {x: 9.5, y: 3.8, w: 3.1, h: 1.0, size: 13, color: S.muted, font: SANS, lh: 1.3});
      c.text('Ratio = 接入前 / 接入后成本', {x: 9.5, y: 5.6, w: 3.1, h: 0.4, size: 11, color: S.muted, font: SANS});
      insight(c, ['prompt token 降 28.1%–72.8%', '6 组中 5 组精度上升', 'GSM8K 约 8.5K 条，规模越大省得越多']);
    },
  ]};
})();

// ---------------------------------------------------------------- theory (rebuilt as modern Metropolis)
const metropolis = (() => {
  const S = {bar: '23373B', orange: 'EB811B', text: '23373B', muted: '6B7B7E', bg: 'FAFAFA', block: 'EDEFF0', green: '14B03D'};
  const frame = (c, title, p, n) => {
    c.bg(S.bg);
    c.rect({x: 0, y: 0, w: W, h: 0.95, fill: S.bar});
    c.text(title, {x: 0.55, y: 0, w: 12, h: 0.95, size: 24, color: 'FFFFFF', font: FIRA, valign: 'middle'});
    c.rect({x: 0, y: 0.95, w: W * p, h: 0.05, fill: S.orange});
    c.text(String(n), {x: W - 1.2, y: 7.05, w: 0.8, h: 0.3, size: 11, color: S.muted, font: FIRA, align: 'right'});
  };
  const block = (c, x, y, w, h, head, body, alert) => {
    c.rect({x, y, w, h: 0.42, fill: alert ? S.orange : S.bar});
    c.text(head, {x: x + 0.15, y, w: w - 0.3, h: 0.42, size: 14, color: 'FFFFFF', font: SANS, bold: true, valign: 'middle'});
    c.rect({x, y: y + 0.42, w, h: h - 0.42, fill: S.block});
    c.text(body, {x: x + 0.18, y: y + 0.55, w: w - 0.36, h: h - 0.6, size: 14, color: S.text, font: SANS, lh: 1.35, acc: S.orange, accBold: true});
  };
  return {name: 'theory-beamer', label: '现代 Metropolis 理论风', pages: [
    (c) => {
      frame(c, '把 0/1 通信图松弛成可学习的掩码', 0.42, 9);
      const g = K.figure(c, B.eq7, {x: 0.8, y: 1.35, w: 11.4, h: 0.85});
      const box = (x0, x1, col) => c.rect({x: g.x + x0 * g.w - 0.05, y: g.y - 0.05, w: (x1 - x0) * g.w + 0.1, h: g.h + 0.1, line: col, lw: 2.25, r: 0.06});
      box(0.675, 0.828, S.orange); box(0.835, 0.99, '2E86DE');
      c.text('空间（对话内）', {x: g.x + 0.68 * g.w, y: g.y + g.h + 0.12, w: 2.1, h: 0.3, size: 13, color: S.orange, font: SANS, bold: true});
      c.text('时间（对话间）', {x: g.x + 0.845 * g.w, y: g.y + g.h + 0.12, w: 2.1, h: 0.3, size: 13, color: '2E86DE', font: SANS, bold: true});
      c.text('式 (7)', {x: 0.8, y: g.y + g.h + 0.12, w: 2, h: 0.3, size: 11, color: S.muted, font: SANS});
      block(c, 0.8, 2.95, 6.2, 2.15, '符号', ['A^{S}、A^{T}：原系统给定的 0/1 邻接矩阵（空间 / 时间）', 'S^{S}、S^{T}：可学习的连续掩码，值越大这条边越重要', '⊙：逐元素相乘，把“有没有边”变成“边有多重要”'], false);
      block(c, 0.8, 5.3, 6.2, 1.45, '训练完之后', ['按 S 的大小保留 (1 − p%) 的边，其余一次性剪掉（式 12）'], true);
      const gs = K.graph(c, {x: 7.6, y: 3.05, w: 5.0, h: 3.0}, A, {font: SANS, edge: S.bar, cut: S.orange, node: 'FFFFFF', nodeLine: S.bar, nodeText: S.text, nodeW: 1.45, nodeH: 0.5, nodeSize: 12, nodeR: 0.05});
      Object.values(gs).forEach((p) => K.ring(c, p, 0.18, S.orange, 2));
      c.text('图 4 示例的空间图（重绘）：虚线为最终被剪掉的 2 条边', {x: 7.6, y: 6.2, w: 5.0, h: 0.5, size: 11, color: S.muted, font: SANS, lh: 1.2});
    },
    (c) => {
      frame(c, '优化目标：既要系统效用高，又要掩码低秩', 0.5, 10);
      const g = K.figure(c, B.eq8, {x: 0.6, y: 1.25, w: 12.1, h: 1.35});
      const br = (x0, x1, col, label, sub) => {
        c.rect({x: g.x + x0 * g.w, y: g.y + g.h + 0.08, w: (x1 - x0) * g.w, h: 0.05, fill: col});
        c.text(label, {x: g.x + x0 * g.w, y: g.y + g.h + 0.2, w: (x1 - x0) * g.w + 0.6, h: 0.3, size: 13, color: col, font: SANS, bold: true});
      };
      br(0.11, 0.41, S.orange, '① 分布近似'); br(0.42, 0.61, '2E86DE', '② 低秩稀疏'); br(0.63, 0.93, S.muted, '约束：掩码不能偏离原图太远');
      block(c, 0.6, 3.25, 5.95, 1.6, '① 不可导 → 策略梯度（式 9–10）', ['效用 φ 来自真实调用 LLM、无法求导，用[[策略梯度]]估计其梯度'], false);
      block(c, 6.75, 3.25, 5.95, 1.6, '② rank 难优化 → 核范数（式 11）', ['rank(S) 非凸，用[[核范数]]近似，让掩码低秩、稀疏'], false);
      block(c, 0.6, 5.1, 12.1, 1.75, '③ 训练 K′ 轮后一次性剪枝（式 12），剩余 K − K′ 轮拓扑固定', [''], true);
      K.figure(c, B.eq12, {x: 3.0, y: 5.7, w: 7.3, h: 0.95});
    },
    (c) => {
      frame(c, 'Obs. 7：剪枝顺带提升了抗攻击能力', 0.82, 19);
      K.vbars(c, {x: 1.2, y: 1.35, w: 7.4, h: 5.4}, ATK.rows, {font: SANS, numFont: FIRA, text: S.text, muted: S.muted, axis: S.muted, before: 'C9D1D3', after: '7A8B8F', oursBefore: 'F6C08A', oursAfter: S.orange, oursText: S.orange, bad: 'C0392B', labelSize: 10.5});
      c.rect({x: 1.3, y: 1.4, w: 0.22, h: 0.14, fill: 'C9D1D3'}); c.text('攻击前', {x: 1.58, y: 1.33, w: 1, h: 0.28, size: 11, color: S.muted, font: SANS});
      c.rect({x: 2.5, y: 1.4, w: 0.22, h: 0.14, fill: '7A8B8F'}); c.text('攻击后（橙色 = 用了 AgentPrune）', {x: 2.78, y: 1.33, w: 4, h: 0.28, size: 11, color: S.muted, font: SANS});
      block(c, 9.0, 1.4, 3.75, 2.6, 'Observation', ['受提示攻击时，AutoGen 掉 [[5.9]] 分，接入后只掉 [[0.2]]'], true);
      block(c, 9.0, 4.2, 3.75, 2.5, '为什么', ['被剪掉的边往往正是传递错误或恶意内容的边（附录图 38 案例）'], false);
      c.text(SRC.f6, {x: 1.2, y: 7.05, w: 8, h: 0.3, size: 10, color: S.muted, font: SANS});
    },
  ]};
})();

// ---------------------------------------------------------------- dark-tech
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
      frame(c, '// METHOD · SPATIAL PRUNING', '剪掉 2 条消息，答案从 8 变成 [[12]]');
      const g = K.figure(c, A.full, {x: 0.6, y: 1.6, w: 7.6, h: 5.7}, 'top-left', {fill: 'FFFFFF', pad: 0.06, r: 0.04});
      K.spotlight(c, g, F.right, S.bg, 0.72);
      K.callout(c, K.at(g, F.cut1), {x: 8.65, y: 1.75, w: 3.0, h: 0.4}, A.c1.replace('Thinker ', 'T'), cs);
      K.callout(c, K.at(g, F.cut2), {x: 8.65, y: 3.25, w: 3.4, h: 0.4}, A.c2.replace('Thinker ', 'T'), cs);
      K.callout(c, K.at(g, F.check), {x: 8.65, y: 4.6, w: 2.6, h: 0.4}, A.cR, {...cs, stroke: S.green, line: S.green, color: S.green});
      c.text(['S^{S}：每条对话内边一个可学习分数', '训练 K′ 轮 → TopK 一次性剪 p%', '6 条边 → 4 条边'], {x: 8.65, y: 5.4, w: 4.2, h: 1.5, size: 13, color: S.muted, font: SANS, lh: 1.5});
      c.text(SRC.f4, {x: 0.6, y: 7.18, w: 6, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
    (c) => {
      frame(c, '// METHOD · TEMPORAL PRUNING', '一轮 token：7,295 → [[3,425]]');
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
      frame(c, '// RESULTS · ROBUSTNESS', '受提示攻击：AutoGen 掉 5.9 分，接入后只掉 [[0.2]]');
      K.vbars(c, {x: 1.1, y: 1.7, w: 8.0, h: 5.2}, ATK.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, axis: S.rule, before: '3A4756', after: '6B7A8C', oursBefore: '155E75', oursAfter: S.cyan, oursText: S.cyan, bad: S.pink});
      c.text(['攻击前 / 攻击后，MMLU', '青色 = 接入 AgentPrune'], {x: 9.6, y: 1.8, w: 3.2, h: 0.8, size: 12, color: S.muted, font: SANS, lh: 1.4});
      ATK.points.forEach((t, i) => {
        c.rect({x: 9.6, y: 2.85 + i * 1.35, w: 0.06, h: 1.05, fill: S.cyan});
        c.text(t, {x: 9.8, y: 2.85 + i * 1.35, w: 3.0, h: 1.1, size: 13.5, color: S.text, font: SANS, lh: 1.3});
      });
      c.text(SRC.f6, {x: 0.6, y: 7.18, w: 8, h: 0.25, size: 9, color: S.muted, font: MONO});
    },
  ]};
})();

// ---------------------------------------------------------------- editorial
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
      frame(c, 'METHOD · 空间剪枝', '少传两条消息，答案反而对了');
      const gl = K.figure(c, A.left, {x: 4.3, y: 2.05, w: 4.1, h: 4.95}, 'top');
      const gr = K.figure(c, A.right, {x: 8.55, y: 2.05, w: 4.1, h: 4.95}, 'top');
      [[gr, A.cut1, 1], [gr, A.cut2, 2], [gr, A.strike, 3], [gl, A.cross, 4]].forEach(([g, f, n]) => { const p = K.at(g, f); K.ring(c, p, 0.2, S.red, 2); K.badge(c, {x: p.x - 0.32, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16}); });
      note(c, 0.7, 2.1, 3.3, 1, '剪掉 Thinker 1 发给 Thinker 2 的回答');
      note(c, 0.7, 3.05, 3.3, 2, '剪掉 Thinker 1 发给总结者的回答');
      note(c, 0.7, 4.0, 3.3, 3, 'Thinker 2 不再沿用“n 不能超过 24”');
      note(c, 0.7, 4.95, 3.3, 4, '原拓扑总结者答 8，剪枝后答 12（正确）');
      c.line({x1: 0.7, y1: 6.05, x2: 4.0, y2: 6.05, color: S.rule, lw: 1});
      c.text('每条边一个可学习分数，训练 K′ 轮后一次性剪掉 p%。', {x: 0.7, y: 6.15, w: 3.3, h: 0.8, size: 12, color: S.muted, font: SERIF, italic: true, lh: 1.3});
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
      frame(c, 'RESULTS · 数字里的 AgentPrune', '更准、更省、更稳');
      const pick = [BENTO[0], BENTO[1], BENTO[4], BENTO[5]];
      pick.forEach((b, i) => {
        const x = 0.7 + i * 3.05;
        c.line({x1: x, y1: 2.15, x2: x + 2.8, y2: 2.15, color: S.ink, lw: 1});
        c.text(b.big, {x, y: 2.3, w: 2.9, h: 1.0, size: 42, color: i === 0 ? S.red : S.ink, font: SERIF, bold: true});
        c.text(b.unit, {x, y: 3.3, w: 2.8, h: 0.35, size: 14, color: S.muted, font: SERIF});
        c.text(b.label, {x, y: 3.75, w: 2.75, h: 1.1, size: 13.5, color: S.ink, font: SERIF, lh: 1.35});
        c.text(b.src, {x, y: 4.85, w: 2.8, h: 0.3, size: 10, color: S.red, font: SERIF, italic: true});
      });
      c.line({x1: 0.7, y1: 5.45, x2: W - 0.7, y2: 5.45, color: S.rule, lw: 1});
      c.text('六个基准上，AgentPrune-C 的平均精度高于所有基线；接入 AutoGen 与 GPTSwarm 后 prompt token 降 28.1%–72.8%；受到提示攻击时，接入后的系统几乎不掉点。', {x: 0.7, y: 5.6, w: 11.9, h: 1.2, size: 15, color: S.ink, font: SERIF, lh: 1.5});
      c.text(SRC.multi, {x: 0.7, y: 7.08, w: 8, h: 0.25, size: 9.5, color: S.muted, font: SERIF});
    },
  ]};
})();

// ---------------------------------------------------------------- defense-cn
const defense = (() => {
  const S = {red: '9E1B32', text: '222222', muted: '666666', rule: 'D8D8D8', tint: 'F7EEF0', gold: 'B8860B'};
  const CH = ['研究背景', '关键观察', '方法', '实验', '讨论'];
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
  const concl = (c, t) => { c.rect({x: 0.5, y: 6.45, w: W - 1, h: 0.5, fill: 'FFFFFF', line: S.red, lw: 1.25}); c.text('结论  ' + t, {x: 0.7, y: 6.45, w: W - 1.4, h: 0.5, size: 15, color: S.red, font: SANS, bold: true, valign: 'middle'}); };
  const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 12, ring: 0.2};
  return {name: 'defense-cn', label: '答辩 / 正式汇报', pages: [
    (c) => {
      frame(c, 2, '3.1 空间剪枝：剪掉对话内的冗余消息', 8);
      const gl = K.figure(c, A.left, {x: 0.5, y: 1.55, w: 3.95, h: 4.75}, 'top');
      const gr = K.figure(c, A.right, {x: 4.6, y: 1.55, w: 3.95, h: 4.75}, 'top');
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.2, S.red, 2.25); K.badge(c, {x: p.x - 0.36, y: p.y - 0.3}, n, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.15}); });
      K.ring(c, K.at(gl, A.cross), 0.25, S.red);
      side(c, 8.85, 1.55, 4.0, 4.75, '方法说明', ['对话内边：同一轮 agent 间的消息', '每条边一个可学习分数 S^{S}，与系统效用一起优化', '训练 K′ 轮后按 TopK 一次性剪 p%（式 12）', '图中 ① T1→T2、② T1→总结者 被剪掉；左答 8（错），右答 12（对）']);
      concl(c, '示例中 6 条边剪掉 2 条，答案由错变对');
    },
    (c) => {
      frame(c, 2, '3.2 时间剪枝：只把有用的历史带入下一轮', 9);
      const g = K.figure(c, B.temporal, {x: 0.5, y: 1.6, w: 12.33, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.5, y: 3.6, w: 1.5, h: 0.34}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 9.0, y: 3.6, w: 1.5, h: 0.34}, '剪掉', cs);
      K.ledger(c, {x: 0.6, y: 4.1, w: 7.4, h: 2.15}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.red, rule: S.rule});
      side(c, 8.4, 4.05, 4.43, 2.25, '计算依据', ['由图 4 底部算式求和', '对话间按图中“×4”累计']);
      concl(c, '每轮 token 由 7,295 降至 3,425（−53.0%）');
    },
    (c) => {
      frame(c, 3, '4.4 鲁棒性：受攻击时性能基本保持', 19);
      K.vbars(c, {x: 1.0, y: 1.6, w: 7.5, h: 4.75}, ATK.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, axis: S.muted, before: 'D9D9D9', after: '9A9A9A', oursBefore: 'E7B8C1', oursAfter: S.red, oursText: S.red, bad: '444444', labelSize: 10.5});
      side(c, 8.85, 1.55, 4.0, 4.75, '实验说明', ['MMLU，提示攻击（改写 agent 角色提示）', '浅色为攻击前，深色为攻击后', 'AutoGen 掉 5.9 分，接入后仅掉 0.2', '完全图掉 4.7 分，AgentPrune-C 仅掉 0.8']);
      concl(c, '剪枝在省成本的同时提升了抗攻击能力');
    },
  ]};
})();

// ---------------------------------------------------------------- jp-gothic (dense Japanese lab "paper reading" format)
const jp = (() => {
  const S = {navy: '0F2C59', teal: '0E7C86', text: '222222', muted: '666666', hl: 'FFF3A3', rule: 'BFC8D6'};
  const frame = (c, title, n) => {
    c.bg('FFFFFF');
    c.text(PAPER + '  [Zhang+, ICLR’25]', {x: 0.45, y: 0.18, w: 11, h: 0.28, size: 10, color: S.muted, font: INTER});
    c.text(title, {x: 0.45, y: 0.5, w: 12.4, h: 0.6, size: 24, color: S.navy, font: SANS, bold: true, acc: S.teal});
    c.rect({x: 0.45, y: 1.13, w: 12.43, h: 0.05, fill: S.navy});
    c.rect({x: 0.45, y: 1.18, w: 4.0, h: 0.05, fill: S.teal});
    c.text(String(n), {x: W - 1.0, y: 7.15, w: 0.6, h: 0.25, size: 10, color: S.muted, font: INTER, align: 'right'});
  };
  const list = (c, x, y, w, items) => {
    let yy = y;
    items.forEach((it) => {
      const [t, subs = []] = Array.isArray(it) ? it : [it];
      c.text('● ' + t, {x, y: yy, w, h: 0.7, size: 15, color: S.text, font: SANS, bold: true, lh: 1.25, acc: S.teal});
      const est = (str, size, ww) => Math.max(1, Math.ceil([...str].reduce((a, ch) => a + (/[\u2E80-\uFFEF]/.test(ch) ? 1 : 0.55), 0) * size / 72 / ww));
      yy += est('● ' + t, 15, w) * 0.37 + 0.05;
      subs.forEach((s) => { c.text('– ' + s, {x: x + 0.3, y: yy, w: w - 0.3, h: 0.6, size: 13, color: S.muted, font: SANS, lh: 1.25}); yy += est('– ' + s, 13, w - 0.3) * 0.32 + 0.04; });
      yy += 0.1;
    });
  };
  const concl = (c, t) => { c.rect({x: 0.45, y: 6.5, w: 12.43, h: 0.55, fill: S.hl}); c.text('⇒ ' + t, {x: 0.6, y: 6.5, w: 12.1, h: 0.55, size: 16, color: S.text, font: SANS, bold: true, valign: 'middle'}); };
  const cs = {stroke: 'D7263D', fill: 'FFFFFF', line: 'D7263D', color: 'D7263D', font: SANS, size: 11.5, ring: 0.19};
  return {name: 'jp-gothic', label: '日式研究室', pages: [
    (c) => {
      frame(c, '方法①：用[[空间剪枝]]去掉对话内的冗余消息', 8);
      list(c, 0.5, 1.45, 4.9, [['对象：同一轮内 agent 之间的消息', ['每条边一个可学习分数 S^{S}']], ['学习：掩码与系统效用一起优化', ['不可导部分用策略梯度（式 9–10）', '低秩稀疏用核范数近似（式 11）']], ['剪枝：训练 K′ 轮后按 TopK 一次性剪 p%', ['之后拓扑固定，持续省 token']], ['示例：6 条边剪掉 2 条', ['Thinker 2 不再沿用“n 不能超过 24”']]]);
      const gl = K.figure(c, A.left, {x: 5.55, y: 1.4, w: 3.6, h: 4.95}, 'top');
      const gr = K.figure(c, A.right, {x: 9.25, y: 1.4, w: 3.6, h: 4.95}, 'top');
      [[A.cut1, 1], [A.cut2, 2]].forEach(([f, n]) => { const p = K.at(gr, f); K.ring(c, p, 0.19, 'D7263D', 2); K.badge(c, {x: p.x - 0.34, y: p.y - 0.28}, n, {fill: 'D7263D', color: 'FFFFFF', font: INTER, size: 10, r: 0.14}); });
      K.ring(c, K.at(gl, A.cross), 0.22, 'D7263D');
      c.text('左：原拓扑（答 8，错）  右：剪枝后（答 12，对）  ①② 被剪的边  Fig. 4', {x: 5.55, y: 6.17, w: 7.3, h: 0.28, size: 10.5, color: S.muted, font: SANS, align: 'center'});
      concl(c, '去掉冗余通信后反而答对了（8 → 12）');
    },
    (c) => {
      frame(c, '方法②：用[[时间剪枝]]精简上一轮的历史', 9);
      const g = K.figure(c, B.temporal, {x: 0.5, y: 1.45, w: 12.38, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.6, y: 3.42, w: 1.3, h: 0.3}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 9.1, y: 3.42, w: 1.3, h: 0.3}, '剪掉', cs);
      list(c, 0.5, 3.9, 5.6, [['对象：上一轮发言是否写进下一轮提示词', ['由掩码 S^{T} 打分，与空间剪枝同时完成']], ['示例：4 条发言只保留 2 条', ['Answer 3 与 Conclusion 进入下一轮']]]);
      K.ledger(c, {x: 6.5, y: 3.9, w: 6.3, h: 2.4}, B.ledger, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, accent: S.teal, rule: S.rule});
      concl(c, '每轮 token：7,295 → 3,425（−53.0%）');
    },
    (c) => {
      frame(c, '实验：[[即插即用]]，直接降低现有框架的成本', 18);
      K.hbars(c, {x: 0.5, y: 1.5, w: 7.6, h: 4.85}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'C5CED9', after: S.teal, fmt: K.money, labelW: 2.35, boldFirst: true});
      list(c, 8.4, 1.5, 4.45, [['设置：5 个 gpt-4 agent', ['AutoGen / GPTSwarm × 3 数据集']], ['成本：GSM8K · GPTSwarm', ['$234.76 → $57.17，省 $177.58']], ['精度：6 组中 5 组上升', ['唯一下降：MMLU·GPTSwarm −0.93']], ['token：prompt 降 28.1%–72.8%']]);
      concl(c, '数据集越大，省得越多（Table 3）');
    },
  ]};
})();

module.exports = [domestic, international, keynote, systems, metropolis, dark, editorial, defense, jp];
