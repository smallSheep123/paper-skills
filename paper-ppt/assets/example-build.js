const pptxgen = require("pptxgenjs");

const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.author = "Paper Reading";
p.title = "DVLA: OSDI 2026 Paper Reading";

// ---------- palette (deep blue + orange, per user spec) ----------
const BG = "FFFFFF";
const DARK = "142438";
const CARD_DK = "1D3252";
const PRIMARY = "1F3A66";   // deep blue
const ACCENT = "D2622A";    // orange, numbers/questions only
const TEXT = "232A31";
const MUTED = "66707A";
const TINT = "EDF2F8";
const HAIR = "D9E0E8";
const SQ_S = "B9CDE4";      // short-VM square
const ONDK = "F2F6FA";
const ONDK_MUT = "9FB0C4";
const RACK = "3A557A";

const SANS = "Microsoft YaHei";
const SERIF = "Arial";    // for numerals / emphasis only
const W = 13.33;

// Historical example (DVLA, OSDI 2026). Paths come from the command line, never hard-coded:
//   node assets/example-build.js <image-dir> <out.pptx>
// The image directory must hold the cropped figures referenced below (fig1.png, ...).
const path = require("node:path");
const IMG = path.resolve(process.argv[2] || "img") + "/";
const OUT = path.resolve(process.argv[3] || "example.pptx");
const AR = { fig1: 2.75, f2a: 1.67, f2b: 1.71, fig5: 2.04, fig6: 2.36, fig7: 2.61, f8pd: 1.558, f8vr: 1.363, fig13: 2.6 };

// ---------- helpers ----------
function header(s, n, title, sub) {
  s.background = { color: BG };
  s.addText("DVLA · OSDI 2026", { x: 0.6, y: 0.3, w: 4, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.62, w: 12.1, h: 0.52, fontFace: SANS, fontSize: 26, bold: true, color: PRIMARY, margin: 0 });
  if (sub) s.addText(sub, { x: 0.6, y: 1.18, w: 12.1, h: 0.32, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  s.addText(`${n} / 9`, { x: 12.2, y: 7.05, w: 0.8, h: 0.3, fontFace: SERIF, fontSize: 12, color: MUTED, align: "right", margin: 0 });
}
function figcap(s, x, y, w, t, align) {
  s.addText(t, { x, y, w, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, align: align || "left", margin: 0 });
}
function img(s, f, x, y, w, ar) { s.addImage({ path: IMG + f, x, y, w, h: w / ar }); }
function vline(s, x, y, h) { s.addShape(p.shapes.LINE, { x, y, w: 0, h, line: { color: HAIR, width: 1 } }); }
function hline(s, x, y, w) { s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color: HAIR, width: 1 } }); }
function vmrow(s, label, x, y, kinds, sw, sh) {
  sw = sw || 0.55; sh = sh || 0.3;
  let cx = x;
  if (label) {
    s.addText(label, { x, y: y - 0.02, w: 0.92, h: sh + 0.04, fontFace: SANS, fontSize: 12, color: MUTED, valign: "middle", margin: 0 });
    cx = x + 0.95;
  }
  kinds.forEach((k) => {
    if (k === "L") s.addShape(p.shapes.RECTANGLE, { x: cx, y, w: sw, h: sh, fill: { color: PRIMARY } });
    else if (k === "S") s.addShape(p.shapes.RECTANGLE, { x: cx, y, w: sw, h: sh, fill: { color: SQ_S } });
    else s.addShape(p.shapes.RECTANGLE, { x: cx, y, w: sw, h: sh, fill: { color: "FFFFFF" }, line: { color: HAIR, width: 1 } });
    cx += sw + 0.07;
  });
  return cx;
}

