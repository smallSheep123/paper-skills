// 7 presets distilled from 2024–2025 references, v3: own composition per page type.
const {W, H} = require('./canvas');
const K = require('./kit');
const {SRC, VENUE, A, B, COST, EX} = require('./content');

const FULL = (x, y) => [(x - 188) / 627, (y - 140) / 472];
const SANS = 'Noto Sans SC', SERIF = 'Noto Serif SC', INTER = 'Inter', FIRA = 'Fira Sans', MONO = 'JetBrains Mono', PAG = 'TeX Gyre Pagella';
const short = (k) => k.replace(' · ', ' ');

// ---------------------------------------------------------------- annotated explainer (Raschka-style redrawn diagrams + bubbles)
const explainer = (() => {
  const S = {ink: '1A1A1A', muted: '6B6B6B', blue: '8EC9F0', blueLine: '2C7FB8', bubble: 'DCEFFB', red: 'D64545', green: '2E9E5B', node: 'FFFFFF', pink: 'FBE3E3', mint: 'DFF3E7'};
  const head = (c, t, sub) => { c.bg('FFFFFF'); c.text(t, {x: 0.6, y: 0.4, w: 12, h: 0.6, size: 26, color: S.ink, font: SANS, bold: true}); if (sub) c.text(sub, {x: 0.6, y: 1.0, w: 12, h: 0.35, size: 14, color: S.muted, font: SANS}); };
  const bub = {stroke: S.ink, fill: S.bubble, line: S.blueLine, color: S.ink, font: SANS, size: 13, r: 0.18, lw: 1.25, arrow: true};
  const gst = {font: SANS, edge: S.ink, cut: S.red, node: S.node, nodeS: 'FFF6D6', nodeLine: S.ink, nodeText: S.ink, nodeR: 0.12, nodeW: 1.6, nodeH: 0.56, nodeSize: 14};
  return {name: 'explainer', label: '标注讲解图（Raschka 风）', pages: [
    (c) => {
      head(c, '例题：错误前提沿着一条边传了下去', '题目：' + EX.q + '（图 4 原拓扑，重绘）');
      const box = {x: 3.6, y: 1.75, w: 6.1, h: 3.4};
      K.graph(c, box, A, gst, false);
      const P = (fx, fy) => ({x: box.x + fx * box.w, y: box.y + fy * box.h});
      K.callout(c, {x: P(0.18, 0.2).x - 0.85, y: P(0.18, 0.2).y}, {x: 0.4, y: 1.75, w: 2.85, h: 1.0}, ['Thinker 1', '“n should be smaller', 'than 24”'], {...bub, fill: S.pink, line: S.red, size: 12});
      K.callout(c, {x: P(0.82, 0.2).x + 0.85, y: P(0.82, 0.2).y}, {x: 10.15, y: 1.75, w: 2.7, h: 1.0}, ['Thinker 2', '沿用“不超过 24”，答 8'], {...bub, fill: S.pink, line: S.red, size: 12.5});
      K.callout(c, {x: P(0.18, 0.8).x - 0.85, y: P(0.18, 0.8).y}, {x: 0.5, y: 4.15, w: 2.7, h: 0.9}, ['Thinker 3', '答 8'], {...bub, size: 12.5});
      K.callout(c, {x: P(0.82, 0.8).x + 0.85, y: P(0.82, 0.8).y}, {x: 10.15, y: 4.15, w: 2.7, h: 0.9}, ['总结者', '3 个回答 5、8、8 → 答 8'], {...bub, size: 12.5});
      c.rect({x: 0.5, y: 5.45, w: 12.35, h: 1.2, fill: S.mint, r: 0.18});
      c.text(['剪掉 Thinker 1 → 2、Thinker 1 → 总结者之后', 'Thinker 2 删去这条限制答 12；Thinker 3 写“Answer 1 set n<24, which is not reasonable.”；总结者答 12（图中标为正确）。'], {x: 0.75, y: 5.5, w: 11.9, h: 1.1, size: 13.5, color: S.ink, font: SANS, lh: 1.4, valign: 'middle'});
      c.text(EX.caveat, {x: 0.6, y: 6.75, w: 12, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      c.text('重绘自 ' + EX.src, {x: 0.6, y: 7.08, w: 8, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
    (c) => {
      head(c, '同一个问题，少传两条消息', '图 4 的空间拓扑重绘：左为原系统，右为 AgentPrune 剪枝后');
      c.text('原系统：6 条边', {x: 0.6, y: 1.45, w: 5.6, h: 0.35, size: 15, color: S.ink, font: SANS, bold: true, align: 'center'});
      K.graph(c, {x: 0.6, y: 2.1, w: 5.6, h: 3.6}, A, gst, false);
      c.text('AgentPrune 后：4 条边', {x: 7.1, y: 1.45, w: 5.6, h: 0.35, size: 15, color: S.blueLine, font: SANS, bold: true, align: 'center'});
      const mid = K.graph(c, {x: 7.1, y: 2.1, w: 5.6, h: 3.6}, A, gst, true);
      K.callout(c, mid[1], {x: 8.6, y: 1.95, w: 2.6, h: 0.42}, '剪掉：Thinker 1 → 2', bub);
      K.callout(c, mid[2], {x: 10.2, y: 3.55, w: 2.6, h: 0.42}, '剪掉：Thinker 1 → 总结者', bub);
      c.rect({x: 0.6, y: 6.0, w: 5.6, h: 0.75, fill: S.pink, r: 0.18});
      c.text('总结者输出：答案是 8', {x: 0.6, y: 6.0, w: 5.6, h: 0.75, size: 15, color: S.red, font: SANS, bold: true, align: 'center', valign: 'middle'});
      c.rect({x: 7.1, y: 6.0, w: 5.6, h: 0.75, fill: S.mint, r: 0.18});
      c.text('总结者输出：答案是 12（图中标为正确）', {x: 7.1, y: 6.0, w: 5.6, h: 0.75, size: 15, color: S.green, font: SANS, bold: true, align: 'center', valign: 'middle'});
      c.line({x1: 6.35, y1: 3.9, x2: 6.95, y2: 3.9, color: S.ink, lw: 2, arrow: true});
      c.text('重绘自 ' + SRC.f4, {x: 0.6, y: 7.08, w: 8, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
    (c) => {
      head(c, '跨轮只带有用的历史', '上一轮的发言会写进下一轮的提示词；AgentPrune 只保留其中 2 条');
      c.text('第 t 轮发言历史', {x: 0.6, y: 1.7, w: 6, h: 0.35, size: 14, color: S.muted, font: SANS, bold: true});
      K.history(c, {x: 0.6, y: 2.15, w: 7.4, h: 0.55}, B.history, {font: SANS, keepFill: S.bubble, keepLine: S.blueLine, keepText: S.ink, dropFill: 'F2F2F2', dropLine: 'B5B5B5', dropText: '9A9A9A', r: 0.16, size: 14});
      c.line({x1: 4.3, y1: 2.85, x2: 4.3, y2: 3.55, color: S.ink, lw: 2, arrow: true});
      c.rect({x: 0.6, y: 3.65, w: 7.4, h: 0.75, fill: 'FFF6D6', line: S.ink, lw: 1.25, r: 0.14});
      c.text('第 t+1 轮提示词：Given the last round’s utterance: {Answer 3, Conclusion} …', {x: 0.8, y: 3.65, w: 7.1, h: 0.75, size: 13, color: S.ink, font: SANS, valign: 'middle'});
      c.text('↑ Answer 1、2 被剪掉，不再进入下一轮', {x: 0.6, y: 2.85, w: 3.6, h: 0.35, size: 12.5, color: S.red, font: SANS, bold: true});
      c.text(['为什么省得多：', '图 4 算式里，对话间一项带 ×4，占剪枝前总量的 69%（5,036 / 7,295），所以剪它收益最大。'], {x: 0.6, y: 4.8, w: 7.4, h: 1.8, size: 14, color: S.ink, font: SANS, lh: 1.45});
      K.ledger(c, {x: 8.6, y: 1.75, w: 4.2, h: 2.6}, B.ledger, {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, accent: S.blueLine, rule: S.ink, size: 14, lastSize: 17, headSize: 11});
      c.rect({x: 8.6, y: 4.75, w: 4.2, h: 0.85, fill: S.bubble, line: S.blueLine, lw: 1.25, r: 0.18});
      c.text(['跨轮（对话间）降得最多', '5,036 → 1,944（−61.4%）'], {x: 8.6, y: 4.75, w: 4.2, h: 0.85, size: 13, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
      c.text('重绘自 ' + SRC.f4 + '；token 由图中算式求和', {x: 0.6, y: 7.08, w: 9, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
    (c) => {
      head(c, '接上 AgentPrune，6 条成本线全部往下走', '据表 3 重绘：左端为接入前（= 100%），右端为接入后的成本占比');
      const x0 = 1.6, x1 = 7.2, y0 = 1.9, y1 = 6.5; const Y = (p) => y1 - (y1 - y0) * p / 100;
      [0, 50, 100].forEach(p => { c.line({x1: x0, y1: Y(p), x2: x1, y2: Y(p), color: 'E3E3E3', lw: 0.75, dash: true}); c.text(p + '%', {x: x0 - 0.75, y: Y(p) - 0.13, w: 0.6, h: 0.26, size: 11, color: S.muted, font: INTER, align: 'right'}); });
      c.line({x1: x0, y1: y0, x2: x0, y2: y1, color: S.ink, lw: 1.5}); c.line({x1: x1, y1: y0, x2: x1, y2: y1, color: S.ink, lw: 1.5});
      c.text('接入前', {x: x0 - 0.6, y: y1 + 0.1, w: 1.2, h: 0.3, size: 13, color: S.ink, font: SANS, bold: true, align: 'center'});
      c.text('接入后', {x: x1 - 0.6, y: y1 + 0.1, w: 1.2, h: 0.3, size: 13, color: S.blueLine, font: SANS, bold: true, align: 'center'});
      const rows = COST.rows.map(r => ({...r, p: 100 * r.b / r.a})).sort((a, b) => b.p - a.p);
      let last = -9; rows.forEach(r => { let ly = Y(r.p); if (ly - last < 0.33) ly = last + 0.33; last = ly; r.ly = ly; });
      rows.forEach(r => {
        const hot = r.k === 'GSM8K · GPTSwarm';
        c.line({x1: x0, y1: Y(100), x2: x1, y2: Y(r.p), color: hot ? S.blueLine : 'A9C9E0', lw: hot ? 3.5 : 2});
        c.ellipse({x: x1 - 0.08, y: Y(r.p) - 0.08, w: 0.16, h: 0.16, fill: hot ? S.blueLine : 'A9C9E0'});
        c.text(Math.round(r.p) + '%  ' + short(r.k), {x: x1 + 0.2, y: r.ly - 0.15, w: 3.2, h: 0.3, size: 12.5, color: hot ? S.blueLine : S.ink, font: SANS, bold: hot, valign: 'middle'});
      });
      c.ellipse({x: x0 - 0.1, y: Y(100) - 0.1, w: 0.2, h: 0.2, fill: S.ink});
      K.callout(c, {x: x1 - 0.1, y: Y(24.4) + 0.05}, {x: 3.2, y: 5.35, w: 3.3, h: 0.75}, ['最省：GSM8K · GPTSwarm', '$234.76 → $57.17'], bub);
      c.rect({x: 10.5, y: 1.9, w: 2.35, h: 4.6, fill: 'F6F6F6', r: 0.18});
      c.text(['效果', '6 组中 5 组上升', '', '唯一下降', 'MMLU · GPTSwarm −0.93', '', 'HumanEval 用 pass@1，其余用准确率'], {x: 10.7, y: 2.05, w: 2.0, h: 4.3, size: 12.5, color: S.ink, font: SANS, lh: 1.35});
      c.text(SRC.t3, {x: 0.6, y: 7.08, w: 9, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- modern lecture (Stanford CS348K 2024)
const lecture = (() => {
  const S = {ink: '111111', muted: '555555', red: '8C1515', blue: '1F6FB2', rule: 'CCCCCC', light: 'D0D0D0'};
  const head = (c, t) => {
    c.bg('FFFFFF');
    c.text(t, {x: 0.55, y: 0.35, w: 10.4, h: 0.6, size: 28, color: S.ink, font: FIRA, bold: true});
    c.text('[Zhang et al. 2025]', {x: 10.6, y: 0.4, w: 2.2, h: 0.3, size: 11, color: S.muted, font: FIRA, align: 'right'});
    c.text('组会 · AgentPrune', {x: 9.8, y: 7.12, w: 3, h: 0.25, size: 9.5, color: S.muted, font: SANS, align: 'right'});
  };
  const bullets = (c, x, y, w, items, size = 16) => {
    let yy = y;
    items.forEach((t) => { c.rect({x, y: yy + 0.13, w: 0.1, h: 0.1, fill: S.ink}); c.text(t, {x: x + 0.25, y: yy, w: w - 0.25, h: 0.6, size, color: S.ink, font: SANS, acc: S.red, accBold: true}); yy += size > 15 ? 0.45 : 0.4; });
  };
  const cs = {stroke: S.red, fill: 'FFFFFF', line: S.red, color: S.red, font: SANS, size: 12, ring: 0.2};
  return {name: 'lecture', label: '现代讲课风（Stanford CS348K）', pages: [
    (c) => {
      head(c, 'Running example: 和为 240 的连续奇数数列有几个？');
      bullets(c, 0.6, 1.15, 12, ['3 个 Thinker 各自解题，Summarizer 汇总；原拓扑下总结者答 [[8]]', '下面是原图中两段输出（放大）：Thinker 2 的限制来自 Thinker 1']);
      const g1 = K.figure(c, EX.t1Before, {x: 0.9, y: 2.3, w: 5.0, h: 4.0}, 'top', {line: S.rule, lw: 1});
      const g2 = K.figure(c, EX.t2Before, {x: 7.0, y: 2.3, w: 5.0, h: 4.0}, 'top', {line: S.rule, lw: 1});
      c.line({x1: g1.x + g1.w + 0.15, y1: 4.3, x2: g2.x - 0.15, y2: 4.3, color: S.red, lw: 2.5, arrow: true});
      c.text('Thinker 1：给出“n 应小于 24”', {x: g1.x, y: g1.y + g1.h + 0.1, w: g1.w, h: 0.3, size: 13, color: S.red, font: SANS, bold: true, align: 'center'});
      c.text('Thinker 2：沿用“不超过 24”，答 8', {x: g2.x, y: g2.y + g2.h + 0.1, w: g2.w, h: 0.3, size: 13, color: S.red, font: SANS, bold: true, align: 'center'});
      c.text(EX.caveat, {x: 0.55, y: 6.78, w: 12.2, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      c.text(EX.src, {x: 0.55, y: 7.12, w: 7, h: 0.25, size: 9.5, color: S.muted, font: FIRA});
    },
    (c) => {
      head(c, 'Spatial pruning: 剪掉对话内的边');
      bullets(c, 0.6, 1.15, 12, ['每条对话内边配一个可学习分数 S^{S}；训练 K′ 轮后按 TopK 一次性剪掉 p%（式 12）', '例：6 条边剪掉 2 条，总结者的答案由 8 变为 [[12]]']);
      const gl = K.figure(c, A.left, {x: 1.6, y: 2.3, w: 4.6, h: 4.7}, 'top');
      const gr = K.figure(c, A.right, {x: 7.0, y: 2.3, w: 4.6, h: 4.7}, 'top');
      c.text('Original', {x: 0.4, y: 4.4, w: 1.1, h: 0.3, size: 13, color: S.muted, font: FIRA, bold: true, align: 'right'});
      c.text('AgentPrune', {x: 11.7, y: 4.4, w: 1.5, h: 0.3, size: 13, color: S.red, font: FIRA, bold: true});
      K.callout(c, K.at(gr, A.cut1), {x: 11.7, y: 2.6, w: 1.5, h: 0.5}, ['剪掉', 'T1→T2'], cs);
      K.callout(c, K.at(gr, A.cut2), {x: 11.7, y: 5.3, w: 1.5, h: 0.5}, ['剪掉', 'T1→总结者'], cs);
      c.text(SRC.f4, {x: 0.55, y: 7.12, w: 6, h: 0.25, size: 9.5, color: S.muted, font: FIRA});
    },
    (c) => {
      head(c, 'Temporal pruning: 只把有用的历史带到下一轮');
      bullets(c, 0.6, 1.15, 12, ['上一轮的每条发言是否写进下一轮提示词，同样由掩码 S^{T} 打分', '与空间剪枝一起训练、一起一次性剪掉']);
      const g = K.figure(c, B.temporal, {x: 0.6, y: 2.25, w: 12.1, h: 1.8}, 'top');
      K.callout(c, K.at(g, B.pruned[0]), {x: 6.4, y: 4.25, w: 1.4, h: 0.32}, '剪掉', cs);
      K.callout(c, K.at(g, B.pruned[1]), {x: 8.9, y: 4.25, w: 1.4, h: 0.32}, '剪掉', cs);
      K.ledger(c, {x: 0.6, y: 4.75, w: 6.6, h: 2.15}, B.ledger, {font: SANS, numFont: FIRA, text: S.ink, muted: S.muted, accent: S.red, rule: S.ink});
      c.text(['Question:', '为什么跨轮开销降得最多？', '图 4 算式中对话间一项带 ×4，占剪枝前总量的 69%（5,036 / 7,295）。'], {x: 7.8, y: 4.8, w: 5.0, h: 2.0, size: 14, color: S.ink, font: SANS, lh: 1.35});
      c.text(SRC.f4 + '；token 由图中算式求和', {x: 0.55, y: 7.12, w: 7, h: 0.25, size: 9.5, color: S.muted, font: FIRA});
    },
    (c) => {
      head(c, 'Plug-in: 接到 AutoGen / GPTSwarm 上直接省钱');
      bullets(c, 0.6, 1.15, 12, ['5 个 gpt-4 agent；prompt token 降 [[28.1%–72.8%]]；6 组中 5 组效果上升（HumanEval 为 pass@1）']);
      COST.rows.forEach((r, i) => {
        const x = 0.6 + (i % 3) * 4.15, y = 1.85 + Math.floor(i / 3) * 2.6; const w = 3.85, hh = 1.4;
        c.text(short(r.k), {x, y, w, h: 0.32, size: 14, color: S.ink, font: FIRA, bold: true});
        const base = y + 0.45 + hh; const bw = 0.8;
        c.rect({x: x + 0.3, y: base - hh, w: bw, h: hh, fill: S.light});
        c.rect({x: x + 0.3 + bw + 0.15, y: base - hh * r.b / r.a, w: bw, h: hh * r.b / r.a, fill: S.red});
        c.line({x1: x, y1: base, x2: x + 2.2, y2: base, color: S.ink, lw: 1});
        c.text(K.money(r.a), {x: x + 0.1, y: base + 0.05, w: 1.2, h: 0.25, size: 10.5, color: S.muted, font: FIRA, align: 'center'});
        c.text(K.money(r.b), {x: x + 1.05, y: base + 0.05, w: 1.2, h: 0.25, size: 10.5, color: S.red, font: FIRA, bold: true, align: 'center'});
        c.text(K.pct(r), {x: x + 2.3, y: y + 0.6, w: 1.5, h: 0.5, size: 24, color: S.red, font: FIRA, bold: true});
        c.text(r.m + ' ' + r.dp, {x: x + 2.3, y: y + 1.15, w: 1.5, h: 0.3, size: 12, color: r.dp.startsWith('+') ? '2E7D32' : S.red, font: FIRA, bold: true});
      });
      c.text(SRC.t3 + ' · 灰柱 = 接入前，红柱 = 接入后（各组单独归一）', {x: 0.55, y: 7.12, w: 8, h: 0.25, size: 9.5, color: S.muted, font: FIRA});
    },
  ]};
})();

// ---------------------------------------------------------------- bento dark (Apple event)
const bentoDark = (() => {
  const S = {bg: '000000', tile: '1C1C1E', text: 'F5F5F7', muted: '98989D', blue: '2997FF', green: '30D158', orange: 'FF9F0A', pink: 'FF375F'};
  const tile = (c, x, y, w, h, fill = S.tile) => c.rect({x, y, w, h, fill, r: 0.22});
  const num = (c, x, y, w, h, big, label, col = S.text, size = 44) => {
    tile(c, x, y, w, h);
    c.text(big, {x: x + 0.3, y: y + 0.25, w: w - 0.5, h: h * 0.5, size, color: col, font: INTER, bold: true});
    c.text(label, {x: x + 0.3, y: y + h - 0.85, w: w - 0.5, h: 0.7, size: 12.5, color: S.muted, font: SANS, lh: 1.25, valign: 'bottom'});
  };
  return {name: 'bento-dark', label: 'Bento 暗色（Apple 发布会）', pages: [
    (c) => {
      c.bg(S.bg);
      c.text('例题', {x: 0.5, y: 0.3, w: 6, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      tile(c, 0.5, 0.95, 8.0, 1.9);
      c.text(EX.q, {x: 0.8, y: 1.15, w: 7.5, h: 0.8, size: 28, color: S.text, font: SANS, bold: true});
      c.text('3 个 Thinker 各自作答，Summarizer 汇总', {x: 0.8, y: 2.1, w: 7.5, h: 0.4, size: 14, color: S.muted, font: SANS});
      num(c, 8.65, 0.95, 2.0, 1.9, '8', '原拓扑', S.pink, 54);
      num(c, 10.8, 0.95, 2.03, 1.9, '12', '剪枝后', S.green, 54);
      [[0.5, 4.0, EX.t1, S.orange], [4.65, 4.0, EX.t2b, S.pink], [8.8, 4.03, EX.t3a, S.green]].forEach(([x, w, t, col]) => {
        tile(c, x, 3.0, w, 3.6);
        c.text(t.who, {x: x + 0.3, y: 3.2, w: w - 0.5, h: 0.3, size: 13, color: col, font: SANS, bold: true});
        c.text('“' + (t.en || (t.pre + ' ' + t.strike + ' ' + t.post)) + '”', {x: x + 0.3, y: 3.6, w: w - 0.55, h: 2.0, size: 15, color: S.text, font: INTER, lh: 1.35});
        c.text(t.zh, {x: x + 0.3, y: 5.85, w: w - 0.5, h: 0.5, size: 12.5, color: S.muted, font: SANS});
      });
      c.text(EX.caveat, {x: 0.5, y: 6.75, w: 12.3, h: 0.3, size: 10.5, color: S.muted, font: SANS});
      c.text(EX.src, {x: 0.5, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg(S.bg);
      c.text('空间剪枝', {x: 0.5, y: 0.3, w: 6, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      tile(c, 0.5, 0.95, 4.4, 6.1, 'FFFFFF');
      const gr = K.figure(c, A.right, {x: 0.6, y: 1.05, w: 4.2, h: 5.9});
      K.ring(c, K.at(gr, A.cut1), 0.22, S.pink, 3); K.ring(c, K.at(gr, A.cut2), 0.22, S.pink, 3);
      tile(c, 5.05, 0.95, 3.9, 2.9);
      c.text('6 → 4', {x: 5.35, y: 1.15, w: 3.4, h: 1.1, size: 54, color: S.blue, font: INTER, bold: true});
      c.text('对话内边数：左图红圈处两条被剪掉', {x: 5.35, y: 2.6, w: 3.4, h: 1.0, size: 12.5, color: S.muted, font: SANS, lh: 1.3});
      tile(c, 9.1, 0.95, 3.73, 2.9);
      c.text('8 → 12', {x: 9.4, y: 1.15, w: 3.3, h: 1.1, size: 54, color: S.green, font: INTER, bold: true});
      c.text('总结者的答案（12 在图中标为正确）', {x: 9.4, y: 2.6, w: 3.2, h: 1.0, size: 12.5, color: S.muted, font: SANS, lh: 1.3});
      tile(c, 5.05, 4.0, 7.78, 3.05);
      c.text('怎么剪', {x: 5.35, y: 4.2, w: 3, h: 0.35, size: 13, color: S.orange, font: SANS, bold: true});
      c.text(['每条边一个可学习分数 S^{S}，和系统效用一起优化', '训练 K′ 轮后按 TopK 一次性剪掉 p%', '之后拓扑固定，后续查询持续省 token'], {x: 5.35, y: 4.65, w: 7.2, h: 2.2, size: 16, color: S.text, font: SANS, lh: 1.55});
      c.text(SRC.f4, {x: 0.5, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg(S.bg);
      c.text('时间剪枝', {x: 0.5, y: 0.3, w: 6, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      tile(c, 0.5, 0.95, 12.33, 2.35, 'FFFFFF');
      const g = K.figure(c, B.temporal, {x: 0.65, y: 1.05, w: 12.03, h: 2.15});
      K.ring(c, K.at(g, B.pruned[0]), 0.2, S.pink, 3); K.ring(c, K.at(g, B.pruned[1]), 0.2, S.pink, 3);
      B.ledger.forEach((r, i) => num(c, 0.5 + i * 3.15, 3.45, 3.0, 3.6, r.d, r.k + '：' + r.a + ' → ' + r.b, i === 2 ? S.blue : S.text, 40));
      tile(c, 9.95, 3.45, 2.88, 3.6);
      c.text(['4 条历史', '只留 2 条'], {x: 10.2, y: 3.7, w: 2.5, h: 1.4, size: 26, color: S.text, font: SANS, bold: true, lh: 1.2});
      c.text('Answer 3 与 Conclusion 进入下一轮提示词（上图红圈为被剪掉的两条）', {x: 10.2, y: 5.3, w: 2.45, h: 1.6, size: 12.5, color: S.muted, font: SANS, lh: 1.3});
      c.text(SRC.f4 + ' · token 由图中算式求和', {x: 0.5, y: 7.15, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      c.bg(S.bg);
      c.text('即插即用：每一组都更便宜', {x: 0.5, y: 0.3, w: 8, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      COST.rows.forEach((r, i) => {
        const x = 0.5 + (i % 3) * 4.15, y = 0.95 + Math.floor(i / 3) * 3.1; const w = 4.0, h = 2.95; const hero = i === 0;
        tile(c, x, y, w, h);
        c.text(short(r.k), {x: x + 0.3, y: y + 0.22, w: w - 0.5, h: 0.32, size: 14, color: S.muted, font: SANS, bold: true});
        c.text(K.pct(r), {x: x + 0.3, y: y + 0.6, w: w - 0.5, h: 1.1, size: hero ? 60 : 50, color: hero ? S.blue : S.text, font: INTER, bold: true});
        c.text(K.money(r.a) + ' → ' + K.money(r.b), {x: x + 0.3, y: y + 1.85, w: w - 0.5, h: 0.4, size: 16, color: S.text, font: INTER});
        c.text(r.m + '  ' + r.pa + ' → ' + r.pb, {x: x + 0.3, y: y + 2.3, w: w - 1.3, h: 0.35, size: 12.5, color: S.muted, font: INTER});
        c.text(r.dp, {x: x + w - 1.1, y: y + 2.28, w: 0.85, h: 0.38, size: 15, color: r.dp.startsWith('+') ? S.green : S.pink, font: INTER, bold: true, align: 'right'});
      });
      c.text(SRC.t3, {x: 0.5, y: 7.15, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- soft bento (light cards)
const softBento = (() => {
  const S = {bg: 'F3F4F8', card: 'FFFFFF', text: '1D2433', muted: '6B7280', lav: 'EDE9FE', lavT: '6D28D9', mint: 'DCFCE7', mintT: '15803D', peach: 'FFEDD5', peachT: 'C2410C', sky: 'E0F2FE', skyT: '0369A1'};
  const card = (c, x, y, w, h, tag, tint, tcol) => {
    c.rect({x: x + 0.03, y: y + 0.05, w, h, fill: 'E2E5EC', r: 0.25});
    c.rect({x, y, w, h, fill: S.card, r: 0.25});
    if (tag) { const tw = 0.3 + K.tw(tag, 11); c.rect({x: x + 0.25, y: y + 0.22, w: tw, h: 0.32, fill: tint, r: 0.16}); c.text(tag, {x: x + 0.25, y: y + 0.22, w: tw, h: 0.32, size: 11, color: tcol, font: SANS, bold: true, align: 'center', valign: 'middle'}); }
  };
  const title = (c, t) => { c.bg(S.bg); c.text(t, {x: 0.55, y: 0.3, w: 12, h: 0.6, size: 26, color: S.text, font: SANS, bold: true}); };
  const qs = {font: SANS, enFont: INTER, text: S.text, muted: S.muted, size: 16, zhSize: 14, who: false};
  return {name: 'soft-bento', label: '浅色柔和卡片', pages: [
    (c) => {
      title(c, '例题：同一位 Thinker 2，前后两次回答');
      card(c, 0.55, 1.1, 12.28, 1.35, '题目', S.sky, S.skyT);
      c.text(EX.q, {x: 1.55, y: 1.25, w: 6.5, h: 0.45, size: 20, color: S.text, font: SANS, bold: true});
      c.text(EX.qEn, {x: 1.55, y: 1.78, w: 6.5, h: 0.3, size: 11, color: S.muted, font: INTER});
      c.text(['Thinker 1–3：各自作答', 'Summarizer：汇总给出最终答案'], {x: 8.6, y: 1.25, w: 4.1, h: 1.0, size: 13, color: S.text, font: SANS, lh: 1.45});
      card(c, 0.55, 2.65, 6.05, 3.6, '原拓扑 · 读到 Thinker 1 的回答', S.peach, S.peachT);
      K.quote(c, {x: 0.85, y: 3.2, w: 5.5, h: 2.5}, EX.t2b, {...qs, strikeColor: S.peachT, answer: S.peachT, accent: S.peachT});
      card(c, 6.78, 2.65, 6.05, 3.6, '剪枝后 · 收不到 Thinker 1 的回答', S.mint, S.mintT);
      K.quote(c, {x: 7.08, y: 3.2, w: 5.5, h: 2.5}, EX.t2a, {...qs, strikeColor: '9CA3AF', strike: S.mintT, answer: S.mintT, accent: S.mintT});
      card(c, 0.55, 6.4, 12.28, 0.62, null);
      c.text('注  ' + EX.caveat, {x: 0.8, y: 6.4, w: 11.9, h: 0.62, size: 12, color: S.muted, font: SANS, valign: 'middle'});
      c.text(EX.src, {x: 0.55, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      title(c, '空间剪枝：剪掉 2 条消息，答案由 8 变为 12');
      card(c, 0.55, 1.1, 5.2, 5.95, '示意（重绘）', S.lav, S.lavT);
      const mid = K.graph(c, {x: 0.75, y: 1.9, w: 4.8, h: 3.2}, A, {font: SANS, edge: '9CA3AF', cut: S.peachT, node: S.lav, nodeS: S.mint, nodeLine: S.lavT, nodeText: S.text, nodeR: 0.2, nodeW: 1.45, nodeH: 0.52, nodeSize: 13, nodeLw: 1}, true);
      K.badge(c, mid[1], 1, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      K.badge(c, mid[2], 2, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      c.text(['可学习分数 S^{S} + 系统效用', '训练 K′ 轮 → TopK 一次性剪 p%'], {x: 0.8, y: 5.5, w: 4.8, h: 1.3, size: 14, color: S.text, font: SANS, lh: 1.5});
      card(c, 5.95, 1.1, 4.3, 5.95, '原图：剪枝后', S.sky, S.skyT);
      const gr = K.figure(c, A.right, {x: 6.1, y: 1.75, w: 4.0, h: 5.15}, 'top');
      K.badge(c, K.at(gr, A.cut1), 1, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      K.badge(c, K.at(gr, A.cut2), 2, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      card(c, 10.45, 1.1, 2.38, 2.9, '被剪掉', S.peach, S.peachT);
      c.text(['① T1 → T2', '② T1 → 总结者'], {x: 10.65, y: 1.75, w: 2.1, h: 1.1, size: 14, color: S.text, font: SANS, lh: 1.6});
      card(c, 10.45, 4.15, 2.38, 2.9, '答案', S.mint, S.mintT);
      c.text('8 → 12', {x: 10.65, y: 4.8, w: 2.1, h: 0.7, size: 28, color: S.mintT, font: INTER, bold: true});
      c.text('12 在图中标为正确', {x: 10.65, y: 5.6, w: 2.1, h: 0.8, size: 12, color: S.muted, font: SANS, lh: 1.3});
      c.text(SRC.f4, {x: 0.55, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      title(c, '时间剪枝：历史只带 2 条，示例 token 降 53%');
      card(c, 0.55, 1.1, 12.28, 2.75, '图 4 局部：发言历史', S.sky, S.skyT);
      const g = K.figure(c, B.temporal, {x: 0.75, y: 1.65, w: 11.9, h: 2.05});
      K.badge(c, K.at(g, B.pruned[0]), '×', {fill: S.peachT, color: 'FFFFFF', font: SANS, size: 11, r: 0.16});
      K.badge(c, K.at(g, B.pruned[1]), '×', {fill: S.peachT, color: 'FFFFFF', font: SANS, size: 11, r: 0.16});
      const tints = [[S.lav, S.lavT], [S.peach, S.peachT], [S.mint, S.mintT]];
      B.ledger.forEach((r, i) => {
        const x = 0.55 + i * 4.15;
        card(c, x, 4.0, 3.98, 3.05, r.k, tints[i][0], tints[i][1]);
        c.text(r.d, {x: x + 0.25, y: 4.7, w: 3.5, h: 0.9, size: 40, color: tints[i][1], font: INTER, bold: true});
        c.text(r.a + ' → ' + r.b + ' tokens', {x: x + 0.25, y: 5.7, w: 3.5, h: 0.4, size: 15, color: S.text, font: INTER});
        c.text(['同一轮 agent 之间', '算式中对话间一项带 ×4', '图 4 底部算式求和'][i], {x: x + 0.25, y: 6.2, w: 3.5, h: 0.6, size: 12, color: S.muted, font: SANS});
      });
      c.text(SRC.f4, {x: 0.55, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      title(c, '即插即用：接到现有框架上直接省钱');
      card(c, 0.55, 1.1, 4.6, 5.95, '最大降幅', S.mint, S.mintT);
      c.text('GSM8K · GPTSwarm', {x: 0.85, y: 1.8, w: 4.1, h: 0.4, size: 16, color: S.muted, font: SANS, bold: true});
      c.text('$234.76', {x: 0.85, y: 2.35, w: 4.1, h: 0.7, size: 34, color: '9CA3AF', font: INTER, bold: true});
      c.text('↓', {x: 0.85, y: 3.05, w: 1, h: 0.6, size: 28, color: S.mintT, font: INTER});
      c.text('$57.17', {x: 0.85, y: 3.65, w: 4.1, h: 0.9, size: 48, color: S.mintT, font: INTER, bold: true});
      c.text(['只剩原成本的 24%', '准确率 89.74 → 90.58（+0.84）'], {x: 0.85, y: 4.85, w: 4.1, h: 1.0, size: 14, color: S.text, font: SANS, lh: 1.5});
      card(c, 5.35, 1.1, 7.48, 5.95, '另外 5 组', S.lav, S.lavT);
      K.table(c, {x: 5.6, y: 1.75, w: 7.0, h: 4.2}, [
        {h: '组', w: 0.36, fn: r => short(r.k), bold: () => true}, {h: '成本', w: 0.34, fn: r => K.money(r.a) + ' → ' + K.money(r.b), num: true},
        {h: '降幅', w: 0.13, fn: K.pct, num: true, align: 'right', color: () => S.lavT, bold: () => true}, {h: '效果', w: 0.17, fn: r => r.dp, num: true, align: 'right', color: r => (r.dp.startsWith('+') ? S.mintT : S.peachT), bold: () => true}],
        COST.rows.slice(1), {font: SANS, numFont: INTER, text: S.text, muted: S.muted, rule: 'E5E7EB', rowRule: 'EEF0F4', size: 13.5, headSize: 12});
      c.text('效果：HumanEval 为 pass@1，其余为准确率', {x: 5.6, y: 6.2, w: 7, h: 0.5, size: 12, color: S.muted, font: SANS});
      c.text(SRC.t3, {x: 0.55, y: 7.15, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- swiss
const swiss = (() => {
  const S = {ink: '000000', muted: '6E6E6E', red: 'E30613', rule: '000000', light: 'EDEDED'};
  const frame = (c, k, n) => {
    c.bg('FFFFFF');
    c.line({x1: 0.5, y1: 0.45, x2: W - 0.5, y2: 0.45, color: S.ink, lw: 2.5});
    c.text(k, {x: 0.5, y: 0.55, w: 6, h: 0.3, size: 11, color: S.ink, font: INTER, bold: true, cs: 1.5});
    c.text(VENUE, {x: 6.6, y: 0.55, w: 3, h: 0.3, size: 11, color: S.muted, font: INTER});
    c.text(String(n).padStart(2, '0'), {x: W - 1.5, y: 0.55, w: 1, h: 0.3, size: 11, color: S.ink, font: INTER, bold: true, align: 'right'});
  };
  return {name: 'swiss', label: '瑞士国际主义', pages: [
    (c) => {
      frame(c, '02 — 例题', 7);
      c.text('240', {x: 0.45, y: 1.0, w: 6, h: 2.0, size: 120, color: S.ink, font: INTER, bold: true});
      c.text(EX.q, {x: 0.5, y: 3.25, w: 5.6, h: 1.0, size: 22, color: S.ink, font: SANS, bold: true, lh: 1.3});
      c.line({x1: 0.5, y1: 4.5, x2: 6.1, y2: 4.5, color: S.ink, lw: 1});
      c.text(['Thinker 1–3 各自作答', 'Summarizer 汇总'], {x: 0.5, y: 4.65, w: 2.7, h: 1.0, size: 13, color: S.ink, font: SANS, lh: 1.5});
      c.text(['原拓扑 → 8', '剪枝后 → 12'], {x: 3.4, y: 4.65, w: 2.7, h: 1.0, size: 13, color: S.red, font: SANS, bold: true, lh: 1.5});
      c.text(EX.caveat, {x: 0.5, y: 5.9, w: 5.6, h: 0.9, size: 11, color: S.muted, font: SANS, lh: 1.4});
      c.line({x1: 6.6, y1: 1.05, x2: 6.6, y2: 6.9, color: S.ink, lw: 1});
      [[EX.t1, false], [EX.t2b, false], [EX.t2a, true]].forEach(([t, cut], i) => {
        const y = 1.05 + i * 1.95;
        c.text(String(i + 1).padStart(2, '0'), {x: 6.9, y, w: 0.8, h: 0.4, size: 16, color: S.red, font: INTER, bold: true});
        c.text(t.who, {x: 7.7, y: y + 0.03, w: 5, h: 0.35, size: 13, color: S.ink, font: SANS, bold: true});
        if (t.en) c.text('“' + t.en + '”', {x: 7.7, y: y + 0.45, w: 5.1, h: 1.3, size: 14, color: S.ink, font: INTER, lh: 1.35});
        else K.quote(c, {x: 7.7, y: y + 0.45, w: 5.1, h: 1.3}, t, {font: SANS, enFont: INTER, text: S.ink, muted: S.muted, who: false, zh: false, size: 14, strikeColor: cut ? S.muted : S.red, strike: cut ? S.red : null, answer: S.red});
      });
      c.text(EX.src, {x: 0.5, y: 7.1, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      frame(c, '03 — 方法 / 空间剪枝', 8);
      c.text('6→4', {x: 0.45, y: 1.0, w: 6, h: 2.0, size: 120, color: S.ink, font: INTER, bold: true});
      c.text('对话内边数：原 6 条，剪掉 2 条后，总结者的答案由 8 变为 12。', {x: 0.5, y: 3.25, w: 5.6, h: 1.0, size: 22, color: S.ink, font: SANS, bold: true, lh: 1.3});
      c.line({x1: 0.5, y1: 4.5, x2: 6.1, y2: 4.5, color: S.ink, lw: 1});
      c.text(['可学习分数 S^{S} × 系统效用', '训练 K′ 轮 → TopK 剪 p%', '之后拓扑固定'], {x: 0.5, y: 4.65, w: 2.7, h: 1.5, size: 13, color: S.ink, font: SANS, lh: 1.5});
      c.text(['① T1 → T2', '② T1 → 总结者'], {x: 3.4, y: 4.65, w: 2.7, h: 1.0, size: 13, color: S.red, font: SANS, bold: true, lh: 1.5});
      c.text('原拓扑', {x: 6.6, y: 1.05, w: 3, h: 0.3, size: 11, color: S.muted, font: SANS, bold: true});
      c.text('剪枝后', {x: 9.75, y: 1.05, w: 3, h: 0.3, size: 11, color: S.red, font: SANS, bold: true});
      K.figure(c, A.left, {x: 6.6, y: 1.45, w: 3.0, h: 5.4}, 'top');
      const gr = K.figure(c, A.right, {x: 9.75, y: 1.45, w: 3.08, h: 5.4}, 'top');
      K.badge(c, K.at(gr, A.cut1), 1, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16});
      K.badge(c, K.at(gr, A.cut2), 2, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16});
      c.text(SRC.f4, {x: 0.5, y: 7.1, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      frame(c, '03 — 方法 / 时间剪枝', 9);
      c.text('−53%', {x: 0.45, y: 1.0, w: 6, h: 2.0, size: 120, color: S.red, font: INTER, bold: true});
      c.text('图 4 示例 token：7,295 → 3,425。上一轮 4 条发言只带 2 条进下一轮。', {x: 0.5, y: 3.25, w: 5.6, h: 1.1, size: 20, color: S.ink, font: SANS, bold: true, lh: 1.3});
      K.ledger(c, {x: 6.6, y: 1.05, w: 6.23, h: 2.6}, B.ledger, {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, accent: S.red, rule: S.ink, size: 16, lastSize: 20});
      const g = K.figure(c, B.temporal, {x: 0.5, y: 4.75, w: 12.33, h: 1.8}, 'top');
      K.badge(c, K.at(g, B.pruned[0]), '×', {fill: S.red, color: 'FFFFFF', font: INTER, size: 12, r: 0.15});
      K.badge(c, K.at(g, B.pruned[1]), '×', {fill: S.red, color: 'FFFFFF', font: INTER, size: 12, r: 0.15});
      c.text(SRC.f4 + ' · token 由图中算式求和', {x: 0.5, y: 7.1, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      frame(c, '04 — 实验 / 即插即用', 18);
      c.text('−76%', {x: 0.45, y: 1.0, w: 6.0, h: 2.0, size: 120, color: S.red, font: INTER, bold: true});
      c.text('GSM8K · GPTSwarm 的 API 成本：$234.76 → $57.17，准确率 89.74 → 90.58。', {x: 0.5, y: 3.25, w: 5.6, h: 1.1, size: 20, color: S.ink, font: SANS, bold: true, lh: 1.3});
      c.text(['prompt token −28.1% ~ −72.8%', '6 组中 5 组效果上升（HumanEval 为 pass@1）'], {x: 0.5, y: 4.7, w: 5.6, h: 1.0, size: 14, color: S.ink, font: SANS, lh: 1.5});
      K.hbars(c, {x: 6.6, y: 1.05, w: 6.23, h: 5.8}, COST.rows, {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, before: S.light, after: S.ink, afterText: S.ink, fmt: K.money, labelW: 2.2, labelSize: 12});
      c.text(SRC.t3, {x: 0.5, y: 7.1, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- slidev seriph (serif, split layout)
const seriph = (() => {
  const S = {ink: '2B2B2B', muted: '7C7C7C', panel: 'F4F1EC', acc: '9C4A2F', rule: 'D6D0C6'};
  const left = (c, kicker, title, body, w = 5.1) => {
    c.bg('FFFFFF');
    c.text(kicker, {x: 0.7, y: 0.7, w: 5, h: 0.3, size: 12, color: S.acc, font: SERIF, italic: true});
    c.text(title, {x: 0.7, y: 1.05, w: w + 0.2, h: 1.6, size: 27, color: S.ink, font: SERIF, bold: true, lh: 1.2});
    c.line({x1: 0.7, y1: 2.85, x2: 1.6, y2: 2.85, color: S.acc, lw: 2});
    c.text(body, {x: 0.7, y: 3.1, w, h: 3.6, size: 15, color: S.ink, font: SERIF, lh: 1.55, paraGap: 8});
  };
  const panel = (c, x = 6.3) => c.rect({x, y: 0, w: W - x, h: H, fill: S.panel});
  const cs = {stroke: S.acc, fill: 'FFFFFF', line: S.acc, color: S.acc, font: SERIF, size: 12, ring: 0.2, r: 0.04};
  const qs = {font: SERIF, enFont: PAG, text: S.ink, muted: S.muted, size: 19, italic: true, who: false, zh: false, strikeScale: 0.86};
  return {name: 'seriph', label: 'Slidev Seriph 衬线分栏', pages: [
    (c) => {
      left(c, 'Example · 图 4', '一条前提，改变了答案', ['题目：' + EX.q, '3 个 Thinker 各自作答，Summarizer 汇总。原拓扑下总结者答 8，剪枝后答 12。', EX.caveat]);
      panel(c);
      [[EX.t1, 0.75, false], [EX.t2b, 2.75, false], [EX.t2a, 4.85, true]].forEach(([t, y, cut]) => {
        c.text(t.who, {x: 6.8, y, w: 6, h: 0.3, size: 13, color: S.acc, font: SERIF, bold: true});
        if (t.en) c.text('“' + t.en + '”', {x: 6.8, y: y + 0.4, w: 6.0, h: 1.3, size: 19, color: S.ink, font: PAG, italic: true, lh: 1.3});
        else K.quote(c, {x: 6.8, y: y + 0.4, w: 6.0, h: 1.6}, t, {...qs, strikeColor: cut ? S.muted : S.acc, strike: cut ? S.acc : null, answer: S.acc});
      });
      c.text(EX.src, {x: 0.7, y: 7.05, w: 5, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
    (c) => {
      left(c, 'Method · 空间剪枝', '少传两条消息，答案变了', ['每条对话内边配一个可学习分数 S^{S}，与系统效用一起优化。', '训练 K′ 轮后按 TopK 一次性剪掉 p% 的边，之后拓扑固定。', '右图 ①② 两条边被剪掉，总结者的答案由 8 变为 12。'], 4.2);
      panel(c, 5.3);
      c.text('原拓扑', {x: 5.6, y: 0.55, w: 3.6, h: 0.3, size: 13, color: S.muted, font: SERIF, italic: true, align: 'center'});
      c.text('剪枝后', {x: 9.45, y: 0.55, w: 3.6, h: 0.3, size: 13, color: S.acc, font: SERIF, italic: true, bold: true, align: 'center'});
      K.figure(c, A.left, {x: 5.6, y: 0.95, w: 3.65, h: 6.1}, 'top');
      const gr = K.figure(c, A.right, {x: 9.45, y: 0.95, w: 3.65, h: 6.1}, 'top');
      K.badge(c, K.at(gr, A.cut1), 1, {fill: S.acc, color: 'FFFFFF', font: PAG, size: 12, r: 0.17});
      K.badge(c, K.at(gr, A.cut2), 2, {fill: S.acc, color: 'FFFFFF', font: PAG, size: 12, r: 0.17});
      c.text(SRC.f4, {x: 0.7, y: 7.05, w: 4.4, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
    (c) => {
      left(c, 'Method · 时间剪枝', '历史只带两条，token 少一半', ['上一轮发言是否写进下一轮提示词，由掩码 S^{T} 决定。', '图 4 中 4 条历史只保留 Answer 3 与 Conclusion。']);
      K.ledger(c, {x: 0.7, y: 5.0, w: 5.1, h: 1.8}, B.ledger, {font: SERIF, numFont: PAG, text: S.ink, muted: S.muted, accent: S.acc, rule: S.ink, size: 14, lastSize: 17, headSize: 11});
      panel(c);
      c.text('剪枝前：4 条历史全部写进下一轮', {x: 6.7, y: 0.6, w: 6.3, h: 0.3, size: 13, color: S.muted, font: SERIF, italic: true});
      K.figure(c, B.tL, {x: 6.7, y: 0.95, w: 6.3, h: 1.85});
      c.text('剪枝后：只保留 Answer 3 与 Conclusion', {x: 6.7, y: 3.1, w: 6.3, h: 0.3, size: 13, color: S.acc, font: SERIF, italic: true, bold: true});
      const g = K.figure(c, B.tR, {x: 6.7, y: 3.45, w: 6.3, h: 1.85});
      K.callout(c, K.at(g, [0.16, 0.38]), {x: 7.2, y: 5.65, w: 1.3, h: 0.32}, '剪掉', cs);
      K.callout(c, K.at(g, [0.60, 0.38]), {x: 9.6, y: 5.65, w: 1.3, h: 0.32}, '剪掉', cs);
      const g2 = K.figure(c, B.tokens, {x: 6.7, y: 6.3, w: 6.3, h: 0.5});
      K.ring(c, K.at(g2, [0.88, 0.5]), 0.25, S.acc, 2);
      c.text(SRC.f4, {x: 0.7, y: 7.05, w: 5, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
    (c) => {
      left(c, 'Results · 即插即用', '接到现有框架上，成本直接打折', ['5 个 gpt-4 agent，AutoGen 与 GPTSwarm，三个数据集。', 'GSM8K · GPTSwarm：$234.76 → $57.17，准确率还高了 0.84。', '6 组中只有 MMLU · GPTSwarm 掉了 0.93。'], 4.6);
      panel(c, 5.7);
      c.text('Table 3（节选）', {x: 6.0, y: 0.7, w: 4, h: 0.3, size: 13, color: S.acc, font: SERIF, italic: true});
      K.table(c, {x: 6.0, y: 1.2, w: 7.0, h: 4.9}, [
        {h: '设置', w: 0.37, fn: r => short(r.k)}, {h: '成本（美元）', w: 0.31, fn: r => K.money(r.a) + ' → ' + K.money(r.b), num: true},
        {h: '降幅', w: 0.14, fn: K.pct, num: true, align: 'right', color: () => S.acc, bold: () => true}, {h: '效果', w: 0.2, key: 'dp', num: true, align: 'right', color: r => (r.dp.startsWith('+') ? '2F6B3B' : S.acc), bold: () => true}],
        COST.rows, {font: SERIF, numFont: PAG, text: S.ink, muted: S.muted, rule: S.ink, top: 1.5, mid: 0.75, bottom: 1.5, size: 14, headSize: 12.5});
      c.text('效果：HumanEval 为 pass@1，其余为准确率。', {x: 6.0, y: 6.3, w: 7, h: 0.35, size: 12, color: S.muted, font: SERIF, italic: true});
      c.text(SRC.t3, {x: 0.7, y: 7.05, w: 4.8, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
  ]};
})();

// ---------------------------------------------------------------- neo-brutalism
const brutal = (() => {
  const S = {bg: 'FFF4D6', ink: '111111', yellow: 'FFD23F', pink: 'FF7AB6', green: '3DDC97', blue: '74B9FF', white: 'FFFFFF'};
  const box = (c, x, y, w, h, fill, sh = 0.09) => { c.rect({x: x + sh, y: y + sh, w, h, fill: S.ink}); c.rect({x, y, w, h, fill, line: S.ink, lw: 2.5}); };
  const head = (c, tag, title, tagFill) => {
    c.bg(S.bg);
    const tw = 0.4 + K.tw(tag, 13);
    box(c, 0.5, 0.35, tw, 0.42, tagFill, 0.06);
    c.text(tag, {x: 0.5, y: 0.35, w: tw, h: 0.42, size: 13, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
    c.text(title, {x: 0.5, y: 0.95, w: 12.3, h: 0.75, size: 30, color: S.ink, font: SANS, bold: true});
  };
  const st = {stroke: S.ink, fill: S.pink, line: S.ink, color: S.ink, font: SANS, size: 13, lw: 2.5, boxLw: 2.5, shadow: 0.06, ring: 0.22};
  const arrow = (c, x1, y1, x2, y2) => c.line({x1, y1, x2, y2, color: S.ink, lw: 3.5, arrow: true});
  return {name: 'neo-brutalism', label: '新野兽派', pages: [
    (c) => {
      head(c, '例题 · 图 4', '一句“n < 24”，一路传到了总结者', S.blue);
      c.text('题目：' + EX.q, {x: 0.5, y: 1.75, w: 12.3, h: 0.4, size: 17, color: S.ink, font: SANS, bold: true});
      [[0.5, 'Thinker 1', '“…n should be smaller than 24.”'], [4.75, 'Thinker 2', '沿用“不超过 24”，只数到 n = 20 → 8'], [9.0, '总结者', '3 个回答 5、8、8 → 答 8']].forEach(([x, t, b], i) => {
        box(c, x, 2.4, 3.8, 1.75, i === 2 ? S.white : S.pink);
        c.text(t, {x: x + 0.2, y: 2.5, w: 3.4, h: 0.4, size: 16, color: S.ink, font: SANS, bold: true});
        c.text(b, {x: x + 0.2, y: 2.95, w: 3.4, h: 1.1, size: 14, color: S.ink, font: i === 0 ? INTER : SANS, bold: true, lh: 1.3});
        if (i < 2) arrow(c, x + 3.9, 3.27, x + 4.2, 3.27);
      });
      box(c, 0.5, 4.6, 3.8, 1.75, S.yellow);
      c.text(['✂ 剪掉', 'T1 → T2、T1 → 总结者'], {x: 0.7, y: 4.7, w: 3.4, h: 1.5, size: 17, color: S.ink, font: SANS, bold: true, lh: 1.4, valign: 'middle'});
      [[4.75, 'Thinker 2 / 3', '删去限制答 12；T3：“Answer 1 set n<24, which is not reasonable.”'], [9.0, '总结者', '答 12（图中标为正确）']].forEach(([x, t, b], i) => {
        box(c, x, 4.6, 3.8, 1.75, S.green);
        c.text(t, {x: x + 0.2, y: 4.7, w: 3.4, h: 0.4, size: 16, color: S.ink, font: SANS, bold: true});
        c.text(b, {x: x + 0.2, y: 5.15, w: 3.4, h: 1.1, size: 13, color: S.ink, font: SANS, bold: true, lh: 1.3});
      });
      arrow(c, 4.4, 5.47, 4.7, 5.47); arrow(c, 8.65, 5.47, 8.95, 5.47);
      c.text(EX.caveat, {x: 0.5, y: 6.62, w: 12.3, h: 0.4, size: 11.5, color: S.ink, font: SANS});
      c.text(EX.src, {x: 0.5, y: 7.13, w: 6, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
    (c) => {
      head(c, '方法 · 空间剪枝', '剪掉 2 条消息，答案由 8 变为 12', S.yellow);
      box(c, 0.5, 1.95, 3.85, 5.0, S.white);
      K.figure(c, A.left, {x: 0.6, y: 2.05, w: 3.65, h: 4.8});
      box(c, 4.65, 1.95, 3.85, 5.0, S.white);
      const gr = K.figure(c, A.right, {x: 4.75, y: 2.05, w: 3.65, h: 4.8});
      K.callout(c, K.at(gr, A.cut1), {x: 8.95, y: 2.0, w: 3.6, h: 0.55}, '① 剪掉 Thinker 1 → 2', st);
      K.callout(c, K.at(gr, A.cut2), {x: 8.95, y: 3.05, w: 3.6, h: 0.55}, '② 剪掉 Thinker 1 → 总结者', st);
      box(c, 8.95, 4.2, 1.7, 1.1, S.pink); c.text(['原拓扑', '答 8'], {x: 8.95, y: 4.2, w: 1.7, h: 1.1, size: 15, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
      box(c, 10.85, 4.2, 1.7, 1.1, S.green); c.text(['剪枝后', '答 12'], {x: 10.85, y: 4.2, w: 1.7, h: 1.1, size: 15, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
      box(c, 8.95, 5.6, 3.6, 1.35, S.blue);
      c.text('可学习分数 S^{S} → 训练 K′ 轮 → TopK 一次性剪 p%', {x: 9.1, y: 5.6, w: 3.3, h: 1.35, size: 13, color: S.ink, font: SANS, bold: true, valign: 'middle', lh: 1.3});
      c.text(SRC.f4, {x: 0.5, y: 7.13, w: 6, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
    (c) => {
      head(c, '方法 · 时间剪枝', '历史 4 条只带 2 条，token 砍掉一半', S.green);
      c.text('上一轮的发言历史', {x: 0.5, y: 1.95, w: 6, h: 0.35, size: 15, color: S.ink, font: SANS, bold: true});
      K.history(c, {x: 0.5, y: 2.4, w: 7.6, h: 0.6}, B.history, {font: SANS, keepFill: S.yellow, keepLine: S.ink, keepText: S.ink, dropFill: S.bg, dropLine: S.ink, dropText: '8A8A8A', size: 15, shadow: 0.06});
      c.text('↓ 只把黄色的两条写进下一轮提示词', {x: 0.5, y: 3.2, w: 7.6, h: 0.4, size: 15, color: S.ink, font: SANS, bold: true});
      box(c, 0.5, 3.85, 7.6, 2.75, S.white);
      c.text('原图：剪枝后的发言历史', {x: 0.7, y: 3.95, w: 7, h: 0.3, size: 12, color: S.ink, font: SANS, bold: true});
      const g = K.figure(c, B.tR, {x: 0.65, y: 4.3, w: 7.3, h: 2.2});
      K.ring(c, K.at(g, [0.16, 0.38]), 0.22, 'D62F6E', 3); K.ring(c, K.at(g, [0.60, 0.38]), 0.22, 'D62F6E', 3);
      B.ledger.forEach((r, i) => {
        const y = 1.95 + i * 1.6;
        box(c, 8.6, y, 4.2, 1.35, [S.white, S.white, S.yellow][i]);
        c.text(r.k, {x: 8.8, y: y + 0.12, w: 3.8, h: 0.35, size: 14, color: S.ink, font: SANS, bold: true});
        c.text(r.a + ' → ' + r.b, {x: 8.8, y: y + 0.5, w: 3.8, h: 0.6, size: 26, color: S.ink, font: INTER, bold: true});
        c.text(r.d, {x: 11.0, y: y + 0.12, w: 1.6, h: 0.35, size: 14, color: S.ink, font: INTER, bold: true, align: 'right'});
      });
      c.text(SRC.f4 + ' · token 由图中算式求和', {x: 0.5, y: 7.13, w: 8, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
    (c) => {
      head(c, '实验 · 即插即用', '接上就省：6 组成本全降', S.pink);
      const fills = [S.yellow, S.white, S.white, S.white, S.white, S.white];
      COST.rows.forEach((r, i) => {
        const x = 0.5 + (i % 3) * 4.2, y = 1.95 + Math.floor(i / 3) * 2.55; const w = 3.85, h = 2.2;
        box(c, x, y, w, h, fills[i]);
        c.text(short(r.k), {x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.35, size: 15, color: S.ink, font: SANS, bold: true});
        c.text(K.pct(r), {x: x + 0.2, y: y + 0.5, w: 2.0, h: 0.75, size: 34, color: S.ink, font: INTER, bold: true});
        const bw = w - 0.4; c.rect({x: x + 0.2, y: y + 1.4, w: bw, h: 0.26, fill: S.bg, line: S.ink, lw: 2});
        c.rect({x: x + 0.2, y: y + 1.4, w: bw * r.b / r.a, h: 0.26, fill: S.pink, line: S.ink, lw: 2});
        c.text(K.money(r.a) + ' → ' + K.money(r.b), {x: x + 0.2, y: y + 1.75, w: 2.6, h: 0.3, size: 12, color: S.ink, font: INTER, bold: true});
        box(c, x + w - 1.15, y + 0.6, 0.95, 0.5, r.dp.startsWith('+') ? S.green : S.pink, 0.05);
        c.text(r.dp, {x: x + w - 1.15, y: y + 0.6, w: 0.95, h: 0.5, size: 13, color: S.ink, font: INTER, bold: true, align: 'center', valign: 'middle'});
      });
      c.text(SRC.t3 + ' · 条 = 接入后 / 接入前成本；角标 = 效果变化（HumanEval 为 pass@1）', {x: 0.5, y: 7.13, w: 12, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
  ]};
})();

module.exports = [explainer, lecture, bentoDark, softBento, swiss, seriph, brutal];
