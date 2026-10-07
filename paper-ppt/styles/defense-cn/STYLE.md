# Defense CN · 国内答辩 / 正式报告

> 国内答辩/正式报告：校色标题带 + 校徽位、编号标题、底部章节箭头导航、提纲回显、红色结论框、创新点卡片。  
> 蒸馏自 [slide-style-atlas.md](../../references/slide-style-atlas.md) 中归入本预设的样本；参考截图见 `refs/`。

![overview](samples/overview.png)

## 1. 何时使用

- 博士/硕士答辩、开题、中期、基金结题、CCF/VALSE 等正式学术报告；
- 需要体现单位身份、按论文章节组织的长报告。

## 2. Token（`tokens.json`）

- 字体：微软雅黑（标题加粗）；正文可用宋体增加正式感（`fonts.heading` / `fonts.body` 决定 PPTX 字体，`fonts.preview` 只用于 SVG 预览）
- 字号：封面 34 · 标题 26 · 正文 19 · 辅助 16 · 章节 36

| 颜色 | 值 |
|---|---|
| `bg` | `#FFFFFF` |
| `primary` | `#0B4F8A` |
| `primaryMid` | `#3C7DBF` |
| `primaryLight` | `#D6E4F2` |
| `text` | `#1A1A1A` |
| `body` | `#262626` |
| `muted` | `#6B6B6B` |
| `faint` | `#A6A6A6` |
| `ghost` | `#D0D0D0` |
| `accent` | `#D7261E` |
| `frame` | `#F2F5F9` |
| `rule` | `#D9D9D9` |

语义：

- `primary`：校色（按学校替换：清华紫 660874、浙大蓝 003F88、复旦蓝 0E419C、北大红 94070A）
- `accent`：提纲当前章、结论框关键词、图下关键句

## 3. 页面原型

| 原型 | 说明 |
|---|---|
| `cover` | 上部校色大色块：单位 / 答辩类型 / 中英文题目；下部 答辩人·专业·导师·日期 |
| `toc` | 竖线串联的提纲，当前章红点红字，已讲章变灰（每章前回显） |
| `chapter` | 左侧校色竖块写“第三章”，右侧章名 + 副标题 |
| `figureConclusion` | 编号标题“3.2 …” + 一句引导 + 大图 + “好处：/结论：”描边框（关键词红） |
| `contributions` | “创新点一/二/三”卡片，每张附对应发表论文 |

示例 deck：`node assets/build-style-samples.js out` 后查看 `out/defense-cn-sample.pptx`。

## 4. 硬性约束

- `primary` 换成学校标准色（清华紫 660874、浙大蓝 003F88、复旦蓝 0E419C、北大红 94070A 等）；校徽替换占位圆
- 标题按论文章节编号；底部导航段 = 章，`chapter` 指当前章
- 红色只用于：提纲当前章、结论框关键词、图下关键句
- 正文可以比组会密（≤ 5 条），但每页必须有一个结论框或关键句
- 预设是起点不是模板：坐标、原型都可以改，但 token 语义不变。

## 5. 参考来源（低分辨率截图，仅用于说明手法）

| 截图 | 来源 | 风格族 | 链接 |
|---|---|---|---|
| `refs/def_zju_jin-p29.jpg` | 自动驾驶中激光雷达感知的脆弱性分析与安全防护（博士学位论文答辩） — 金子植 浙江大学（2025-05-27） | ZJU defense blue band + chevron breadcrumb | [PDF](https://jinzizhisir.github.io/papers/phd_slides.pdf) |
| `refs/def_thu_lyu-p15.jpg` | 面向市场化互动的工业负荷建模与优化决策方法（博士学位论文答辩） — 吕睿可 清华大学（2026-05-24） | Tsinghua purple photo-divider defense | [PDF](https://rick10119.github.io/files/Slides_phd_disseration_defense_Ruike_Lyu.pdf) |
| `refs/fudan_zhangqi-p11.jpg` | 当LLM成为Agent的“决策大脑”：能力边界与安全挑战 — 张奇 复旦大学/上海人工智能实验室（CCF Talk 2026） | CCF gradient-bar official template | [PDF](http://qizhang.info/slides/CCFTALK2026.pdf) |
| `refs/def_fudan_wang-p12.jpg` | 细粒度医疗行为识别与技能评估技术研究（博士学位论文答辩） — 王顺利 复旦大学（2024-05-25） | Fudan defense navy tab header | [PDF](https://shunli-wang.github.io/publications/pdf/slwang_PhD-Dissertation_Slides.pdf) |
