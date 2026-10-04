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

## 5. 可选 OOXML 修复

仅在确实遇到 PptxGenJS 多 run 段落的重复 `<a:pPr>` 问题时使用：

```bash
python assets/fix_pPr.py deck.pptx --out deck.fixed.pptx
```

脚本默认另存，不覆盖源文件。出现冲突属性时应回到生成源修复，而不是让脚本猜。

修复后必须重新渲染并复审。

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

- PptxGenJS 图片 API：<https://gitbrent.github.io/PptxGenJS/docs/api-images/>
- PptxGenJS speaker notes：<https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/>
- LibreOffice 命令行参数：<https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html>

这些链接用于工具实现，不是论文事实依据。
