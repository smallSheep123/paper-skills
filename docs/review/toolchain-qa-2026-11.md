# 分支说明：全流程自测（Windows）与修复清单

> 分支 `fix/qa-toolchain-2026-11`，基于 `main @ d166c26`。
> 做法：把 skill 的**每个入口**在本机真跑一遍（9 套样稿、9 套模板、公式、裁图、PDF 截图、两个检查器、单测），
> 记录跑不动、跑出来不对、报错看不懂的地方，然后只修「明确的缺陷」。
> 这份文档是给评审者看的：第 1 节是结论，第 2 节是复现命令，第 3 节逐条讲改了什么，
> **第 4 节把第一轮评审的每条意见对应到具体改动**，第 5 节是我拿不准的地方。
> 原始 JSON / 日志不入库（会过时、且带本机路径），需要时用第 2 节的命令现场生成。

## 1. 结论

| | 修复前（`d166c26`） | 本分支 |
|---|---|---|
| 9 套官方样稿 `check_deck.py` | **0/9 通过，53 条 error**（每页 `missing speaker notes`） | **9/9 通过，0 error** |
| 9 套官方样稿 `lint_style.py --preset <自身>` | **2 error + 18 warning** | **0 error + 0 warning** |
| 单元测试 | 72 个（2 个跳过，输出被 `--help` usage 刷屏） | **87 个全过，0 跳过**，输出干净 |
| `npm run math-samples` | 缺依赖只报 `Math pipeline failed`；**同目录第二次必失败** | 报「哪个 python、缺什么、怎么指」；连跑 3 次通过；`native 2 / svg 4` |
| `diagram.py` 输出 | 2400×1240，**61% 高度是空白** | 2392×488（内容 + 8px），空白带 0 |
| `pdf_snap.py` 缺文件 | 裸 traceback | `error: PDF not found: ...`，退出码 2 |

一句话：**样稿本身过不了自己的闸门**，这是最该修的一条；其余是「能跑但别扭」和两条规则误报。

## 2. 怎么复现

```bash
# 环境：Windows 11 · Node 22.22 · Python 3.13（PyMuPDF 2.1、Pillow、latex2mathml、mathml2omml）
cd paper-skills && npm ci --prefix paper-ppt

# 单测（README 里写的那条命令）
python -m unittest discover -s tests -v

# 9 套样稿 → 两个检查器
node paper-ppt/assets/build-style-samples.js paper-ppt/style-samples
for s in international domestic keynote-minimal systems-talk theory-beamer \
         dark-tech editorial defense-cn jp-gothic; do
  python paper-ppt/scripts/check_deck.py paper-ppt/style-samples/$s-sample.pptx
  python paper-ppt/scripts/lint_style.py paper-ppt/style-samples/$s-sample.pptx --preset $s
done

# 修复前对照：不需要切分支，取基线资产重建一套样稿 + 用基线 lint
git checkout d166c26 -- paper-ppt/assets/build-style-samples.js \
    paper-ppt/assets/style-presets.js paper-ppt/assets/style-presets-extra.js \
    paper-ppt/scripts/lint_style.py
node paper-ppt/assets/build-style-samples.js paper-ppt/style-samples-before
# 跑完记得还原
git checkout HEAD -- paper-ppt/assets paper-ppt/scripts
```

修完的逐页像素核验（同 150 dpi，与基线渲染对比）：`international` p1/p2/p4–p8 平均差 **0.000/255**，
p3 为 0.172（章节页标题恢复成原句后，框按测量从 1.60 长到 1.81in，中心不动）；`defense-cn` 5 页全部 0.000。

## 3. 改了什么

