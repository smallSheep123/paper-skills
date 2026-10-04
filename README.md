# paper-skills：论文提取入库 + 组会汇报 PPT 工作流

两个配套的 ZCode skill（也可用于其他支持 `.agents/skills/` 的 AI 客户端）：

| Skill | 作用 | 触发说法 |
| --- | --- | --- |
| [`paper-extract/`](paper-extract/) | 论文/文档 PDF → Markdown，存入本地论文库（去重、检索、打标签）；含代理环境（Clash）故障自愈 | "把这篇论文转成 md / 提取入库 / 查论文库" |
| [`paper-ppt/`](paper-ppt/) | 论文 → 学术组会汇报 PPT（提取 → 定图 → 逐页规划 → pptxgenjs 生成 → 渲染 → 视觉验收），每页带演讲备注 | "把这篇论文做成组会 PPT / 汇报 slides" |

## 分享 / 上传到 GitHub

**随包上传**（就是这些文件，无其他依赖）：

```
paper-extract/            # 可独立分享
paper-ppt/                # 可独立分享；完整示例见 paper-ppt/assets/example-build.js
```

**朋友需要自己安装**（见 [paper-ppt/INSTALL.md](paper-ppt/INSTALL.md) 有完整步骤）：
Node.js + pptxgenjs、LibreOffice + pdftoppm（渲染验收用）、
以及只用提取功能时：Python 环境 + MinerU（首次运行自动下载数 GB 模型）+ paper-mcp。

## 安装 skill 本体

把文件夹复制到以下任一位置即可被发现：

- `<项目>/.agents/skills/`（项目级）
- `~/.agents/skills/`（用户级，所有项目可用）

## 需要按自己环境修改的硬编码路径

skill 内为了开箱即用写死了作者机器的路径，分享后按需改：

- `paper-extract`：`scripts/extract_offline.py` 里的 `PAPER_MCP_CONFIG` 默认值、
  SKILL.md「位置速查」表中的论文库目录 / mineru-api 启动路径。
- `paper-ppt`：SKILL.md 中的工作目录根（`D:\AIGC`）、LibreOffice 路径、
  `scripts/extract_offline.py` 同上。
