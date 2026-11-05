# 分支说明：style lint + domestic 原型扩展

> 分支 `feat/style-lint-and-archetypes`。目的：把「AI 做出来的片子到底好不好看」从靠眼睛，变成一部分可测的规则；
> 并把这次手工搭的 4 类页面固化成原型，减少下次从零排版。
> 这份文档是给第二位评审者看的：先看结论和对比图，再看我自认为没做好的地方，最后是我希望你判断的问题。
> **状态更新见第 8 节**：审阅结论已落地，lint / CI 已进 main，四个原型留在本分支继续改。

## 1. 这次改了什么

| 文件 | 改动 | 为什么 |
|---|---|---|
| `paper-ppt/scripts/lint_style.py` | 新增。读 PPTX 的 XML，估文字是否溢出、红词是否超量、红字是否连续过长、行首是否有标点、图号是否重号/跳号 | `check_deck.py` 只查几何与结构，文字撑破框这件事完全没人管 |
| `paper-ppt/assets/style-presets.js` | domestic 新增 `compare3 / twoFigures / metricGrid / formulaTable`；`section` 支持 `keys`；`summary` 支持 `limits` 两栏或三栏 + `takeaway/closing` | 真实论文页一半以上是复合版式，原来 7 个原型接不上，只能手写 |
| `tests/test_tools.py` | 新增 `StyleLintTests`（15 例） | 规则要能被回归，不能加完就漂 |
| `tests/test_archetypes.py` | 新增。依次构建 6 个 domestic 原型，断言 `[[...]]` 变成真实 `C00000` run | `build-style-samples` 不调用复合原型，「9 个预设都能构建」证明不了它们能用 |
| `.github/workflows/tests.yml` | 新增 CI：`unittest discover` | README 的命令曾经是红的没人发现 |
| `docs/review/*.png` | 对比图与原型实拍 | 便于评审直接看，不用自己跑 |

## 2. 怎么验证的

```bash
# 单元测试：干净工作树 72 个通过（2 个因缺可选数学依赖跳过）
cd paper-skills && python -m unittest discover -s tests

# 规则在真片上跑
python paper-ppt/scripts/lint_style.py ../output/deck-domestic.pptx
# 第一次：12 条。按提示改了三处文案后：3 条（都是 29–30 字的要点，略超 28 字上限）
#   12 -> p13 红色连续 10 汉字「保证任何情况下都能看」/ p17 7 字 / p19 7 字
#    3 -> 只剩三条「bullet 29 字 > 28」，属于作者判断，不强行改

# 原型在真内容上跑（同一篇 HyperEdge，同一批图）
node docs/review/gallery.js && python paper-ppt/scripts/bridge.py render docs/review/gallery.pptx --out renders/gal
```

对比图：`docs/review/archetypes-before-after.png`（左＝手写图元，右＝新原型重排同一内容，红词同样用 `[[...]]` 标注）。

逐页：

| 页 | 原型 | 文件 |
|---|---|---|
| 章节页 + 本节看点 | `section` + `keys` | `docs/review/archetype-2.png` |
| 三方案对比 | `compare3` | `docs/review/archetype-2.png` |
| 并排双图 | `twoFigures` | `docs/review/archetype-3.png` |
| 2×2 指标 | `metricGrid` | `docs/review/archetype-4.png` |
| 公式 + 成本表 | `formulaTable` | `docs/review/archetype-5.png` |
| 总结（结论/边界） | `summary` + `takeaway` | `docs/review/archetype-6.png` |

## 3. 规则清单（lint_style）

