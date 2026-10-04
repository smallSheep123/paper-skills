---
name: paper-ppt
description: 把论文 PDF 做成学术组会/课程分享 PPT 的视觉 AI 工作流（提取入库 → 论文图目检 → 双风格设计 → storyboard → 2 页试制 → pptxgenjs 落地 → 渲染 → 视觉 AI 逐页验收 → 修订）。当用户要"把这篇论文做成 PPT / 组会汇报 / 论文分享 slides / 讲论文"，或给了逐页规划让生成 PPT 时使用。与 paper-extract skill 配套。
---

# paper-ppt：视觉 AI 驱动的论文汇报 PPT 工作流

目标产出：一份能直接讲的学术汇报 PPT（16:9，标准字体，论文原图 + 必要自绘示意图，每页带演讲备注）。

核心原则：

> **AI 负责理解、选图、构图、视觉判断和修订；代码只负责把已经确定的设计精确落地、连接工具和导出文件。**
>
> 不做“输入论文 → 套模板 → 自动排版 → 导出”的流水线。

分享 / 安装：见 [INSTALL.md](INSTALL.md)。

视觉系统：
- [references/style-guide.md](references/style-guide.md)：公共规则 + 风格路由
- [references/academic-clean.md](references/academic-clean.md)：学术简约
- [references/academic-rich.md](references/academic-rich.md)：学术丰富
- [references/academic-slide-distillation.md](references/academic-slide-distillation.md)：参考学术 PPT 的原则蒸馏
- [references/talk-structure.md](references/talk-structure.md)：默认内容结构

完整成品脚本示例：[assets/example-build.js](assets/example-build.js)。它只是“如何落地”的代码示例，**不是设计模板**。

## 流程总览

```
论文提取
→ 论文图/表视觉目检
→ 内容真值表（message / evidence / source）
→ 选择 Academic Clean / Academic Rich
→ 视觉 AI 生成 style brief
→ 逐页 storyboard
→ 2 页关键试制
→ 渲染 + 视觉 AI 审核
→ 全量落地
→ 逐页视觉验收
→ 内容/视觉修订
→ 交付
```

## 0. 环境与约定

- 工作目录：`D:\AIGC\<论文名缩写>-ppt\`（图片放 `img\` 子目录）。
- pptxgenjs：`NODE_PATH=$(npm root -g) node build.js`。
- 渲染：`soffice.com` → PDF → `pdftoppm` → PNG。
- **必须用 `soffice.com`**；`soffice.exe` 在 Git Bash 中可能挂住。
- 提取论文优先走配套 **paper-extract** skill；不可用时用 `scripts/extract_offline.py`。
- 不修改用户系统环境变量；回环服务检查使用 NO_PROXY / `--noproxy "*"`。

## 1. 论文提取 + 视觉素材目检

1. 用 paper-extract 得到 `paper.md` 和 `images\`。
2. 建 Figure/Table → 文件映射，但**映射只用于定位，不用于判断图片内容**。
3. 视觉 AI 逐张目检候选图，记录：
   - 这是什么图；
   - 讲什么结论；
   - 是否适合投影；
   - 是否需要裁剪 / 拆分 / 放大；
   - 图中文字是否过小；
   - 是否存在 MinerU 裁切错误。
4. 只把“能讲清楚”的图纳入候选素材。
5. 记录原图宽高比，禁止拉伸。
6. 若图例破碎或子图拼接失败，优先重新裁切；实在不行才用简短文字图例替代。

## 2. 建立内容真值表

在开始设计前，为每一页候选内容写：

```yaml
message: 这一页观众应该记住什么
evidence:
  - Figure / Table / paper paragraph
