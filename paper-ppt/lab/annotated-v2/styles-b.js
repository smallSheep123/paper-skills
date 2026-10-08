// 7 new presets distilled from 2024–2025 references.
const {W, H} = require('./canvas');
const K = require('./kit');
const {SRC, VENUE, A, B, COST, ATK, BENTO} = require('./content');

const FULL = (x, y) => [(x - 188) / 627, (y - 140) / 472];
const SANS = 'Noto Sans SC', SERIF = 'Noto Serif SC', INTER = 'Inter', FIRA = 'Fira Sans', MONO = 'JetBrains Mono', PAG = 'TeX Gyre Pagella';

// ---------------------------------------------------------------- annotated explainer (Raschka-style redrawn diagrams + bubbles)
const explainer = (() => {
  const S = {ink: '1A1A1A', muted: '6B6B6B', blue: '8EC9F0', blueLine: '2C7FB8', bubble: 'DCEFFB', red: 'D64545', green: '2E9E5B', node: 'FFFFFF'};
  const head = (c, t, sub) => { c.bg('FFFFFF'); c.text(t, {x: 0.6, y: 0.4, w: 12, h: 0.6, size: 26, color: S.ink, font: SANS, bold: true}); if (sub) c.text(sub, {x: 0.6, y: 1.0, w: 12, h: 0.35, size: 14, color: S.muted, font: SANS}); };
  const bub = {stroke: S.ink, fill: S.bubble, line: S.blueLine, color: S.ink, font: SANS, size: 13, r: 0.18, lw: 1.25, arrow: true};
  const gst = {font: SANS, edge: S.ink, cut: S.red, node: S.node, nodeS: 'FFF6D6', nodeLine: S.ink, nodeText: S.ink, nodeR: 0.12, nodeW: 1.6, nodeH: 0.56, nodeSize: 14};
  return {name: 'explainer', label: '标注讲解图（Raschka 风）', pages: [
    (c) => {
      head(c, '同一个问题，少传两条消息', '图 4 的空间拓扑重绘：左为原系统，右为 AgentPrune 剪枝后');
      c.text('原系统：6 条边', {x: 0.6, y: 1.45, w: 5.6, h: 0.35, size: 15, color: S.ink, font: SANS, bold: true, align: 'center'});
      K.graph(c, {x: 0.6, y: 2.1, w: 5.6, h: 3.6}, A, gst, false);
      c.text('AgentPrune 后：4 条边', {x: 7.1, y: 1.45, w: 5.6, h: 0.35, size: 15, color: S.blueLine, font: SANS, bold: true, align: 'center'});
      const mid = K.graph(c, {x: 7.1, y: 2.1, w: 5.6, h: 3.6}, A, gst, true);
      K.callout(c, mid[1], {x: 8.6, y: 1.95, w: 2.6, h: 0.42}, '剪掉：Thinker 1 → 2', bub);
      K.callout(c, mid[2], {x: 10.2, y: 3.55, w: 2.6, h: 0.42}, '剪掉：Thinker 1 → 总结者', bub);
      c.rect({x: 0.6, y: 6.0, w: 5.6, h: 0.75, fill: 'FBE3E3', r: 0.18});
      c.text('总结者输出：答案是 8（错）', {x: 0.6, y: 6.0, w: 5.6, h: 0.75, size: 15, color: S.red, font: SANS, bold: true, align: 'center', valign: 'middle'});
      c.rect({x: 7.1, y: 6.0, w: 5.6, h: 0.75, fill: 'DFF3E7', r: 0.18});
      c.text('总结者输出：答案是 12（对）', {x: 7.1, y: 6.0, w: 5.6, h: 0.75, size: 15, color: S.green, font: SANS, bold: true, align: 'center', valign: 'middle'});
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
      K.ledger(c, {x: 8.6, y: 1.75, w: 4.2, h: 2.6}, B.ledger.map(r => ({...r})), {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, accent: S.blueLine, rule: S.ink, size: 14, lastSize: 17, headSize: 11});
      K.callout(c, {x: 11.2, y: 3.42}, {x: 9.0, y: 4.85, w: 3.8, h: 0.75}, '跨轮开销降得最多：\n5,036 → 1,944'.split('\n'), bub);
      c.text('重绘自 ' + SRC.f4 + '；token 由图中算式求和', {x: 0.6, y: 7.08, w: 9, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
    (c) => {
      head(c, '受到攻击时，剪过枝的系统几乎不掉点', 'MMLU，提示攻击；左柱为攻击前，右柱为攻击后（据图 6 重绘）');
      K.vbars(c, {x: 1.1, y: 1.6, w: 11.4, h: 5.2}, ATK.rows, {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, axis: S.ink, before: 'E3E3E3', after: 'B5B5B5', oursBefore: S.bubble, oursAfter: S.blue, oursText: S.blueLine, bad: S.red, barLine: S.ink, barLw: 1, r: 0.04});
      const gw = 11.4 / 6; const x = (i) => 1.1 + gw * i + gw / 2;
      K.callout(c, {x: x(4) + 0.25, y: 4.6}, {x: 6.7, y: 1.75, w: 2.7, h: 0.6}, 'AutoGen：82.1 → 76.2\n掉 5.9 分'.split('\n'), {...bub, fill: 'FBE3E3', line: S.red});
      K.callout(c, {x: x(5) + 0.25, y: 2.95}, {x: 9.85, y: 1.75, w: 2.7, h: 0.6}, '接入后：82.7 → 82.5\n只掉 0.2 分'.split('\n'), bub);
      c.text(SRC.f6, {x: 0.6, y: 7.08, w: 9, h: 0.25, size: 9.5, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- modern lecture (Stanford CS348K 2024)
const lecture = (() => {
  const S = {ink: '111111', muted: '555555', red: '8C1515', blue: '1F6FB2', rule: 'CCCCCC'};
  const head = (c, t, n) => {
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
      head(c, 'Spatial pruning: 剪掉对话内的边');
      bullets(c, 0.6, 1.15, 12, ['每条对话内边配一个可学习分数 S^{S}，与系统效用一起优化', '训练 K′ 轮后，按 TopK 一次性剪掉 p% 的边，之后拓扑固定（式 12）', '例：6 条边剪掉 2 条，总结者的答案从 8（错）变成 12（对）']);
      const gl = K.figure(c, A.left, {x: 1.6, y: 2.65, w: 4.6, h: 4.35}, 'top');
      const gr = K.figure(c, A.right, {x: 7.0, y: 2.65, w: 4.6, h: 4.35}, 'top');
      c.text('Original', {x: 0.4, y: 4.6, w: 1.1, h: 0.3, size: 13, color: S.muted, font: FIRA, bold: true, align: 'right'});
      c.text('AgentPrune', {x: 11.7, y: 4.6, w: 1.5, h: 0.3, size: 13, color: S.red, font: FIRA, bold: true});
      K.callout(c, K.at(gr, A.cut1), {x: 11.7, y: 2.9, w: 1.5, h: 0.5}, '剪掉\nT1→T2'.split('\n'), cs);
      K.callout(c, K.at(gr, A.cut2), {x: 11.7, y: 5.4, w: 1.5, h: 0.5}, '剪掉\nT1→总结者'.split('\n'), cs);
      K.ring(c, K.at(gl, A.cross), 0.24, S.red);
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
      bullets(c, 0.6, 1.15, 12, ['5 个 gpt-4 agent，三个数据集；prompt token 降 [[28.1%–72.8%]]', 'GSM8K · GPTSwarm：$234.76 → $57.17，精度 89.74 → 90.58'], 16);
      K.hbars(c, {x: 0.6, y: 2.3, w: 9.0, h: 4.6}, COST.rows, {font: SANS, numFont: FIRA, text: S.ink, muted: S.muted, before: 'D0D0D0', after: S.red, fmt: K.money, labelW: 2.5, extraW: 1.0, boldFirst: true,
        extra: (r, b) => c.text(r.dp, {x: b.x, y: b.y, w: 1.0, h: b.h, size: 14, bold: true, color: r.dp.startsWith('+') ? '2E7D32' : S.red, font: FIRA, align: 'right', valign: 'middle'})});
      c.text(['灰：接入前', '红：接入后', '右列：精度变化'], {x: 10.2, y: 2.4, w: 2.6, h: 1.2, size: 12, color: S.muted, font: SANS, lh: 1.4});
      c.text('6 组中唯一掉点：MMLU · GPTSwarm（−0.93）', {x: 10.2, y: 4.2, w: 2.6, h: 1.0, size: 13, color: S.ink, font: SANS, lh: 1.3});
      c.text(SRC.t3, {x: 0.55, y: 7.12, w: 7, h: 0.25, size: 9.5, color: S.muted, font: FIRA});
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
      c.text('空间剪枝', {x: 0.5, y: 0.3, w: 6, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      tile(c, 0.5, 0.95, 4.4, 6.1, 'FFFFFF');
      const gr = K.figure(c, A.right, {x: 0.6, y: 1.05, w: 4.2, h: 5.9});
      K.ring(c, K.at(gr, A.cut1), 0.22, S.pink, 3); K.ring(c, K.at(gr, A.cut2), 0.22, S.pink, 3);
      tile(c, 5.05, 0.95, 3.9, 2.9);
      c.text('6 → 4', {x: 5.35, y: 1.15, w: 3.4, h: 1.1, size: 54, color: S.blue, font: INTER, bold: true});
      c.text('条对话内边，剪掉的是左图红圈处两条', {x: 5.35, y: 2.6, w: 3.4, h: 1.0, size: 12.5, color: S.muted, font: SANS, lh: 1.3});
      tile(c, 9.1, 0.95, 3.73, 2.9);
      c.text('8 → 12', {x: 9.4, y: 1.15, w: 3.3, h: 1.1, size: 54, color: S.green, font: INTER, bold: true});
      c.text('总结者的答案由错变对', {x: 9.4, y: 2.6, w: 3.2, h: 1.0, size: 12.5, color: S.muted, font: SANS, lh: 1.3});
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
      c.text('AgentPrune，一页看完', {x: 0.5, y: 0.3, w: 8, h: 0.5, size: 22, color: S.text, font: SANS, bold: true});
      const cols = [S.blue, S.green, S.text, S.text, S.orange, S.pink];
      const pos = [[0.5, 0.95, 6.1, 3.0, 64], [6.75, 0.95, 6.08, 3.0, 64], [0.5, 4.1, 4.0, 2.95, 40], [4.65, 4.1, 2.6, 2.95, 40], [7.4, 4.1, 2.7, 2.95, 40], [10.25, 4.1, 2.58, 2.95, 40]];
      BENTO.forEach((b, i) => {
        const [x, y, w, h, sz] = pos[i];
        tile(c, x, y, w, h);
        c.text(b.big, {x: x + 0.3, y: y + 0.25, w: w - 0.5, h: sz / 50, size: sz, color: cols[i], font: INTER, bold: true});
        if (b.unit) c.text(b.unit, {x: x + 0.3, y: y + 0.3 + sz / 55, w: w - 0.5, h: 0.4, size: 16, color: S.muted, font: INTER});
        c.text(b.label, {x: x + 0.3, y: y + h - 1.2, w: w - 0.55, h: 0.8, size: 12.5, color: S.muted, font: SANS, lh: 1.25, valign: 'bottom'});
        c.text(b.src, {x: x + 0.3, y: y + h - 0.38, w: w - 0.55, h: 0.25, size: 10, color: '6E6E73', font: INTER});
      });
      c.text(SRC.multi, {x: 0.5, y: 7.15, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- soft bento (light cards)
const softBento = (() => {
  const S = {bg: 'F3F4F8', card: 'FFFFFF', text: '1D2433', muted: '6B7280', lav: 'EDE9FE', lavT: '6D28D9', mint: 'DCFCE7', mintT: '15803D', peach: 'FFEDD5', peachT: 'C2410C', sky: 'E0F2FE', skyT: '0369A1'};
  const card = (c, x, y, w, h, tag, tint, tcol) => {
    c.rect({x: x + 0.03, y: y + 0.05, w, h, fill: 'E2E5EC', r: 0.25});
    c.rect({x, y, w, h, fill: S.card, r: 0.25});
    if (tag) { c.rect({x: x + 0.25, y: y + 0.22, w: 0.25 + tag.length * 0.19, h: 0.32, fill: tint, r: 0.16}); c.text(tag, {x: x + 0.25, y: y + 0.22, w: 0.25 + tag.length * 0.19, h: 0.32, size: 11, color: tcol, font: SANS, bold: true, align: 'center', valign: 'middle'}); }
  };
  const title = (c, t) => { c.bg(S.bg); c.text(t, {x: 0.55, y: 0.3, w: 12, h: 0.6, size: 26, color: S.text, font: SANS, bold: true}); };
  return {name: 'soft-bento', label: '浅色柔和卡片', pages: [
    (c) => {
      title(c, '空间剪枝：剪掉 2 条消息，答案由 8 变 12');
      card(c, 0.55, 1.1, 7.6, 5.95, '图 4 局部', S.sky, S.skyT);
      const gl = K.figure(c, A.left, {x: 0.75, y: 1.7, w: 3.55, h: 5.2}, 'top');
      const gr = K.figure(c, A.right, {x: 4.45, y: 1.7, w: 3.55, h: 5.2}, 'top');
      K.badge(c, K.at(gr, A.cut1), 1, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      K.badge(c, K.at(gr, A.cut2), 2, {fill: S.peachT, color: 'FFFFFF', font: INTER, size: 12, r: 0.18});
      card(c, 8.35, 1.1, 4.48, 1.9, '被剪掉', S.peach, S.peachT);
      c.text(['① Thinker 1 → Thinker 2', '② Thinker 1 → 总结者'], {x: 8.6, y: 1.7, w: 4.1, h: 1.1, size: 15, color: S.text, font: SANS, lh: 1.5});
      card(c, 8.35, 3.15, 4.48, 1.6, '结果', S.mint, S.mintT);
      c.text('原拓扑答 8（错）→ 剪枝后答 12（对）', {x: 8.6, y: 3.7, w: 4.1, h: 0.9, size: 15, color: S.text, font: SANS, lh: 1.3});
      card(c, 8.35, 4.9, 4.48, 2.15, '方法', S.lav, S.lavT);
      c.text(['可学习分数 S^{S} + 系统效用', '训练 K′ 轮 → TopK 一次性剪 p%'], {x: 8.6, y: 5.45, w: 4.1, h: 1.4, size: 14, color: S.text, font: SANS, lh: 1.5});
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
        c.text(['只在原系统的对话内边上剪', '算式中对话间一项带 ×4', '图 4 底部算式求和'][i], {x: x + 0.25, y: 6.2, w: 3.5, h: 0.6, size: 12, color: S.muted, font: SANS});
      });
      c.text(SRC.f4, {x: 0.55, y: 7.15, w: 6, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
    (c) => {
      title(c, '即插即用：接到现有框架上直接省钱');
      card(c, 0.55, 1.1, 7.9, 5.95, 'API 成本（美元）', S.sky, S.skyT);
      K.hbars(c, {x: 0.75, y: 1.75, w: 7.5, h: 5.1}, COST.rows, {font: SANS, numFont: INTER, text: S.text, muted: S.muted, before: 'D6DAE3', after: S.skyT, fmt: K.money, labelW: 2.35, r: 0.04, boldFirst: true});
      card(c, 8.65, 1.1, 4.18, 1.9, '最大降幅', S.mint, S.mintT);
      c.text('$234.76 → $57.17', {x: 8.9, y: 1.65, w: 3.8, h: 0.6, size: 22, color: S.mintT, font: INTER, bold: true});
      c.text('GSM8K · GPTSwarm，精度 +0.84', {x: 8.9, y: 2.3, w: 3.8, h: 0.5, size: 13, color: S.muted, font: SANS});
      card(c, 8.65, 3.15, 4.18, 1.9, 'Prompt token', S.lav, S.lavT);
      c.text('−28.1% ~ −72.8%', {x: 8.9, y: 3.7, w: 3.8, h: 0.6, size: 22, color: S.lavT, font: INTER, bold: true});
      c.text('6 组实验的降幅区间', {x: 8.9, y: 4.35, w: 3.8, h: 0.5, size: 13, color: S.muted, font: SANS});
      card(c, 8.65, 5.2, 4.18, 1.85, '唯一掉点', S.peach, S.peachT);
      c.text('MMLU · GPTSwarm：83.98 → 83.05', {x: 8.9, y: 5.75, w: 3.8, h: 0.9, size: 14, color: S.text, font: SANS, lh: 1.3});
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
  const cs = {stroke: S.red, fill: S.red, line: S.red, color: 'FFFFFF', font: SANS, size: 12, ring: 0.2};
  return {name: 'swiss', label: '瑞士国际主义', pages: [
    (c) => {
      frame(c, '03 — 方法 / 空间剪枝', 8);
      c.text('6→4', {x: 0.45, y: 1.0, w: 6, h: 2.0, size: 120, color: S.ink, font: INTER, bold: true});
      c.text('条对话内边。剪掉 2 条后，总结者的答案从 8 变成 12。', {x: 0.5, y: 3.25, w: 5.6, h: 1.0, size: 22, color: S.ink, font: SANS, bold: true, lh: 1.3});
      c.line({x1: 0.5, y1: 4.5, x2: 6.1, y2: 4.5, color: S.ink, lw: 1});
      c.text(['可学习分数 S^{S} × 系统效用', '训练 K′ 轮 → TopK 剪 p%', '之后拓扑固定'], {x: 0.5, y: 4.65, w: 2.7, h: 1.5, size: 13, color: S.ink, font: SANS, lh: 1.5});
      c.text(['① T1 → T2', '② T1 → 总结者'], {x: 3.4, y: 4.65, w: 2.7, h: 1.0, size: 13, color: S.red, font: SANS, bold: true, lh: 1.5});
      const g = K.figure(c, A.full, {x: 6.6, y: 1.0, w: 6.23, h: 6.0}, 'top');
      K.badge(c, K.at(g, FULL(775, 253)), 1, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16});
      K.badge(c, K.at(g, FULL(735, 397)), 2, {fill: S.red, color: 'FFFFFF', font: INTER, size: 11, r: 0.16});
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
      c.text('−75.6%', {x: 0.45, y: 1.05, w: 6.0, h: 2.0, size: 92, color: S.red, font: INTER, bold: true});
      c.text('GSM8K · GPTSwarm 的 API 成本：$234.76 → $57.17，精度 89.74 → 90.58。', {x: 0.5, y: 3.25, w: 5.6, h: 1.1, size: 20, color: S.ink, font: SANS, bold: true, lh: 1.3});
      c.text(['prompt token −28.1% ~ −72.8%', '6 组中 5 组精度上升'], {x: 0.5, y: 4.7, w: 5.6, h: 1.0, size: 14, color: S.ink, font: SANS, lh: 1.5});
      K.hbars(c, {x: 6.6, y: 1.05, w: 6.23, h: 5.8}, COST.rows, {font: SANS, numFont: INTER, text: S.ink, muted: S.muted, before: S.light, after: S.ink, afterText: S.ink, fmt: K.money, labelW: 2.2, labelSize: 12, boldFirst: true});
      c.text(SRC.t3, {x: 0.5, y: 7.1, w: 8, h: 0.25, size: 9, color: S.muted, font: INTER});
    },
  ]};
})();

// ---------------------------------------------------------------- slidev seriph (serif, split layout)
const seriph = (() => {
  const S = {ink: '2B2B2B', muted: '7C7C7C', panel: 'F4F1EC', acc: '9C4A2F', rule: 'D6D0C6'};
  const left = (c, kicker, title, body) => {
    c.bg('FFFFFF');
    c.text(kicker, {x: 0.7, y: 0.7, w: 5, h: 0.3, size: 12, color: S.acc, font: SERIF, italic: true});
    c.text(title, {x: 0.7, y: 1.05, w: 5.3, h: 1.6, size: 27, color: S.ink, font: SERIF, bold: true, lh: 1.2});
    c.line({x1: 0.7, y1: 2.85, x2: 1.6, y2: 2.85, color: S.acc, lw: 2});
    c.text(body, {x: 0.7, y: 3.1, w: 5.1, h: 3.6, size: 15, color: S.ink, font: SERIF, lh: 1.55, paraGap: 8});
  };
  const panel = (c) => c.rect({x: 6.3, y: 0, w: W - 6.3, h: H, fill: S.panel});
  const cs = {stroke: S.acc, fill: 'FFFFFF', line: S.acc, color: S.acc, font: SERIF, size: 12, ring: 0.2, r: 0.04};
  return {name: 'seriph', label: 'Slidev Seriph 衬线分栏', pages: [
    (c) => {
      left(c, 'Method · 空间剪枝', '少传两条消息，答案反而对了', ['每条对话内边配一个可学习分数 S^{S}，与系统效用一起优化。', '训练 K′ 轮后按 TopK 一次性剪掉 p% 的边，之后拓扑固定。', '右图：剪掉 ① ② 两条边后，总结者的答案从 8（错）变成 12（对）。']);
      panel(c);
      const gl = K.figure(c, A.left, {x: 6.6, y: 0.7, w: 3.15, h: 6.1});
      const gr = K.figure(c, A.right, {x: 9.9, y: 0.7, w: 3.15, h: 6.1});
      K.callout(c, K.at(gr, A.cut1), {x: 10.2, y: 0.3, w: 1.6, h: 0.32}, '① T1→T2', cs);
      K.callout(c, K.at(gr, A.cut2), {x: 9.9, y: 6.6, w: 2.0, h: 0.32}, '② T1→总结者', cs);
      c.text(SRC.f4, {x: 0.7, y: 7.05, w: 5, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
    (c) => {
      left(c, 'Method · 时间剪枝', '历史只带两条，token 少一半', ['上一轮的发言是否写进下一轮提示词，由掩码 S^{T} 决定。', '图 4 中 4 条历史只保留 Answer 3 与 Conclusion。']);
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
      left(c, 'Results · 即插即用', '接到现有框架上，成本直接打折', ['5 个 gpt-4 agent，AutoGen 与 GPTSwarm，三个数据集。', 'GSM8K · GPTSwarm：$234.76 → $57.17，精度还高了 0.84。', '6 组中只有 MMLU · GPTSwarm 掉了 0.93。']);
      panel(c);
      c.text('API 成本（美元）', {x: 6.7, y: 0.7, w: 4, h: 0.3, size: 13, color: S.muted, font: SERIF, italic: true});
      K.hbars(c, {x: 6.7, y: 1.15, w: 6.25, h: 5.6}, COST.rows, {font: SERIF, numFont: PAG, text: S.ink, muted: S.muted, before: 'D9D2C7', after: S.acc, fmt: K.money, labelW: 2.55, labelSize: 12, boldFirst: true});
      c.text(SRC.t3, {x: 0.7, y: 7.05, w: 5.4, h: 0.25, size: 9.5, color: S.muted, font: PAG});
    },
  ]};
})();

// ---------------------------------------------------------------- neo-brutalism
const brutal = (() => {
  const S = {bg: 'FFF4D6', ink: '111111', yellow: 'FFD23F', pink: 'FF7AB6', green: '3DDC97', blue: '74B9FF', white: 'FFFFFF'};
  const box = (c, x, y, w, h, fill, sh = 0.09) => { c.rect({x: x + sh, y: y + sh, w, h, fill: S.ink}); c.rect({x, y, w, h, fill, line: S.ink, lw: 2.5}); };
  const head = (c, tag, title, tagFill) => {
    c.bg(S.bg);
    box(c, 0.5, 0.35, 0.3 + tag.length * 0.21, 0.42, tagFill, 0.06);
    c.text(tag, {x: 0.5, y: 0.35, w: 0.3 + tag.length * 0.21, h: 0.42, size: 13, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
    c.text(title, {x: 0.5, y: 0.95, w: 12.3, h: 0.75, size: 30, color: S.ink, font: SANS, bold: true});
  };
  const st = {stroke: S.ink, fill: S.pink, line: S.ink, color: S.ink, font: SANS, size: 13, lw: 2.5, boxLw: 2.5, shadow: 0.06, ring: 0.22};
  return {name: 'neo-brutalism', label: '新野兽派', pages: [
    (c) => {
      head(c, '方法 · 空间剪枝', '剪掉 2 条消息，答案从 8 变成 12', S.yellow);
      box(c, 0.5, 1.95, 3.85, 5.0, S.white);
      const gl = K.figure(c, A.left, {x: 0.6, y: 2.05, w: 3.65, h: 4.8});
      box(c, 4.65, 1.95, 3.85, 5.0, S.white);
      const gr = K.figure(c, A.right, {x: 4.75, y: 2.05, w: 3.65, h: 4.8});
      K.callout(c, K.at(gr, A.cut1), {x: 8.95, y: 2.0, w: 3.6, h: 0.55}, '① 剪掉 Thinker 1 → 2', st);
      K.callout(c, K.at(gr, A.cut2), {x: 8.95, y: 3.05, w: 3.6, h: 0.55}, '② 剪掉 Thinker 1 → 总结者', st);
      box(c, 8.95, 4.2, 1.7, 1.1, S.pink); c.text(['原拓扑', '答 8（错）'], {x: 8.95, y: 4.2, w: 1.7, h: 1.1, size: 15, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
      box(c, 10.85, 4.2, 1.7, 1.1, S.green); c.text(['剪枝后', '答 12（对）'], {x: 10.85, y: 4.2, w: 1.7, h: 1.1, size: 15, color: S.ink, font: SANS, bold: true, align: 'center', valign: 'middle'});
      box(c, 8.95, 5.6, 3.6, 1.35, S.blue);
      c.text('可学习分数 S^{S} → 训练 K′ 轮 → TopK 一次性剪 p%', {x: 9.1, y: 5.6, w: 3.3, h: 1.35, size: 13, color: S.ink, font: SANS, bold: true, valign: 'middle', lh: 1.3});
      c.text(SRC.f4, {x: 0.5, y: 7.13, w: 6, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
    (c) => {
      head(c, '方法 · 时间剪枝', '历史 4 条只带 2 条，token 砍掉一半', S.green);
      c.text('上一轮的发言历史', {x: 0.5, y: 1.95, w: 6, h: 0.35, size: 15, color: S.ink, font: SANS, bold: true});
      K.history(c, {x: 0.5, y: 2.4, w: 7.6, h: 0.6}, B.history, {font: SANS, keepFill: S.yellow, keepLine: S.ink, keepText: S.ink, dropFill: S.bg, dropLine: S.ink, dropText: '8A8A8A', size: 15, shadow: 0.06});
      c.text('↓ 只把黄色的两条写进下一轮提示词', {x: 0.5, y: 3.2, w: 7.6, h: 0.4, size: 15, color: S.ink, font: SANS, bold: true});
      box(c, 0.5, 3.85, 7.6, 1.15, S.white);
      const g = K.figure(c, B.temporal, {x: 0.6, y: 3.92, w: 7.4, h: 1.0});
      c.text('图 4 原图对应部分（右半为剪枝后）', {x: 0.5, y: 5.15, w: 7.6, h: 0.3, size: 11, color: S.ink, font: SANS});
      B.ledger.forEach((r, i) => {
        const y = 1.95 + i * 1.7;
        box(c, 8.6, y, 4.2, 1.45, [S.white, S.white, S.yellow][i]);
        c.text(r.k, {x: 8.8, y: y + 0.12, w: 3.8, h: 0.35, size: 14, color: S.ink, font: SANS, bold: true});
        c.text(r.a + ' → ' + r.b, {x: 8.8, y: y + 0.5, w: 3.8, h: 0.6, size: 26, color: S.ink, font: INTER, bold: true});
        c.text(r.d, {x: 11.0, y: y + 0.12, w: 1.6, h: 0.35, size: 14, color: S.ink, font: INTER, bold: true, align: 'right'});
      });
      c.text(SRC.f4 + ' · token 由图中算式求和', {x: 0.5, y: 7.13, w: 8, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
    (c) => {
      head(c, '实验 · 鲁棒性', '被攻击时，接了 AgentPrune 的几乎不掉点', S.pink);
      box(c, 0.5, 1.95, 8.6, 5.0, S.white);
      K.vbars(c, {x: 1.15, y: 2.1, w: 7.8, h: 4.75}, ATK.rows, {font: SANS, numFont: INTER, text: S.ink, muted: S.ink, axis: S.ink, before: 'E6E6E6', after: 'A8A8A8', oursBefore: 'BFF2DB', oursAfter: S.green, oursText: S.ink, bad: 'D62F6E', barLine: S.ink, barLw: 2, labelSize: 10});
      box(c, 9.5, 1.95, 3.3, 1.55, S.pink);
      c.text(['AutoGen', '−5.9 分'], {x: 9.65, y: 1.95, w: 3.0, h: 1.55, size: 22, color: S.ink, font: SANS, bold: true, valign: 'middle', lh: 1.2});
      box(c, 9.5, 3.75, 3.3, 1.55, S.green);
      c.text(['接入 AgentPrune', '−0.2 分'], {x: 9.65, y: 3.75, w: 3.0, h: 1.55, size: 22, color: S.ink, font: SANS, bold: true, valign: 'middle', lh: 1.2});
      box(c, 9.5, 5.55, 3.3, 1.4, S.yellow);
      c.text('MMLU，提示攻击；每组左柱攻击前、右柱攻击后', {x: 9.65, y: 5.55, w: 3.0, h: 1.4, size: 12.5, color: S.ink, font: SANS, bold: true, valign: 'middle', lh: 1.3});
      c.text(SRC.f6, {x: 0.5, y: 7.13, w: 8, h: 0.25, size: 9.5, color: S.ink, font: INTER});
    },
  ]};
})();

module.exports = [explainer, lecture, bentoDark, softBento, swiss, seriph, brutal];
