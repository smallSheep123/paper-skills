# 学术 Slide 风格图谱（Atlas）

> 98 套新样本 + [slide-style-gallery.md](slide-style-gallery.md) 原有 7 套，共 **105 套**公开学术 deck。  
> 每套都实际下载、渲染并看过总览和至少 3 张全尺寸页面；字体来自 `pdffonts`，文字密度、配色、深色背景比例由脚本测量。  
> 逐套记录（字体、版式、内容分布、画风、可迁移手法）见 [atlas/records.jsonl](atlas/records.jsonl)。  
> 蒸馏结果落成 7 套新预设，见 [../styles/](../styles/README.md)。只提炼手法，不继承各校/各公司的 Logo、配色和字体文件。

## 1. 样本构成

| 维度 | 分布 |
|---|---|
| 场景 | 会议报告 20 · 课程 20 · 答辩 20 · keynote 16 · tutorial 14 · 学术报告 5 · 组会/论文分享 2 · job talk 1 |
| 语言 | 英文 71 · 中文 19 · 日文 6 · 韩文 2 |
| 来源分组 | 系统顶会 16 · ML 讲座/教程 15 · 名校课程 17 · 中文报告/答辩 18 · 答辩/keynote 18 · 设计派/日韩 14 |
| 制作工具（按嵌入字体推断） | PowerPoint / Keynote / Google Slides 73 · Beamer/LaTeX 25 |
| 比例 | 16:9 共 73 · 4:3 共 19（多为 Beamer 和较老课程）· 其他为讲义/备注页导出 |
| 深色背景（≥40% 页面） | 12 套 |

## 2. 测量出来的规律

### 2.1 文字密度

- 每页中位词数（英文词；中文 2 字 ≈ 1 词）：四分位 **30 / 43.5 / 61**；
- **质量评分 5 的 deck 中位 38 词/页，评分 ≤3 的 51 词/页**——好看的 deck 普遍更少字；
- 极简端（< 20 词）：Bach keynote、Crane、FairVis、Sasha Rush、Kakao、Servan 答辩；它们靠构建动画（同一页拆成多张 PDF 页）把信息分摊开，单个讲稿常有 100–230 张导出页；
- 高密度端（> 70 词）：中文答辩、日文讲义、理论 Beamer、讲义导出的课程页。高密度本身不是问题，但必须配合固定的结构（编号标题、块类型、章节导航）。

### 2.2 字体（pdffonts 实测）

| 拉丁字体 | 出现次数 | 典型场景 |
|---|---|---|
| Arial | 65 | 各类 PowerPoint，国内报告默认 |
| Calibri | 21 | Office 默认模板、课程 |
| Helvetica Neue / Helvetica | 27 | Keynote（Apple 用户的极简风） |
| Computer Modern / Latin Modern | 20+ | Beamer、公式页 |
| Gill Sans · Lato · Roboto · Google Sans · Avenir · Graphik · Raleway · Fira Sans | 2–4 各 | 有意识做设计的 deck |
| Times / Garamond / Palatino | 少量 | 衬线派：理论课程、插画风 |

| CJK 字体 | 出现次数 |
|---|---|
| 微软雅黑（含 Light/UI） | 15 |
| 黑体 SimHei · 宋体 SimSun · 楷体 KaiTi · 等线 DengXian · 仿宋 | 6 · 5 · 2 · 2 · 1 |
| 苹方 PingFang SC | 4 |
| MS PGothic · Yu Gothic · MS Gothic · Meiryo · M PLUS 1p · Noto Sans JP | 8 · 5 · 3 · 1 · 2 · 1 |
| Kakao Big（韩文） | 1 |

结论：**中文标题几乎都是微软雅黑/黑体**；宋体、楷体只用于正文或营造“古典/正式”感。日文以 Gothic 系粗黑体为主。拉丁字体真正决定观感的是 Helvetica/Avenir（干净）、Fira（Beamer 现代）、Palatino/Garamond（人文）。

### 2.3 画风与版式聚类

