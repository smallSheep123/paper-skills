// Gallery deck: the four new domestic archetypes + section keys + 3-column summary.
// Content mirrors pages 16/17/20/21 of the HyperEdge deck so the rendered pages can
// be compared side by side with the hand-built ones.
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const {loadTokens, PptxCanvas, drawSlide, writeDeck} = require('../../paper-ppt/assets/style-presets');

// 图片来自论文原图裁切（paper-extract 的 figure 子命令），放在同目录 figs/ 下
const FIG = path.resolve(__dirname, 'figs') + path.sep;
const t = loadTokens('domestic');
const deck = new pptxgen();
deck.layout = t.slide.layout;
const FOOT = 'HyperEdge · NSDI 2026';
let page = 0;

function slide(spec) {
  const s = deck.addSlide();
  page += 1;
  drawSlide(new PptxCanvas(s, t), t, {...spec, page, footer: FOOT});
}

slide({type: 'section', number: '01', title: '背景与动机',
  subtitle: '视频流量在涨，CDN 的计费方式让成本涨得更快；而家庭侧的资源一直闲着',
  keys: ['按峰值计费的账', 'Hdevice 的真实能力', '为什么层级树与纯 P2P 都不成立']});

slide({type: 'compare3', prefix: '一、', title: '为什么不能照搬 CDN',
  figure: FIG + 'p07.png', caption: null,
  items: [
    {body: '缓存命中率低：设备存储小、\n热度变化快，回源带宽代价大。'},
    {body: '全局不可见：本地决策跟不上\n热度变化，异构还会放大不均衡。'},
    {body: '仍是 server-to-client：设备\n可控可问责，才谈得上 SLO。'},
  ],
  note: '关键区别：P2P 的 peer 自愿、自治、随时走；Hdevice 向第三方厂商租赁，可控可问责，所以敢把决策全部收上来。'});

slide({type: 'twoFigures', prefix: '三、', title: '低谷预取抹掉回源成本',
  items: [{file: FIG + 'fig6.png', caption: '图 6  一天内的 HyperEdge 流量与回源流量'},
          {file: FIG + 'fig7.png', caption: '图 7  承接流量占比与节省比例'}],
  lead: '省的不只是“更便宜的单位”，而是把不可控的峰值需求挪到可控的谷底。'});

slide({type: 'metricGrid', prefix: '四、', title: '其余指标全面看齐',
  cells: [
    {figure: FIG + 'fig10.png', caption: '图 10  建连时间', head: '建连时间',
     body: '中位超 SLO 3.08%，99 分位 17.12%，但绝对超出只有几百毫秒。'},
    {figure: FIG + 'fig11.png', caption: '图 11  分段大小', head: '分段 10s',
     body: '分段越小越省流量、越容易卡。实测 5/10/15 秒后取 10 秒。'},
    {figure: FIG + 'fig12.png', caption: '图 12  缓存命中率', head: '缓存命中率',
     body: '与 CDN 基本重合，靠 Tracker 的预测式分发，而不是更大的缓存。'},
    {figure: FIG + 'fig13.png', caption: '图 13  Seek 时间', head: 'Seek 时间',
     body: '中位仅比 CDN 高 3.56%，拖动时连接通常已经建好。'},
  ],
  note: '四个次要指标里最值得学的是分段大小：一个参数同时牵着省流量和不卡顿两头。'});

slide({type: 'formulaTable', prefix: '三、', title: '$360M 到 $235M',
  formula: 'C_total = U_HE × T_HE + U_CDN × T_CDN + C_H←C',
  formulaNote: 'U 是单位流量成本，T 是峰值流量；C_H←C 是从 CDN 回源到边缘的开销',
  figure: FIG + 'fig5.png', caption: '图 5  HyperEdge 成本构成',
  rows: [
    ['边缘网络（租设备 + 带宽）', '$198M', '83.7%'],
    ['CDN 流量（约 10% 用户流量）', '$36M', '15.2%'],
    ['人力（20 人，含运维）', '$2.4M', '1.0%'],
    ['Tracker 服务器（约 20 台）', '$72K', '0.03%'],
  ],
  total: '合计 ≈ $235M / 年　·　纯 CDN 同流量 $360M / 年',
  bigNumber: '−35%', bigLabel: '整体成本降幅（相对纯 CDN 方案）'});

slide({type: 'summary', title: '总结：结论与边界',
  conclusions: [
    'CDN 按峰值计费，业务增长即成本线性上涨',
    '边缘设备弱、散、不可靠，不能各自决策',
    '扁平数据面 + 集中控制面 + 多路径并行',
    '30 TB/s 下年省 35%，体验基本持平',
  ],
  limits: [
    '依赖“便宜且可租”的第三方设备市场，区域差异大',
    '隐私、ISP 收益、安全在附录讨论，正文未量化',
    '强依赖 Tracker 预测质量与客户端实测',
    '未支持播放中动态切换码率',
  ],
  takeaway: '真正可复用的不是“用边缘设备”，而是“把每台设备都不达标这件事，交给能看见全局的调度器去摊平”。',
  closing: '恳请各位老师和同学批评指正'});

writeDeck(deck, path.resolve(__dirname, 'gallery.pptx')).then((r) => console.log(r));
