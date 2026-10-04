# 学术 PPT 参考蒸馏

本文件不是“模板收藏”，而是给视觉 AI 的**参考原则库**。目标是从优秀学术演讲规范与真实 slide deck 中抽出可复用的设计规律，同时避免照抄任何具体页面。

## 参考来源

### 1. MIT AeroAstro Communication Lab — Slide Design
https://mitcommlab.mit.edu/aeroastro/commkit/slide-design/

可蒸馏：
- slide 应补充讲述，而不是替代讲述。
- 研究会议需要足够技术细节，但要围绕核心 message 组织。
- 论文 Figure 不能机械复制到 slide；应删掉与当前 message 无关的信息并适配演讲。
- 视觉层级、阅读顺序、简洁标题比“装饰”重要。

### 2. MIT Broad Institute Communication Lab — Slideshow
https://mitcommlab.mit.edu/broad/commkit/slideshow/

可蒸馏：
- 每页只承担一个 message。
- 每页只保留支撑这个 message 所需的信息。
- 图比文字优先。
- Figure 应尽量简单，同时保留结论所需证据。

### 3. Nature / Scitable — Presentation Slides
https://www.nature.com/scitable/topicpage/presentation-slides-13905480/

可蒸馏：
- 标题区域最好直接说“so what”，而不是只写主题名。
- 观众无法同时高效听讲和阅读长段文字。
- 视觉材料必须能独立理解，不能因为“少字”而删掉关键标签。

### 4. Nature Methods — Talking points
https://www.nature.com/articles/nmeth0508-371

可蒸馏：
- 文字要少而精，图示优于长文字。
- 图优先于表格；图与坐标标签必须足够大。
- 简单背景、高对比、可读字体比特效可靠。
- 动画只在确实能解释过程时使用。

### 5. NeurIPS — Guidelines for Talks
https://neurips.cc/Conferences/2021/PaperInformation/Author-Guidelines

可蒸馏：
- 少文字、大字号、粗体用于强调。
- 高对比；不要用特殊文字特效。
- 不依赖颜色单独传递含义；考虑色觉无障碍。

### 6. Simon Peyton Jones — How to Give a Great Research Talk
https://simon.peytonjones.org/great-research-talk/

可蒸馏：
- talk 的目标不是把论文全部复述，而是让观众理解并愿意继续读。
- 核心思想和直觉比技术细节堆积更重要。
- 示例、直觉解释、故事推进比“按论文目录念”更适合演讲。

### 7. Jure Leskovec — Thesis Defense
https://cs.stanford.edu/people/jure/pubs/thesis/jure-defense_pdf.pdf

不是照抄其 2008 年的黑黄视觉，而是学习：
- 大标题非常明确，信息层级强。
- 可以直接在 slide 上对旧假设做“划掉 / 高亮 / 对比”，让逻辑转折可视化。
- 数据图与结论并置，而不是把所有解释放在讲稿里。
- 大型结构矩阵/问题地图可以成为章节导航，但不应每页都这样。

### 8. Chris Ré — NeurIPS 2023 Keynote
https://cs.stanford.edu/people/chrismre/papers/NeurIPS23_Chris_Re_Keynote_DELIVERED.pdf

可蒸馏：
- keynote 式学术 deck 可以比论文组会更有页面节奏和视觉冲击。
- 章节切换、单句问题页、局部大图可以增强叙事。
- 但核心仍然围绕研究论点，而不是“品牌视觉”。

## 统一蒸馏：7 条设计原则

### P1. Message first
先写这一页的 message，再选图和布局。没有 message 的页不要生成。

### P2. Evidence is the hero
学术 PPT 的主角是证据：论文图、实验结果、机制图、公式关系。装饰永远排在后面。

### P3. Adapt, don't paste
论文适合阅读，PPT 适合观看。Figure 应裁、拆、放大、标注，而不是截图缩小。

### P4. One visual hierarchy
观众应该在 3 秒内知道先看哪里、再看哪里。不要让标题、图、数字、卡片同时抢注意力。

### P5. Story beats chronology
汇报不必严格按 paper section 顺序。优先：问题 → 为什么难 → 核心 idea → 怎么做 → 证据 → 局限。

### P6. Restraint signals scholarship
学术感来自克制和可信，而不是“朴素 = 难看”。丰富风格也要避免营销化和模板化。

### P7. Visual AI is an editor
视觉模型的职责不是最后检查“有没有溢出”，而是像设计编辑一样参与：
- 选图
- 判断图的可讲性
- 决定裁剪
- 规划阅读路径
- 发现信息过载
- 重新排版
- 对照论文检查视觉是否误导

## 不应蒸馏的东西

- 不复制某个学校的固定模板。
- 不复制具体配色作为默认“学术风”。
- 不把旧 slide 的小字号、重描边、3D 效果继承下来。
- 不因为 keynote 有大图就强行给所有论文生成装饰图。
- 不因为某套 deck 用黑底就把“黑底”理解成高级。
