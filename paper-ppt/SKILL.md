---
name: paper-ppt
description: 把论文 PDF 做成学术组会汇报 PPT 的完整工作流（提取入库 → 定图 → 逐页规划 → pptxgenjs 生成 → LibreOffice 渲染 → 视觉验收 → 交付）。当用户要"把这篇论文做成 PPT / 组会汇报 / 论文分享 slides / 讲论文"，或给了逐页规划让生成 PPT 时使用。与 paper-extract skill 配套。
---

# paper-ppt：论文汇报 PPT 工作流

目标产出：一份能直接讲的学术汇报 PPT（16:9，微软雅黑正文，论文原图 + 自绘示意图，每页带演讲备注）。**不像 AI 总结卡片。**

> 分享 / 装到别的机器：见 [INSTALL.md](INSTALL.md)（依赖、MinerU 模型下载、MCP 配置）。
> 完整成品示例脚本：[assets/example-build.js](assets/example-build.js)（DVLA OSDI'26 九页，可直接对照改）。

## 流程总览

```
提取入库 → 定图核对 → 逐页规划 → build.js 生成 → fix_pPr 修正
→ LibreOffice 渲染 PNG → visual-judge 验收 → 修复 → 交付
```

### 0. 环境与约定

- 工作目录：`D:\AIGC\<论文名缩写>-ppt\`（图片放 `img\` 子目录），成品最终移到 `D:\AIGC\<系统名>_<会议>_论文汇报.pptx`。
- pptxgenjs：`NODE_PATH=$(npm root -g) node build.js`（已全局安装）。
- 渲染：`"D:/AIGC/lmetric-ppt/lo/program/soffice.com" -env:UserInstallation=file:///D:/AIGC/lmetric-ppt/loprofile --headless --convert-to pdf --outdir . <deck>.pptx`，再 `pdftoppm -png -r 150 <deck>.pdf slide`。
  - **必须用 `soffice.com`**（`soffice.exe` 是 GUI 子系统进程，在 Git Bash 里会挂住不退出）。
- 提取论文：优先走配套 **paper-extract** skill（同仓库 `../paper-extract`）；MCP 不可用时用本包 `scripts/extract_offline.py` 兜底（仅在进程内注入 NO_PROXY，不改系统配置）。
- 已有成品可参考：`D:\AIGC\dvla-ppt\build.js`、`D:\AIGC\lmetric-ppt\build.js`。

### 1. 提取 + 定图

1. 用 paper-extract 提取入库，拿到 `paper.md` 和 `images\`。
2. `grep -n -E "images/|^Figure [0-9]+" paper.md`，按"图片行 → 紧随其后的 caption"配对出 Figure N → 哈希文件名映射（此提取格式 caption 在图后面）。
3. **选图前先读论文正文**，只放讲得到的图；每张要上页面的图用 Read 目检确认内容，别信任映射。
4. 拷贝到工作目录 `img\` 并用 PIL 记录尺寸/宽高比（pptxgenjs 按宽高比手算摆放，禁止拉伸变形）。
5. MinerU 裁切偶尔会把子图的图例切在单词中间（如 Figure 8 双栏图）：拼图前目检，碎图例直接裁掉并用一行文字图例替代。

### 2. 逐页规划

- **用户给了逐页规划 → 严格照办**（标题、每页放什么、演讲稿、时间分配都以用户为准，核对数字后不要自作主张改结构）。
- 没给规划 → 用默认结构，读 [references/talk-structure.md](references/talk-structure.md)。
- 排版与用色规则是硬性的，读 [references/style-guide.md](references/style-guide.md) 后再写 build.js。
- 页面上出现的每个数字都必须能在论文正文里找到出处，不确定的不写。

### 3. 生成 build.js

- 用 [assets/ppt-helpers.js](assets/ppt-helpers.js) 里的常量与 helper（header / figcap / img / hline / vline），拷进 build.js 改配色即可。
- 每页 `addNotes(...)` 写正式口语演讲稿，句尾标"（约 X 秒/分）"，全篇加总等于用户要的时长。
- 已知坑：
  - **多 run 段落**（含上标/混排）写完后必须跑 `assets/fix_pPr.py <deck>.pptx` 去重 `<a:pPr>`，否则 PowerPoint 重排会乱。
  - 十六进制色不带 `#`；透明度用 `transparency`/`opacity` 属性；bullet 用 `{code, indent}` 工厂函数；shadow 对象每次新建。
  - 最小字号 ≥12pt；文本框 `margin: 0` 便于对齐。

### 4. 渲染 + 验收

1. `node build.js` → `python assets/fix_pPr.py <deck>.pptx`（校验通过：页数、每页图片数、notes 有无）。
2. soffice 转 PDF → pdftoppm 出 PNG。
3. 派 `presentations:visual-judge`，prompt 要给足上下文：**设计意图**（深色封面/浅色内容、主色强调色）、哪些是论文原图（学术样貌是预期）、封面留空是有意的、自绘方块示意图是教学图。验收标准：无溢出/裁切/重叠/乱码，中文与 ①②③④ 正常渲染，图片无变形，整体"正式学术而非 AI 卡片"。
4. **不要自己先看图再派 judge**（重复劳动）。fail 的页修完只重派 fail 的页。
5. 全部 pass → 移动成品到 `D:\AIGC\`，删除 PDF/PNG 中间产物，最终回复带 `::zcode-file-citation{path=... purpose="output"}`。

## 禁止事项

- 演讲稿不上页面；页面不放"关键词 / 一句话概括 / 核心亮点 / 3 个贡献卡片"。
- 标题不中英混排（"局限与结论"而不是"局限与结论 Limitations & Takeaways"）。
- 数字/英文强调用 **Arial**，不用 Georgia（老式数字高低不齐，用户明确批评过）。
- 不要为此流程改用户系统环境变量；本地服务检查带 `--noproxy "*"`。
- 用户说"不要再重做"时只做增量修改。
