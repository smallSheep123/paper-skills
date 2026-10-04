---
name: paper-extract
description: 论文/文档提取为 Markdown 并入库（paper-mcp + MinerU）的可靠用法与故障自愈。当用户要"把 PDF/论文转成 md、提取入库、查论文库、按章节取内容、给论文打标签"，或 paper-mcp 工具报 502 / "Failed to query MinerU API health" / "mineru 退出码 1" 时使用。系统开着代理（Clash 等）的环境下尤其要看。
---

# paper-extract：论文提取入库与代理故障自愈

用户的论文库基于 paper-mcp（MinerU 提取 + SQLite 论文库 + MCP 接口）。
本 skill 教你：正常怎么用、服务没起怎么拉、被代理拦了怎么绕。**不修改任何系统配置。**

## 关键背景（为什么会被代理拦）

用户系统常设 `http_proxy=http://127.0.0.1:7897`（Clash）且无 `NO_PROXY`。
Clash 会拒绝回环目标：任何进程若带着这个代理变量去访问 `127.0.0.1:8000`，会得到 502。
这就是 `Failed to query MinerU API health from http://127.0.0.1:8000: 502 Bad Gateway` 的来源——
**不是 MinerU 服务坏了，是请求被代理劫持了。**

**已有修复（2026-09）**：paper_mcp 源码加了开关 `extract.localhost_bypass_proxy`（config.yaml，默认 `true`），
mineru 子进程会把 localhost 注入自己的 NO_PROXY，不再被代理拦截。新起的 MCP 进程（ZCode / Claude Desktop / opencode 等）
都自动免疫。兜底脚本只在两种情况下还需要：① MCP 进程还是修复前启动的老进程；② 有人把开关设成了 `false`。

## 正常路径（优先）

直接调 MCP 工具：

- `mcp__paper-mcp__extract_pdf(path)`：提取入库，命中哈希缓存秒回。>20 页建议 `async_mode=true`，用 `get_job` 轮询，`done` 后 `get_paper` 取内容。
- `extract_to_markdown(path, save_dir)`：只出 markdown 不入库。
- `get_paper(paper_id, section?)` / `search_library(query)` / `set_paper_tags(paper_id, tags)`。

提取成功后读返回的 `abstract`，给论文打小写标签（如 `moe,scheduling`）。
`set_paper_tags` 不依赖 MinerU，服务挂了也能用。

## 第一步：确认 MinerU 常驻服务在跑

paper-mcp 依赖本地 MinerU 服务（127.0.0.1:8000）。**检查时必须绕开代理**：

```bash
curl -s -o /dev/null -w "%{http_code}" --noproxy "*" http://127.0.0.1:8000/docs
```

- `200`：服务正常，直接调 MCP 工具。若仍报 502，走下面的兜底脚本。
- 连接失败：服务没起。用 run_in_background 启动（约 5 秒后 /docs 返回 200；模型在首次提取时加载，首次提取约 1–3 分钟）：

```bash
"D:/Programming/Python/envs/paper-mcp/Scripts/mineru-api.exe" --host 127.0.0.1 --port 8000
```

（开机自启可让用户双击 `D:\Learning\paper知识库\project\tool\scripts\mineru-api.bat`。）

## 兜底脚本（MCP 工具仍报 502 时用）

适用场景：MCP 进程是修复前启动的老进程、`localhost_bypass_proxy` 被关了、或换了别的环境。
脚本只在**自身进程内**注入 `NO_PROXY=localhost,127.0.0.1`，不改系统、不改配置，退出即失效。

```bash
"D:/Programming/Python/envs/paper-mcp/python.exe" \
  "C:/Users/steve/.agents/skills/paper-extract/scripts/extract_offline.py" \
  "D:/path/to/paper.pdf" [--force] [--no-lib] [--no-copy]
```

- 默认行为：提取 + 入库 + 把 md 拷贝为源文件同名的 `.md`。
- 输出为一行 JSON：`paper_id`、`title`、`lib_md`（库内 md 绝对路径）、`copied_md`、`abstract`。
- 大文件（>20 页）耗时 2–3 分钟，bash 加大 timeout 或放后台跑。

## 位置速查

| 项 | 路径 |
| --- | --- |
| MCP 服务端 | `D:\Programming\Python\envs\paper-mcp\python.exe -m paper_mcp` |
| 配置 | `D:\Learning\paper知识库\project\tool\config.yaml`（环境变量 `PAPER_MCP_CONFIG` 指向它） |
| 论文库数据 | `D:\Learning\paper知识库\project\tool\data`（SQLite + 提取产物） |
| MinerU 启动脚本 | `D:\Learning\paper知识库\project\tool\scripts\mineru-api.bat` |
| 兜底脚本 | 本 skill 的 `scripts/extract_offline.py` |

## 禁止事项

- 不要修改用户系统环境变量或 Clash 配置（用户明确拒绝过）。源码只保留已批准的最小改动：
  `extract.localhost_bypass_proxy` 开关（config.py / mineru_cli.py / 两份 yaml），不要再扩大源码改动面。
- 不要在检查/访问 127.0.0.1 服务时省略 `--noproxy "*"`。
- 不要重复提取：先调 `extract_pdf`（哈希去重），确认失败再考虑 `--force`。
