<p align="center">
  <img src="docs/images/hero.png" alt="paper-skills：把论文变成好看、好讲、可编辑的学术汇报" width="100%">
</p>

<p align="center"><b>中文</b> · <a href="README.en.md">English</a></p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2E86DE"></a>
  <img alt="Skills" src="https://img.shields.io/badge/skills-paper--extract%20%7C%20paper--ppt-8E44AD">
  <img alt="Presets" src="https://img.shields.io/badge/style%20presets-9-E4572E">
  <img alt="Atlas" src="https://img.shields.io/badge/distilled%20from-105%20real%20decks-27AE60">
  <img alt="Output" src="https://img.shields.io/badge/output-editable%20PPTX-555">
</p>

<p align="center">
  <b>两个给 AI 用的 Skill：读论文 → 设计汇报 → 渲染后自己看图修改 → 交付可编辑 PPTX + 演讲备注。</b><br>
  不是“套模板生成 PPT”，而是让 AI 像研究助理 + 视觉编辑一样把一场汇报做完。
</p>

<p align="center">
  <a href="#-三步用起来">三步用起来</a> ·
  <a href="#-对-ai-说什么">对 AI 说什么</a> ·
  <a href="#-每页放什么内容蒸馏">内容蒸馏</a> ·
  <a href="#-9-套风格预设">风格预设</a> ·
  <a href="#-工作流">工作流</a> ·
  <a href="#-本地工具链可选">本地工具链</a> ·
  <a href="#-常见问题">FAQ</a>
</p>

---

## ✨ 你会得到什么

| | |
|---|---|
| 🎯 **讲得清楚** | AI 先读懂论文、定主线，再决定每页讲什么；数字和结论都能追溯到论文原文 |
| 🎨 **看起来专业** | 9 套风格预设，蒸馏自 105 套真实学术 deck（系统顶会、ML 教程、名校课程、国内答辩、日韩技术发表） |
| 👀 **真的看过** | 每批页面都实际渲染成图，AI 看图找问题再改，不是“生成完就交” |
| 🗣 **先问清楚** | 开工前访谈场景、时长、听众、风格；读完论文给你看大纲，做完样页再确认，不会闷头做完才发现方向不对 |
| ✏️ **能继续改** | 输出可编辑 PPTX，文字、标注、自绘图都可改；每页带中文/英文演讲备注 |
| 🧾 **过程可复核** | 保留 `source-notes` / `storyboard` / `qa-summary`，后续局部修改不用从头来 |

---

## 🚀 三步用起来

### ① 把 Skill 放进你的 AI 客户端

本仓库就是两个 Skill 文件夹，每个里面有一份 `SKILL.md`（AI 读的说明书）和配套脚本：

```bash
git clone https://github.com/smallSheep123/paper-skills.git
```

| 你用的 AI | 放到哪里 |
|---|---|
| **Claude Code** | 项目内 `.claude/skills/`，或全局 `~/.claude/skills/` |
| **Codex CLI** | `~/.codex/skills/`（以 Codex 当前文档为准） |
| **其他支持 Skill 的 Agent** | 客户端约定的 skills 目录，常见是 `<project>/.agents/skills/` |
| **不支持 Skill 的 AI**（网页版对话等） | 把 `paper-ppt/SKILL.md` 的内容发给它，或让它先读这个文件；没有本地执行能力时只能产出内容/结构草案 |

```text
<skills 目录>/
├── paper-extract/   # 论文 → AI 可读素材（截图 / 文本 / 图表清单 / MinerU）
└── paper-ppt/       # 论文 → 汇报 PPT（理解、设计、样页、看图迭代、交付）
```

> 两个 Skill 可以单独用。AI 本身能可靠读 PDF 和看图时，只装 `paper-ppt` 也行。

### ② 把论文给 AI，说一句话

```text
用 paper-ppt 把这篇论文做成组会汇报。论文：./paper.pdf
```

