# 分支说明：style lint + domestic 原型扩展

> 分支 `feat/style-lint-and-archetypes`。目的：把「AI 做出来的片子到底好不好看」从靠眼睛，变成一部分可测的规则；
> 并把这次手工搭的 4 类页面固化成原型，减少下次从零排版。
> 这份文档是给第二位评审者看的：先看结论和对比图，再看我自认为没做好的地方，最后是我希望你判断的问题。

## 1. 这次改了什么

| 文件 | 改动 | 为什么 |
|---|---|---|
| `paper-ppt/scripts/lint_style.py` | 新增。读 PPTX 的 XML，估文字是否溢出、红词是否超量、红字是否连续过长、行首是否有标点、图号是否重号/跳号 | `check_deck.py` 只查几何与结构，文字撑破框这件事完全没人管 |
| `paper-ppt/assets/style-presets.js` | domestic 新增 `compare3 / twoFigures / metricGrid / formulaTable`；`section` 支持 `keys`；`summary` 支持 `limits` 两栏或三栏 + `takeaway/closing` | 真实论文页一半以上是复合版式，原来 7 个原型接不上，只能手写 |
| `tests/test_tools.py` | 新增 `StyleLintTests`（9 例） | 规则要能被回归，不能加完就漂 |
| `.github/workflows/tests.yml` | 新增 CI：`unittest discover` | README 的命令曾经是红的没人发现 |
| `docs/review/*.png` | 对比图与原型实拍 | 便于评审直接看，不用自己跑 |

## 2. 怎么验证的

```bash
# 单元测试：56 + 9 = 65，全绿
cd paper-skills && python -m unittest discover -s tests

# 规则在真片上跑
python paper-ppt/scripts/lint_style.py ../output/deck-domestic.pptx
# 第一次：12 条。按提示改了三处文案后：3 条（都是 29–30 字的要点，略超 28 字上限）
#   12 -> p13 红色连续 10 汉字「保证任何情况下都能看」/ p17 7 字 / p19 7 字
#    3 -> 只剩三条「bullet 29 字 > 28」，属于作者判断，不强行改

# 原型在真内容上跑（同一篇 HyperEdge，同一批图）
node work/gallery.js && python paper-ppt/scripts/bridge.py render work/gallery.pptx --out renders/gal
```

对比图：`docs/review/archetypes-before-after.png`（左＝手写图元，右＝新原型重排同一内容）。

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
| 文字溢出 | 估算行高 > 可用高度 1.03× | 最伤观感的一类错误，且完全可估 |
| 每条红词数 | > `limits.keywordsPerBullet` | 一条里两个红词＝都没红 |
| 红字连续长度 | > 6 字 | domestic STYLE.md 明写「红色不连续超过 6 个字」，以前只是文字 |
| 行首标点 | 段落或 `<a:br/>` 段以 `，。；` 开头 | 中文排版硬伤，手工断行时最容易踩 |
| 每条字数 | 列表框内 > `limits.charsPerBulletZh` | 与 STYLE.md 的 28 字对齐 |
| 大数字唯一 | 带图页面 ≥2 个 bigNumber 字号 | 「结果页只强调一个数」 |
| 图号 | 重号 / 中间跳号 | 图注靠手打，编号错没人拦 |

溢出是**估算**（CJK 1 em、ASCII ≈0.5 em），只报 3% 以上的可疑项，不和像素较劲。

## 4. 我自认为还不够好的地方（请重点看这几处）

1. **`compare3` 的纵向留白偏大**：图带 2.5″ + 两行文字之后，到收束条之间还有约 1″ 空。手写版靠"文字三行"填满，原型只给两行。
2. **`metricGrid` 的图比手写版小**：为了给右侧文字让位，图宽压到半栏（≈2.9″），13 张图里的箱线图在这种尺寸下坐标轴标签偏小。
3. **`summary` 两栏下方仍空**：加了 `takeaway` 深色条后底部才立住；不加时 4″ 以下全空。
4. **`twoFigures` 的两张图宽度不等**（等高原则的必然结果），右图比左图窄 1″ 左右，对齐强迫症会难受。
5. **规则偏保守**：`p17「20%–5 倍」红色 7 字`这种其实是数字不是词，被规则误伤；目前只能靠人判断。
6. **lint 不查自动换行**：行首标点只在"手工断行"和"段落开头"能查到；PowerPoint 自己换行把标点甩到行首的，查不到（这个必须靠渲染后看图）。
7. **gallery 会误报"图号缺失"**：它只放了 5–7、10–13，脚本按 min..max 找跳号，所以报 8、9 缺失。真实整稿不会这样，但说明规则对"节选稿"不友好。

## 5. 想请你判断的问题

**审美**
- `compare3` 里「图带 + 三栏文字 + 收束条」这个三段式，是不是比手写版的「三张小图 + 三栏 + 收束条」更清楚？还是更空？
- `metricGrid` 的「图 50% / 文字 50%」比例对不对？图再大一点、文字再窄一点，会不会更像实验页？
- 总结页用「结论 / 边界」两栏 + 深色收束条，是否比「结论 / 讨论 / 边界」三栏更适合国内组会？

**框架**
- 这四个原型够不够覆盖"论文汇报"的真实页型？下一步该补哪一个（相关工作对比？消融表？时间线？）。
- `section.keys` / `summary.limits` / `compare3.note` 这些可选字段，是不是把原型变成了"参数太多的模板"？有没有更克制的抽象。
- `lint_style.py` 的规则集里，哪条应该升级成 error（阻断交付），哪条其实该删掉（噪声大于价值）。

## 6. 复现

```bash
cd paper-skills
python -m unittest discover -s tests           # 65 passed
python paper-ppt/scripts/lint_style.py <deck>  # 需要 zip + xml，无需 Office
node ../work/gallery.js                        # 需要 pptxgenjs（paper-ppt/package.json）
python paper-ppt/scripts/bridge.py render ../work/gallery.pptx --out renders/gal --dpi 130
```
