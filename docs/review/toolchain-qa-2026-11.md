# 分支说明：全流程自测（Windows）与十处修复

> 分支 `fix/qa-toolchain-2026-11`，基线 `main @ d166c26`，一个提交 `1618f7e`。
> 目的：把 skill 的**每个入口**在本机真跑一遍（生成样稿、生成模板、裁图、公式、PDF 截图、两个检查器、单测），
> 记录跑不动、跑出来不对、报错看不懂的地方，然后只修「明确的缺陷」，不改设计取向。
> 这份文档是给第二位评审者看的：先看结论和第 3 节的逐条证据，第 5 节是我拿不准、希望你来判的三件事。
> 所有数字都能用第 2 节的命令复现；原始输出在 `docs/review/toolchain-qa-2026-11/`。

## 1. 结论

| | 修复前（`d166c26`） | 修复后（本分支） |
|---|---|---|
| 9 套官方样稿 `check_deck.py` | 0/9 通过，**53 条 error**（每页都是 `missing speaker notes`） | **9/9 通过，0 error** |
| 9 套官方样稿 `lint_style.py --preset <自身>` | **2 error + 18 warning** | **0 error + 0 warning** |
| `python -m unittest discover -s tests` | 通过，但结尾被 `--help` 的 usage 刷屏 | 72 passed / 2 skipped，输出干净 |
| `npm run math-samples` | 缺依赖时只报 `Math pipeline failed`；**同目录跑第二次必失败** | 缺依赖报「哪个 python、缺什么、怎么指」；可重复跑 |
| `diagram.py` 输出 | 2400×1240，**61% 的高度是空白** | 2392×488（内容 + 8px 留白），空白带 0 |
| `pdf_snap.py` 缺文件 | 裸 traceback | `error: PDF not found: nope.pdf`，退出码 2 |

一句话：**样稿本身过不了自己的闸门**，这是最该修的一条；其余九条是「能跑但别扭」的摩擦。

## 2. 怎么复现

```bash
# 环境：Windows 11 · Node 22.22 · Python 3.13（PyMuPDF 2.1、Pillow）
cd paper-skills && npm ci --prefix paper-ppt

# 单测（README 里写的那条）
python -m unittest discover -s tests -v

# 样稿：9 套 × 5–8 页
node paper-ppt/assets/build-style-samples.js paper-ppt/style-samples
for s in international domestic keynote-minimal systems-talk theory-beamer \
         dark-tech editorial defense-cn jp-gothic; do
  python paper-ppt/scripts/check_deck.py paper-ppt/style-samples/$s-sample.pptx
  python paper-ppt/scripts/lint_style.py paper-ppt/style-samples/$s-sample.pptx --preset $s
done

# 修复前的对照（不需要切分支，直接取基线资产重建一套样稿）
git checkout d166c26 -- paper-ppt/assets/build-style-samples.js \
    paper-ppt/assets/style-presets.js paper-ppt/assets/style-presets-extra.js
node paper-ppt/assets/build-style-samples.js paper-ppt/style-samples-before
# 逐套跑 check_deck + lint（lint 也要用基线的：git show d166c26:paper-ppt/scripts/lint_style.py）
git checkout HEAD -- paper-ppt/assets paper-ppt/scripts
```

`checks-before.json` / `checks-after.json` 就是上面两条循环的机器可读结果，`lint/before-*.json`、`lint/after-*.json` 是逐套的原始 lint 报告。

## 3. 十个问题（+ 两条顺带修补）

### 3.1 官方样稿全部过不了自己的 `check_deck`（最严重）

**现象**：9 套样稿、53 页，页页报 `missing speaker notes`。`check_deck.py` 把「没有演讲备注」当 error 级，而 `build-style-samples.js` 从不写备注 —— 仓库指向的「范例」本身不合规。

**改动**：新增 `NOTE_BY_TYPE`（32 类版式各一句口头提示，例如 `result: 只讲一个数字：谁的、在什么条件下、相对谁。`）与 `sampleNote()`，每页 `notes()` 落盘；`spec.notes` 仍优先，不覆盖作者意图。

