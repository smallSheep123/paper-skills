# 预设 → 版式骨架图谱（Layout Atlas）

> 回答一个具体问题：**换一套预设，到底该换掉什么？**
>
> 答案是构图，不是色板。`tokens.json` 只负责字体、配色语义和网格；一套风格的辨识度来自
> 「信息在页面上如何被组织」——几栏、图在哪、结论落在哪、是否用引线编号、是否留白。
> 本文件把 `styles/<name>/refs/` 里的原始参考页、从中提炼的构图规律，以及
> `assets/style-presets*.js` 中对应的原型一一对应起来。原始截图的来源与链接见各
> `styles/<name>/STYLE.md` §5；这里只记**版式**，不重复配色参数。

## 0. 为什么要补这一层

审计发现（`../../../output/audit/` 下的可复现证据）：改造前九套预设中只有
`international` / `domestic` 有为多种页型分别设计的构图，另外 `systems-talk` /
`theory-beamer` / `defense-cn` 各有一两个招牌构图；其余页面基本是
「同一种 `head` + 一张居中/左侧的图 + 一段文字」，跨预设的差别主要落在颜色和字体上。

用同一篇虚构论文、同一套内容、只换预设，抽取 PPTX 的几何指纹（忽略颜色与字体），
改造前 **同一套预设跨页型的版式基因只有 1–2 种**：`defense-cn` 的方法页与结果页
几何距离仅 0.059（几乎同一张版式）、`jp-gothic` 0.148、`domestic` 0.277、
`international` 0.338。也就是说连已设计过的预设，换页型时也常常只是换文字。

改造后每套预设都有覆盖五类页型的独立构图，同一份 45 页矩阵里跨预设的同指纹对
从补齐前的 5 对降到 2 对（180 对比较中），且这 2 对目视差异明显。量化方法与产物见
[output/audit/README.md](../../../output/audit/README.md)。

## 1. 构图原语（`assets/layout-kit.js`）

所有原型都只用画布接口（rect / line / text / image / ellipse）绘制，PPTX 与 SVG 预览同源。

| 原语 | 作用 | 为什么需要 |
|---|---|---|
| `figure(c,t,file,box,o)` | 按图片真实宽高比放入盒子，**返回紧致矩形**，可加承托框与图注 | 图不再被拉伸；后续标注必须跟着返回的矩形，而不是固定坐标 |
| `at(card, [fx,fy])` | 用 0–1 分数坐标取图上一点 | 圈点 / 引线随图缩放 |
| `ring` / `badge` | 圈出图上的边、打编号 | 把「要点」锚到图上的位置，而不是并列的 bullet |
| `callout(c,from,box,text,o)` | 引线标注，线连到标注框最近边 | 标注不压住被标注的元素 |
| `columns(box,n,gap)` | 等宽分栏 | 表格、卡片、讲义三栏共用 |
| `divide` / `columnHead` | 竖直分隔线、带下划线的列头 | 双栏对照 / 表头的骨架 |
| `textLines` / `textHeight` | 粗略估算行数与所需高度（CJK 1em、拉丁 0.55em） | 预留垂直空间，避免文字压到下一个构件 |

## 2. 预设 → 原始参考 → 版式骨架

### international · 海外组会 / 会议（Kaiming He、Chris Ré、Song Han、CS231n、Jure Leskovec）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `han-goal-challenge-solution.jpg` | 目标 / 挑战 / 解法三行论点在上，两张证据图并排在下，读者先读论点再看图 | `setup`（新增） |
| `kaiming-equation-annotation.jpg` | 主图占左侧，右上角嵌入局部放大图，虚线引线 + 圆圈标出被放大的位置 | `zoom`（新增） |
| `re-takeaway-box.jpg` + `leskovec-question-nav.jpg` | 收尾页不是 bullet：左侧编号结论、右侧一个描边 takeaway 框 + 开放问题导航 | `recap`（新增） |
| `cs231n-consistent-glyphs.jpg` | 同一符号在公式、图、正文三处同色 | `equation` / `result` |

### domestic · 国内组会（胡瀚 VALSE、李宏毅 NTU）

