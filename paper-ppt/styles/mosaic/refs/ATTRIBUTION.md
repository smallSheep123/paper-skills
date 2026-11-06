# refs/ — mosaic 蒸馏来源截图

以下 4 张是公开 PDF 页面的低分辨率渲染截图，仅作风格观察证据，版权归原作者所有。原 PDF 不在本仓库内，只保留这些截图。

| 文件 | 看到的特征 | 原页面 |
|---|---|---|
| `mosaic-01.png` | vibrant 色板：青绿 `#0C9487` + 品红 `#BE175C` | `sci-gallery.pdf` p7 |
| `mosaic-02.png` | `cards` 布局：浅灰卡片网格 | 同上 |
| `mosaic-03.png` | `callouts`：四色浅底 + 左侧竖条 | 同上 |
| `mosaic-04.png` | ACL 2025 示例：彩色高亮 callout 与满版分区页 | `acl25.pdf` |

## 来源

| 来源 | URL | 类型 | 取得 |
|---|---|---|---|
| `sci-brain-slides 0.1.0` gallery（Typst Universe 包示例，MIT，2026-09-10 发布） | `https://raw.githubusercontent.com/typst/packages/main/packages/preview/sci-brain-slides/0.1.0/docs/gallery.pdf` | Typst 示例 PDF | 2026-11-04 |
| `touying-unistra-pristine` ACL 2025 示例 | `https://raw.githubusercontent.com/spidersouris/touying-unistra-pristine/main/examples/acl25.pdf` | 真实会议 talk PDF，2025 | 2026-11-04 |
| 包主页（确认发布日期、主题清单与许可证） | `https://typst.app/universe/package/sci-brain-slides` | 文档页 | 2026-11-04 |

## 安全检查

只接受 PDF：落地后校验前 5 字节为 `%PDF-`、文件大小与页数可解析，再用 PyMuPDF 离线渲染成 PNG 才看图。全程没有下载或执行 `.pptx` / 宏 / 压缩包 / 可执行文件。

| 文件 | 大小 | 魔数 | 页数 | 判定 |
|---|---:|---|---:|---|
| `sci-gallery.pdf` | 183,540 B | `%PDF-` | 44 | 通过 |
| `acl25.pdf` | 1,090,754 B | `%PDF-` | 31 | 通过（只取 callout 与分区页语言） |

## 色值采样（`sci-gallery.pdf` p7）

| 实测 | 落到 token |
|---|---|
| `#0C9487` 青绿 | `primary`（卡片顶边、表头、满版章节页） |
| `#BE175C` 品红 | `accent`（只给结论与本文方案） |
| 四色浅底 | `calloutContext` / `calloutVerified` / `calloutLimit` / `calloutTakeaway` |

## 使用边界

只提取风格特征（版式骨架、栅格、配色语义、字体层级），不复制原文、图件、校徽或模板源码；截图只说明「这个特征从哪看出来」。样稿里的论文 SPARQ、作者与全部数字均为**虚构占位内容**，不对应任何真实论文，也不来自上述来源。
