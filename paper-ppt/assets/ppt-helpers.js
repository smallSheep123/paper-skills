// pptxgenjs 通用 helper。新建 deck 时把本文件内容拷进 build.js 顶部，按需改调色板。
// 运行：NODE_PATH=$(npm root -g) node build.js   （画布 13.33 x 7.5 英寸）
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";

// ---- 调色板（示例：深蓝 + 橙；按论文主题可换主色，ACCENT 只给关键数字/问题句）----
const BG = "FFFFFF", DARK = "142438", PRIMARY = "1F3A66", ACCENT = "D2622A";
const TEXT = "232A31", MUTED = "66707A", TINT = "EDF2F8", HAIR = "D9E0E8";
const ONDK = "F2F6FA", ONDK_MUT = "9FB0C4";
const SANS = "Microsoft YaHei";   // 中文 + 正文
const NUM = "Arial";              // 数字/英文强调（等高数字；禁用 Georgia 老式数字）
const W = 13.33;

// ---- 图片：按真实宽高比手算 h，禁止拉伸 ----
const IMG = "img/";
const AR = { fig1: 2.75 }; // 例：宽/高，用 PIL 量完填这里
function img(s, f, x, y, w, ar) { s.addImage({ path: IMG + f, x, y, w, h: w / ar }); }

// ---- 内容页页眉/页脚（封面与结尾页不用）----
function header(s, n, title, sub) {
  s.background = { color: BG };
  s.addText("系统名 · 会议", { x: 0.6, y: 0.3, w: 4, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.62, w: 12.1, h: 0.52, fontFace: SANS, fontSize: 26, bold: true, color: PRIMARY, margin: 0 });
  if (sub) s.addText(sub, { x: 0.6, y: 1.18, w: 12.1, h: 0.32, fontFace: SANS, fontSize: 13.5, color: MUTED, margin: 0 });
  s.addText(`${n} / 9`, { x: 12.2, y: 7.05, w: 0.8, h: 0.3, fontFace: NUM, fontSize: 12, color: MUTED, align: "right", margin: 0 });
}

function figcap(s, x, y, w, t, align) { // 图注，最小 12pt
  s.addText(t, { x, y, w, h: 0.3, fontFace: SANS, fontSize: 12, color: MUTED, align: align || "left", margin: 0 });
}
function hline(s, x, y, w) { s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color: HAIR, width: 1 } }); }
function vline(s, x, y, h) { s.addShape(p.shapes.LINE, { x, y, w: 0, h, line: { color: HAIR, width: 1 } }); }
function band(s, y, h) { s.addShape(p.shapes.RECTANGLE, { x: 0, y, w: W, h, fill: { color: TINT } }); } // 结论/问题通栏带

// ---- 大数字 callout：数值用 NUM 粗体 ACCENT，标签用 SANS MUTED ----
// s.addText([
//   { text: "TTFT −92%", options: { fontFace: NUM, fontSize: 28, bold: true, color: ACCENT } },
//   { text: "  vs vLLM",  options: { fontFace: SANS, fontSize: 14, color: MUTED } },
// ], { x, y, w, h: 0.6, margin: 0 });

// ---- 演讲备注：正式口语 + 时长标记 ----
// s.addNotes("……（约 50 秒）");

p.writeFile({ fileName: "deck.pptx" }).then(() => console.log("written"));
