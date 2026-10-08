# 字体清单：每套风格要装什么字体

> 字体决定一套风格 60% 的观感。每套预设在 `styles/<preset>/tokens.json` 的 `fonts` 里按优先级列了首选与回退字体；
> 本页说明**每个字体从哪来、能不能免费用、没有时用什么替换**。
> 检查本机缺哪些：`python scripts/check_fonts.py <preset>`（不带参数检查全部）。

## 0. 仓库自带的字体与“开源字体轨”

**西文开源字体已放在 `fonts/`**（约 8 MB，每个目录带授权文件）；**中日文字体**每个 10–25 MB，用脚本从 google/fonts 固定版本下载并校验 SHA-256：

```bash
python scripts/get_fonts.py --install    # 下载中日文 + 安装全部开源字体到当前用户
python scripts/get_fonts.py --list       # 看自带了哪些、哪些待下载
python scripts/check_fonts.py --track open
```

| 目录 | 字体 | 替代谁 | 授权 |
|---|---|---|---|
| `fonts/arimo` | Arimo | Arial（**等宽度**，换行不变） | OFL 1.1 |
| `fonts/carlito` | Carlito | Calibri（等宽度） | OFL 1.1 |
| `fonts/inter` | Inter | Helvetica Neue / Segoe UI | OFL 1.1 |
| `fonts/jetbrains-mono` | JetBrains Mono | Consolas / Menlo | OFL 1.1 |
| `fonts/fira-sans`、`fonts/fira-mono` | Fira Sans / Fira Mono | （theory-beamer 原本就用） | OFL 1.1 |
| `fonts/stix-two-math` | STIX Two Math | Cambria Math | OFL 1.1 |
| `fonts/tex-gyre-pagella` | TeX Gyre Pagella | Palatino Linotype | GUST Font License |
| `fonts/cjk/`（下载） | Noto Sans SC / Noto Serif SC / Noto Sans JP | 微软雅黑·苹方 / 宋体·思源宋体 / ヒラギノ | OFL 1.1 |

**开源字体轨**：每套预设的 `tokens.json` 里有 `fonts.open`，生成时设 `PAPER_PPT_FONTS=open`（或 `loadTokens(name, {fontTrack: 'open'})`）就全部换成上表字体。好处是**任何电脑渲染都一样**，且字体可以随 PPTX 一起发给别人。

| 预设 | 开源字体轨（西文 / 中日文 / 等宽） |
|---|---|
| domestic、international、systems-talk、defense-cn | Arimo / Noto Sans SC / JetBrains Mono |
| keynote-minimal、dark-tech | Inter / Noto Sans SC / JetBrains Mono |
| theory-beamer | Fira Sans / Noto Sans SC / Fira Mono，公式 STIX Two Math |
| editorial | TeX Gyre Pagella / Noto Serif SC / JetBrains Mono |
| jp-gothic | Noto Sans JP / Noto Sans JP / JetBrains Mono |

注意：Google Fonts 提供的部分字体是可变字体（文件名带 `[wght]`），PowerPoint 能显示，但嵌入时只保证常规和粗体；要嵌入请在目标机器上测试一次。TeX Gyre Pagella 是 OTF（CFF 轮廓），PowerPoint 不能嵌入，放映机需安装。

## 1. 先决定：在哪台电脑上放映？

开工前访谈会问这一条（见 SKILL.md §0）。答案决定字体策略：

| 放映环境 | 策略 |
|---|---|
| 自己的电脑，且已装好字体 | 按预设首选字体 |
| 会场 / 教室 / 别人的 Windows 电脑 | 用**安全字体组**（§3）；或用开源字体轨（§0）并嵌入字体，在目标机打开检查 |
| Mac 上做、Windows 上放（或反过来） | 选两边都有的字体，或嵌入字体；PingFang / Helvetica Neue 在 Windows 上没有 |
| 只交 PDF | 任意字体，导出 PDF 时字体自动嵌入 |

**嵌入字体**：Windows PowerPoint → 文件 → 选项 → 保存 → “将字体嵌入文件”（选“嵌入所有字符”更稳）；Mac PowerPoint 16.17+ 在 偏好设置 → 保存 中开启。只有允许嵌入的 TrueType 字体能嵌入，部分 OTF（CFF 轮廓）和商业字体不能。

## 2. 每套风格的字体

“首选”是设计时依据的字体；“回退”按顺序尝试；“开源替代”可免费下载、可随项目分发。