### ③ 回答 AI 的问题：问清楚才开工

AI **不会拿到论文就直接做**。它会分三次和你确认，每次都给默认值，你可以只回编号或“默认”：

| 关口 | 什么时候 | 问你什么 |
|---|---|---|
| **G1 需求访谈** | 开工前 | 场景（组会 / 会议 talk / 答辩 / 课程 / 工作汇报）、时长与详略、听众、语言、风格、最想讲的重点、你是作者还是读者、在哪台电脑放映 |
| **G2 大纲确认** | 读完论文后 | 一句话主线 + 每页标题（结论式）+ 哪些放进备份页 |
| **G3 样页确认** | 做完方法页和实验页后 | 风格、文字密度、字体、配色是否满意 |

第一轮大概长这样：

> 开工前确认几件事，回编号就行，不答的按默认：
> 1. 场景：组会读论文 / 讲自己的论文 / 答辩 / 课程展示 / 工作汇报？（默认：组会读论文）
> 2. 讲多细：简略约 10 页、8–10 分钟；详细约 18–20 页、15–20 分钟？（默认：详细）
> 3. 听众：同方向 / 同领域不同方向 / 外行或评委？（默认：同领域不同方向）
> 4. 语言：PPT 和备注都用中文？（默认：是）
> 5. 风格：有想用的预设、截图或学校模板吗？没有我按场景推荐。
> 6. 你最希望听众记住论文的哪一点？

赶时间就说“**你看着办**”：AI 只问详略，其余用默认值，并在交付时列出它替你做的决定。完整问题库见 [intake.md](paper-ppt/references/intake.md)。

---

## 💬 对 AI 说什么

直接复制，改掉尖括号里的内容即可。

<details open>
<summary><b>中文组会（最常用）</b></summary>

```text
用 paper-ppt 把 <paper.pdf> 做成 15 分钟中文组会汇报，风格用 domestic。
先读懂论文和原始图表，再做方法页、实验页样稿；渲染后自己看图修改，再完成全稿。
每页写演讲备注，数字必须能在论文里找到出处，不要编造结论。
```
</details>

<details>
<summary><b>系统 / 网络 / 存储论文</b></summary>

```text
用 paper-ppt 做 <paper.pdf> 的 20 分钟汇报，风格用 systems-talk：
底部贡献追踪条、Insight 卡逐页累积、结果页用比值箭头标出最关键的一个数。
```
</details>

<details>
<summary><b>博士 / 硕士答辩、开题、中期</b></summary>

```text
用 paper-ppt 做我的博士答辩 PPT，风格用 defense-cn，主色换成 <学校标准色>。
材料：<学位论文.pdf> 和 <已发表论文1.pdf> <已发表论文2.pdf>。
按论文章节组织，每章前回显提纲，最后一页列创新点和对应发表论文。
```
</details>

<details>
<summary><b>英文 reading group / 会议 rehearsal</b></summary>

```text
Use paper-ppt to make a 12-minute English talk for <paper.pdf>, style keynote-minimal.
Assertion titles, one idea per slide, speaker notes in English.
```
</details>

<details>
<summary><b>给参考图，让它学风格</b></summary>

```text
用 paper-ppt 做 <paper.pdf> 的组会 PPT。风格参考这几张截图：<ref1.png> <ref2.png>。
只学配色、层级和留白，不要照抄 Logo 和版式槽位。
```
</details>

<details>
<summary><b>改已有的 PPT</b></summary>

```text
用 paper-ppt 润色 <my-talk.pptx>：只改第 5–8 页的方法部分，让图更大、字更少，
其他页不动。改完渲染给我看前后对比。
```
</details>

**小提示**

- 说清 **时长 / 页数、语言、听众**，AI 就不用再问；
- 想要哪种风格直接说预设名；不说时中文默认 `domestic`，英文默认 `international`；
- “不要编造”“数字要有出处”这类要求可以一直带着，Skill 本身也会做事实终审；
- 局部修改说清页码，AI 默认只动相关页面。