source: 论文中的具体出处
must_keep_terms: 不能改写错的术语
numbers: 页面可能出现的数字及来源
speaker_intent: 这页要怎么讲
```

任何页面元素都必须能回到这个真值表。**视觉 AI 可以删信息，不能创造论文事实。**

## 3. 选择两套风格之一

先读 [references/style-guide.md](references/style-guide.md)。

- **Academic Clean**：简约、标准、正式、paper-faithful。默认组会。
- **Academic Rich**：更丰富的编辑式排版、视觉节奏与讲故事能力，但仍保持学术感。

用户指定就按用户指定。
用户没指定则根据场景自动选择，不必为了这个单独打断用户提问。

## 4. 视觉 AI 生成 Style Brief

在写任何 build.js 前，视觉 AI 必须产出简短的设计 brief：

```yaml
style: academic-clean | academic-rich
audience: 组会 / 课程 / 答辩 / 公开演讲
tone: 克制 / 编辑式 / 技术感
palette: 主色、强调色、中性色及用途
typography: 标题/正文/图注字号策略
figure_strategy: 原图、裁剪、拆图、重绘的原则
layout_rhythm: 计划使用的 4-6 种页面构图
avoid: 这套 deck 明确禁止的视觉习惯
```

这份 brief 是整套 PPT 的视觉合同。

## 5. 逐页 Storyboard（先设计，后编码）

用户给了逐页规划 → 内容结构严格照办；视觉组织仍需要做 storyboard。

用户没给规划 → 读 [references/talk-structure.md](references/talk-structure.md)。

每页 storyboard 至少包含：

```yaml
slide: 5
message: 这一页的唯一主消息
title: 结论型标题或正式章节标题
evidence: Figure 7 / 自绘机制
visual_anchor: 页面最大的视觉焦点
layout: 60/40 双栏 / hero figure / 上下结构 / before-after ...
annotations: 要加的箭头、编号、局部高亮
on_slide_text: 页面短文字
notes_goal: 演讲备注要解释的 why
risk: 过密 / 字太小 / 图太复杂 / 信息重复
```

**禁止在 storyboard 阶段就用代码随机试布局。**

## 6. 先做 2 页视觉试制

在全量生成前，选：
- 1 页普通内容页；
- 1 页最复杂页（通常是架构/结果）。

用 pptxgenjs 精确落地 → 渲染 PNG → 交给视觉模型审核。

视觉模型要判断：
- 风格是否符合 Clean / Rich；
- 标题和主视觉层级是否成立；
- 论文图是否太小；
- 是否像 AI 卡片模板；
- 是否有更好的裁剪/注释/阅读顺序；
- 页面是否“可讲”而不是只有“看起来整齐”。

试制不过，不进入全量生成。

## 7. build.js 的职责边界

代码可以：
- 精确放置文本、图、线、箭头、形状；
- 按 AI 指定坐标生成页面；
- 计算图片宽高比；
- 添加 notes；
- 输出 pptx；
- 做必要的 XML 修复；
- 调用渲染与检测工具。

代码不可以：
- 自动选择“第几个模板”；
- 根据文本长度随机套卡片；
- 自己决定配色和视觉风格；
- 用程序化规则替代视觉 AI 的构图判断；
- 为了填空自动生成装饰图。

可复用 helper 在 [assets/ppt-helpers.js](assets/ppt-helpers.js)，只当执行工具，不当设计系统。

## 8. 演讲备注

每页 `addNotes(...)` 写正式口语演讲稿。
- 页面不放演讲稿。
- 图复杂的页先给读图路径。
- 全篇备注时长加总约等于用户要求。
- 不必按论文段落逐句翻译，重点解释“为什么、怎么看、结论是什么”。

## 9. 渲染 + 逐页视觉验收

1. 生成 PPTX。
2. 跑 `assets/fix_pPr.py` 修复多 run 段落的 `<a:pPr>` 问题。
3. LibreOffice → PDF → PNG。
4. 视觉 AI **逐页检查**，不只是检查溢出：
   - 信息层级
   - 阅读顺序
   - 对齐与留白
   - 图像裁切 / 变形 / 清晰度
   - 标题是否表达 message
   - 论文图是否被误读或视觉篡改
   - Clean / Rich 风格一致性
   - 是否出现“AI 卡片味”
5. fail 页只修 fail 页；如果问题是信息架构错误，可以重排，不局限于微调坐标。
6. 全部通过后交付。

## 10. 内容与视觉的双重验收

最终必须同时通过：

### Content pass
- 论文事实正确
- 数字可追溯
- 方法逻辑完整
- 结论没有夸大
- 专有名词统一

### Visual pass
- 3 秒能看出每页重点
- 主图/主结论足够大
- 无明显溢出、裁切、重叠、乱码
- 投影可读
- 图像不变形
- 风格统一但布局不机械重复
- 正式学术，而非 AI 生成商业模板

## 禁止事项

- 演讲稿不上页面。
- 不默认做“关键词 / 一句话概括 / 核心亮点 / 3 个贡献卡片”。
- 标题不中英混排，除非论文专有名本身需要。
- 数字/英文强调使用 Arial，不用 Georgia。
- 不为统一而强行九页九个相同圆角框。
- 不把视觉模型降级成最后一步的“查错器”。
- 用户说“不要再重做”时只做增量修改。
