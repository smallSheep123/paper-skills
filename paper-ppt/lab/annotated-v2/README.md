# annotated-v2 · 图表加工层 + 16 套风格试稿（里程碑，未并入正式 preset）

用一篇真实论文（AgentPrune, ICLR 2025）在 16 套风格里各做 3 页同内容样稿：
**空间剪枝（方法）→ 时间剪枝（方法）→ 实验结果**。目的是验证两件事：

1. AI 不只换配色，而是**加工论文图**：拆图、裁切、圈注、编号、压暗非重点、重绘图表；
2. 风格一致的前提下，每套风格用**自己的招牌版式**，而不是同一版式换皮。

> 状态：试稿。用户选定风格后，再把选中的风格和 `kit.js` 并入 `assets/style-presets*.js` 与 `styles/<preset>/`。

## 文件

| 文件 | 作用 |
|---|---|
| `canvas.js` | 双后端画布：同一组调用同时出 PPTX（pptxgenjs，可编辑）和 SVG 预览；中英文自动分字体；`[[强调]]`、`**粗体**`、`^{上标}` |
| `kit.js` | 图表加工层：`figure` 放图、`callout` 引线标注、`ring` 圈注、`badge` 编号、`spotlight` 压暗、`graph` 重绘通信图、`hbars`/`vbars` 重绘柱状图、`ledger` 账单表、`history` 发言历史重绘 |
| `content.js` | 全部文字和数字（只来自论文，或由论文数字直接计算） |
| `styles-a.js` | 修复后的 9 套：domestic、international、keynote-minimal、systems-talk、theory-beamer（重做为 Metropolis）、dark-tech、editorial、defense-cn、jp-gothic |
| `styles-b.js` | 新增 7 套：explainer（Raschka 标注讲解）、lecture（Stanford CS348K）、bento-dark（Apple 发布会）、soft-bento、swiss、seriph（Slidev）、neo-brutalism |
| `make_crops.py` | 从论文 PDF 复现所有裁图（300 dpi） |
| `previews/` | 16 套 × 3 页的预览拼图 |

## 运行

```bash
python make_crops.py path/to/agentprune.pdf   # 生成 crops/（论文图不入库）
node build.js                                  # out/<style>.pptx + out/<style>/p*.svg；打印 QA 溢出警告
python render.py                               # SVG → PNG 与每套拼图（需要 cairosvg；先装 fonts/ 里的开源字体）
```

## 内容真实性

- 每个数字都能在论文中找到：Fig. 4 的 token 账单按图中算式求和（2,259→1,481、5,036→1,944、7,295→3,425）；成本与精度来自 Table 3；攻击前后数据读自 Fig. 6 柱顶标注；均值来自 Table 1；$5.6 / $43.56 来自附录 H.1。
- 论文自身不一致：摘要写 GPTSwarm `$43.7`，附录 H.1 写 `$43.56`，试稿采用附录。
- 标注只描述图里看得到的事实：①② 两条被剪的边、Thinker 2 删去的前提、答案 8（错）→ 12（对）、保留的 Answer 3 与 Conclusion。
- 成本图默认**按行归一**（接入前 = 100%），否则 AutoGen 的几美元在 $234 的刻度下看不见；图下注明了条长含义，数值标签仍是原始美元。

## 自审（这一版还不够的地方）

**已修**：敷衍页（小图一行字）、假公式、Theorem 误用、校徽占位、日文混排、汉字缺字形、成本小值看不见、`S^S` 生硬写法、溢出检测。

**仍存在，未解决：**

1. **没在 PowerPoint 里真渲染过。** 预览是 SVG 近似；PPTX 文本框高度固定，若本机缺开源字体或换行规则不同，可能溢出。并入正式 preset 前必须用 LibreOffice/PowerPoint 跑一次 `bridge.py render` 视觉复核。
2. **裁图里的原文小字仍偏小。** 例如 Thinker 的输出文本在投影上读不清——它们是“形状证据”，讲的内容靠标注。若听众要读原文，需要再放大一层局部。
3. **标注坐标是人工（AI 看图）定的。** 换论文时要重新看图定锚点；目前没有自动检测剪刀/对勾等标记。
4. **少数标注引线较长或越过图面**（seriph 方法页、explainer 结果页），可读但不够干净。
5. **只验证了 3 类页面。** 封面、动机、公式推导连续页、消融表、总结页还没有在新风格里做。
6. **新风格的适用边界：** bento / neo-brutalism 不适合承载公式和长推导；keynote-minimal 只在“图占满 70% 以上”或“一个大数字 + 原图证据”时成立。
7. 并入正式 preset 时，`canvas.js` 的上标与分字体逻辑要合并进 `assets/style-presets.js` 的 `PptxCanvas/SvgCanvas`，避免两套画布并存。

## 红线（写入 `references/visual-review.md`）

- 只有一行字的页面：必须是极简风格，且图占画面 ≥ 70%；否则判为敷衍页。
- 结论页必须有证据（图、表或数字）和出处。
- 复杂多子图默认先考虑拆页 / 裁局部 / 重绘，再考虑整图缩放。
- 标注只写图中可见或论文明说的事实。
