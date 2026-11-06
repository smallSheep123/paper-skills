# refs/ — folio 蒸馏来源截图

以下 4 张是公开 PDF 页面的低分辨率渲染截图，仅作风格观察证据，版权归原作者所有。原 PDF 不在本仓库内，只保留这些截图。

| 文件 | 看到的特征 | 原页面 |
|---|---|---|
| `folio-01.png` | 封面：超大留白 + 靛蓝标题 + 短紫线 | `sci-starter.pdf` p1 |
| `folio-02.png` | 双栏公式页：细线、稀疏、无框 | `sci-gallery.pdf` |
| `folio-03.png` | 数据页：横向条形 + 浅灰卡片 | 同上 |
| `folio-04.png` | 结论页：满版靛蓝 `#2F2F7E` | 同上 |

## 来源

| 来源 | URL | 类型 | 取得 |
|---|---|---|---|
| `sci-brain-slides 0.1.0` starter（Typst Universe 包示例，MIT，2026-09-10 发布） | `https://raw.githubusercontent.com/typst/packages/main/packages/preview/sci-brain-slides/0.1.0/docs/starter.pdf` | Typst 示例 PDF | 2026-11-04 |
| 同包 gallery（44 页，5 主题 + 9 布局） | `https://raw.githubusercontent.com/typst/packages/main/packages/preview/sci-brain-slides/0.1.0/docs/gallery.pdf` | 同上 | 2026-11-04 |
| `touying-unistra-pristine` ACL 2025 示例 | `https://raw.githubusercontent.com/spidersouris/touying-unistra-pristine/main/examples/acl25.pdf` | 真实会议 talk PDF，2025 | 2026-11-04 |
| 包主页（确认发布日期、主题清单与许可证） | `https://typst.app/universe/package/sci-brain-slides` | 文档页 | 2026-11-04 |

## 安全检查

只接受 PDF：落地后校验前 5 字节为 `%PDF-`、文件大小与页数可解析，再用 PyMuPDF 离线渲染成 PNG 才看图。全程没有下载或执行 `.pptx` / 宏 / 压缩包 / 可执行文件。

| 文件 | 大小 | 魔数 | 页数 | 判定 |
|---|---:|---|---:|---|
| `sci-starter.pdf` | 48,517 B | `%PDF-` | 6 | 通过 |
| `sci-gallery.pdf` | 183,540 B | `%PDF-` | 44 | 通过 |
| `acl25.pdf` | 1,090,754 B | `%PDF-` | 31 | 通过（交叉验证，未整套采用） |

## 色值采样

| 页面 | 实测 | 落到 token |
|---|---|---|
| `sci-gallery` p4 | `#2F2F7E` 靛蓝 | `primary` |
| `sci-starter` p1 | `#222276` 封面标题色 | `primaryDark` |
| `sci-gallery` p4 | `#7C5FDB` 薰衣草紫 | `accent`（全稿唯一强调） |
| `sci-starter` p5 | `#F1F2F5` 浅灰卡片面 | `frame` |

字号实测（`sci-starter.pdf`，Typst 逻辑页）：正文 15.4pt、标题 26.4pt、大标题 39.6pt；本套按比例放大到 16:9 宽屏，层级比例不变。

## 使用边界

只提取风格特征（版式骨架、栅格、配色语义、字体层级），不复制原文、图件、校徽或模板源码；截图只说明「这个特征从哪看出来」。样稿里的论文 SPARQ、作者与全部数字均为**虚构占位内容**，不对应任何真实论文，也不来自上述来源。