| 风格族 | 代表 | 版式要点 | 对应预设 |
|---|---|---|---|
| 白底极简 / 发布会式 | s3fifo、eden、retlm、Beyer、Neubig、Mu Li 答辩 | 粗标题 + 一行结论副标题，大量留白，一页一个图，focus 构建 | `keynote-minimal` |
| 系统顶会 | Skyplane、Bolt、Shortstack、Klimovic、Graviton、Jeff Dean | 贡献追踪条、累积 Insight 卡、比值箭头、深色代码页、整宽结论横幅 | `systems-talk` |
| 理论 Beamer | Schädlich、Yasuda、Fürnsinn、Rush、Metropolis 系 | 深色标题栏 + 进度线、Theorem/Question/Example 固定色块、一个符号一种颜色 | `theory-beamer` |
| 深色科技 | Jason Wei、Kakao、Bach keynote、MIT 6.S191 | 深底、双色撞色封面、细体大字章节页、focus-dim | `dark-tech` |
| 插画 / 杂志 | Crane、Shakir Mohamed、Hearst、CMU 15-445 | 暖白底、衬线斜体标题、一页一张插画、概念色 | `editorial` |
| 国内答辩 / 正式报告 | 浙大/清华/复旦答辩、CCF、VALSE、LAMDA | 校色标题带、校徽、编号标题、底部章节箭头、提纲回显、红色结论框 | `defense-cn`（组会仍用 `domestic`） |
| 日韩技术发表 | kantoCV、NLP2025 tutorial、东大讲义、Kakao | 粗黑体、黑色左竖条标题、论文出处行、单一强调色、时间徽章、「参考」贴纸、黑色结论横幅 | `jp-gothic` |
| 经典 Office / 老派课程 | Hennessy–Patterson、M. Jordan、CS162、Zisserman | 蓝标题 + 横线、剪贴画、高密度 | 已有 `international` 足够，不单独建预设 |

## 3. 新增蒸馏手法（接 gallery 的 P1–P11）

### P12. 一个概念一个颜色，文字、公式、图三处一致
Yasuda 的 S/A/x/b、Schädlich 的用户 1/2/3、Rush 的矩阵、Deshraj 的说话人波形、LeCun 的模块角色。**做法**：开讲前为 3–6 个核心对象分配颜色（`tokens.color.sym`），正文用 `{{n:文字}}` 标记，自绘图用同一色值。被调用最多的 ML/理论 deck 几乎都这样做。

### P13. “你在这里”的回显导航，而不是反复插目录页
Beyer 每页左侧淡化的 Transformer 图只高亮当前模块；Bolt 的底部贡献追踪条；浙大答辩的底部箭头导航；Barron 在同一条 S 曲线上移动红箭头；Muli 的 2×2 路线卡。**做法**：选一种，全稿只用一种。

### P14. 累积的 Insight / Design Principle 卡片
Skyplane、OdinFS、Shortstack：每讲完一个洞见就在侧栏加一张编号卡，旧卡转灰但保留。适合“测量 → 洞见 → 设计”的系统论文。

### P15. 结果页写比值，不写表
系统 deck 在图上直接画 baseline → ours 的箭头和“24.7×”，坐标轴旁加“better →”。本文系统在所有图中固定一个颜色（Blaze 黄、Eden 红）。

### P16. 断言标题 + 一句加粗副标题
s3fifo、Eden、Deshraj：标题是名词短语（“Observation”/“S3-FIFO design”），紧跟一行加粗的结论句。比把结论塞进标题更易读，适合英文。

### P17. 固定块类型
Beamer 理论报告：Theorem 蓝、Definition 灰、Question 红、Example 绿；Yasuda 用圆角黑框 + “Goal./Idea./Fact./Conjecture.” 粗体引导词。块类型一旦定色，全稿不变。

### P18. 深色全屏代码页
Klimovic、RedLeaf：代码单独放深色页，只框出改动的那一行，旁边一个黄色气泡。浅色正文页与深色代码页交替，听众立刻知道“现在看代码”。

### P19. 可跳过页的显式标记
NLP2025 tutorial 的黄色“Skip”贴纸、东大讲义的「参考」、Villa job talk 的“More details / Back”按钮。时间不够时跳页而不慌。

### P20. 论文出处行放在标题上方
kantoCV 论文分享：每页标题上方一行小字 `论文标题 [Author+, Venue'26]`；Beyer 在标题下方给年份 + 全体作者。读论文合集或 related work 时尤其有用。

