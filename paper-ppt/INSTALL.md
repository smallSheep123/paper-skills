# INSTALL：paper-ppt 安装指南

把 skill 文件夹放进 `<项目>/.agents/skills/` 或 `~/.agents/skills/` 后，AI 客户端（ZCode 等）
在新会话里即可自动发现。下面是它依赖的外部组件——**这些不在包里，需要按需自装**。

## 一、只在"生成 PPT"时需要（必装）

| 组件 | 用途 | 安装 |
| --- | --- | --- |
| Node.js ≥ 18 | 运行 pptxgenjs 生成脚本 | 官网/winget 安装 |
| pptxgenjs | 生成 .pptx | `npm install -g pptxgenjs` |
| LibreOffice | 把 pptx 渲染成 PDF/PNG 做视觉验收 | [清华镜像](https://mirrors.tuna.tsinghua.edu.cn/libreoffice/libreoffice/stable/) 下 win/x86_64 的 msi；无管理员权限可用管理员解包模式 `msiexec /a xxx.msi /qn TARGETDIR=D:\lo\`，运行 `lo\program\soffice.com`（**不是 soffice.exe**，GUI 进程会挂住） |
| pdftoppm（poppler） | PDF → PNG | `winget install poppler`，或装了 TeX Live 就已自带 |

## 二、只在"论文提取入库"时需要（可选；做 PPT 前需要先把论文转成 md+图）

| 组件 | 用途 | 安装 |
| --- | --- | --- |
| Python 3.10 环境 | MinerU / paper-mcp 运行环境 | conda 或 venv 均可，如 `conda create -n paper-mcp python=3.10` |
| MinerU | PDF 解析引擎（**首次运行自动下载数 GB 模型**，国内加速：先 `set MINERU_MODEL_SOURCE=modelscope`，或用 `mineru-models-download` 预下载） | `uv pip install -U "mineru[all]"`；有 NVIDIA 显卡可先装 CUDA 版 torch 更快，纯 CPU 也能跑 |
| paper-mcp | 论文库（SQLite 去重/检索/打标签）+ MCP 接口 | `git clone` 后 `pip install -e .`；是本项目作者的仓库，朋友也可自己实现同等接口 |
| MCP 客户端配置 | 让 AI 客户端发现 paper-mcp 工具 | 见下方 json |

MCP 配置示例（ZCode：`~/.zcode/cli/config.json`；Claude Desktop 等类似）：

```json
{
  "mcp": {
    "servers": {
      "paper-mcp": {
        "command": "<paper-mcp 环境的 python.exe 绝对路径>",
        "args": ["-m", "paper_mcp"],
        "env": { "PAPER_MCP_CONFIG": "<config.yaml 绝对路径>" }
      }
    }
  }
}
```

MinerU 常驻服务（可选，避免每次提取冷启动）：

```bash
"<paper-mcp 环境>/Scripts/mineru-api.exe" --host 127.0.0.1 --port 8000
```

## 三、代理环境（Clash 等）注意

系统代理若不排除回环地址，访问 `127.0.0.1:8000` 的健康检查会被拦成 502。
本包 `scripts/extract_offline.py` 只在进程内注入 `NO_PROXY=localhost,127.0.0.1` 绕开，**不改系统配置**。
手检服务是否存活时务必加 `--noproxy "*"`。

## 四、随包自带 / 不随包

- **随包上传**：SKILL.md、references/（结构与排版规则）、assets/（ppt-helpers.js、fix_pPr.py、example-build.js 完整示例）、scripts/（提取兜底脚本）。
- **不随包、需自装**：上表所有组件；MinerU 模型（数 GB，首次运行自动下）；论文库数据。
- **字体**：微软雅黑、Arial 为 Windows 自带，无需安装。

## 五、装完自测

1. `NODE_PATH=$(npm root -g) node assets/ppt-helpers.js` —— 生成 deck.pptx 即 OK（删掉即可）。
2. `"…/soffice.com" --headless --convert-to pdf deck.pptx` —— 出 PDF 即渲染链路 OK。
3. （可选）对任意 PDF 跑 `scripts/extract_offline.py <pdf>` —— 出 markdown 即提取链路 OK。