// ============================================================ P1 cover
{
  const s = p.addSlide();
  s.background = { color: DARK };
  s.addText("OSDI 2026 · Seattle", { x: 0.7, y: 0.5, w: 5, h: 0.3, fontFace: SANS, fontSize: 12, color: ONDK_MUT, margin: 0 });
  s.addText("OSDI 2026 · Fleet and Cluster Scheduling", { x: 0.7, y: 1.9, w: 7, h: 0.35, fontFace: SANS, fontSize: 13, color: ACCENT, margin: 0 });
  s.addText("DVLA", { x: 0.7, y: 2.3, w: 6, h: 1.0, fontFace: SERIF, fontSize: 54, bold: true, color: ONDK, margin: 0 });
  s.addText([
    { text: "Dynamic VM Lifetime Aware Scheduling for Drifting Lifetime", options: { breakLine: true } },
    { text: "Distributions and Long-Lived VM Placement Debt" },
  ], { x: 0.7, y: 3.45, w: 11.2, h: 0.95, fontFace: SANS, fontSize: 19, bold: true, color: ONDK, margin: 0, lineSpacingMultiple: 1.2 });
  s.addText("Zhengtong Zhang, Zihan Xu, Zhidong Hu, Yanbo Shan, Fei Peng, et al.",
    { x: 0.7, y: 4.75, w: 11, h: 0.32, fontFace: SANS, fontSize: 13, color: ONDK_MUT, margin: 0 });
  s.addText("Alibaba Cloud Computing",
    { x: 0.7, y: 5.1, w: 11, h: 0.32, fontFace: SANS, fontSize: 13.5, color: ONDK, margin: 0 });
  s.addText("报告人：__________　　学号：__________　　课程：__________",
    { x: 0.7, y: 6.15, w: 9, h: 0.35, fontFace: SANS, fontSize: 13, color: ONDK_MUT, margin: 0 });
  // subtle rack vector, bottom-right
  [[10.9, 5.15], [11.65, 5.45], [12.4, 5.2]].forEach(([rx, ry]) => {
    s.addShape(p.shapes.RECTANGLE, { x: rx, y: ry, w: 0.58, h: 1.55, fill: { color: DARK }, line: { color: RACK, width: 1 } });
    for (let i = 1; i <= 4; i++) s.addShape(p.shapes.LINE, { x: rx + 0.07, y: ry + i * 0.31, w: 0.44, h: 0, line: { color: RACK, width: 0.75 } });
  });
  s.addNotes(
    "各位老师、同学，大家好。我今天汇报的论文是 DVLA: Dynamic VM Lifetime Aware Scheduling for Drifting Lifetime Distributions and Long-Lived VM Placement Debt，发表在 OSDI 2026，来自阿里巴巴云计算，属于集群调度方向的研究。" +
    "这篇论文关注的问题是：云平台中虚拟机的生命周期信息，应当如何在调度系统中被更合理地使用。（约 20 秒）"
  );
}