| # | 问题 | 改动 |
|---|---|---|
| 1 | 9 套样稿全部过不了自己的 `check_deck`（53 页缺演讲备注） | `build-style-samples.js` 新增 `NOTE_BY_TYPE`（32 类版式各一句口头提示）+ 每页 `notes()`；`spec.notes` 优先 |
| 2 | lint 把代码页当要点列表（systems-talk p4，4 条） | 段落收集 `a:latin@typeface`，等宽字体框不算 list |
| 3 | lint 把参考文献当要点列表（jp-gothic p5，3 条） | 过半段落以 `[N]` 开头时不算 list |
| 4 | lint 对英文按**字符数**计数，正常英文要点全超限 | 英文改为**按词数**：`wordsPerBulletEn` 默认 8 词；中文仍按字数（`charsPerBulletZh`） |
| 5 | 目录页「当前章」被当成红色强调（defense-cn p2） | 新增 `navigation_rails()`：同列 ≥3 个短标签、等距排列视为导航栏，栏内整段强调色＝状态色，豁免红色连续规则 |
| 6 | international 标题框装不下两行长标题（p5/p7 两条 hard error） | 用 `layout-kit.textLines()` 按**实际可用宽度**（含 tag 占的 1.9in）算行数，框对称扩到需要的高度；subtitle 挂到**框底**而不是 `titleY+titleH` |
| 7 | international 章节页标题 2 行溢出 1.05x | 同一套测量方式（1.6 → 1.81in），subtitle 取 `max(4.25, 框底+0.05)` |
| 8 | `diagram.py` 默认输出 61% 空白；RGBA 全不透明时不裁 | 默认裁到内容 + `--pad`（8 CSS px），`--no-trim` 保留旧行为，JSON 加 `trim.dead_band_pct`；alpha 全 255 时改按颜色差裁剪；顺手关掉文件句柄（Windows 会锁文件） |
| 9 | `npm run math-samples` 报错看不懂 | `preflight()` 先探 `pymupdf`，再探 `fitz`（对齐 `math_assets.py` 的回退），失败打印实际解释器 + `PAPER_PPT_PYTHON` 用法 |
| 10 | `math_assets.py` 只认新版 PyMuPDF | `_fitz()`：`pymupdf` → `fitz`（≤1.23）。`pdf_snap.py`、`bridge.py` 也统一成这个顺序，顺带消掉 PyMuPDF 的 FutureWarning |
| 11 | `npm run math-samples` 只能跑一次 | `finalize` 拒绝覆盖是对的，但样稿是生成物：构建脚本先删自己的旧产物，连跑 3 次通过 |
| 12 | `pdf_snap.py` 缺文件抛裸 traceback | `require_pdf()` 前置校验；`main()` 捕获 `OSError`（pymupdf 的 `FileNotFoundError` 继承 `RuntimeError`，原来漏掉） |
| 13 | 测试日志被 `--help` 的 usage 刷屏 | `--help` 用例重定向 stdout |
| 14 | 两条规则改动没有测试 | 新增 15 个用例，见第 6 节 |
| 15 | CI 里 OMML 分支从来跑不到 | `tests.yml` 加装 `latex2mathml mathml2omml`（`requirements-math.txt` 里本来就有），2 个跳过变成真跑 |

## 4. 第一轮评审意见 → 处理

### 必须改（4 条）

**4.1「改文案绕过规则，反而改坏了内容」** — 已全部回退。

- defense-cn 目录第 3 项恢复成「热点感知的任务放置」（不再为躲 6 字上限缩成「热点感知放置」），
  改由第 5 条的**导航栏豁免**处理；
- international 6 条英文要点、章节页标题全部恢复原句（`Easy tokens skip the deep path`、
  `Is per-token depth the right unit, or per-region?`、`Can a router learn which tokens need depth?` 等）；
- 只保留两处确实超长的内容收敛：jp-gothic 2 条日文（29 字，超过 28 字预算）、systems-talk 的中文要点。
  这两处是「内容真的长」，不是规则误判。
- 结果：恢复文案后 `lint` 仍是 0 findings，且 international 7/8 页与基线**像素完全相同**。

**4.2「international 标题框的启发式有 bug」** — 已按建议重写。

- 删掉「46 字符」这个常数，改用 `layout-kit` 的 `textLines(title, size, 实际可用宽度)`：
  宽度先减掉 tag 占的 1.9in，再减左右内边距 0.2in；
- 高度 `= 行数 × 字号 × 1.38 / 72 + 0.12in`（1.38 = 画布 1.15 行距 × lint 假设的 1.2 行盒，0.12 是上下内边距 + 取整）；
- 框**对称扩**（`y = titleY - (h - titleH) / 2`），文字光学中心保持在 0.755in；
- subtitle 从 `titleY + titleH` 改成 `y + h`（框底），长标题 + subtitle 不再叠；
- 章节页（44pt）用同一套办法。两张示意图见 `images/title-box-measure.png`。

**4.3「改了门禁规则却没有测试」** — 补了 15 个用例（第 6 节）。

**4.4「原始输出里有本机路径、而且会过时」** — 已从仓库删除全部 `checks-*.json` / `lint/*.json` / `logs/*`。
仓库只留本文和两张图；需要原始数据按第 2 节现场跑（`check_deck`、`lint --json` 都是固定命令）。

### 可以顺手修（3 条）

- **RGBA 全不透明不裁**：改为先看 alpha 最小值，`< 255` 才按 alpha 裁，否则按颜色差裁。新增 3 个用例覆盖
  （不透明 RGBA / 真透明 / 空白图）。
- **preflight 只认 pymupdf**：现在 `pymupdf` → `fitz` 都试，和 `math_assets.py` 一致；报错文案改成
  `it has neither pymupdf nor fitz`。另外 `pdf_snap.py`、`bridge.py` 的 `import fitz` 也统一成先 `pymupdf`。
- **`build-templates.js` 弄脏工作区**：本轮**不改**，已开 issue 跟踪（会覆盖已跟踪的 9 套 `template.pptx`
  和 `template-preview/`）。

### 判断题（3 个）