| 风格 | 标题 / 正文（西文） | 中文 | 等宽 | 开源替代（西文 / 中文） |
|---|---|---|---|---|
| `domestic` | Arial → Helvetica | 微软雅黑 → 苹方 → 思源黑体 → Noto Sans SC | Consolas → Menlo | Liberation Sans / 思源黑体 |
| `international` | Arial → Helvetica → Calibri | 微软雅黑 → 苹方 → 思源黑体 | Consolas → Menlo | Liberation Sans / 思源黑体 |
| `keynote-minimal` | Helvetica Neue → Arial | 苹方 → 微软雅黑 → Noto Sans SC | Menlo → Consolas | Inter 或 Nimbus Sans / 思源黑体 |
| `systems-talk` | Arial → Helvetica | 微软雅黑 → 苹方 → Noto Sans SC | Consolas → Menlo | Liberation Sans / 思源黑体 |
| `theory-beamer` | Fira Sans → Calibri；公式 Cambria Math | 思源黑体 → 微软雅黑 | Fira Mono → Consolas | Fira Sans（本身开源）/ 思源黑体；公式可用 STIX Two Math |
| `dark-tech` | Inter → Segoe UI → Arial | 苹方 → 微软雅黑 → Noto Sans SC | JetBrains Mono → Consolas | Inter、JetBrains Mono（本身开源）/ 思源黑体 |
| `editorial` | Palatino Linotype → Book Antiqua → Georgia | 思源宋体 → 宋体 → Noto Serif SC | Menlo → Consolas | TeX Gyre Pagella 或 P052 / 思源宋体 |
| `defense-cn` | Arial | 微软雅黑 → 苹方 → Noto Sans SC | Consolas | Liberation Sans / 思源黑体 |
| `jp-gothic` | Noto Sans JP → Hiragino Sans → Meiryo | Noto Sans JP → ヒラギノ角ゴ → 游ゴシック | Consolas | Noto Sans JP（本身开源） |

## 3. 安全字体组（去陌生电脑放映时用）

Windows + Office 自带、几乎所有会场电脑都有：

- 西文无衬线：**Arial**；西文衬线：**Georgia** 或 **Times New Roman**
- 中文：**微软雅黑**（标题/正文）、**宋体**（衬线风格）
- 日文：**Meiryo** / **Yu Gothic**
- 等宽：**Consolas**；公式：**Cambria Math**

把预设换成安全字体组时，只改 `tokens.json` 的 `fonts`（或让 AI 在 `design-brief.md` 记录替换），不改字号和网格；换完重新渲染检查换行。
Inter → Arial、Helvetica Neue → Arial、Fira Sans → Calibri、Palatino → Georgia 后字宽会变，标题可能多折一行。

## 4. 字体来源与授权

| 字体 | 来源 | 授权 / 说明 |
|---|---|---|
| Arial、Calibri、Consolas、Georgia、Segoe UI、Cambria Math、Palatino Linotype、Book Antiqua | Windows / Microsoft Office 自带 | 商业字体，随系统使用，**不要放进仓库分发** |
| 微软雅黑、宋体、Meiryo、游ゴシック | Windows 自带 | 同上 |
| Helvetica、Helvetica Neue、苹方 PingFang SC、ヒラギノ角ゴ Hiragino Sans、Menlo | macOS 自带 | 同上；Windows 上没有 |
| 思源黑体 / 思源宋体 Source Han Sans / Serif | github.com/adobe-fonts/source-han-sans · source-han-serif | SIL OFL 1.1，可免费商用与分发 |
| Noto Sans SC / Noto Serif SC / Noto Sans JP | fonts.google.com/noto | SIL OFL 1.1；与思源同源 |
| Inter | github.com/rsms/inter | SIL OFL 1.1 |
| JetBrains Mono | github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 |
| Fira Sans / Fira Mono | github.com/mozilla/Fira 或 Google Fonts | SIL OFL 1.1 |
| Liberation Sans | github.com/liberationfonts | SIL OFL 1.1；与 Arial **等宽度**，换行不变 |
| Carlito | Google Fonts / 多数 Linux 发行版 | SIL OFL 1.1；与 Calibri 等宽度 |
| TeX Gyre Pagella、P052、Nimbus Sans | TeX 发行版 / Ghostscript（URW base35） | GUST / AGPL 含字体例外；Palatino、Helvetica 的开源近似 |
| STIX Two Math | github.com/stipub/stixfonts | SIL OFL 1.1 |

安装后需要重启 PowerPoint 才能识别新字体。Linux 渲染预览（LibreOffice / svg_preview）读取 fontconfig，安装到 `~/.fonts/` 后运行 `fc-cache -f`。

## 5. AI 的字体规则

- 访谈时问清放映环境；答不上来就默认“会场 Windows 电脑”，使用安全字体组或嵌入字体。
- 需要跨机器一致、或交付给多人修改时，优先开源字体轨，并在交付说明里附 `get_fonts.py --install`。
- 运行 `check_fonts.py`，缺少首选字体时在 `design-brief.md` 写明实际使用的字体，渲染预览也用同一字体。
- `qa-summary.md` 写明：使用的字体、是否嵌入、是否在目标环境打开验证。没验证就写“未验证”。
- 不要把商业字体文件放进交付物或仓库。
