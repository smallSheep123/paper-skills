---
name: paper-extract
description: 把论文准备成 AI 可读的素材，两条并列可选路径：A. 智能体原生（页面截图 + 视觉识别 + 文本层，无需模型）；B. MinerU 4.x 解析为 Markdown。用户要求“PDF转md、提取论文、准备论文给AI读、截图论文图表、下载MinerU模型”时使用。不需要论文数据库或常驻服务。
---

# paper-extract：论文 → AI 可读素材

目标：**把论文可靠地变成 AI 能读、能看、能追溯的素材**——正文文本、每页截图、图表清单和裁切好的原图。

两条路径**并列、可选、可组合**，不是主备关系：

| 路径 | 需要什么 | 适合 |
| --- | --- | --- |
| **A. 原生**（`scripts/pdf_snap.py`） | 宿主 AI 能看图；Poppler 或 PyMuPDF | 有文本层的论文 PDF；做 PPT 需要原图做视觉真值；不想装模型 |
| **B. MinerU**（`scripts/mineru_*.py`） | MinerU 4.x + 本地模型 | 扫描件；需要可复用的 Markdown；公式要转 LaTeX；大量表格要结构化；宿主不能看图 |

选择规则：

- 宿主能看图且 PDF 有文本层 → 默认 **A**；
- 命中 B 的任一适用条件 → 用 **B**，或 **A + B 并行**（B 出正文/公式/表格，A 出截图和原图裁切做视觉真值）；
- 用户指定路径时听用户的。

本 Skill 不维护论文数据库，不提供标签、搜索或去重系统，也不要求启动常驻 MinerU API。

## 0. 路径 A：智能体原生（截图 + 视觉识别）

```bash
python scripts/pdf_snap.py pages     paper.pdf --out work/pages --dpi 150   # 每页 PNG + sheet.png 总览
python scripts/pdf_snap.py text      paper.pdf --out work/paper.txt.md      # 每页文本，带 <!-- Page N --> 标记
python scripts/pdf_snap.py inventory paper.pdf --out work/inventory.md      # Figure/Table 清单初稿（含页码）
python scripts/pdf_snap.py crop      paper.pdf --page 5 --box 0.05,0.08,0.45,0.30 --out work/figs/fig4.png
```

做法：

1. `pages` 出整套截图，先看 `sheet.png` 掌握版面，再逐页打开含图表的页；
2. `text` 出文本层用于通读。多栏论文在图注、表格、公式处常常错乱：**凡是会进入汇报的数字，都以页面截图为准**；
3. `inventory` 按 “Figure N:” / “Table N:” / “图 N：” 抓 caption，给出图表清单初稿。它是线索不是真值——漏抓、错位都要看图修正；
4. `crop` 用页面比例坐标（0–1）在 300 dpi 下重新渲染并裁切。坐标由 AI 看截图估出，裁完**必须打开裁切结果**核对坐标轴标签、图例、子图编号是否完整，不完整就调坐标再裁；
5. 公式：优先裁原图；需要可编辑公式时由视觉模型对照截图转写 LaTeX，并在 `source-notes.md` 标注“转写，已对照第 N 页”；
6. 截图和裁切文件名保留页码/图号（`fig4.png`、`p05.png`），方便追溯。

宿主自带 PDF 读取能力时，可以直接用宿主的文本结果代替 `text`，截图和裁切仍建议走 `pages` / `crop`。

内容是否充足的自检见 [source-sufficiency.md](../paper-ppt/references/source-sufficiency.md)。

## 路径 B：MinerU

以下为 MinerU 路径，需要时再用。脚本只调用 MinerU 官方 4.x CLI。

## 1. 环境

推荐在独立 Python 环境安装 MinerU：

```bash
python -m pip install -U "mineru>=4.0,<5"
mineru-kit --help
```

需要更高吞吐或特定 GPU 后端时，按当前 MinerU 官方文档选择对应 extra。不要由 Skill 擅自修改 CUDA、显卡驱动或系统 Python。

## 2. 先准备模型

模型下载与论文解析明确分离。

标准档位：

```bash
python scripts/mineru_models.py download --tier standard
python scripts/mineru_models.py verify --tier standard
```

网络环境需要 ModelScope 时：

```bash
python scripts/mineru_models.py download --tier standard --source modelscope
```

查看 MinerU 当前模型配置：

```bash
python scripts/mineru_models.py show
```

`mineru_models.py` 只负责转发官方 `mineru-kit models ...` 命令，不自己实现模型下载逻辑。

## 3. 生成 Markdown

模型准备完成后：

```bash
python scripts/mineru_extract.py /path/to/paper.pdf
```

默认输出：

```text
/path/to/paper_mineru/
└── paper.md
```

默认使用：

```text
MINERU_MODEL_SOURCE=local
```

因此解析阶段只使用本地已准备模型。缺模型时应明确失败，而不是在解析过程中静默下载。

需要允许 MinerU 自动选择远端模型源时，显式指定：

```bash
python scripts/mineru_extract.py paper.pdf --model-source auto
```

常用参数：

```bash
# 只解析指定页
python scripts/mineru_extract.py paper.pdf --pages "1-8"

# 扫描件强制 OCR
python scripts/mineru_extract.py paper.pdf --ocr-mode ocr

# 自定义输出目录
python scripts/mineru_extract.py paper.pdf --out-dir ./paper-output
```

`mineru-kit parse` 作为一次性转换入口使用：不需要常驻服务，也不依赖额外文档库。

## 4. 把结果交给 AI

后续至少保留：

- 原始 PDF；
- 生成的 Markdown；
- Markdown 引用或同目录产生的图片/素材；
- 本次 MinerU tier；
- 已知的解析异常，例如公式丢失、图例裁切、OCR 可疑位置。

Markdown 适合快速理解正文，**原 PDF 页面仍然是 Figure、Table 和公式的视觉真值**。

用于 PPT 的图、表和公式必须由视觉模型实际查看原 PDF 页面或对应图片，不能只根据 Markdown、文件名或 caption 猜内容。

如果 Markdown 使用相对图片路径，不要只搬走 `.md` 文件；保留输出目录结构。

## 5. 失败处理

- 命令不存在：确认当前 Python 环境已安装 MinerU；
- 缺模型：先运行 `mineru_models.py download` 和 `verify`；
- 扫描件识别差：尝试 `--ocr-mode ocr`，并回到原 PDF 复核关键数字；
- 图片/公式不完整：不要用 OCR 猜测替代原始证据，交给视觉模型查看原页面；
- 输出目录已存在：保留旧结果，换新目录，不默认覆盖。

如果宿主本身已经能高质量读取 PDF 并能看图，优先走路径 A；只有需要稳定、可重复使用的 Markdown 产物，或命中路径 B 的适用条件时再调用 MinerU。
