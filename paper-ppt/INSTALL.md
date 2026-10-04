# 安装与工具接入

## 1. 必需的是 AI 能力，不是指定供应商

将 Skill 目录放入客户端支持的位置（例如 `.agents/skills/`）。在新会话确认其已被发现，不覆盖已有系统提示词。

完整流程需要实际图像输入能力、论文读取、PPT 创建/编辑以及可查看的渲染结果。可以使用宿主现成工具，也可以使用下面的本地备用链路。**模型、视觉插件和 API 额度不随仓库提供**；不能把某个不存在的 `visual-judge` 工具写成调用成功。主模型可看图时允许分阶段自审；纯文本模型只能产草案，不能验收。

## 2. 本地备用工具链

在 `paper-ppt/` 目录执行（Windows PowerShell、Git Bash 和 Linux 均可使用这些命令）：

```bash
npm install
python -m pip install -r requirements.txt
python scripts/bridge.py doctor
```

需要 Node.js 20+、Python 3.10+、LibreOffice、Poppler 的 `pdftoppm`。`npm install` 使用本目录依赖，避免要求全局 `NODE_PATH`。`doctor` 从当前目录检查 Node 包，因而应在 `paper-ppt/` 下运行；它不测试视觉模型，也不证明字体或 PowerPoint 兼容。

LibreOffice/Poppler 通过系统包管理器或官方安装包安装。脚本先查 PATH 和常见安装位置；便携版可通过命令行指定，不需要修改系统环境：

```bash
python scripts/bridge.py render /path/to/deck.pptx --out /path/to/renders/r01 --soffice /path/to/soffice --pdftoppm /path/to/pdftoppm
```

Windows 控制台优先指定 `soffice.com`；Linux/macOS 使用对应命令。也可使用现有进程环境变量 `LIBREOFFICE_PATH`、`PDFTOPPM_PATH`。路径含空格时用引号包裹。每轮必须使用新输出目录，防止把旧截图当作新结果。渲染用临时 LibreOffice profile，不占用用户日常配置。

默认 150 DPI，可通过 `--dpi` 指定 72–600。输出 PDF、每页 PNG、`contact-sheet.png` 和 `render.json`。脚本不会调用视觉模型；AI 接着必须通过宿主看图工具读取这些图片。

## 3. 无论文素材自测

```bash
node assets/smoke-build.js smoke.pptx
python scripts/bridge.py render smoke.pptx --out smoke-render-r01
```

让视觉模型实际查看输出全页图，检查中文、英文、符号、备注与可编辑文本。字体缺失时使用目标机和构建机都有的字体；自测可设置进程变量 `PAPER_PPT_TEST_FONT`，不要提交字体文件。

这只是工具链自测，不是论文质量验证。`assets/example-build.js` 为历史参考，含作者机器路径且不附原论文图片，不作为上述自测入口。

## 4. 审阅记录检查

实际执行各轮视觉调用后，依 [视觉协议](references/visual-review.md) 保存日志，再执行：

```bash
python scripts/check_review.py /path/to/renders/r01/render.json /path/to/review-log.json
```

检查结果只证明日志结构、版本和覆盖一致，不证明模型调用真实性，不是自动审美评分。主/子 Agent 必须给出真实观察和可追溯的调用引用。

## 5. OOXML 按需修复

不是所有 PptxGenJS 版本都会遇到重复段落属性。先检查实际输出，确实有问题才运行：

```bash
python assets/fix_pPr.py deck.pptx --out deck.fixed.pptx
```

原文件不覆盖。相同属性可去重；冲突属性拒绝猜测，返回绘制源修复。修复后重新渲染和看图。这个脚本不等于完整 OOXML 校验器，也不保证 PowerPoint 兼容。

## 6. 可选 MinerU 本地提取

宿主已有高质量 PDF 阅读能力或已有 Markdown 时，无需 MinerU。需要稳定的本地 Markdown 产物时，安装 MinerU 4.x 即可，**不需要额外论文库，也不需要常驻 API 服务**。

```bash
python -m pip install -U "mineru>=4.0,<5"
python ../paper-extract/scripts/mineru_models.py download --tier standard
python ../paper-extract/scripts/mineru_models.py verify --tier standard
python ../paper-extract/scripts/mineru_extract.py /path/to/paper.pdf
```

模型下载和文档解析是两步；解析脚本默认只使用已下载的本地模型。详细说明见 [paper-extract](../paper-extract/SKILL.md)。独立只安装 `paper-ppt` 时不会复制一份 MinerU 脚本，避免两套实现漂移；需要本地提取就同时安装 `paper-extract`。

## 7. 技术参考

- PptxGenJS 图片 API：https://gitbrent.github.io/PptxGenJS/docs/api-images/
- PptxGenJS 备注 API：https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/
- LibreOffice 命令行参数：https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html

上述是工具文档，不是论文事实依据。宿主工具接口以实际发现的版本为准。
