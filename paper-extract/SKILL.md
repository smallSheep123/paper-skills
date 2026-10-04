---
name: paper-extract
description: 使用 MinerU 4.x 将论文/文档无状态解析为 Markdown，供 AI 直接阅读；包含独立模型下载与校验脚本。用户要求“PDF转md、提取论文、准备论文给AI读、下载MinerU模型”时使用。不需要论文数据库或常驻服务。
---

# paper-extract：MinerU → Markdown → AI

目标很简单：**把论文可靠地转换成 AI 可直接读取的 Markdown，并保持相关图片/素材可追溯。**

本 Skill 不维护论文数据库，不提供标签、搜索或去重系统，也不要求启动常驻 MinerU API。脚本只调用 MinerU 官方 4.x CLI。

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

如果宿主本身已经能高质量读取 PDF，可以直接复用宿主结果；只有需要稳定、可重复使用的 Markdown 产物时再调用 MinerU。