---

## 📑 每页放什么：内容蒸馏

[page-content-guide.md](paper-ppt/references/page-content-guide.md) 从 105 套真实 deck 蒸馏出**内容层**规则，AI 写大纲前必读：

- **6 种场景的页序模板**：组会读论文、会议 talk、学位答辩（含开题/中期）、课程教程、工作汇报、主题报告 / Job talk，每页标明“必需 / 可选”和“这页回答什么”；
- **18 类页面的内容契约**：封面、一页看懂、动机、相关工作、洞察、贡献、方法总览、方法细节、实验设置、主结果、消融、局限、总结、备份页……每类写明必须有什么、不要放什么、文字预算；
- **从数据里读出的规律**：

| 场景 | 中位页数 | 中位词/页 | 动机 / 方法 / 结果 |
|---|---:|---:|---|
| 会议 talk | 38 | 36 | 35 / 40 / 25 |
| 学位答辩 | 79 | 46 | 20 / 42 / 38 |
| 课程 lecture | 51 | 48 | 12 / 78 / 10 |
| 组会 / 报告 | 27–28 | 48 | 40 / 40 / 20 |

页数含动画分步导出的 PDF 页。评分最高的 deck 共有的习惯：标题即结论、一页一个意思、一张主图贯穿全场、动机后紧跟一页 “This work”、结果页先说结论再给图、结尾是 takeaway 而不是“谢谢”。

---

## 🎨 9 套风格预设

预设 = 字体 / 字号 / 配色语义 / 网格 + 一组页面原型。它是起点不是模板：AI 会按论文内容改构图、拆页。

<table>
<tr>
<td width="33%" align="center"><img src="paper-ppt/styles/domestic/samples/05-method.png"><br><a href="paper-ppt/styles/domestic/STYLE.md"><b>domestic</b></a><br><sub>中文组会：提纲导航、关键词标红、图注承托框</sub></td>
<td width="33%" align="center"><img src="paper-ppt/styles/international/samples/04-buildSteps.png"><br><a href="paper-ppt/styles/international/STYLE.md"><b>international</b></a><br><sub>英文组会：标题即结论、增量构建、唯一强调色</sub></td>
<td width="33%" align="center"><img src="paper-ppt/styles/keynote-minimal/samples/02-statement.png"><br><a href="paper-ppt/styles/keynote-minimal/STYLE.md"><b>keynote-minimal</b></a><br><sub>发布会式极简：粗标题 + 结论副标题、观察卡</sub></td>
</tr>
<tr>
<td align="center"><img src="paper-ppt/styles/systems-talk/samples/03-insights.png"><br><a href="paper-ppt/styles/systems-talk/STYLE.md"><b>systems-talk</b></a><br><sub>系统顶会：贡献追踪条、Insight 卡、比值结果</sub></td>
<td align="center"><img src="paper-ppt/styles/theory-beamer/samples/04-blocks.png"><br><a href="paper-ppt/styles/theory-beamer/STYLE.md"><b>theory-beamer</b></a><br><sub>理论报告：进度线、定理色块、符号配色</sub></td>
<td align="center"><img src="paper-ppt/styles/dark-tech/samples/03-focus.png"><br><a href="paper-ppt/styles/dark-tech/STYLE.md"><b>dark-tech</b></a><br><sub>深色科技：撞色封面、focus-dim 构建</sub></td>
</tr>
<tr>
<td align="center"><img src="paper-ppt/styles/defense-cn/samples/04-figureConclusion.png"><br><a href="paper-ppt/styles/defense-cn/STYLE.md"><b>defense-cn</b></a><br><sub>国内答辩：校色标题带、章节导航、结论框</sub></td>
<td align="center"><img src="paper-ppt/styles/editorial/samples/04-chips.png"><br><a href="paper-ppt/styles/editorial/STYLE.md"><b>editorial</b></a><br><sub>插画杂志风：衬线斜体、一页一图</sub></td>
<td align="center"><img src="paper-ppt/styles/jp-gothic/samples/03-read.png"><br><a href="paper-ppt/styles/jp-gothic/STYLE.md"><b>jp-gothic</b></a><br><sub>日韩技术发表：论文出处行、黑色结论横幅</sub></td>
</tr>
</table>