**代价**：样稿多了 53 句话，都是提示语不是内容，评审时可以只扫一遍口吻。

### 3.2 lint 把代码页当要点列表（4 条误报）

**证据**：systems-talk p4，代码行 45/38/47 字符，加一条「5 paragraphs in one body frame」。
**改动**：`paragraphs()` 收集 run 的 `a:latin@typeface`；一个文本框里「绝大多数段落是等宽字体」时不算 list。`MONO_FONT = (consola|courier|monaco|menlo|mono|code)`。
**代价**：如果谁把正文设成 Consolas，这条规则会放过它。我认为可以接受 —— 正文用等宽本身就不是这套预设的用法。

### 3.3 lint 把参考文献当要点列表（3 条误报）

**证据**：jp-gothic p5，`[2] B. Author et al. Early exit networks. Venue 2024.` 44–53 字符。
**改动**：文本框里「过半段落以 `[N]` 开头」时不算 list。
**代价**：`[1]` 开头的正文段落会被一起豁免，实际极少。

### 3.4 international 标题框装不下两行长标题（2 条 hard error）

**证据**：p5/p7 报 `text needs ~2 lines / 1.227in in a 0.75in box (1.64x)`；渲染确认确实是两行。
**改动**：标题字符数 > 46 时把框按两行展开（`y - 0.245`，`h 1.24`），**对称扩**，文字光学中心不动。
**验证**：p7 修复前后**像素完全相同**（平均差 0.000/255）——这条改的是「声明」，渲染器本来就这么画，只是声明与事实不符。逐页差值见下表。

| 页 | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 |
|---|---|---|---|---|---|---|---|---|
| 平均差 /255 | 0.000 | 1.531 | 8.562 | 0.000 | 2.090 | 0.000 | **0.000** | 2.425 |

p2/p3/p5/p8 的差异来自 3.6 的文案收敛，不是版式。

### 3.5 dark-tech 章节号 96pt 塞进 1.6in 框（1 条 warning）

**证据**：p2 报 `1.15x`。**改动**：框 `1.6 → 1.95in`，`y 1.5 → 1.42`，同样对称扩。

### 3.6 九处占位文案超出「每条 ≤28 字」预算

**证据**：international 6 条（30/36/29/49/39/50 字）、jp-gothic 2 条（29 字）。
**改动**：只改样稿文案，**没有放宽规则** —— 这些文案是「示范如何写要点」的，本身超限就是在示范错的东西。
**这是我拿不准的一处，见 5.1。**

### 3.7 `diagram.py` 默认输出 61% 空白

**证据**：`assets/diagram-example.html` 固定 1200×620 视口，内容只占上面 39%；贴进 16:9 页面后图显得小且偏上。
**改动**：默认裁到内容 + `--pad`（8 CSS px），`--no-trim` 关掉，JSON 报告加 `trim.dead_band_pct`。
**风险**：如果有下游脚本依赖「输出尺寸 = 视口尺寸」，行为变了。见 5.3。

对比图：`docs/review/toolchain-qa-2026-11/images/diagram-trim-before-after.png`

### 3.8 `npm run math-samples` 报错看不懂

**现象**：`Math pipeline failed`，不说哪个解释器、缺什么。
**改动**：新增 `preflight()`，先 `python -c "import pymupdf"`，失败时说清三件事：

```
Math pipeline needs a Python with pymupdf; python: it has no pymupdf (ModuleNotFoundError: No module named 'pymupdf')
Point PAPER_PPT_PYTHON at the interpreter used for this repo, e.g.
  PAPER_PPT_PYTHON=.venv/Scripts/python.exe node assets/build-math-samples.js math-samples
```

### 3.9 `math_assets.py` 只认新版 PyMuPDF

**改动**：`import pymupdf as fitz` → `_fitz()`，先 `pymupdf` 再回退 `fitz`（≤1.23）。顺带：JSON 里 `native: 0 / svg: 6` 说明本机走的是**全 SVG 回退**，因为 `latex2mathml` + `mathml2omml` 没装 —— 这条路径本次**没有验证到**，见 5.2。

### 3.10 `npm run math-samples` 只能跑一次

