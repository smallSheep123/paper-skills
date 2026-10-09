# paper-ppt 安装与工具接入

`paper-ppt` 的核心依赖不是某个固定模型，而是三类能力：

1. **能读论文和图片的 AI**
2. **能创建/编辑 PPTX 的工具**
3. **能把 PPTX 渲染成图片供视觉复审的工具**

优先使用宿主已经提供的能力；下面的本地工具链只是备用方案。

## 1. 安装本地 PPT 工具

在 `paper-ppt/` 目录：

```bash
npm install
python -m pip install -r requirements.txt
python scripts/bridge.py doctor
```

建议环境：

- Node.js 20+
- Python 3.10+
- LibreOffice
- Poppler（提供 `pdftoppm`）

缺 LibreOffice 时（`doctor` 报 `soffice: null`）按平台安装，**不要跳过真实渲染**：

| 平台 | 命令 |
|---|---|
| Debian / Ubuntu（含容器、沙箱） | `sudo apt-get update && sudo apt-get install -y libreoffice-impress poppler-utils` |
| macOS | `brew install --cask libreoffice && brew install poppler` |
| Windows | 安装 LibreOffice 后用 `--soffice "C:\Program Files\LibreOffice\program\soffice.com"` |

沙箱或容器重启后，apt 装的 LibreOffice 和 `~/.local/share/fonts` 里的字体都可能丢失：每批渲染前重跑 `doctor` 和 `check_fonts.py`。
确实装不上时，`scripts/svg_preview.py` 的 SVG 预览只能检查布局草稿；它按估算字宽排版，不能作为文字溢出、换行和字体的视觉验收，审阅记录里要写明 `renderer: svg-preview (not final)`。
LibreOffice 渲染中英文之间、全角括号旁的空隙往往比 PowerPoint 宽，看到这类空隙先在源文本里确认没有多余空格，不要为此改版式。

`doctor` 只检查本地工具链，不检查视觉模型是否可用，也不代表 PowerPoint 兼容性已经验证。

## 2. 渲染 PPTX

```bash
python scripts/bridge.py render deck.pptx --out renders/r01
```

输出包括：

```text
renders/r01/
├── <deck>.pdf
├── slide-1.png
├── slide-2.png
├── ...
├── contact-sheet.png
└── render.json
```

每轮修改使用新的输出目录，例如 `r01`、`r02`，避免新旧预览混淆。

需要显式指定工具路径时：

```bash
python scripts/bridge.py render deck.pptx \
  --out renders/r01 \
  --soffice /path/to/soffice \
  --pdftoppm /path/to/pdftoppm
```

Windows 控制台优先使用 `soffice.com`；其他平台使用实际可执行文件。

默认 150 DPI，可通过 `--dpi` 调整。

## 3. 工具链自测

```bash
node assets/smoke-build.js smoke.pptx
python scripts/bridge.py render smoke.pptx --out smoke-render-r01
```

然后让视觉模型**实际查看**生成的全页图片，确认：

- 中文与英文正常；
- 符号没有乱码；
- 字体替换没有破坏版面；
- 演讲备注存在；
- 文本仍然可编辑。

这只是工具链测试，不代表真实论文 PPT 已通过内容和视觉验收。

## 4. 审阅记录检查

在渲染前先检查导出的结构：

```bash
python scripts/check_deck.py deck.pptx --out deck-audit.json
```

它检查图片比例、页面边界、备注覆盖及图表缓存与内嵌工作簿的一致性，不判断文字换行、事实解释和美观。无文字、无图片的装饰形状允许有意出血，其越界会报 warning，仍需逐页视觉确认并记录判断。若 PptxGenJS 将图表零值导出为空值，先核对数据源，再运行 `python scripts/restore_chart_zeros.py input.pptx --out new-version.pptx` 另存修复；它只恢复缓存已为零的空数字单元格，其他差异应修复生成源。

真实完成视觉审阅后，可运行：

```bash
python scripts/check_review.py renders/r01/render.json review-log.json
```

它检查的是：

- 审阅记录结构；
- 当前页面是否有对应记录；
- 图片/整套 deck 是否被修改过；
- 最终版本与通过记录是否匹配。

它**不会调用视觉模型，也不会判断页面好不好看或论文事实是否正确**。

## 5. 保存 PPTX：一律用 `writeDeck`

PptxGenJS 会给同一段落的每个 run 都写一份 `<a:pPr>`。中英混排、`**粗体**`、`{{c:颜色}}` 都会把一段拆成多个 run，生成的文件过不了 `check_deck.py`，PowerPoint 也可能要求修复。保存时不要直接调用 `pptx.writeFile()`，改用：

```js
const {writeDeck} = require('./assets/style-presets');
await writeDeck(pptx, 'deck.pptx');   // 每段只保留第一份 pPr
```

已经用 `writeFile` 生成的旧文件，可以用 `python assets/fix_pPr.py deck.pptx --out deck.fixed.pptx` 补救。修复后必须重新渲染并复审。

## 6. 可选：MinerU 本地论文提取

如果宿主已经能稳定读取 PDF，或已经有 Markdown，可以跳过 MinerU。

需要本地 Markdown 产物时：

```bash
python -m pip install -U "mineru>=4.0,<5"

python ../paper-extract/scripts/mineru_models.py download --tier standard
python ../paper-extract/scripts/mineru_models.py verify --tier standard

python ../paper-extract/scripts/mineru_extract.py /path/to/paper.pdf
```

模型准备和文档解析是两步；默认解析只使用本地已下载模型。详细说明见 [paper-extract](../paper-extract/SKILL.md)。

`paper-ppt` 不复制另一套 MinerU 脚本，避免两个 Skill 的实现发生漂移。

## 7. 视觉能力要求

完整工作流需要真实图像输入能力：

- 可以是独立视觉审阅 Agent；
- 也可以是同一个多模态主 Agent 分阶段完成设计与复审。

只读取文件名、图片尺寸、替代文本或 XML **不算看图**。

没有视觉能力时，可以生成内容草案或结构方案，但不能声称“视觉验收通过”。

## 8. 技术参考

含数学公式时先安装可选依赖 `python -m pip install -r requirements-math.txt`，并准备 `pdflatex` 及相关 TeX 包。运行 `npm run math-samples` 生成 Academic Evidence 风格的中英文公式样例。完整操作见 [math-equations.md](references/math-equations.md)。`npm run samples` 继续生成原有九套预设，不依赖 TeX；其中普通文本符号示例不代表 LaTeX 转换。

- PptxGenJS 图片 API：<https://gitbrent.github.io/PptxGenJS/docs/api-images/>
- PptxGenJS speaker notes：<https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/>
- LibreOffice 命令行参数：<https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html>

这些链接用于工具实现，不是论文事实依据。