**怎么选**

| 场景 | 用这个 |
|---|---|
| 中文组会读论文 | `domestic` |
| 英文组会 / reading group | `international` 或 `keynote-minimal` |
| 系统、网络、存储、数据库 | `systems-talk` |
| 理论、算法、密码学、数学 | `theory-beamer` |
| 工业分享、技术沙龙 | `dark-tech` |
| HCI、可视化、图形学、科普 | `editorial` |
| 答辩、开题、中期、基金汇报 | `defense-cn` |
| 日文 / 韩文，或日系高密度分享 | `jp-gothic` |

**每套都带字体清单和基础模板**

| 预设 | 西文首选 | 中日文首选 | 基础模板 |
|---|---|---|---|
| `domestic` | Arial | 微软雅黑 | [template.pptx](paper-ppt/styles/domestic/template.pptx) |
| `international` | Arial | 微软雅黑 | [template.pptx](paper-ppt/styles/international/template.pptx) |
| `keynote-minimal` | Helvetica Neue | 苹方 | [template.pptx](paper-ppt/styles/keynote-minimal/template.pptx) |
| `systems-talk` | Arial | 微软雅黑 | [template.pptx](paper-ppt/styles/systems-talk/template.pptx) |
| `theory-beamer` | Fira Sans + Cambria Math | 思源黑体 | [template.pptx](paper-ppt/styles/theory-beamer/template.pptx) |
| `dark-tech` | Inter + JetBrains Mono | 苹方 | [template.pptx](paper-ppt/styles/dark-tech/template.pptx) |
| `editorial` | Palatino Linotype | 思源宋体 | [template.pptx](paper-ppt/styles/editorial/template.pptx) |
| `defense-cn` | Arial | 微软雅黑 | [template.pptx](paper-ppt/styles/defense-cn/template.pptx) |
| `jp-gothic` | Noto Sans JP | Noto Sans JP | [template.pptx](paper-ppt/styles/jp-gothic/template.pptx) |

- **模板**：每页是该风格的真实版式，文字换成“【结论式标题 + 关键词】”这样的占位说明，演讲备注写着这页该放什么内容；
- **字体**：[fonts.md](paper-ppt/references/fonts.md) 列出每个字体的来源、授权、开源替代，以及去会场电脑放映时用的“安全字体组”；`python paper-ppt/scripts/check_fonts.py domestic` 检查本机缺哪些。
- **开源字体**：仓库在 `paper-ppt/fonts/` 自带开源授权的西文字体；中日文字体（Noto Sans SC / Noto Serif SC / Noto Sans JP）用 `python paper-ppt/scripts/get_fonts.py --install` 下载安装。生成时设 `PAPER_PPT_FONTS=open`，任何预设都会切到开源字体轨，每台电脑渲染结果一致（详见 [fonts.md](paper-ppt/references/fonts.md) §0）。

想知道这些风格从哪来：[风格图谱](paper-ppt/references/slide-style-atlas.md) 记录了 105 套真实 deck 的字体实测、文字密度和版式聚类（例如：评分最高的 deck 中位每页 38 词，评分较低的是 51 词）。

---

## 🔁 工作流

<p align="center"><img src="docs/images/workflow.png" alt="工作流：论文素材 → 理解与主线 → 设计简报 → 样页迭代 → 交付" width="100%"></p>

