# paper-skills：论文提取入库 + 视觉 AI 学术 PPT 工作流

两个配套的 ZCode skill（也可用于其他支持 `.agents/skills/` 的 AI 客户端）：

| Skill | 作用 | 触发说法 |
| --- | --- | --- |
| [`paper-extract/`](paper-extract/) | 论文/文档 PDF → Markdown，存入本地论文库（去重、检索、打标签）；含代理环境（Clash）故障自愈 | "把这篇论文转成 md / 提取入库 / 查论文库" |
| [`paper-ppt/`](paper-ppt/) | 论文 → 学术汇报 PPT：视觉 AI 参与选图、构图、双风格设计、试制、逐页验收；代码只负责精确落地和工具连接 | "把这篇论文做成组会 PPT / 汇报 slides" |

## paper-ppt 的两套视觉风格

- **Academic Clean**：学术简约 / Paper-faithful。排版简练、字体标准、论文图和论文内容优先，适合组会、答辩、论文精读。
- **Academic Rich**：学术丰富 / Conference-editorial。更强调页面节奏、非对称构图、注释与视觉叙事，适合课程分享和公开技术演讲。

两套风格都遵循同一条底线：**不为了好看改变论文事实，不把学术 PPT 做成 AI 卡片模板。**

参考原则不是凭空写的，`paper-ppt/references/academic-slide-distillation.md` 蒸馏了 MIT Communication Lab、Nature、NeurIPS 以及真实研究演讲 deck 的设计规律。

## 工作流

```
论文提取
→ 论文图视觉目检
→ 内容真值表
→ 选择 Clean / Rich
→ 视觉 AI style brief
→ 逐页 storyboard
→ 2 页试制 + 视觉审核
→ pptxgenjs 精确落地
→ 渲染
→ 视觉 AI 逐页验收
→ 修订与交付
```

这里的 pptxgenjs / Python **不是自动设计器**。它们只负责把 AI 已经做出的视觉决策可靠写进 PPTX、渲染、裁图、修复和导出。

## 分享 / 上传到 GitHub

**随包上传**：

```
paper-extract/            # 可独立分享
paper-ppt/                # 可独立分享
```

完整生成示例见 `paper-ppt/assets/example-build.js`，但它只是代码落地参考，不是固定模板。

**朋友需要自己安装**（见 [paper-ppt/INSTALL.md](paper-ppt/INSTALL.md)）：
Node.js + pptxgenjs、LibreOffice + pdftoppm；
只用提取功能时另需 Python + MinerU + paper-mcp。

## 安装 skill 本体

把文件夹复制到以下任一位置即可被发现：

- `<项目>/.agents/skills/`（项目级）
- `~/.agents/skills/`（用户级，所有项目可用）

## 需要按自己环境修改的硬编码路径

- `paper-extract`：`scripts/extract_offline.py` 里的 `PAPER_MCP_CONFIG` 默认值、SKILL.md 中的论文库 / MinerU 路径。
- `paper-ppt`：SKILL.md 中的工作目录根、LibreOffice 路径，`scripts/extract_offline.py` 同上。