### P21. 答辩专用结构
国内答辩：封面 答辩人/专业/导师/日期 四行；提纲在每章前回显、当前章标红；标题按论文章节编号（“3.2 …”）；底部章节箭头导航；“创新点一/二/三”卡片配对应发表论文；“好处：/结论：”描边框收尾。

### P22. 封面与章节页是唯一可以“放肆”的地方
Shakir 的植物插画封面、Kakao 的青黄撞色、Bach 的黑底细体、清华答辩的紫色照片分隔页：正文页克制，封面和章节页承担品牌和情绪。

## 4. 选预设的速查

| 场景 | 首选 | 备选 |
|---|---|---|
| 中文组会读论文 | `domestic` | `keynote-minimal`（导师偏好简洁时） |
| 中文答辩 / 开题 / 中期 / 基金汇报 | `defense-cn` | `domestic` |
| 英文组会 / reading group | `international` | `keynote-minimal` |
| 系统 / 网络 / 存储论文 | `systems-talk` | `keynote-minimal` |
| 理论 / 算法 / 密码学 / 数学 | `theory-beamer` | `international` |
| 工业界分享、技术沙龙、产品化项目 | `dark-tech` | `keynote-minimal` |
| HCI / 可视化 / 图形学 / 科普 | `editorial` | `keynote-minimal` |
| 日文 / 韩文报告，或喜欢日系高信息密度 | `jp-gothic` | `domestic` |

## 5. 全部样本目录

