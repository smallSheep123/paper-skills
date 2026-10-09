# 数学公式：源码、对象与排版

论文 PDF 是视觉真值。抄写或 OCR 得到的 LaTeX 要逐项核对分子/分母、上下标、求和范围、括号、粗体向量、转置、范数及公式编号；转换工具不能验证数学含义。原论文公式图可作为保真兜底，须完整裁切并保留出处。

## 表示选择

- **SVG 矢量公式**：推荐用于复杂结构，以及尚未验证目标 PowerPoint 环境的交付。放大清晰，保留源 LaTeX；可移动和缩放，但不能在公式编辑器中逐项修改。附带同尺寸透明 PNG，兼容不支持 SVG 的阅读器。
- **OMML 原生公式 + SVG/PNG 后备**：可尝试用于需要继续编辑的公式。当前工具仅转换经结构检查的简单分式、根号、上下标与运算；复杂布局自动退回矢量。原生字体使用 Cambria Math，字面大小与 TeX 字体不同，留足空间并在目标 PowerPoint 中实际打开核验。LibreOffice 可能使用后备图，渲染成功不证明原生公式显示/编辑已验证。
- 不把 `\frac`、`\sum` 等 LaTeX 源码直接塞入文本框，不用普通 Unicode 拼出复杂公式后声称已经支持 LaTeX。

## 本地工具链

安装可选 Python 依赖：`python -m pip install -r requirements-math.txt`。

需要 PATH 中的 `pdflatex` 和 TeX 包 `standalone`、`amsmath`、`amssymb`、`bm`、`xcolor`、`lmodern`。PDF 同时导出矢量路径和透明图片，二者共享同一边界，不依赖 Ghostscript、浏览器或 SVG 字体安装。没有 TeX 时使用宿主可靠公式渲染器或原论文公式图；不要用假公式补位。

输入 `math-request.json` 是数组，`id` 在一次准备中唯一。数学片段不带 `$`、`\[\]` 或文档前导；中文讲解用 PPT 文本放在公式外。本地渲染支持标准 LaTeX/AMS 数学，不自动加载用户宏包或猜测自定义宏。

```json
[
  {"id":"response", "latex":"y_i=\\frac{x_i^2+\\alpha}{\\sqrt{1+\\beta_i^2}}", "fontSize":28, "mode":"svg"},
  {"id":"piecewise", "latex":"f(x)=\\begin{cases}x^2,&x\\geq0,\\\\-x,&x<0.\\end{cases}", "fontSize":28, "mode":"svg"}
]
```

`mode: "svg"` 固定矢量；`"auto"` 尝试简单原生结构并记录回退原因；`"native"` 强制原生，无法可靠转换时直接报错。工具的 native 结构检查不等于目标软件兼容性验收。

```bash
python scripts/math_assets.py prepare math-request.json --out build/math.json
```

产物包含每式的 `.tex`、PDF、SVG、PNG、实际宽高与表示方式。**28 pt 指字面字号，分式/求和整体高度会更大**，不能给所有公式套同一固定高度。

PptxGenJS 中插入已经准备的资产：

```javascript
const {loadEquations, addEquation} = require('./assets/ppt-helpers');
const equations = loadEquations('build/math.json');
addEquation(slide, equations.response, {x: 1.1, y: 2.0, w: 11.1, h: 1.6});
// addEquation 插入带源码标记的图片；先将 deck 正常写为 build/deck.raw.pptx。
```

然后必须完成矢量/原生嵌入，再进行段落修复（如需要）、结构检查及真实渲染：

```bash
python scripts/math_assets.py finalize build/deck.raw.pptx --manifest build/math.json --out build/deck.math.pptx
python scripts/check_deck.py build/deck.math.pptx --out build/audit.json
python scripts/bridge.py render build/deck.math.pptx --out renders/math-r01
```

`finalize` 另存，拒绝覆盖；检查资产哈希及源码一致性。LaTeX 和字号保留在公式对象的替代文字中，方便追溯和重新生成。需要保留原生字体的机器须具备 Cambria Math。

