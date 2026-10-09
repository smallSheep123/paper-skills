// Real export regression examples; these equations are illustrative, not paper claims.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createDeck, loadEquations} = require('./ppt-helpers');
const {loadTokens, PptxCanvas, PRESETS, writeDeck} = require('./style-presets');
const {equationContent} = require('../styles/academic-evidence/equation-layout');

const FORMULAS = [
  {id: 'fraction', latex: String.raw`y_i = \frac{x_i^2+\alpha}{\sqrt{1+\beta_i^2}}`},
  {id: 'scripts', latex: String.raw`h_t^{(l+1)} = h_t^{(l)} + \eta g_t^{(l)}`},
  {id: 'matrix', latex: String.raw`\begin{bmatrix}y_1\\y_2\end{bmatrix} = \begin{bmatrix}w_{11}&w_{12}\\w_{21}&w_{22}\end{bmatrix}\begin{bmatrix}x_1\\x_2\end{bmatrix}`},
  {id: 'cases', latex: String.raw`\phi(x)=\begin{cases}x^2/2,&\lvert x\rvert\leq\delta,\\\delta(\lvert x\rvert-\delta/2),&\lvert x\rvert>\delta.\end{cases}`},
  {id: 'aligned', latex: String.raw`\begin{aligned}\mathcal L(\theta)&=\frac{1}{n}\sum_{i=1}^{n}(y_i-\theta^\top x_i)^2+\lambda\lVert\theta\rVert_2^2\\\nabla_\theta\mathcal L&=-\frac{2}{n}\sum_{i=1}^{n}x_i(y_i-\theta^\top x_i)+2\lambda\theta\end{aligned}`},
  {id: 'brace', latex: String.raw`y=\underbrace{r(x)f_{\mathrm{deep}}(x)}_{\text{deep path}}+\underbrace{(1-r(x))f_{\mathrm{shallow}}(x)}_{\text{shallow path}}`},
];

function python(args) {
  const run = spawnSync(process.env.PAPER_PPT_PYTHON || 'python', args, {stdio: 'inherit'});
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error('Math pipeline failed');
}

async function main() {
  const out = path.resolve(process.argv[2] || 'math-samples');
  fs.mkdirSync(out, {recursive: true});
  const script = path.join(__dirname, '../scripts/math_assets.py');
  const request = path.join(out, 'math-request.json'), manifest = path.join(out, 'math.json');
  fs.writeFileSync(request, JSON.stringify(FORMULAS.map(f => ({...f, fontSize: 28})), null, 2));
  python([script, 'prepare', request, '--out', manifest]);
  const eq = loadEquations(manifest);
  for (const style of ['domestic', 'international']) {
    const zh = style === 'domestic', tokens = loadTokens(style);
    const deck = createDeck({title: zh ? '数学公式排版示例' : 'Mathematical notation examples'});
    const specs = [
      {title: zh ? '归一化响应与状态更新' : 'Normalized response and state update',
        equations: [{asset: eq.fraction, caption: zh ? '分子、分母与根号各自保留完整结构' : 'A fraction with indexed variables and a square root'},
          {asset: eq.scripts, caption: zh ? '时间下标与层数上标对应不同含义' : 'Time indices and layer indices carry different meanings'}]},
      {title: zh ? '矩阵形式的线性变换' : 'A linear transformation in matrix form',
        equations: [{asset: eq.matrix}], points: zh ? ['每个输出是对应行权重与输入向量的点积', '方括号覆盖完整的两行，列与行保持对齐'] : ['Each output is the dot product of one weight row and the input', 'The brackets span both rows; entries align by column']},
      {title: zh ? '分段函数与路由分解' : 'A piecewise function and a routing decomposition',
        equations: [{asset: eq.cases, caption: zh ? '阈值两侧的条件与表达式逐行对应' : 'Each condition stays beside its corresponding expression'},
          {asset: eq.brace, caption: zh ? '下括号将路径标签与对应项连接' : 'Underbraces identify the two paths'}]},
      {title: zh ? '正则化目标与梯度' : 'A regularized objective and its gradient',
        equations: [{asset: eq.aligned}], points: zh ? ['两行在等号处对齐，目标和梯度保持相邻', '求和范围、转置和范数的上下标完整保留'] : ['The objective and gradient align at the equals sign', 'Summation limits, transposes and norm indices retain their structure']},
    ];
    specs.forEach((s, i) => {
      const canvas = new PptxCanvas(deck.addSlide(), tokens);
      PRESETS[style].frame(canvas, tokens, {...s, page: i + 1,
        source: 'Illustrative equations', footer: '数学公式排版示例',
        notes: 'Illustrative mathematical examples, not findings from The Interaction Tax. LaTeX source is preserved in equation alternative text.'});
      equationContent(canvas, tokens, s);
    });
    const draft = path.join(out, `${style}-math.raw.pptx`);
    await writeDeck(deck, draft);
    python([script, 'finalize', draft, '--manifest', manifest, '--out', path.join(out, `${style}-math.pptx`)]);
  }
}
if (require.main === module) main().catch(e => {console.error(e); process.exit(1);});
module.exports = {FORMULAS};
