# refs/ — nocturne 蒸馏来源截图

以下 4 张是公开 PDF 页面的低分辨率渲染截图，仅作风格观察证据，版权归原作者所有。原 PDF 不在本仓库内，只保留这些截图。

| 文件 | 看到的特征 | 原页面 |
|---|---|---|
| `nocturne-01.png` | dark 色板：石板 `#1A2137` + 暖金 `#C7A139` | `sci-gallery.pdf` p5 |
| `nocturne-02.png` | 满版深色结论页 | 同上 |
| `nocturne-03.png` | academic 色板（配色对照） | 同上 |
| `nocturne-04.png` | Neversink 深色 intro 页（交叉验证现代深色语言） | `slidev-theme-neversink` 文档截图 |

## 来源

| 来源 | URL | 类型 | 取得 |
|---|---|---|---|
| `sci-brain-slides 0.1.0` gallery（Typst Universe 包示例，MIT，2026-09-10 发布） | `https://raw.githubusercontent.com/typst/packages/main/packages/preview/sci-brain-slides/0.1.0/docs/gallery.pdf` | Typst 示例 PDF | 2026-11-04 |
| `gureckis/slidev-theme-neversink` 文档截图 | `https://raw.githubusercontent.com/gureckis/slidev-theme-neversink/main/docs/public/screenshots/` | Slidev 主题截图 PNG，2024–2026 | 2026-11-04 |
| 包主页（确认发布日期、主题清单与许可证） | `https://typst.app/universe/package/sci-brain-slides` | 文档页 | 2026-11-04 |

## 安全检查

只接受 PDF：落地后校验前 5 字节为 `%PDF-`、文件大小与页数可解析，再用 PyMuPDF 离线渲染成 PNG 才看图。全程没有下载或执行 `.pptx` / 宏 / 压缩包 / 可执行文件。

| 文件 | 大小 | 魔数 | 页数 | 判定 |
|---|---:|---|---:|---|
| `sci-gallery.pdf` | 183,540 B | `%PDF-` | 44 | 通过 |
| Neversink `1–12.png` | 27–159 KB | PNG 签名 `\x89PNG` | — | 通过（Pillow 逐张打开） |

## 色值采样（`sci-gallery.pdf` p5）

| 实测 | 落到 token |
|---|---|
| `#1A2137` 石板底（占该页 32.6%） | `bg` |
| `#C7A139` 暖金 | `accent`（全稿唯一强调） |
| `#7B9CEF` 淡蓝 | `cool` 次级数据 |

标题用 `#E7ECFE` 而非纯白、正文 `#CBD3E8`：纯白在深底上眩光明显。

## 使用边界

只提取风格特征（版式骨架、栅格、配色语义、字体层级），不复制原文、图件、校徽或模板源码；截图只说明「这个特征从哪看出来」。样稿里的论文 SPARQ、作者与全部数字均为**虚构占位内容**，不对应任何真实论文，也不来自上述来源。