1. **「都不对，要分语言」→ 已按此实现**：英文按词数（默认 8 词，可用 `limits.wordsPerBulletEn` 覆盖），
   中文仍按字数（`charsPerBulletZh`，各预设 26/28）；英文文案已全部改回原句。
   实测：8 词的句子放行，9 词的要点报警（`test_english_bullet_is_measured_in_words`）。
2. **「CI 里那 2 个测试从来没跑过」→ 已修**：`tests.yml` 加装 `latex2mathml mathml2omml`。
   本机装上后：87 个用例 0 跳过，公式管线 `native 2 / svg 4`（此前 `native 0 / svg 6` 全回退）。
   这条路径本身逻辑没动，是**依赖缺失**导致从来没被验证。
3. **「默认裁图算破坏性变更，但可以接受」→ 已在文档写明**：`paper-ppt/SKILL.md` 的 diagram 用法新增一条
   「默认会裁图 + `--no-trim` 保留原尺寸 + `trim.dead_band_pct`」，同时修掉 RGBA 问题。

## 5. 我拿不准、希望你判的

1. **导航栏豁免的边界**：现在判据是「同 x（±0.05)列、≥3 个 ≤20 字的单段文本框、纵向间距在 0.5–1.8 倍中位数之间」，
   栏内整段强调色视为状态。够窄，但如果有版式把「三个短标签 + 一个红色结论」排成一列，也会被放过。
   要不要再把「栏内必须只有一个强调色元素」作为额外条件？
2. **英文 8 词是否合适**：`Why do dense models waste compute on easy tokens?` 是 9 词，被我算作超限。
   这是「一句正常英文要点」还是「该拆句」，我没有把握；阈值留在 tokens 里，改一个数就行。
3. **`navigation_rails` 放在 lint 里是否越界**：它让 lint 需要看「页面上下文」而不只是单个文本框。
   如果你认为 lint 应该保持「逐形状判定」，这条应该换成在 tokens 里声明「本页有目录栏」。

## 6. 新增测试（15 个）

| 用例 | 断言 |
|---|---|
| `test_code_frame_is_not_a_bullet_list` | 4 行 45 字符等宽代码框不出 `chars`/`words` 警告 |
| `test_bibliography_is_not_a_bullet_list` | 3 条 `[N]` 文献不出警告 |
| `test_english_bullet_is_measured_in_words` | 8 词放行、9 词报警 |
| `test_chinese_bullet_still_measured_in_characters` | 中文仍按字数报警 |
| `test_toc_current_chapter_is_a_state_mark` | 4 个等距标签 + 1 个强调色，不报红色连续 |
| `test_red_label_outside_a_rail_is_still_flagged` | 孤立红色标签仍然报警 |
| `test_accent_phrase_inside_a_sentence_is_still_flagged` | 句中的强调短语仍然报警 |
| `test_opaque_rgba_is_trimmed` | RGBA 但全不透明时按颜色裁剪（原来报 already tight） |
| `test_transparent_background_is_trimmed_by_alpha` | 真透明背景按 alpha 裁剪，尺寸 101×61 |
| `test_blank_image_reports_nothing_drawn` | 空白图不动，reason=nothing drawn |
| `PdfSnapPathTests` ×3 | 缺文件抛 `ValueError`；存在则透传；CLI 一行错误 + 退出码 2、无 traceback |
| `InternationalTitleBoxTests` ×2 | 长标题框 > 0.75in 且中心不变；短标题保持 0.75in；subtitle 落在框底之下（不重叠） |

## 7. 产物

```
docs/review/toolchain-qa-2026-11.md                本文
docs/review/toolchain-qa-2026-11/images/diagram-trim-before-after.png   裁图前后（2400×1240 → 2392×488）
docs/review/toolchain-qa-2026-11/images/title-box-measure.png           标题框怎么算（含 subtitle 落点）
```

改动的代码：`paper-ppt/assets/{build-style-samples,build-math-samples,style-presets}.js`、
`paper-ppt/scripts/{lint_style,diagram,math_assets,bridge}.py`、`paper-extract/scripts/pdf_snap.py`、
`tests/test_tools.py`、`.github/workflows/tests.yml`、`paper-ppt/SKILL.md`。

## 8. 没动、但值得知道

1. `node paper-ppt/assets/build-templates.js` 会重写已跟踪的 9 套 `template.pptx`（内容变化、体积减半）并
   在 `template-preview/` 留下未跟踪 SVG。跑完工作树是脏的，误提交会换掉仓库里的模板 —— 已开 issue。
2. `lint_style.py` 输出是「人读文本 + 末行 JSON」，`check_deck.py` 是纯 JSON，CI 里要写两种解析。
3. `check_deck` 把备注缺失定为 error，想只查几何的场景没有开关。
4. dark-tech 章节号框与标题框在坐标上重叠 0.17in（96pt 数字顶对齐，字形不会压到标题）。
   本机用 LibreOffice 渲染 p2 核过：`02` 与 `Architecture` 各自成行，没有压字。
   international 章节页（p3）同样渲过：两行标题 + 下方 subtitle，不重叠。