已有 `paperGlance` / `method` / `result` / `summary` / `compare3` / `twoFigures` /
`metricGrid` / `formulaTable` 等较完整的构图。本次补充：
`hylee-diagram-vocabulary.jpg` 的「图上编号 → 右侧按编号解释」读图顺序 →
`annotatedFigure`（新增）：图上圈 ①②③，右侧同号要点逐条落地，而不是并列 bullet。

### keynote-minimal · 白底极简发布会（S3-FIFO、Eden、Chajed、王迪）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `s3fifo-p8.jpg` | 论断在上、图在下，一页一个视觉，字极少 | `figure` |
| `eden-p13.jpg` | 左右两栏对照：左图、右结论表，中间一条细竖线，胜出行用描边框 | `duel`（新增） |
| `chajed-p34.jpg` | 图铺满整宽，标题与一句话分列上下，页面就是那张图 | `figureFull`（新增） |
| `pku_wangdi-p26.jpg` | 同一张模块图连续多页，只点亮当前模块 | `focus` |

### systems-talk · 系统顶会（Skyplane、BOLT、Graviton、Klimovic）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `bolt-p11.jpg` | 底部整宽贡献追踪条，按阶段点亮 | `tracker` / `insights` |
| `skyplane-p19.jpg` | 洞察卡逐页累积、当前卡上色 | `insights` |
| `graviton-p20.jpg` | 图 + 底部整宽结论横幅 | `banner` |
| `klimovic-p28.jpg` | 深色全屏代码页、只框一行改动 | `code` |
| 系统论文「改了什么」页 | 编号阶段流水线，每段带自己的注，当前段用阶段色 | `pipeline`（新增） |
| 多组设置的评测表 | 整宽数据表 + 表头 + 本文行高亮 + 口径小字 | `results`（新增） |

### theory-beamer · Metropolis 式理论报告（Fürnsinn、Yasuda、Schädlich、RedLeaf）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `furnsinn-p12.jpg` | 深色标题栏 + 橙色进度线，Theorem/Question/Example 固定色块 | `head` / `blocks` |
| `yasuda-p16.jpg` | 圆角定理块：左列若干小块 + 右侧一个大定理块，结论条在底部 | `mosaic`（新增） |
| `schadlich-p19.jpg` | 编号推导阶梯：左栏步骤标签、每行一条式子、行间细线、结果框 | `derivation`（新增） |
| 理论报告收尾 | 居中 Corollary 框 + 三条等宽推论卡，各带符号色 + 底部进度线 | `verdict`（新增） |
| P12 一概念一颜色 | 公式中每个符号一种颜色，图例同色 | `symbols` |

### dark-tech · 深色科技发布会（Kakao、Jason Wei、Bach、Klimovic）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `jasonwei-p12.jpg` | 论文白底图放进白色承托框，青色引线把注释扇向右侧 | `annotated`（新增） |
| `kakao_ko-p32.jpg` | 同一组线框模块连续多页，只点亮当前模块 | `focus` |
| `klimovic-p28.jpg` | 大号细体编号逐行排列，无框，只有节奏线 | `steps`（新增） |
| `bachkey-p1.jpg` | 黑白交替的细体大字；一条分隔线把两个状态劈成左右两半 | `versus`（新增） |

### editorial · 插画杂志风（Keenan Crane、Shakir、Sasha Rush、Marti Hearst）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `crane-p12.jpg` | 一页一张插画，衬线斜体标题，图是主角 | `hero` |
| `hearst-p23.jpg` | 剪报拼贴：左侧大图卡 + 右侧窄栏带下划线的栏目头 + 底部深色出处条 | `panel`（新增） |
| `rushdeepseek-p23.jpg` | 首字下沉 + 宽栏衬线正文 + 外侧页边编号注释 + 斜体 pull quote | `essay`（新增） |
| 2×2 概念圆点 | 浅色圆盘编号，不用剪贴画图标 | `chips` |