| id | 分组 | 作者/机构 | 场合 | 语言 | 风格族 | 主要字体 | 词/页 | 质量 | 预设 |
|---|---|---|---|---|---|---|---|---|---|
| baleen | 系统顶会 | Daniel Lin-Kit Wong, Gregory R. Ganger | FAST 2024 | en | CMU PDL lab template, centered steel-blue titl | Arial, Arial | 49 | 4 | `systems-talk` |
| blaze | 系统顶会 | Won Wook Song, Byung-Gon Chun et al. / | EuroSys 2024 | en | Korean lab white + light-blue footer strip | TrebuchetMS, FiraSans | 58 | 4 | `systems-talk` |
| bolt | 系统顶会 | Serhat Arslan, Yuliang Li, Gautam Kuma | NSDI 2023 | en | Google-color tracker bar footer | ProximaNova, Arial | 42 | 4 | `systems-talk` |
| cumulusdb | 系统顶会 | Viktor Leis (TU München), Christian Di | VLDB 2024 (vision pape | en | German university Beamer corporate design (TU  | RobotoCondensed, BeraSansMono | 67 | 4 | `theory-beamer` |
| eden | 系统顶会 | Anil Yelam, Alex C. Snoeren et al. / U | NSDI 2025 | en | Google Slides minimal white | Calibri, Nunito | 26 | 4 | `keynote-minimal` |
| graviton | 系统顶会 | Stavros Volos, Kapil Vaswani, Rodrigo  | OSDI 2018 | en | Segoe light corporate + takeaway banner | SegoeUI, Arial | 40 | 4 | `systems-talk` |
| ipads_dtx | 系统顶会 | 陈榕 Rong Chen / IPADS, Shanghai Jiao To | CCF 大数据管理前沿技术论坛 2022 | zh | Chinese lab red line-art header, research-over | MicrosoftYaHei, CenturyGothic | 61 | 3 | `defense-cn` |
| klimovic | 系统顶会 | Ana Klimovic / ETH Zürich (EASL, Syste | EuroSys 2024 CHEOPS wo | en | Avenir light minimal + dark code-walkthrough s | Avenir, Calibri | 33 | 5 | `systems-talk` |
| kungfu | 系统顶会 | Peter Pietzuch / Imperial College Lond | Dutch Seminar on Data  | en | Helvetica Neue Apple-Keynote clean, numbered-p | HelveticaNeue, Arial | 50 | 4 | `systems-talk` |
| minflow | 系统顶会 | Tao Li, Yongkun Li, Yinlong Xu et al.  | FAST 2024 | en | Chinese lab dense purple-banner + gold conclus | MicrosoftYaHei, GillSans | 48 | 3 | `defense-cn` |
| odinfs | 系统顶会 | Diyu Zhou, Sanidhya Kashyap et al. / E | OSDI 2022 | en | navy condensed + storyteller character | Calibri, BookAntiqua | 29 | 4 | `systems-talk` |
| redleaf | 系统顶会 | Vikram Narayanan, Anton Burtsev et al. | OSDI 2020 | en | Beamer Metropolis code-diagram | FiraSans, FiraMonoForPowerline | 33 | 4 | `theory-beamer` |
| s3fifo | 系统顶会 | Juncheng Yang, K. V. Rashmi et al. / C | SOSP 2023 | en | bold Graphik headline + subtitle, off-white | Graphik, HelveticaNeue | 31 | 5 | `keynote-minimal` |
| shortstack | 系统顶会 | Midhul Vuppalapati, Kushal Babel et al | OSDI 2022 | en | Keynote white build-up diagrams | HelveticaNeue, Arial | 40 | 4 | `systems-talk` |
| skyplane | 系统顶会 | Paras Jain, Joseph E. Gonzalez, Ion St | NSDI 2023 | en | open-source product launch, insight cards | HelveticaNeue, Arial | 38 | 5 | `systems-talk` |
| xfaas | 系统顶会 | Alireza Sahraei, Soteris Demetriou, Di | SOSP 2023 | en | Meta corporate split-panel slate | OptimisticText, Arial | 28 | 4 | `systems-talk` |
| bach | ML 讲座/教程 | Francis Bach (INRIA / ENS Paris) | Summer school on distr | en | classic LaTeX seminar blue-red | f-0-0, f-1-0 | 51 | 3 | `theory-beamer` |
| beyer | ML 讲座/教程 | Lucas Beyer (Google DeepMind / OpenAI  | invited tutorial deck, | en | Google Sans paper-anchored explainer | GoogleSans, Arial | 78 | 5 | `keynote-minimal` |
| diff23 | ML 讲座/教程 | Jiaming Song, Chenlin Meng, Arash Vahd | CVPR 2023 | en | NVIDIA-tutorial centered + orange bubble nav | TrebuchetMS, Arial | 54 | 4 | `international` |
| hetero | ML 讲座/教程 | Jiashuo Liu, Tiffany Cai, Peng Cui, Ho | NeurIPS 2023 | en | Times serif Google Slides plain | font000000002b27741d, font000000002b277411 | 38 | 3 | `editorial` |
| jasonwei | ML 讲座/教程 | Jason Wei (OpenAI) | invited guest lecture  | en | dark Google Sans explainer | GoogleSans, GoogleSansText | 38 | 5 | `dark-tech` |
| lecun | ML 讲座/教程 | Yann LeCun (NYU / Meta FAIR) | UW Lytle Lecture 2024 | en | LeCun rainbow-gradient title bar | LiberationSans, LiberationSerif | 54 | 4 | `international` |
| metalearn | ML 讲座/教程 | Chelsea Finn (Stanford/Google Brain),  | ICML 2019 | en | Calibri + LaTeXiT whiteboard-dense | Calibri | 43 | 4 | `theory-beamer` |
| ntkcollapse | ML 讲座/教程 | Mariia Seleznova, Dana Weitzner, Raja  | NeurIPS 2023 | en | Keynote green theorem boxes | HelveticaNeue, Arial | 115 | 3 | `theory-beamer` |
| overfit | ML 讲座/教程 | Spencer Frei, Vidya Muthukumar, Fanny  | NeurIPS 2023 | en | minimal teal theory tutorial | AvenirNext | 60 | 4 | `theory-beamer` |
| retlm | ML 讲座/教程 | Sewon Min (UW), with Akari Asai, Zexua | ACL 2023 | en | Keynote Gill Sans centered minimal | Graphik, HelveticaNeue | 40 | 4 | `keynote-minimal` |
| rlhf | ML 讲座/教程 | Nathan Lambert (Hugging Face), Dmitry  | ICML 2023 | en | Helvetica minimal + soft-blue SaaS cards | HelveticaNeue, Arial | 25 | 4 | `keynote-minimal` |
| rushattn | ML 讲座/教程 | Sasha Rush (Cornell Tech / Hugging Fac | MLSys 2023 invited tal | en | Beamer custom Raleway minimal | Lato, Raleway | 17 | 5 | `theory-beamer` |
| rushdeepseek | ML 讲座/教程 | Sasha Rush (Cornell) | Simons Institute LLM w | en | Google Slides plain + serif quote cards | Arial, Merriweather | 16 | 3 | `editorial` |
| shakir | ML 讲座/教程 | Shakir Mohamed (DeepMind) | AISTATS 2023 | en | botanical illustrated Canva keynote | Kodchasan | 27 | 5 | `editorial` |
| ssl | ML 讲座/教程 | Xinlei Chen, Ishan Misra, Mathilde Car | ICML 2023 | en | FAIR thin-Helvetica + Meta blue | Calibri, HelveticaNeue | 19 | 3 | `keynote-minimal` |
| cmu11711 | 课程 | Sean Welleck (slides from Graham Neubi | CMU 11-711 Spring 2025 | en | Neubig Keynote white + LaTeX | — | 31 | 4 | `keynote-minimal` |
| cmu15445 | 课程 | Andy Pavlo / CMU 15-445/645 | CMU 15-445 Fall 2024 | en | Pavlo spaced-caps serif + red callouts | CrimsonText, Calibri | 62 | 4 | `editorial` |
| cornell6787 | 课程 | Chris De Sa / Cornell CS6787 | Cornell CS6787 Fall 20 | en | Garamond serif minimal + LaTeX | Garamond, Arial | 24 | 3 | `theory-beamer` |
| cs149 | 课程 | Kayvon Fatahalian & Kunle Olukotun / S | Stanford CS149 Fall 20 | en | Kayvon condensed-bold Keynote | MyriadPro, Consolas | 42 | 5 | `systems-talk` |
| cs162 | 课程 | John Kubiatowicz / UC Berkeley CS162 | Berkeley CS162 Fall 20 | en | classic Berkeley clipart PowerPoint | Calibri, Arial | 222 | 2 | `international` |
| cs224n | 课程 | John Hewitt / Stanford CS224N | Stanford CS224N Winter | en | Stanford teal-heading Calibri template | Calibri, Times | 65 | 4 | `keynote-minimal` |
| cs294agents | 课程 | Denny Zhou (Google DeepMind) / UC Berk | Berkeley CS294 LLM Age | en | minimal Google Sans white | GoogleSans, Arial | 28 | 3 | `keynote-minimal` |
| cs336 | 课程 | Tatsunori Hashimoto / Stanford CS336 | Stanford CS336 Spring  | en | sky-blue top band + handwritten sketches | SourceSansPro, Arial | 34 | 4 | `keynote-minimal` |
| ethddca | 课程 | Onur Mutlu / ETH Zürich Digital Design | ETH DDCA Spring 2025 | en | Mutlu green-serif gold-rule | Tahoma, Verdana | 38 | 3 | `editorial` |
| mit6s191 | 课程 | Alexander Amini / MIT 6.S191 | MIT 6.S191 Jan 2026 | en | MIT watermark + neon-network cover | — | 0 | 4 | `dark-tech` |
| oxdeepnlp | 课程 | Phil Blunsom / Oxford CS & DeepMind | Oxford DeepNLP 2017 | en | Beamer plain CM sans | Times | 55 | 3 | `theory-beamer` |
| oxfordaz | 课程 | Andrew Zisserman / University of Oxfor | Oxford C19 Hilary Term | en | Zisserman blue-bullet underline-title | Lcmss8, Cmmi8 | 72 | 3 | `international` |
| princeton484 | 课程 | Princeton COS 484 (instructor not name | Princeton COS 484 Spri | en | Keynote white centered Helvetica | HelveticaNeue, GillSans | 21 | 3 | `keynote-minimal` |
| utokyo_mi | 课程 | 二反田篤史 / 東京大学 数理・情報教育研究センター | UTokyo MI center 2021 | ja | Japanese MEXT-consortium plain white | YuGothic, Calibri | 108 | 3 | `jp-gothic` |
| utokyo_suzuki | 课程 | 鈴木大慈 / 東京大学 (intensive lecture at Toho | 東北大学集中講義 2023 | ja | Japanese navy title bar dense theory | Meiryo, CenturyGothic | 59 | 4 | `jp-gothic` |
| uw447 | 课程 | Sofia Serrano (slides credit Tsvetkov, | UW CSE 447 Winter 2023 | en | Google Slides teal cover + grey title bar | Lato, Calibri | 21 | 3 | `keynote-minimal` |
| uw599i | 课程 | John Thickstun / UW CSE 599I Generativ | UW CSE 599I Autumn 202 | en | purple three-field footer bar Keynote | — | 150 | 3 | `international` |
| ccmt_zhang | 中文报告 | 张绍磊 中国科学院计算技术研究所 | CCMT 学生论坛 2023 | zh | institute footer-bar classic PPT | SimSun, SimHei | 52 | 3 | `defense-cn` |
| cips_liuqun | 中文报告 | 刘群 华为诺亚方舟实验室 | CIPS 2022 学术年会 (2023-0 | zh | Beamer corporate photo-cover + shaded TOC | SimHei, NimbusRomNo9L-Regu | 40 | 3 | `theory-beamer` |
| cncc_kuang | 中文报告 | 况琨/吴飞 浙江大学 et al. | CNCC 2025 | zh | ZJU watermark Office tutorial | MicrosoftYaHei, TimesNewRoman | 46 | 3 | `defense-cn` |
| def_fudan_wang | 中文报告 | 王顺利 复旦大学 | 2024-05-25 | zh | Fudan defense navy tab header | MicrosoftYaHei, TimesNewRoman | 84 | 4 | `defense-cn` |
| def_thu_lyu | 中文报告 | 吕睿可 清华大学 | 2026-05-24 | zh | Tsinghua purple photo-divider defense | MicrosoftYaHei, Arial | 96 | 4 | `defense-cn` |
| def_ucas_peng | 中文报告 | 彭任锋 中国科学院数学与系统科学研究院 | 2026-04-29 | zh | Beamer Metropolis Chinese (Fira + STSong) | FiraSans | 74 | 4 | `theory-beamer` |
| def_zju_jin | 中文报告 | 金子植 浙江大学 | 2025-05-27 | zh | ZJU defense blue band + chevron breadcrumb | Calibri, Arial | 70 | 5 | `defense-cn` |
| fudan_zhangqi | 中文报告 | 张奇 复旦大学/上海人工智能实验室 | CCF Talk 2026 | zh | CCF gradient-bar official template | MicrosoftYaHei, Calibri | 48 | 4 | `defense-cn` |
| nju_pang | 中文报告 | 庞竟成 南京大学 LAMDA | 2024 | zh | LAMDA lab template, shadowed navy titles | KaiTi, MicrosoftYaHei | 33 | 3 | `defense-cn` |
| nndl3h | 中文报告 | 邱锡鹏 复旦大学 | 2018 | zh | navy box + orange dashed rule tutorial | Arial, 微软雅黑 | 18 | 4 | `keynote-minimal` |
| pku_wangdi | 中文报告 | 王迪 北京大学 | 2024 (OOPSLA'24 work,  | zh | Keynote grey gradient minimal builds | AlegreyaSans, Aptos | 27 | 4 | `keynote-minimal` |
| pku_xiong | 中文报告 | 熊英飞 北京大学 | PKU course 2025 | zh | Office default blank + school seal | Calibri, STXihei | 56 | 2 | `defense-cn` |
| sustech | 中文报告 | yhbcode000 (南方科技大学) | GitHub template 2025 | zh | Beamer group-meeting steel-blue + orange | MicrosoftYaHei | 22 | 4 | `theory-beamer` |
| thu_chatglm_agent | 中文报告 | 东昱晓 清华大学 KEG | 2023 | zh | sky-gradient cover + bilingual result slides | MicrosoftYaHei, MicrosoftYaHeiUI | 43 | 3 | `defense-cn` |
| thu_chen_mla | 中文报告 | 陈键飞 清华大学 | THU course 2025 | zh | mint monochrome code-lecture | Consolas, MicrosoftYaHei | 56 | 3 | `defense-cn` |
| thubeamer | 中文报告 | YangLaTeX (清华大学 Beamer 主题) | GitHub template v1.2 2 | zh | Beamer THU purple miniframes | SimHei, SFSS1000 | 44 | 3 | `theory-beamer` |
| valse_med | 中文报告 | 郑冶枫 西湖大学 | VALSE Webinar 2024-09- | zh/en | university blue title bar + left bullets right | Arial, Arial | 51 | 3 | `defense-cn` |
| zjubeamer | 中文报告 | qychen2001 (ZJU-Beamer-Template) | GitHub template 2023-2 | zh | Beamer ZJU navy gradient + emblem watermark | STXihei | 47 | 3 | `theory-beamer` |
| chajed | 答辩/keynote | Tej Chajed, MIT PDOS (systems verifica | MIT PhD defense, 2021- | en | minimal Open Sans + teal systems diagrams | OpenSans, HelveticaNeue | 25 | 5 | `systems-talk` |
| cogan | 答辩/keynote | Josh Cogan, Stanford / SLAC | Stanford Physics PhD d | en | national-lab PowerPoint, red rule + logos | Arial, Times | 41 | 3 | `international` |
| deshraj | 答辩/keynote | Desh Raj, Johns Hopkins CLSP (speech / | JHU PhD defense, 2024- | en | Keynote bold Avenir, waveform glyph system | AvenirNext, HelveticaNeue | 48 | 5 | `systems-talk` |
| furnsinn | 答辩/keynote | Florian Fürnsinn, University of Vienna | Univ. of Vienna PhD de | en | Beamer navy miniframes (Frankfurt-style) + col | — | 88 | 4 | `theory-beamer` |
| hennpatt | 答辩/keynote | John Hennessy (Stanford) & David Patte | ACM A.M. Turing Lectur | en | classic Berkeley PowerPoint, blue title + rule | Arial, OpenSans | 64 | 3 | `international` |
| jeffdean | 答辩/keynote | Jeff Dean & Amin Vahdat, Google | Hot Chips 2023 | en | Google corporate clean + 4-color accents | GoogleSans18pt, GoogleSansText | 48 | 4 | `systems-talk` |
| kobus | 答辩/keynote | Giovanna Kobus Conrado, HKUST (CS) | HKUST PhD thesis defen | en | brutalist black frame + magenta accent | LexendDeca, Lexend | 19 | 4 | `keynote-minimal` |
| krypton | 答辩/keynote | Alessandro Sciarra, Goethe University  | Frankfurt PhD defence, | en | custom TikZ Beamer, rainbow string-art corners | CenturySchL-Ital, F15 | 62 | 3 | `theory-beamer` |
| mjordan | 答辩/keynote | Michael I. Jordan, UC Berkeley (ACM Te | ACM TechTalk 2020 | en | senior-professor plain PowerPoint, black foote | Calibri, Verdana | 34 | 3 | `international` |
| morehead | 答辩/keynote | Alex Morehead, University of Missouri  | Univ. of Missouri PhD  | en | centered navy title, paper-figure + reference  | HelveticaNeue, DMSerifDisplay | 32 | 4 | `keynote-minimal` |
| muli | 答辩/keynote | Mu Li, CMU CSD | CMU PhD thesis defense | en | Keynote sky-blue monochrome, roadmap grid | — | 44 | 5 | `keynote-minimal` |
| nayebi | 答辩/keynote | Aran Nayebi, Stanford Neurosciences (Y | Stanford Neurosciences | en | Keynote grey title band, figure-first | Garamond, HelveticaNeue | 38 | 4 | `keynote-minimal` |
| sanford | 答辩/keynote | Clayton Sanford, Columbia University ( | Columbia PhD thesis de | en | Keynote Helvetica bold, corner architecture ic | HelveticaNeue, ZapfDingbatsITC | 36 | 4 | `systems-talk` |
| schadlich | 答辩/keynote | Robert Schädlich, DIENS École normale  | ENS Paris PhD defense, | en | Beamer Metropolis-light (Fira) + handwritten a | FiraSans, Caveat | 39 | 5 | `theory-beamer` |
| servan | 答辩/keynote | Sacha Servan-Schreiber, MIT CSAIL (cry | MIT PhD defense, ~2025 | en | Google Slides navy + emoji protocol cartoons | Arial, Arial | 16 | 4 | `editorial` |
| villa | 答辩/keynote | Alessandro T. Villa, Duke University E | Econ job market talk,  | en | Beamer Metropolis variant, serif body | TeXGyrePagellaX, Cabin | 74 | 4 | `theory-beamer` |
| wright | 答辩/keynote | Ana Wright (mathematics, knot theory;  | PhD dissertation defen | en | stock Beamer Warsaw (black header + blue gradi | NimbusSanL, NimbusSanL-Regu | 52 | 3 | `theory-beamer` |
| yasuda | 答辩/keynote | Taisuke (Tai) Yasuda, CMU Computer Sci | CMU PhD thesis defense | en | Keynote theory talk, rounded-box theorems + ma | HiraginoSans-W3, HiraginoSans-W5 | 75 | 5 | `theory-beamer` |
| bachkey | 设计派/日韩 | Benjamin Bach, University of Edinburgh | Dealing with Data 2019 | en | thin-type black/white alternating keynote | Poppins, Poppins-ExtraLight | 4 | 4 | `dark-tech` |
| barron | 设计派/日韩 | Jon Barron, Google Research | CVPR 2023 workshop | en | minimal Lato argument + annotated notes | Lato, HelveticaNeue | 209 | 4 | `keynote-minimal` |
| crane | 设计派/日韩 | Keenan Crane, Carnegie Mellon Universi | talk (undated, ~2010s) | en | illustrated Palatino lavender | Palatino, CrashLandingBB | 8 | 5 | `editorial` |
| fairvis | 设计派/日韩 | Cabrera, Epperson, Hohman, Kahng, Morg | IEEE VIS (VAST) 2019 | en | navy section blocks + big caption UI demo | HelveticaNeue, Times | 12 | 4 | `keynote-minimal` |
| hearst | 设计派/日韩 | Marti Hearst, UC Berkeley | IEEE VIS 2022 | en | AI-painted cover + paper-clipping collage | GillSans, Calibri | 66 | 4 | `editorial` |
| heo_ko | 设计派/日韩 | 허기홍, KAIST 전산학부 | SIGPL 여름학교 2026 | ko | Keynote centered + cartoon icons + pop-culture | HelveticaNeue, Calibri | 20 | 4 | `jp-gothic` |
| kakao_ko | 设计派/日韩 | 강우영 (edwin.ai), Kakao | if(kakaoAI)2024 | ko | dark tech keynote, focus-dim builds | KakaoBigOTFBold, KakaoBigOTFRegular | 19 | 5 | `dark-tech` |
| kantocv_ja | 设计派/日韩 | Takuro Kawada, Hosei Univ. (Iyatomi La | kantoCV 67th (CVPR 202 | ja | paper-reading black left-bar | MPLUS2, MS-PGothic | 75 | 4 | `jp-gothic` |
| munzner | 设计派/日韩 | Tamara Munzner, UBC | Graphics Interface 202 | en | classic vis-research build diagrams | MyriadPro, GillSans | 52 | 3 | `keynote-minimal` |
| nagase_ja | 设计派/日韩 | 永瀬亮太郎, 立命館大学 | SP/SLP研究会 2025 (invite | ja | JP university bar-title invited talk | YuGothic, MS-Gothic | 84 | 3 | `jp-gothic` |
| okada | 设计派/日韩 | Kobayashi, Okada, Wolff (Hokkaido/Nago | RAOTA 若手研究者の集い 2025 | ja | Japanese theory talk, single orange accent | NotoSans, NotoSansMath | 55 | 4 | `jp-gothic` |
| plopes_genems | 设计派/日韩 | Yun Ho, Romain Nith, Pedro Lopes — HCI | CHI 2026 | en | lowercase photo-led HCI lab | Roboto, Arial | 15 | 5 | `editorial` |
| roblox | 设计派/日韩 | Sergey Makeev, Roblox | SIGGRAPH 2026 Advances | en | SIGGRAPH course template, beige bar | CIDFont+F1 | 93 | 3 | `international` |
| yokoi_ja | 设计派/日韩 | Heinzerling, 横井祥, 小林悟郎 (RIKEN/東北大/国語研) | 言語処理学会 NLP2025 | ja | speakerdeck JP heavy-gothic tutorial | MPLUS1p, Ubuntu | 102 | 4 | `jp-gothic` |

来源链接、逐项版式/内容/画风记录见 `atlas/records.jsonl`。