// ============================================================ P2 background
{
  const s = p.addSlide();
  header(s, 2, "研究背景：VM 生命周期与资源利用效率", "为什么 VM 生命周期值得参与调度");
  // left: self-drawn schematic (short VMs end -> machines pinned by long VMs)
  s.addText("短 VM 结束后，机器能否回收取决于长 VM 的位置", { x: 0.6, y: 1.62, w: 5.0, h: 0.32, fontFace: SANS, fontSize: 14, bold: true, color: TEXT, margin: 0 });
  vmrow(s, "物理机 A", 0.6, 2.1, ["S", "S", "L"]);
  vmrow(s, "物理机 B", 0.6, 2.56, ["S", "S", "S"]);
  vmrow(s, "物理机 C", 0.6, 3.02, ["L", "E", "E"]);
  s.addShape(p.shapes.LINE, { x: 2.6, y: 3.5, w: 0, h: 0.38, line: { color: MUTED, width: 1.5, endArrowType: "triangle" } });
  s.addText("短生命周期 VM 运行结束", { x: 2.85, y: 3.55, w: 2.6, h: 0.3, fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0 });
  vmrow(s, "物理机 A", 0.6, 4.05, ["E", "E", "L"]);
  vmrow(s, "物理机 B", 0.6, 4.51, ["E", "E", "E"]);
  vmrow(s, "物理机 C", 0.6, 4.97, ["L", "E", "E"]);
  s.addText([
    { text: "A、C 被单个长 VM 钉住，", options: { fontFace: SANS, fontSize: 13, color: TEXT } },
    { text: "长期无法回收", options: { fontFace: SANS, fontSize: 13, bold: true, color: ACCENT } },
  ], { x: 0.6, y: 5.48, w: 5.2, h: 0.32, margin: 0 });
  vmrow(s, null, 0.62, 6.0, ["S"], 0.3, 0.24);
  s.addText("S = 短生命周期 VM", { x: 1.05, y: 5.97, w: 1.9, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, valign: "middle", margin: 0 });
  vmrow(s, null, 3.0, 6.0, ["L"], 0.3, 0.24);
  s.addText("L = 长生命周期 VM", { x: 3.43, y: 5.97, w: 2.0, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, valign: "middle", margin: 0 });
  // right: Figure 1 + stats
  img(s, "fig1_lifetime.jpg", 5.95, 1.75, 6.75, AR.fig1);
  figcap(s, 5.95, 4.28, 6.8, "Figure 1 — VM 生命周期分布：请求量 vs core-hours（Alibaba Cloud 生产数据）");
  s.addText([
    { text: "短 VM（< 1 天）　", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
    { text: "96%", options: { fontFace: SERIF, fontSize: 17, bold: true, color: ACCENT } },
    { text: " 的请求 · 不足 ", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
    { text: "2%", options: { fontFace: SERIF, fontSize: 17, bold: true, color: ACCENT } },
    { text: " 的 core-hours", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
  ], { x: 5.95, y: 4.75, w: 6.8, h: 0.4, margin: 0 });
  s.addText([
    { text: "长 VM（> 1 月）　", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
    { text: "2.5%", options: { fontFace: SERIF, fontSize: 17, bold: true, color: ACCENT } },
    { text: " 的请求 · ", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
    { text: "93%", options: { fontFace: SERIF, fontSize: 17, bold: true, color: ACCENT } },
    { text: " 的 core-hours", options: { fontFace: SANS, fontSize: 15, color: TEXT } },
  ], { x: 5.95, y: 5.25, w: 6.8, h: 0.4, margin: 0 });
  s.addText("集群的长期资源占用，由少量长生命周期 VM 决定。",
    { x: 5.95, y: 5.85, w: 6.8, h: 0.32, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 6.5, w: W, h: 0.62, fill: { color: TINT } });
  s.addText("长生命周期 VM 的放置方式，决定了机器能否被及时回收。",
    { x: 0.6, y: 6.5, w: 12.1, h: 0.62, fontFace: SANS, fontSize: 16, bold: true, color: PRIMARY, valign: "middle", margin: 0 });
  s.addNotes(
    "首先是研究背景。云平台的资源成本与物理机数量直接相关，因此调度器追求更高的打包密度。生产数据给出了一个高度不对称的分布：存活不足一天的短 VM 占请求量的 96%，却只贡献不到 2% 的 core-hours；存活超过一个月的长 VM 只有约 2.5% 的请求，却占用 93% 的 core-hours。也就是说，集群的长期资源占用由少量长生命周期 VM 决定。" +
    "左侧示意图说明了一个基本事实：短 VM 结束之后，一台机器能否被回收，取决于它上面长 VM 的分布方式。因此，长 VM 的放置是资源效率的关键。（约 50 秒）"
  );
}

// ============================================================ P3 two production problems
{
  const s = p.addSlide();
  header(s, 3, "现有生命周期感知调度面临两个生产问题", "来自生产环境的核心动机");
  // upper: drift
  s.addText("① Lifetime Distribution Drift（分布漂移）", { x: 0.6, y: 1.6, w: 6.5, h: 0.32, fontFace: SANS, fontSize: 15.5, bold: true, color: TEXT, margin: 0 });
  img(s, "fig2a_spatial.jpg", 0.6, 2.05, 2.5, AR.f2a);
  img(s, "fig2b_temporal.jpg", 3.3, 2.05, 2.5, AR.f2b);
  figcap(s, 0.6, 3.57, 2.6, "跨集群差异", "center");
  figcap(s, 3.3, 3.57, 2.6, "月度时间漂移", "center");
  s.addText([
    { text: "Spatial drift　", options: { fontFace: SERIF, fontSize: 14.5, bold: true, color: PRIMARY } },
    { text: "不同集群的生命周期分布差异显著", options: { fontFace: SANS, fontSize: 14, color: TEXT } },
  ], { x: 6.3, y: 2.15, w: 6.4, h: 0.38, margin: 0 });
  s.addText([
    { text: "Temporal drift　", options: { fontFace: SERIF, fontSize: 14.5, bold: true, color: PRIMARY } },
    { text: "同一集群的分布随月份发生明显偏移", options: { fontFace: SANS, fontSize: 14, color: TEXT } },
  ], { x: 6.3, y: 2.65, w: 6.4, h: 0.38, margin: 0 });
  s.addText("固定的 lifetime category 与静态策略无法长期适用（LA-Binary / NILAS / LAVA 均如此）。",
    { x: 6.3, y: 3.2, w: 6.4, h: 0.38, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  hline(s, 0.6, 4.1, 12.1);
  // lower: placement debt, self-drawn
  s.addText("② Long-lived VM Placement Debt（放置债务）", { x: 0.6, y: 4.25, w: 6.5, h: 0.32, fontFace: SANS, fontSize: 15.5, bold: true, color: TEXT, margin: 0 });
  s.addText("分散放置（现状）", { x: 0.6, y: 4.68, w: 2.6, h: 0.28, fontFace: SANS, fontSize: 13, bold: true, color: MUTED, margin: 0 });
  vmrow(s, "PM1", 0.6, 5.02, ["L", "S", "S"], 0.42, 0.28);
  vmrow(s, "PM2", 0.6, 5.4, ["L", "S", "S"], 0.42, 0.28);
  vmrow(s, "PM3", 0.6, 5.78, ["L", "S", "S"], 0.42, 0.28);
  vmrow(s, "PM4", 0.6, 6.16, ["L", "S", "S"], 0.42, 0.28);
  s.addText("短 VM 结束后", { x: 3.42, y: 4.68, w: 1.8, h: 0.28, fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0 });
  s.addShape(p.shapes.LINE, { x: 3.02, y: 5.75, w: 0.42, h: 0, line: { color: MUTED, width: 1.25, endArrowType: "triangle" } });
  vmrow(s, null, 3.5, 5.02, ["L", "E", "E"], 0.42, 0.28);
  vmrow(s, null, 3.5, 5.4, ["L", "E", "E"], 0.42, 0.28);
  vmrow(s, null, 3.5, 5.78, ["L", "E", "E"], 0.42, 0.28);
  vmrow(s, null, 3.5, 6.16, ["L", "E", "E"], 0.42, 0.28);
  s.addText("四台机器均无法释放", { x: 3.5, y: 6.55, w: 2.6, h: 0.3, fontFace: SANS, fontSize: 13, bold: true, color: ACCENT, margin: 0 });
  s.addText("集中放置（理想）", { x: 6.85, y: 4.68, w: 2.6, h: 0.28, fontFace: SANS, fontSize: 13, bold: true, color: MUTED, margin: 0 });
  vmrow(s, "PM1", 6.85, 5.02, ["L", "L", "L"], 0.42, 0.28);
  vmrow(s, "PM2", 6.85, 5.4, ["L", "E", "E"], 0.42, 0.28);
  vmrow(s, "PM3", 6.85, 5.78, ["S", "S", "S"], 0.42, 0.28);
  vmrow(s, "PM4", 6.85, 6.16, ["S", "S", "S"], 0.42, 0.28);
  s.addText("长 VM 聚集，机器可回收", { x: 6.85, y: 6.55, w: 2.8, h: 0.3, fontFace: SANS, fontSize: 13, color: TEXT, margin: 0 });
  // small transition
  s.addText([
    { text: "Distribution Drift", options: { fontFace: SERIF, fontSize: 15, bold: true, color: PRIMARY, breakLine: true } },
    { text: "＋", options: { fontFace: SANS, fontSize: 14, color: MUTED, breakLine: true } },
    { text: "Placement Debt", options: { fontFace: SERIF, fontSize: 15, bold: true, color: PRIMARY, breakLine: true } },
    { text: "↓", options: { fontFace: SANS, fontSize: 15, color: ACCENT, breakLine: true } },
    { text: "DVLA", options: { fontFace: SERIF, fontSize: 19, bold: true, color: ACCENT } },
  ], { x: 10.4, y: 4.85, w: 2.3, h: 2.0, align: "center", margin: 0, lineSpacingMultiple: 1.12 });
  s.addNotes(
    "在生产环境中，现有的生命周期感知调度遇到两个关键问题。" +
    "第一是生命周期分布漂移。Figure 2 显示：不同集群之间的生命周期分布差异很大，同一集群的分布也会随月份发生明显偏移。因此 LA-Binary、NILAS、LAVA 这类依赖固定生命周期分类的静态策略，无法长期适用于生产环境。" +
    "第二是长生命周期 VM 放置债务。以 LAVA 为代表的策略为了提高单机打包密度，把短 VM 与长 VM 混放，结果是长 VM 被分散到大量机器上。短 VM 结束后，这些机器各自被一个长 VM 钉住，整机无法回收，形成持续累积的 placement debt。" +
    "分布漂移与放置债务这两个问题，共同构成了 DVLA 的设计动机。（约 1 分 05 秒）"
  );
}

// ============================================================ P4 online/offline insufficiency
{
  const s = p.addSlide();
  header(s, 4, "仅依赖在线或离线调度均无法解决 Placement Debt", "为什么必须在线与离线协同");
  vline(s, 7.0, 1.8, 4.6);
  img(s, "fig5_stranded.jpg", 0.6, 1.95, 6.0, AR.fig5);
  figcap(s, 0.6, 4.95, 6.2, "Figure 5 — 三种策略下 stranded machines 比例（迁移预算 0.01%–0.03%，60 天）");
  s.addText("online-only 与 offline-only 的债务都在持续增长，混合策略（绿线）明显更优。",
    { x: 0.6, y: 5.4, w: 6.2, h: 0.35, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  // right: two paragraphs
  s.addText([
    { text: "Online-only", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY, breakLine: true } },
    { text: "能在放置时减少新增债务；但生命周期预测不可能完全准确，已形成的错误放置也无法通过在线决策修复。", options: { fontFace: SANS, fontSize: 14, color: TEXT } },
  ], { x: 7.35, y: 1.95, w: 5.35, h: 1.25, margin: 0, lineSpacingMultiple: 1.15 });
  s.addText("+", { x: 7.35, y: 3.28, w: 5.35, h: 0.4, fontFace: SERIF, fontSize: 22, bold: true, color: ACCENT, align: "center", margin: 0 });
  s.addText([
    { text: "Offline-only", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY, breakLine: true } },
    { text: "约 40% VM 因硬件依赖、工作负载约束或策略限制不可迁移；迁移预算有限，新债务产生速度远快于偿还速度。", options: { fontFace: SANS, fontSize: 14, color: TEXT } },
  ], { x: 7.35, y: 3.75, w: 5.35, h: 1.25, margin: 0, lineSpacingMultiple: 1.15 });
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 7.35, y: 5.35, w: 5.35, h: 1.0, rectRadius: 0.07, fill: { color: TINT } });
  s.addText("Online Prevention ＋ Offline Rectification",
    { x: 7.35, y: 5.35, w: 5.35, h: 1.0, fontFace: SERIF, fontSize: 17, bold: true, color: PRIMARY, align: "center", valign: "middle", margin: 0 });
  s.addNotes(
    "那么，只靠在线调度或者只靠离线调度，能否解决放置债务？Figure 5 的 trace 驱动实验给出了否定的回答。" +
    "Online-only 在放置阶段就考虑生命周期亲和，能够减缓新增债务；但生命周期预测不可能完全准确，而且在线决策是贪心且基本不可撤销的，无法修复历史上已经形成的债务。" +
    "Offline-only 依靠迁移来重整资源，但生产分析显示约 40% 的 VM 因硬件依赖、工作负载约束或策略限制不可迁移；即使对可迁移的部分，迁移预算也有限，新债务的产生速度远快于可执行的偿还速度。" +
    "因此结论是：有效的系统必须同时做两件事——在线预防新债务，离线修正存量债务。这正是 DVLA 的设计出发点。（约 50 秒）"
  );
}

// ============================================================ P5 DVLA architecture
{
  const s = p.addSlide();
  header(s, 5, "DVLA：在线预防与离线修正协同的 VM 调度系统", "看图方法：只看四个模块 —— 预测寿命 · 更新分组 · 在线放置 · 离线迁移");
  img(s, "fig7_arch.jpg", 1.07, 1.62, 11.2, AR.fig7);
  figcap(s, 1.07, 5.92, 11.2, "Figure 7 — DVLA 在线 / 离线调度架构（Alibaba Cloud 生产实现）", "center");
  const comps = [
    ["① Hierarchical Lifetime Prediction", "初始 + 剩余预测，服务在线放置与离线优化"],
    ["② Dynamic Affinity Grouping", "感知分布漂移，动态调整亲和分组"],
    ["③ DAPP", "债务感知放置，源头减少新债务"],
    ["④ PDRE", "离线 live migration 修正存量债务"],
  ];
  comps.forEach((c, i) => {
    s.addText([
      { text: c[0], options: { fontFace: SANS, fontSize: 13, bold: true, color: PRIMARY, breakLine: true } },
      { text: c[1], options: { fontFace: SANS, fontSize: 11.5, color: TEXT } },
    ], { x: 0.6 + i * 2.91, y: 6.3, w: 2.8, h: 0.7, margin: 0, lineSpacingMultiple: 1.1 });
    if (i < 3) vline(s, 0.6 + i * 2.91 + 2.88, 6.36, 0.58);
  });
  s.addNotes(
    "DVLA 的总体架构如 Figure 7 所示。这张图不用看所有箭头，只看四个模块：预测寿命、更新分组、在线放置、离线迁移。" +
    "第一，分层生命周期预测模型：VM 创建时用初始预测支撑低延迟的在线放置，VM 运行后用剩余生命周期预测支撑离线优化。" +
    "第二，动态亲和分组：通过变更点检测实时感知生命周期分布漂移，动态调整调度所用的亲和分组。" +
    "第三，DAPP，即债务感知放置策略：在在线分配阶段主动聚集长生命周期 VM，从源头减少新债务。" +
    "第四，PDRE，即放置债务修正引擎：通过策略性的 live migration 偿还不可避免的存量债务。" +
    "后面两页分别展开这几个组件。（约 1 分钟）"
  );
}

// ============================================================ P6 prediction + grouping
{
  const s = p.addSlide();
  header(s, 6, "动态生命周期感知：从预测到策略更新", "Hierarchical Prediction ＋ Dynamic Affinity Grouping");
  vline(s, 6.75, 1.8, 4.9);
  // left: two-stage prediction flow
  s.addText("分层生命周期预测", { x: 0.6, y: 1.75, w: 5.8, h: 0.32, fontFace: SANS, fontSize: 15.5, bold: true, color: TEXT, margin: 0 });
  const chain = (rows, y0) => {
    rows.forEach((r, i) => {
      s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: y0 + i * 0.78, w: 4.9, h: 0.58, rectRadius: 0.05, fill: { color: i === 1 ? TINT : BG }, line: { color: i === 1 ? PRIMARY : HAIR, width: i === 1 ? 1.25 : 1 } });
      s.addText(r, { x: 0.95, y: y0 + i * 0.78, w: 4.7, h: 0.58, fontFace: SANS, fontSize: 13, color: i === 1 ? PRIMARY : TEXT, valign: "middle", margin: 0 });
      if (i < rows.length - 1) s.addShape(p.shapes.LINE, { x: 3.3, y: y0 + i * 0.78 + 0.58, w: 0, h: 0.2, line: { color: MUTED, width: 1.25, endArrowType: "triangle" } });
    });
  };
  chain(["VM 创建（仅静态请求特征，低延迟要求）", "Initial Lifetime Prediction", "支撑在线放置（DAPP 打分）"], 2.15);
  chain(["VM 运行中（运行时信息丰富）", "Remaining Lifetime Prediction", "支撑离线优化与迁移决策"], 4.65);
  // right: figure 6 + flow
  s.addText("Dynamic Affinity Grouping", { x: 7.05, y: 1.75, w: 5.7, h: 0.32, fontFace: SANS, fontSize: 15.5, bold: true, color: TEXT, margin: 0 });
  img(s, "fig6_grouping.jpg", 7.05, 2.15, 5.65, AR.fig6);
  figcap(s, 7.05, 4.58, 5.7, "Figure 6 — 漂移检测：短暂尖峰判为噪声，持续偏移确认后触发策略更新");
  s.addText([
    { text: "Monitor", options: { fontFace: SERIF, fontSize: 14.5, bold: true, color: PRIMARY } },
    { text: "  →  ", options: { fontFace: SANS, fontSize: 14.5, color: MUTED } },
    { text: "Detect Drift", options: { fontFace: SERIF, fontSize: 14.5, bold: true, color: PRIMARY } },
    { text: "  →  ", options: { fontFace: SANS, fontSize: 14.5, color: MUTED } },
    { text: "Update Groups", options: { fontFace: SERIF, fontSize: 14.5, bold: true, color: PRIMARY } },
  ], { x: 7.05, y: 5.05, w: 5.7, h: 0.4, margin: 0 });
  s.addText("区分短期噪声与持续漂移，避免调度策略频繁震荡。",
    { x: 7.05, y: 5.6, w: 5.7, h: 0.4, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  s.addNotes(
    "先看前两个组件。预测采用分层设计：VM 创建时只有静态请求特征，且在线调度要求低延迟，因此用初始预测模型支撑在线放置；VM 运行之后可以获得丰富的运行时信息，剩余生命周期预测的精度更高，服务于离线优化和迁移决策。" +
    "动态亲和分组解决静态策略失效的问题：系统每天监测集群的生命周期分布，短暂尖峰被当作噪声忽略，持续漂移被确认后才更新亲和分组。" +
    "Figure 6 展示了这一过程：策略既能跟上真实漂移，又不会因为短期波动而频繁震荡。（约 1 分 05 秒）"
  );
}

// ============================================================ P7 DAPP + PDRE
{
  const s = p.addSlide();
  header(s, 7, "Placement Debt 的预防与修正", "DAPP（在线预防）＋ PDRE（离线修正）");
  vline(s, 6.75, 1.75, 4.45);
  // left: DAPP
  s.addText([
    { text: "DAPP", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY } },
    { text: "　Debt-Aware Placement Policy · 在线", options: { fontFace: SANS, fontSize: 13, color: MUTED } },
  ], { x: 0.6, y: 1.72, w: 5.9, h: 0.34, margin: 0 });
  s.addText([
    { text: "长生命周期 VM 到达　→　", options: { fontFace: SANS, fontSize: 14, color: TEXT } },
    { text: "优先放入 Long-lived Affinity 机器", options: { fontFace: SANS, fontSize: 14, bold: true, color: PRIMARY } },
  ], { x: 0.6, y: 2.15, w: 5.9, h: 0.35, margin: 0 });
  s.addText("现状", { x: 0.6, y: 2.75, w: 2.0, h: 0.28, fontFace: SANS, fontSize: 12.5, bold: true, color: MUTED, margin: 0 });
  vmrow(s, "PM1", 0.6, 3.08, ["L", "S"], 0.42, 0.28);
  vmrow(s, "PM2", 0.6, 3.46, ["L", "S"], 0.42, 0.28);
  vmrow(s, "PM3", 0.6, 3.84, ["L", "S"], 0.42, 0.28);
  s.addShape(p.shapes.LINE, { x: 2.95, y: 3.6, w: 0.5, h: 0, line: { color: ACCENT, width: 1.5, endArrowType: "triangle" } });
  s.addText("DAPP", { x: 2.98, y: 3.25, w: 0.9, h: 0.28, fontFace: SERIF, fontSize: 12, bold: true, color: ACCENT, margin: 0 });
  vmrow(s, "PM1", 3.65, 3.08, ["L", "L"], 0.42, 0.28);
  vmrow(s, "PM2", 3.65, 3.46, ["L", "E"], 0.42, 0.28);
  vmrow(s, "PM3", 3.65, 3.84, ["S", "S"], 0.42, 0.28);
  s.addText("长 VM 到达时即聚集到既有长 VM 机器上，避免散落；非对称亲和打分对“长 VM 放入短机器”重罚。",
    { x: 0.6, y: 4.4, w: 5.9, h: 0.6, fontFace: SANS, fontSize: 13, color: MUTED, margin: 0, lineSpacingMultiple: 1.15 });
  // right: PDRE chain
  s.addText([
    { text: "PDRE", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY } },
    { text: "　Placement Debt Rectification Engine · 离线", options: { fontFace: SANS, fontSize: 13, color: MUTED } },
  ], { x: 7.05, y: 1.72, w: 5.7, h: 0.34, margin: 0 });
  const steps = ["识别 stranded machines 上的长生命周期 VM", "按可回收性排序：优先最易回收机器、剩余寿命最长的 VM", "执行 live migration（受迁移预算与安全约束）", "释放整台机器，偿还存量债务"];
  steps.forEach((t, i) => {
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 7.05, y: 2.15 + i * 0.78, w: 5.65, h: 0.56, rectRadius: 0.05, fill: { color: i === 3 ? TINT : BG }, line: { color: i === 3 ? PRIMARY : HAIR, width: i === 3 ? 1.25 : 1 } });
    s.addText(t, { x: 7.2, y: 2.15 + i * 0.78, w: 5.35, h: 0.56, fontFace: SANS, fontSize: 12.5, color: i === 3 ? PRIMARY : TEXT, valign: "middle", margin: 0 });
    if (i < 3) s.addShape(p.shapes.LINE, { x: 9.87, y: 2.71 + i * 0.78, w: 0, h: 0.22, line: { color: MUTED, width: 1.25, endArrowType: "triangle" } });
  });
  s.addText("预测误差 / 历史债务 →", { x: 5.55, y: 3.35, w: 2.3, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, align: "center", margin: 0 });
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 6.42, w: W, h: 0.68, fill: { color: TINT } });
  s.addText([
    { text: "Online ＝ Prevention", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY } },
    { text: "　　·　　", options: { fontFace: SANS, fontSize: 16, color: MUTED } },
    { text: "Offline ＝ Rectification", options: { fontFace: SERIF, fontSize: 16, bold: true, color: PRIMARY } },
  ], { x: 0.6, y: 6.42, w: 12.1, h: 0.68, align: "center", valign: "middle", margin: 0 });
  s.addNotes(
    "方法的后两个组件分别对应债务的预防与修正。" +
    "在线侧的 DAPP 遵循一个简单原则：长生命周期 VM 到达时，优先放入已经具有长生命周期亲和的机器，让长 VM 尽量聚集，而不是为了单机密度把短 VM 填进去。DAPP 用核心数加权的机器分类和非对称亲和打分实现这一点，对“把长 VM 放到短生命周期机器上”这类制造债务的放置施加严厉惩罚。" +
    "离线侧的 PDRE 处理无法避免的存量债务：先借助更准确的剩余生命周期预测，识别 stranded machine 上可迁移的长 VM；在有限迁移预算内，优先选择最容易回收的机器和剩余寿命最长的 VM，通过 live migration 把它们聚拢，最终释放整台机器。" +
    "两者的分工可以概括为一句话：在线负责预防，离线负责修正。（约 1 分钟）"
  );
}