| 规则 | 触发条件 | 为什么是这条 |
|---|---|---|
| 文字溢出 | 3–15% 为 warn；>15% 为 `overflow_hard`（error） | 最伤观感的一类错误，且完全可估 |
| 每条红词数 | > `limits.keywordsPerBullet`（按**连续红 run** 计数，不看颜色集合） | 一条里两个红词＝都没红 |
| 红字连续长度 | > 6 个汉字（相邻红 run 先合并再数）；形状名为 `nav:*` 的导航项整段强调色视为状态色，豁免 | domestic STYLE.md 明写「红色不连续超过 6 个字」；目录高亮当前章是状态不是强调 |
| 行首标点 | 段落或 `<a:br/>` 段以 `，。；` 开头 | 中文排版硬伤，手工断行时最容易踩 |
| 每条长度 | 中文列表框内 > `limits.charsPerBulletZh`；英文 > `limits.linesPerBulletEn`（默认 2，按实际框宽量行数） | 中文与 STYLE.md 的 28 字对齐；英文没有等价字数，同一句在窄栏与通栏行数不同 |
| 图号 | 重号（error）/ 跳号（整稿 ≥8 个图注才提示） | 图注靠手打，编号错没人拦 |

溢出是**估算**（CJK 1 em、ASCII ≈0.5 em），只报 3% 以上的可疑项，不和像素较劲。
每条规则单独定级（见 `SEVERITY`）：`overflow_hard` / `figure_duplicate` / `leading_punct` 为 error，
其余为 warn；`--strict` 只把 warn 提升为 error，不再一刀切。**「大数字唯一」已删除**（与 `check_deck` 重复，且误伤分节页）。

## 4. 我自认为还不够好的地方（请重点看这几处）

1. **`compare3` 的纵向留白偏大**：图带 2.5″ + 两行文字之后，到收束条之间还有约 1″ 空。手写版靠「文字三行」填满，原型只给两行；收束条仍钉在页面底部，没有做成流式排布。
2. **`metricGrid` 的图比手写版小**：图宽压到半栏（≈2.9″），箱线图在这种尺寸下坐标轴标签偏小。审阅建议改成图 60% / 文字 40%，**这轮没有改**（见第 7 节）。
3. **`summary` 两栏下方仍空**：加了 `takeaway` 深色条后底部才立住；不加时 4″ 以下全空。
4. **`twoFigures` 的两张图宽度不等**（等高原则的必然结果），右图比左图窄 1″ 左右，也没有把「等高」登记成可断言的约束。
5. **溢出估算对中英混排仍有 ±10% 误差**：一段里字号不一时按最大字号估，只能当提示，不能当判据。
6. **lint 不查自动换行**：行首标点只在「手工断行」和「段落开头」能查到；PowerPoint 自己换行把标点甩到行首的查不到，必须靠渲染后看图。
7. **lint 只遍历 `p:sp`，表格里的字完全不查**：`formulaTable` 的成本表因此不受字数/红词规则约束。审阅者也指出了这一条，这轮没动。

## 5. 想请你判断的问题

**审美**
- `compare3` 里「图带 + 三栏文字 + 收束条」这个三段式，是不是比手写版的「三张小图 + 三栏 + 收束条」更清楚？还是更空？
- `metricGrid` 的「图 50% / 文字 50%」比例对不对？图再大一点、文字再窄一点，会不会更像实验页？
- 总结页用「结论 / 边界」两栏 + 深色收束条，是否比「结论 / 讨论 / 边界」三栏更适合国内组会？

**框架**
- 这四个原型够不够覆盖「论文汇报」的真实页型？下一步该补哪一个（相关工作对比？消融表？时间线？）。
- `section.keys` / `summary.limits` / `compare3.note` 这些可选字段，是不是把原型变成了「参数太多的模板」？有没有更克制的抽象。
- `lint_style.py` 的规则集里，哪条应该升级成 error（阻断交付），哪条其实该删掉（噪声大于价值）。

## 6. 复现

```bash
cd paper-skills
python -m unittest discover -s tests           # 72 passed, 2 skipped
python paper-ppt/scripts/lint_style.py <deck>  # 需要 zip + xml，无需 Office
node docs/review/gallery.js                    # 图在同目录 figs/；需要 pptxgenjs
python paper-ppt/scripts/bridge.py render docs/review/gallery.pptx --out renders/gal --dpi 130
```

---

## 7. 对第一轮审阅意见的回应

审阅提出的 5 个 lint bug **全部复现并修复**，另有 2 条我不完全同意，证据如下。

### 已确认并修复