| 阶段 | AI 做什么 | 留下什么 |
|---|---|---|
| ① 素材 | 逐页截图、提取文本、生成 Figure/Table 清单，按需高清裁图；扫描件或公式多时走 MinerU | `pages/`、`inventory.md` |
| ⓪ 访谈 | 问清场景、时长、听众、语言、风格、放映环境（G1） | `design-brief.md` 访谈记录 |
| ② 理解 | 找出值得讲的主线，核对关键数字，检查素材够不够撑起所选详略 | `source-notes.md` |
| ③ 设计 | 按场景页序模板写大纲，每页一句话结论；发给你确认（G2） | `storyboard.md` |
| ④ 样页 | 先做方法页和实验页，渲染 → 看图 → 修改，发给你确认（G3）；再 1–3 页一批做全稿 | 每轮渲染图、`review-log.json` |
| ⑤ 交付 | 事实终审 + 整套视觉终审 | `deck.pptx`、`speaker-notes.md`、`contact-sheet.png`、`qa-summary.md` |

**分工很明确：** AI 负责理解、取舍、设计和审美判断；代码只负责截图裁切、生成 PPTX、渲染预览和版本记录。代码不会自动选模板，也不替代视觉模型看图。

---

## 🛠 本地工具链（可选）

宿主 AI 已经能读 PDF、生成和渲染 PPT 时，这一节可以跳过。

<details>
<summary><b>论文素材：路径 A（原生，无需模型，默认）</b></summary>

只需要 Poppler（`pdftoppm` / `pdftotext`）或 `pip install pymupdf`：

```bash
python paper-extract/scripts/pdf_snap.py pages     paper.pdf --out work/pages
python paper-extract/scripts/pdf_snap.py text      paper.pdf --out work/paper.txt.md
python paper-extract/scripts/pdf_snap.py inventory paper.pdf --out work/inventory.md
python paper-extract/scripts/pdf_snap.py crop      paper.pdf --page 5 --box 0.05,0.08,0.45,0.30 --out work/figs/fig4.png
```

AI 看截图决定裁切坐标，并在设计前做[内容充足性自检](paper-ppt/references/source-sufficiency.md)。
</details>

<details>
<summary><b>论文素材：路径 B（MinerU，扫描件 / 公式 / 表格多时）</b></summary>

可与路径 A 并行使用：

```bash
python -m pip install -U "mineru>=4.0,<5"
python paper-extract/scripts/mineru_models.py download --tier standard
python paper-extract/scripts/mineru_models.py verify   --tier standard
python paper-extract/scripts/mineru_extract.py /path/to/paper.pdf
```

模型准备和文档解析是两步；默认只使用本地已下载模型。
</details>

<details>
<summary><b>PPT 生成与渲染</b></summary>

```bash
cd paper-ppt
npm install
python -m pip install -r requirements.txt
python scripts/bridge.py doctor          # 检查环境
node assets/build-style-samples.js out   # 生成 9 套预设的示例 deck
```

公式：`scripts/math_assets.py` / `assets/equations.js` 把 LaTeX 渲染为 SVG/PNG 或简单原生 OMML（见 [math-equations.md](paper-ppt/references/math-equations.md)）；结构检查：`python scripts/check_deck.py deck.pptx`。

真实渲染需要 LibreOffice 与 Poppler。没有 LibreOffice 时可用 `scripts/svg_preview.py` 做近似预览（换行按字宽估算，最终以 PPTX 实际打开为准）。详见 [INSTALL.md](paper-ppt/INSTALL.md)。
</details>

---

## ❓ 常见问题

<details>
<summary><b>一定要给 PPTX 模板吗？</b></summary>

不用。说预设名、一句风格描述、几张截图或网页 slide 都可以。AI 只提炼配色、层级、留白和节奏，然后为这篇论文重新设计。
</details>

<details>
<summary><b>必须装 MinerU 吗？</b></summary>