// ============================================================ P8 evaluation + production
{
  const s = p.addSlide();
  header(s, 8, "评估结果：提高 Packing Density，并在生产环境长期运行", "Trace 驱动仿真 ＋ 阿里云生产部署");
  vline(s, 7.85, 1.8, 5.0);
  // left: Figure 8(a) + packing density numbers
  img(s, "fig8_pd.jpg", 0.6, 1.85, 4.35, AR.f8pd);
  figcap(s, 0.6, 4.72, 4.6, "Figure 8(a) — Packing Density 提升（pp）；深色＝Oracle，浅色＝Realistic");
  const pdRows = [["DVLA", "+1.5 pp", ACCENT], ["LAVA", "+0.9 pp", TEXT], ["LA-Binary", "+0.6 pp", TEXT]];
  pdRows.forEach((r, i) => {
    s.addText([
      { text: r[0], options: { fontFace: SANS, fontSize: 14, color: TEXT } },
      { text: "　　", options: { fontFace: SANS, fontSize: 14 } },
      { text: r[1], options: { fontFace: SERIF, fontSize: 17, bold: true, color: r[2] } },
    ], { x: 5.25, y: 2.15 + i * 0.66, w: 2.5, h: 0.4, margin: 0 });
  });
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.3, w: 7.05, h: 0.75, rectRadius: 0.06, fill: { color: TINT } });
  s.addText([
    { text: "vs LAVA 额外 ", options: { fontFace: SANS, fontSize: 16, color: PRIMARY } },
    { text: "+0.6 pp", options: { fontFace: SERIF, fontSize: 20, bold: true, color: ACCENT } },
    { text: "　≈ 云规模下节省 ", options: { fontFace: SANS, fontSize: 16, color: PRIMARY } },
    { text: "数千台机器", options: { fontFace: SANS, fontSize: 16, bold: true, color: ACCENT } },
  ], { x: 0.6, y: 5.3, w: 7.05, h: 0.75, align: "center", valign: "middle", margin: 0 });
  s.addText("23 个生产集群 · 两个月生产 trace 回放（Realistic / Oracle 两种预测设置）",
    { x: 0.6, y: 6.25, w: 7.05, h: 0.32, fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0 });
  // right: production + figure 13
  s.addText("Production Deployment", { x: 8.15, y: 1.82, w: 4.6, h: 0.32, fontFace: SERIF, fontSize: 15, bold: true, color: TEXT, margin: 0 });
  s.addText([
    { text: "Alibaba Cloud · ", options: { fontFace: SANS, fontSize: 14.5, color: TEXT } },
    { text: "> 7 个月", options: { fontFace: SERIF, fontSize: 16, bold: true, color: ACCENT } },
    { text: " · 大规模生产部署", options: { fontFace: SANS, fontSize: 14.5, color: TEXT } },
  ], { x: 8.15, y: 2.2, w: 4.6, h: 0.35, margin: 0 });
  img(s, "fig13_debt.jpg", 8.15, 2.75, 4.55, AR.fig13);
  figcap(s, 8.15, 4.55, 4.6, "Figure 13 — 全量上线前后 stranded machines 占比");
  s.addText([
    { text: "Stranded machines　", options: { fontFace: SANS, fontSize: 13.5, color: TEXT } },
    { text: "25.3% → 21.3%", options: { fontFace: SERIF, fontSize: 15, bold: true, color: ACCENT } },
  ], { x: 8.15, y: 4.95, w: 4.6, h: 0.35, margin: 0 });
  s.addText([
    { text: "仅含单个长 VM 的机器　", options: { fontFace: SANS, fontSize: 13.5, color: TEXT } },
    { text: "4.3% → 3.5%", options: { fontFace: SERIF, fontSize: 15, bold: true, color: ACCENT } },
  ], { x: 8.15, y: 5.38, w: 4.6, h: 0.35, margin: 0 });
  s.addText("放置债务在生产环境中被实质性削减。",
    { x: 8.15, y: 5.9, w: 4.6, h: 0.32, fontFace: SANS, fontSize: 13, color: MUTED, margin: 0 });
  s.addNotes(
    "实验部分。左侧 Figure 8 是主实验：基于 23 个生产集群两个月的 trace 回放，在真实预测设置下，DVLA 将整体打包密度提升 1.5 个百分点，显著高于 LAVA 的 0.9 和 LA-Binary 的 0.6。相比 LAVA 的额外 0.6 个百分点，在云的规模上相当于节省数千台物理机。有一个细节可以提：DVLA 用真实预测的成绩，已经超过了 LAVA 用完美预测的 Oracle 上限，说明算法设计本身的收益超过了预测信息带来的收益。" +
    "右侧是生产部署。DVLA 已在阿里云大规模生产环境运行超过 7 个月。Figure 13 显示：全量上线后，stranded machine 比例从 25.3% 降到 21.3%，只含单个长生命周期 VM 的机器从 4.3% 降到 3.5%，直接验证了放置债务被实质性削减。（约 1 分 10 秒）"
  );
}