**现象**：同目录第二次跑必挂：`ValueError: Final output must be a new file, different from the source`。
**根因**：`math_assets.py finalize` 拒绝覆盖（对 CLI 是对的），但样稿构建的输出是生成物，不应要求先手删。
**改动**：构建脚本在 `finalize` 前删掉自己的旧产物；连跑 3 次验证通过。

### 3.11 顺带两条小的

- `pdf_snap.py`：pymupdf 的 `FileNotFoundError` 继承 `RuntimeError` 而非 `OSError`，所以缺文件时抛出裸 traceback。新增 `require_pdf()` 前置校验，并把 `OSError` 加进 `main()` 的捕获列表。
- `tests/test_tools.py::test_help_without_tools`：`--help` 把整屏 usage 打到 stdout，测试日志结尾像报错。用 `contextlib.redirect_stdout` 吞掉。

## 4. 我没动、但看到的

1. **`node assets/build-templates.js` 会改写已跟踪文件**：`styles/*/template.pptx` 全部重写（内容变化、体积减半），`template-preview/` 下多出一批未跟踪的 SVG。跑完 `git status` 是脏的，误提交就会把仓库里的模板换掉。建议：输出目录 gitignore 化，或脚本加 `--check` 只校验不写。
2. **lint 输出格式不统一**：`lint_style.py` 是「人读文本 + 末行 JSON」，`check_deck.py` 是纯 JSON。CI 里要解析得写两种。
3. **`check_deck` 把备注缺失定为 error**：想只查结构的场景（比如纯几何回归）没有办法跳过。
4. **`build-style-samples.js` 的 `svg_preview.py`** 只有在 `npm run samples` 里才被调用，单独跑 node 脚本时 SVG 预览目录是空的 —— 不报错，容易以为漏了。

## 5. 希望评审判断的三件事

### 5.1 样稿文案超限：改文案，还是放宽规则？

我选了改文案（3.6）。理由是样稿的功能是「示范」，超限示范会教坏下游；但另一面是：这等于承认「28 字」这条规则对英文要点偏严 —— international 的 49/50 字两条是完整的观点句，压到 28 字会丢信息。如果你认为规则该按语言分档（例如 CJK 28、英文 60），那 3.6 应该回退成规则改动。

### 5.2 原生 OMML 公式路径没有验证

本机缺 `latex2mathml` / `mathml2omml`，6 个公式全部走 SVG 回退，`native: 0`。也就是说「LaTeX → 原生公式」这条路在 Windows + 现行依赖下**没有证据**。要么把两个包加进 CI 依赖并跑一次 `--mode native`，要么在文档里明确「默认 SVG，native 需自备依赖」。

### 5.3 `diagram.py` 默认裁图是否算破坏性变更？

我倾向「默认裁是对的」（否则每次都要手写 `--pad`），但它确实改了默认输出尺寸。如果仓库已有下游按视口尺寸排版图片，应改成默认不裁 + `--trim` 开启。我没有找到下游调用，但你可能知道我看不到的用法。

## 6. 产物清单

```
docs/review/toolchain-qa-2026-11.md              本文
docs/review/toolchain-qa-2026-11/checks-before.json   修复前 9 套 check_deck 结果（含逐条 error）
docs/review/toolchain-qa-2026-11/checks-after.json    修复后（同结构）
docs/review/toolchain-qa-2026-11/checks-*.md          人读汇总表
docs/review/toolchain-qa-2026-11/lint/before-*.json   基线 lint 逐套原始报告
docs/review/toolchain-qa-2026-11/lint/after-*.json    修复后逐套原始报告
docs/review/toolchain-qa-2026-11/logs/tests.log       unittest 输出
docs/review/toolchain-qa-2026-11/logs/math.log        公式管线：缺依赖报错 + 成功运行
docs/review/toolchain-qa-2026-11/images/diagram-trim-before-after.png       裁图前后
docs/review/toolchain-qa-2026-11/images/international-title-before-after.png  标题框前后
```

另外六套本地新增风格的回归（不在本仓库内）：60 页 lint `0E/0W`，说明等宽 / 文献两条豁免没有把正常版式放过。