不必须。能看图的 AI 默认走原生截图路径；扫描件、需要 LaTeX 公式、表格很多或 AI 不能看图时再用 MinerU，也可以两条一起用。
</details>

<details>
<summary><b>AI 会不会编数字？</b></summary>

Skill 要求每个数字都能追溯到论文的页码、图或表；论文没写清的内容标记“未确认”，只讲原理。交付时 `qa-summary.md` 会写明哪些检查过、哪些没验证。
</details>

<details>
<summary><b>做完想改某几页怎么办？</b></summary>

直接说“只改第 X 页，做什么改动”。工作目录里保留了 storyboard、生成源和渲染记录，默认只动相关页面。
</details>

<details>
<summary><b>字体显示不对？</b></summary>

AI 访谈时会问放映环境。去会场电脑放映时用 [fonts.md](paper-ppt/references/fonts.md) 的安全字体组，或在 PowerPoint 里嵌入字体；`check_fonts.py` 能列出本机缺的字体和实际会用的替代字体。

想彻底避免字体差异：西文开源字体已随仓库放在 `paper-ppt/fonts/`，中日文字体（Noto Sans SC / Noto Serif SC / Noto Sans JP）用 `python paper-ppt/scripts/get_fonts.py --install` 获取；生成时设 `PAPER_PPT_FONTS=open`，任何预设都会换成开源字体轨，每台电脑渲染都一样（详见 [fonts.md](paper-ppt/references/fonts.md) §0）。
</details>

---

## 📁 目录

```text
paper-skills/
├── paper-extract/                 论文 → AI 可读素材
│   ├── SKILL.md
│   └── scripts/
│       ├── pdf_snap.py            截图 / 文本 / 图表清单 / 高清裁切
│       ├── mineru_models.py       MinerU 模型下载与校验
│       └── mineru_extract.py      MinerU → Markdown
│
├── paper-ppt/                     论文 → 汇报 PPT
│   ├── SKILL.md                   AI 工作流说明书（从这里开始读）
│   ├── styles/                    9 套风格预设：STYLE.md · tokens.json · template.pptx · refs/ · samples/
│   ├── references/                访谈问题库、页面内容指南、字体清单、设计规范、看图审阅协议、风格图谱
│   ├── assets/                    PPTX 绘制：style-presets*.js、ppt-helpers.js
│   └── scripts/                   bridge.py 渲染 · check_deck.py · check_fonts.py · math_assets.py · svg_preview.py
│
├── docs/images/                   README 配图
└── tests/                         工具测试
```

**设计参考**：[Academic Evidence 风格案例](paper-ppt/styles/academic-evidence/STYLE.md) · [公式渲染](paper-ppt/references/math-equations.md) · [访谈问题库](paper-ppt/references/intake.md) · [页面内容指南](paper-ppt/references/page-content-guide.md) · [字体清单](paper-ppt/references/fonts.md) · [设计规范](paper-ppt/references/style-guide.md) · [讲述结构](paper-ppt/references/talk-structure.md) · [视觉审阅协议](paper-ppt/references/visual-review.md) · [风格蒸馏库](paper-ppt/references/slide-style-gallery.md) · [风格图谱](paper-ppt/references/slide-style-atlas.md) · [Academic Clean](paper-ppt/references/academic-clean.md) / [Rich](paper-ppt/references/academic-rich.md)

---

## 🧪 开发

```bash
python -m unittest discover -s tests -v
```

测试检查工具连接、版本记录、预设构建和低层脚本行为，**不能替代论文事实审查、视觉模型看图或真实 PowerPoint 兼容性测试**。

项目不包含论文库、模型密钥或个人配置；`paper-ppt/fonts/` 只收录可再分发的开源字体（各自附授权文件），商业字体不随项目分发；`refs/` 中的真实 slides 截图为低分辨率引用并注明出处，仅用于说明设计手法。

## License

[MIT](LICENSE)
