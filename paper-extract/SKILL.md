---
name: paper-extract
description: 使用 MinerU 4.x 将论文/文档无状态解析为 Markdown，供 AI 直接阅读；包含独立模型下载/校验脚本。用户要求“PDF转md、提取论文、准备论文给AI读、下载MinerU模型”时使用。不需要任何额外论文库或常驻服务。
---

# paper-extract：MinerU → Markdown → AI

目标只有一件事：**把论文可靠地转换成 AI 可直接读取的 Markdown（以及 MinerU 产生的相邻素材）**。

不维护论文数据库，不做标签/搜索系统，不依赖 MCP 服务，也不要求启动常驻 MinerU API。代码只调用 MinerU 官方 4.x CLI。

## 0. 依赖

MinerU 4.x 要求 Python `>=3.10,<3.15`。推荐在独立虚拟环境安装：

```bash
python -m pip install -U "mineru>=4.0,<5"
mineru-kit --help
```

需要 GPU 高吞吐时按 MinerU 官方平台说明选择 `mineru[torch]` / `mineru[full]`；不要在脚本里替用户改 CUDA、驱动或全局 Python 环境。

## 1. 模型下载与解析分离

**先下载模型，再解析文档。** 两步彼此独立。

默认 Standard 档位：

```bash
python scripts/mineru_models.py download --tier standard
python scripts/mineru_models.py verify --tier standard
```

网络环境需要 ModelScope 时：

```bash
python scripts/mineru_models.py download --tier standard --source modelscope
```

查看当前模型配置：

```bash
python scripts/mineru_models.py show
```

脚本只是转发官方 `mineru-kit models ...` 命令，不实现下载器、不伪造完成标记。

## 2. 生成 Markdown

模型已准备好后：

```bash
python scripts/mineru_extract.py /path/to/paper.pdf
```

默认输出：

```text
/path/to/paper_mineru/
└── paper.md
```

脚本默认设置当前子进程 `MINERU_MODEL_SOURCE=local`，因此**不会一边解析一边偷偷下载模型**；缺模型就明确失败。需要允许 MinerU 自动选择远端模型源时显式使用：

```bash
python scripts/mineru_extract.py paper.pdf --model-source auto
```

常用参数：

```bash
# 指定页面
python scripts/mineru_extract.py paper.pdf --pages "1-8"

# OCR 扫描件
python scripts/mineru_extract.py paper.pdf --ocr-mode ocr

# 指定输出目录
python scripts/mineru_extract.py paper.pdf --out-dir ./paper-output
```

`mineru-kit parse` 是无状态转换，不使用 MinerU 文档库数据库/缓存，也不需要启动 API Server。单文件模式直接写完整 Markdown。

## 3. 给 AI 的交接

AI 后续至少拿到：

- 原始 PDF；
- 生成的 Markdown；
- MinerU 在输出位置生成或引用的图片/素材（若本次解析包含）；
- 实际使用的 MinerU tier 与未解决的解析问题。

Markdown 用于快速理解正文；**原 PDF 页面仍然是图、表、公式的视觉真值**。拟用于 PPT 的 Figure/Table/公式必须让视觉模型实际查看原 PDF 或对应图片，不能只根据 Markdown 文本猜。

如果 Markdown 中出现图片引用，保持输出目录结构，不单独搬走 `.md` 导致相对路径失效。

## 4. 不做的事情

- 不集成 paper-mcp。
- 不提供论文数据库、去重、标签或搜索。
- 不要求常驻 `mineru-kit api-server`。
- 不自动修改系统代理、CUDA、驱动、全局环境变量。
- 不重复下载已经通过 `models verify` 的模型。
- 不把 OCR / 模型推断结果当作实验数字的最终证据。

如果宿主本身已经能高质量读取 PDF，可以直接复用宿主结果；只有需要稳定 Markdown 产物时再走 MinerU。