| 问题 | 复现 | 修法 |
|---|---|---|
| 红词数规则是哑的（`colours` 是 set，最多算 1） | 一段里两个红词，0 告警 | 按 run 顺序数「连续红段」的个数，不再看颜色集合 |
| 红字长度按 run 算，被拆开就逃掉 | `4+4` 字拆成两个 run，不告警 | 相邻红 run 先合并再数汉字；`<a:br/>` 视为分隔 |
| 正文里的「如图 3 所示」被当成图注 | 两页都写，报重号+缺 1、2 | 只认「图/Figure/Fig/表/Table + 数字」开头**且**字号≤图注+2 或颜色为 muted 的段落 |
| 英文 `Figure 7` 不认 | 完全不进统计 | 与中文同一正则，`re.I` |
| 行首标点报两次 | 段首与第一个 br 段是同一字符 | 只检查 `segments[1:]` |
| 行距/段前距解析了但没用 | 1.5 倍行距估算不变 | 逐段按 `lnSpc × spcBef` 累加；顺带修了「lnSpc 是子元素却被当属性读」的老 bug |

另外按审阅建议：

- **每个规则单独定级**：溢出 >1.15×、图号重号、行首标点为 error；字数、红词数、红字长度为 warn。`--strict` 现在只是「把 warn 也当 error」，不再一刀切。
- **删掉「大数字唯一」**：和 `check_deck` 重复，且误伤分节页。
- **图号跳号**只在整稿（≥8 个图注）时提示，节选稿不再误报。
- 新增 6 个回归测试，`StyleLintTests` 共 15 例；`tests/test_archetypes.py` 另加原型构建测试。
  干净工作树全套 **72 个通过**（2 skipped）。

### 我不完全同意的两条

**1.「原型 body 只接受纯字符串，所以红词丢了」——不成立。**
`c.text` 走 `parseRuns`，`[[可控可问责]]` 会变成 accent run。丢红词是我写 gallery 时没写标记，不是接口限制。
现在 `archetype-2.png` 右侧与原稿一样有「回源 / 不均衡 / 可控可问责」，可对照 `archetypes-before-after.png`。
（如果要更显式的写法，`items: [{body: [{text, accent}]}]` 也可以加，但不是修复 bug，是加 API。）

**2.「先把原型全部暂缓」——同意暂缓合并，但不同意四个都不可用。**
`twoFigures` / `formulaTable` 只用了 `figureRow` 与表格排布，改完 compare3 之后可以直接用；
`compare3` 按你的意见加了图带高度上限、`summary` 恢复两栏默认字号 19/4.3″。
`metricGrid` 仍是图 50%，**没有**按你的建议改成 60/40：改比例会连带四格文字高度，
我想留到下一轮连同消融表原型一起调，而不是在没有视觉验证的情况下顺手改。
它们仍需要一轮视觉确认，所以**不随这次合并进 main**。

### 已在这次补掉的

- `compare3` 图带高度加上限，竖版图不会再跑出页面。
- `summary` 两栏恢复 `small+1` / 4.3″，三栏才收紧——旧稿不会悄悄变样。
- `docs/review/figs/` 已提交（8 张图），`gallery.js` 可以就地复现。
- 对比图文件名、`gallery.js` 路径、报告里的 `../work/` 全部改正。

### 合并决定（已落地）

- **进 main**：`scripts/lint_style.py`、15 个 lint 回归测试、`.github/workflows/tests.yml`、`SKILL.md` 的一行命令。
  已提交为 `ba8c5e6` 并推送 `origin/main`；main 干净工作树 **71 个测试通过**（2 skipped），commit 内只有这 4 个文件。
- **留在分支**：四个原型、`section.keys`、`summary` 改动、`STYLE.md` 表格、`docs/review/*`、`tests/test_archetypes.py`。
- 已知未做：**表格里的文字完全不查**（只遍历 `p:sp`）。这是下一步，不是这次的范围。

---

## 8. 第二轮：完整性事故、验证与最终落地

### 发现的问题（比 lint bug 更严重）

准备最终验证时，在**全新干净工作树**上跑测试，5 个 JavaScript 用例全部失败：