共享画布也支持 `canvas.equation(asset, box, options)`。它只放置公式，不决定整页构图。现有预设的普通文本符号例子不代表 LaTeX 转换；需要复杂数学时调用公式工具，不能直接把 LaTeX 源码传给 `text()`。外部注释、箭头或高亮的位置由所选风格和真实渲染决定。

## 符号着色与逐项讲解

- 给单个符号上色，在 LaTeX 源码里直接写 `\textcolor[HTML]{2E86DE}{s_\theta}`。色值用所选预设 `tokens.color.sym` 里的同一个十六进制值，正文和自绘图也用同一个颜色。
- 校验器禁止 `\newcommand` 和 `\def`，同一个符号每次出现都要重复写颜色宏。可以在生成 `math-request.json` 的脚本里做字符串替换，不要在 LaTeX 里定义宏。
- `math_assets.py` 只返回整条公式的外框，拿不到子项坐标。逐项讲解有三种做法，按优先级：
  1. **拆式**：把公式拆成几段独立资产，左右并排放，每段各自有坐标，可以精确加框、加箭头。拆式要注意三点：
     - 每段都加同一个**内含真实括号**的幻影：`\vphantom{\left(\frac{p(y)}{p(x)}\right)}`（括号里放全式最高的部分）。带括号的那段也加这同一个幻影。不要写裸 `\vphantom{X}`，也不要写 `\left.\vphantom{X}\right.`：`\left.` 不占高度，`\left…\right` 会多撑出约 10–20% 的高度，没括号的段因此偏矮，按高度居中后基线就会错开（SEDD 测试实测差 0.07 in，改成这种写法后 ≤ 0.007 in）；
     - 每段在请求里设 `"border": 0`，否则每段自带 2 bp 边距，拼接处会有缝；
     - 成对括号被拆开时写成 `\left[ … \right.` 和 `\left. … \right]`，两半和其他段都用同一个幻影；
     - 拼好后放大看一眼基线：各段字母底部要在同一条水平线上，差 0.03 in 以上就回去检查幻影。
     theory-beamer 的 `symbols` 原型接受分段数组 `equationAsset: [a, b, c]`，并用 `labels` 在每段下方标注；
  2. **颜色图例**：公式里的项着色，公式下方用正文字体画同色色块和说明；
  3. `\underbrace{...}_{\text{说明}}`：说明会用数学字体，和正文字体不一致，只适合短标签。
- 不要凭估算的坐标在整式图片上画圈。

## 排版与验收

- `fontSize` 必须由调用方显式给出，为有限正数；没有全局 18 pt 下限、60 pt 上限或统一美学字号。实际可读性由所选风格、投影环境与视觉复审判断。`color` 同样可配置，深色风格应传入适合背景的颜色。
- 插入时保留实际物理尺寸。超出预留框直接报错，不自动缩小、不拉伸；优先加宽、在语义合理处使用 `aligned` 分行、拆页或减去旁注。
- 核对矩阵括号、分段条件、求和/积分上下限以及有意设置的多行对齐是否保真，检查注释是否碰到上下标或分数线。注释位置、具体间距、每页公式数量、编号位置和配色由风格决定。
- 实际查看每页与整套总览；SVG 快速预览不代替导出 PPTX 的渲染。原生分支和后备图的范围、字号、颜色均应核对；没有检查 PowerPoint 就如实标记未验证。

可选样例：`node assets/build-math-samples.js build/math-samples`，使用 [Academic Evidence](../styles/academic-evidence/STYLE.md) 的排版，中英文各四页，覆盖分式、根号、上下标、矩阵、分段、多行及下括号。示例不代表所有风格，也不是论文结论。

实现依据：[Microsoft DrawingML 数学扩展](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/853b19c7-68a9-4f9a-a2ae-5e6cb0d02e62)、[Microsoft 365 LaTeX 支持](https://learn.microsoft.com/en-us/office/math/latex)、[latex2mathml](https://github.com/roniemartinez/latex2mathml)、[mathml2omml](https://github.com/amedama41/mathml2omml)。工具转换范围小于 Microsoft 365 原生输入的支持范围。