### defense-cn · 国内答辩（浙大金、清华吕、复旦王、张奇 CCF）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `def_zju_jin-p29.jpg` | 校色标题带 + 底部章节箭头导航 + 编号标题 | `head` / `nav` |
| `def_fudan_wang-p12.jpg` | 一句引导 + 编号要点作为行文 + 整宽图带 + 图下分栏图注 | `figureBand`（新增） |
| `fudan_zhangqi-p11.jpg` | 方法 × 特性对照表，本文行高亮，红色描边结论框收尾 | `matrix`（新增） |
| `def_thu_lyu-p15.jpg` | 两个案例并排，各有标题带与图注，底部红色结论框 | `casePair`（新增） |
| P21 答辩专用结构 | 创新点一/二/三卡片配发表论文 | `contributions` |

### jp-gothic · 日韩技术发表（kantoCV、NLP2025 tutorial、東大鈴木、Okada）

| 原始参考页 | 提炼的构图 | 对应原型 |
|---|---|---|
| `kantocv_ja-p13.jpg` | 论文出处行在标题上方、黑色左竖条、图上气泡标注、右侧深色例子面板 | `dense`（新增） |
| `utokyo_suzuki-p45.jpg` | 顶部公式带 + 黑表头三栏（符号 / 推导 / 读法）+ 底部彩色 chips | `formula`（新增） |
| `yokoi_ja-p38.jpg` | 变更前后双栏表，改动行贴黄色 sticker，中间箭头，黑色结论横幅 | `beforeAfter`（新增） |
| `okada-p4.jpg` | 收尾页大号轮廓编号竖排 + 每条一行结论 + 黑色横幅 | `takeaways`（新增） |
| `read` | 要点（→ 子点）+ 图 + 黑色结论横幅 | `read` |

## 3. 五类页型的跨预设对照

同一份内容、同一个页型，九套预设应当给出**不同骨架**。
可复现的 45 页矩阵稿见 `output/audit/matrix.pptx` 与 `final-render/grid.png`。

| 预设 | 概述 | 方法 | 结果 | 对比 | 收尾 |
|---|---|---|---|---|---|
| `international` | 论点三行 + 双图 | 主图 + 局部放大引线 | 图 + 唯一强调数字 | 带高亮模块的流水线 | 编号结论 + takeaway 框 + 开放问题 |
| `domestic` | 论文速览卡 | 图上编号 → 右侧同号解释 | 图 + 强调数字 + 要点 | 两图并排 + 引导语 | 结论 / 边界两栏 |
| `keynote-minimal` | 整宽图 + 一句话 | 左图右判决表 + 竖线 | 黄色大卡片一个数字 | 模块 focus 构建 | 编号大数字三条 |
| `systems-talk` | 编号阶段流水线 | 左图右累积洞察卡 | 原图 + 大号比值箭头 | 整宽数据表 | 图 + 底部整宽结论横幅 |
| `theory-beamer` | 左列小块 + 右大定理块 | 编号推导阶梯 | 类型色块堆叠 | 公式 + 同色符号图例 | 推论框 + 三条推论卡 |
| `dark-tech` | 白框图 + 引线注释扇 | 白框图 + 右侧引线注释 | 大号细体编号行 | 左右数值对照 + 竖线 | 一句话居中细体大字 |
| `editorial` | 首字下沉 + 页边注 | 斜体标题 + 大图 + 图注 | 2×2 概念圆盘 | 杂志正文 + 页边编号注 | 大引号 + 斜体引文 |
| `defense-cn` | 编号要点 + 整宽图带 | 编号标题 + 大图 + 结论框 | 方法 × 特性矩阵 | 双案例图卡 + 红结论框 | 创新点卡片 |
| `jp-gothic` | 图 + 气泡 + 深色例子面板 | 出处行 + 要点子点 + 图 + 黑横幅 | 公式带 + 三栏 + chips | 变更前后双栏 + 黄 sticker | 大号编号 + 黑横幅 |

## 4. 使用约定

- **先按内容选行，再按预设取列**。表里的每个格子都是一个可选原型，不是必须套用的模板。
- 换预设时至少换掉构图骨架；只改 `tokens.json` 的颜色和字体不算换风格。
- 图片一律通过 `layout-kit.figure()` 或 `figureFrame()` 按真实宽高比放置，标注用返回的矩形做锚点。
- 自由绘制仍须遵守该预设 `STYLE.md` 的硬性约束（配色语义、字数上限、导航、图注等）。
- 渲染后看图改坐标、换原型或拆页；预设是起点，不是终点。