// ============================================================ P9 limitations + conclusion
{
  const s = p.addSlide();
  header(s, 9, "局限与结论");
  vline(s, 7.15, 1.8, 4.7);
  // left: limitations
  const lims = [
    ["Prediction dependency", "系统效果随生命周期预测质量提升；但鲁棒性较好——长 VM recall 降至 40% 时仍有 1.02 pp 的打包密度收益。"],
    ["Migration constraints", "约 40% VM 因硬件依赖、工作负载约束或策略限制不可迁移，离线修正能力受迁移预算与约束限制。"],
    ["Environment-specific policy", "生命周期区间与动态分组参数来自生产环境标定，属于环境相关参数；迁移到其他云平台需重新配置与验证。"],
  ];
  lims.forEach((l, i) => {
    s.addText([
      { text: l[0], options: { fontFace: SERIF, fontSize: 15, bold: true, color: PRIMARY, breakLine: true } },
      { text: l[1], options: { fontFace: SANS, fontSize: 13.5, color: TEXT } },
    ], { x: 0.6, y: 1.9 + i * 1.55, w: 6.25, h: 1.45, margin: 0, lineSpacingMultiple: 1.18 });
  });
  // right: conclusion chain
  const chainBoxes = [
    ["Lifetime Drift ＋ Placement Debt", 13.5],
    ["Dynamic Online Scheduling ＋ Offline Rectification", 13.5],
    ["Higher Packing Density", 15],
  ];
  chainBoxes.forEach((b, i) => {
    const hl = i === 2;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 7.5, y: 1.95 + i * 1.25, w: 5.2, h: 0.85, rectRadius: 0.07, fill: { color: hl ? TINT : BG }, line: { color: hl ? PRIMARY : HAIR, width: hl ? 1.5 : 1 } });
    s.addText(b[0], { x: 7.6, y: 1.95 + i * 1.25, w: 5.0, h: 0.85, fontFace: SERIF, fontSize: b[1], bold: true, color: hl ? PRIMARY : TEXT, align: "center", valign: "middle", margin: 0 });
    if (i < 2) s.addShape(p.shapes.LINE, { x: 10.1, y: 2.8 + i * 1.25, w: 0, h: 0.4, line: { color: MUTED, width: 1.5, endArrowType: "triangle" } });
  });
  s.addText("DVLA 将 VM 生命周期信息从静态的放置特征，扩展为持续参与在线调度与离线资源重整的系统信号。",
    { x: 7.5, y: 5.85, w: 5.2, h: 0.75, fontFace: SANS, fontSize: 13.5, color: TEXT, margin: 0, lineSpacingMultiple: 1.2 });
  s.addText("谢谢大家 · 欢迎批评指正", { x: 0.6, y: 6.85, w: 6.2, h: 0.3, fontFace: SANS, fontSize: 13, color: MUTED, margin: 0 });
  s.addNotes(
    "最后是局限与结论。" +
    "局限有三点：第一，系统仍然依赖生命周期预测，效果随预测质量提升；不过敏感性分析显示，即使长 VM 的 recall 降到 40%，仍有 1.02 个百分点的打包密度收益，说明它对不完美预测是鲁棒的。第二，约 40% 的 VM 存在各类迁移限制，离线修正的能力因此受到约束。第三，生命周期区间和动态分组参数来自生产环境标定，属于环境相关参数，迁移到其他云平台需要重新配置和验证——这一点是基于设计的合理归纳。" +
    "总结：DVLA 针对分布漂移与放置债务两个生产问题，通过动态在线调度与离线修正的协同设计，取得了更高的打包密度，并在阿里云生产环境得到验证。它把 VM 生命周期信息从静态的放置特征，扩展为持续参与在线调度与离线资源重整的系统信号。" +
    "我的汇报到此结束，谢谢大家，欢迎批评指正。（约 40 秒）"
  );
}

require("./style-presets").writeDeck(p, OUT).then(() => console.log("written", OUT));