```
Error: Cannot find module './layout-kit'
Require stack: .../paper-ppt/assets/style-presets.js
```

根因不是 lint：`c5d17c1` 这个「修 lint」的提交里混进了三个**未经审阅**的 international 原型
（`setup` / `zoom` / `annotatedFigure`）和一行 `require('./layout-kit')`，
但 `layout-kit.js` 当时是 untracked、从未提交。本地测试之所以显示全绿，全靠工作区里恰好躺着这个文件；
任何干净克隆、CI、或者评审者拉分支，都会直接挂在 `require()` 上。
同一个工作区里还有 311 行未提交的 `style-presets-extra.js` 改动，属于同一批未完成的重构。

这也说明上一节「71 个通过」的数字当时是在**被污染的工作树**上取得的，不足以作为交付证据。

### 处理方式（代码不丢，范围拆清）

| 动作 | 结果 |
|---|---|
| 把整套未完成重构隔离到 `wip/layout-kit-presets` | commit `9d267b8`，含 `layout-kit.js`（99 行）、`style-presets-extra.js`（+311 行）及三个原型；该分支自洽，**72 个测试全绿**，已推送 |
| `feat` 分支退回审阅范围 | commit `aad2aa2` 移除 `require('./layout-kit')` 与三个 WIP 原型，只保留四个 domestic 原型 + 两处审阅修复（summary 两栏、compare3 clamp） |
| selective merge 到 main | `ba8c5e6`，只挑 4 个文件，见第 7 节 |

### 验证记录（全部在干净树上重跑）

| 场景 | 命令 / 动作 | 结果 |
|---|---|---|
| `feat` HEAD 干净树（无 `layout-kit.js`） | `python -m unittest discover -s tests` | **72 passed, 2 skipped** |
| `wip/layout-kit-presets` HEAD | 同上 | **72 passed, 2 skipped** |
| `main` @ `ba8c5e6` | 同上 | **71 passed, 2 skipped** |
| gallery 重建 | `node docs/review/gallery.js` | 6 页，`paragraphsFixed: 36`，无报错 |
| gallery 渲染 | `bridge.py render` | `backend: powerpoint` + `rasterizer: pdftoppm`，6 页 PNG + contact sheet |

最后一条顺带复验了之前修的 Windows 渲染闭环：没有 LibreOffice 也能走 PowerPoint COM 出图。

### 视觉复审（6 页逐页看过）

没有坏样式、没有越界、红词都在。`formulaTable`（公式独占整行 + 左图右表 + 唯一大数字）层级最清楚；
`summary` 两栏 + 深色收束条比三栏更适合国内组会。
但第 4 节的三条仍然成立：`compare3` 底部约 1″ 空档、`metricGrid` 四张图偏小、`twoFigures` 两图不等宽。
**这正是四个原型继续暂缓、不进 main 的理由**——它们能用，但还没到该固化进通用预设的程度。

### 一个环境提醒

收尾时主工作区已被另一个并行分支 `feat/style-layout-redesign`（基于 `ba8c5e6`）占用并暂存了未提交改动。
本轮所有分支侧操作都改在独立 worktree 完成，避免两条工作流互相覆盖工作区。
如果你也在同一目录并行操作，请先确认 `git branch --show-current` 再改文件。

### 最终结论

- **合入 main**：仅 lint / 测试 / CI / SKILL 一行（`ba8c5e6`），审阅结论照此执行。
- **继续暂缓**：四个原型、`summary`、`STYLE.md`、`docs/review`、`tests/test_archetypes.py`。
- **单独存放**：`wip/layout-kit-presets`，未审阅，不要合进 main。
- 下一轮建议顺序：① `compare3` 改流式排布消掉空档 → ② `metricGrid` 图 60/40 并做视觉确认 → ③ 补消融表原型 → ④ lint 支持表格文字（`p:graphicFrame`）。

---

## 9. 公式：从纯文本换成 LaTeX / OMML 原生

用户反馈：`formulaTable` 那页的 `C_total = U_HE × T_HE + …` 「一看就是 AI 的，而且丑爆了」，问能不能用 LaTeX 或 OMML。
核对后发现 skill 自己就有规范（`references/math-equations.md`）和完整管线（`math_assets.py`），
**是这个原型没遵守**——直接 `c.text(s.formula)` 把 LaTeX 风格的源码当普通文本贴了。

### 问题出在哪

- 下划线 `_total`、`_HE` 不是真下标，只是字符；
- 正文 Arial 粗体冒充数学斜体，和中文注释不是一套排版系统；
- `←` 直接塞进变量名写成 `C_H←C`；
- `×` 和所有字距靠手打，没有任何排版引擎参与。

### 修法：LaTeX 作源码，OMML 作 PPT 对象，SVG 作后备

| 层 | 内容 |
|---|---|
| 源码 | `docs/review/math-request.json`：`C_{\text{total}} = U_{\text{HE}} \cdot T_{\text{HE}} + U_{\text{CDN}} \cdot T_{\text{CDN}} + C_{\text{H}\leftarrow\text{C}}`，26 pt，色 `1F4E79` 直接取 domestic token |
| 渲染 | `math_assets.py prepare` → `pdflatex` → SVG + PNG（`text_as_path`，不依赖本机字体）+ 实测外框 **6.1 × 0.36 in** |
| OMML | 同一次 prepare 的 `mode: auto` 把 LaTeX → MathML → OMML；结构检查通过，得到**在 PowerPoint 里可继续编辑**的原生公式 |
| 嵌入 | `finalize` 用 `mc:AlternateContent`：`mc:Choice Requires="a14"` 放 OMML，`mc:Fallback` 放 SVG 矢量图 |
| 验收 | `slide5.xml` 实测含 `<m:oMath>`；`finalize` 报 `{"native": 1}`；PowerPoint COM 渲染出来的确是数学排版 |

为什么用 `\text` + `\cdot` 而不是 `\mathrm`：`native_math` 只放行经结构检查的 MathML 子集，
`\mathrm` 会产生 `mathvariant` 属性从而回退到 SVG；`\text` 走 `<mtext>`、`\cdot` 走 `<mo>`，能留在 OMML 分支。
注释里的 `C_H←C` 也改成中文描述「末项是 CDN → 边缘的回源开销」，不再重复那个丑符号。

### 原型改动

`formulaTable` 现在接受 `equationAsset` 并调用 `c.equation()`；若仍传含 `_` / `^` / `\frac` 等
TeX 痕迹的 `formula` 字符串，**直接抛错**，杜绝下一次有人顺手退化回纯文本。
公式区预留 0.8 in（原生公式的 `equationGeometry` pad），下方注释 / 图 / 表顺延，渲染实测不越界。

### 成稿

`output/build-domestic.js` 的 P16 同步换掉。因为逻辑框只是预留空间、字形垂直居中后落在
1.42–1.78 in，正好沿用原来的注释与表格坐标，**整页不用重排**。
`deck-domestic.math.pptx` 是 OMML 版，`deck-domestic.pptx` 是 LaTeX PNG 版（免后处理、兼容性更好）。
`check_deck.py` 在 OMML 版上 **status = pass（0 error / 0 warning）**。

### 复现（在仓库根执行）

```bash
cd paper-skills
python -m pip install -r paper-ppt/requirements-math.txt   # OMML 转换才需要；pdflatex 另需 TeX Live
python paper-ppt/scripts/math_assets.py prepare docs/review/math-request.json --out docs/review/math.json
node docs/review/gallery.js                               # -> docs/review/gallery.raw.pptx
python paper-ppt/scripts/math_assets.py finalize docs/review/gallery.raw.pptx \
    --manifest docs/review/math.json --out docs/review/gallery.pptx
python paper-ppt/scripts/bridge.py render docs/review/gallery.pptx --out renders/gal
```

`docs/review/math.json` 和 `math-assets/` 已提交，路径写成相对仓库根，clone 后可直接跑；
`gallery.js` 会把相对路径解析成绝对路径。要改公式只需改 `math-request.json` 再跑一次 `prepare`。

对比图：`docs/review/formula-before-after.png`（整页 + 公式区域放大，左右同一放大倍数）。
