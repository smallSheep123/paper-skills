# paper-skills

**AI 主导的论文阅读与学术汇报工作流。**

让 AI 负责理解论文、组织叙事、设计页面、查看渲染结果并持续修改；代码只负责连接 MinerU、PPTX 生成、渲染和检查工具。

> 目标不是“自动套模板做 PPT”，而是让 AI 像研究助理 + 视觉编辑一样参与整个过程。

## 两个 Skill

| Skill | 作用 | 常见触发 |
| --- | --- | --- |
| [paper-extract](paper-extract/SKILL.md) | MinerU 模型准备与论文 → Markdown | “把这篇论文转成 md 给 AI 读” |
| [paper-ppt](paper-ppt/SKILL.md) | 论文理解、视觉设计、逐页制作、事实校核与视觉迭代 | “把这篇论文做成 8 分钟组会 PPT” |

二者可以独立使用。已经有可靠 Markdown/PDF 阅读能力时，可以直接使用 `paper-ppt`。

## 核心工作流

```text
PDF / Markdown / 风格参考
          ↓
     AI 理解论文
          ↓
视觉 AI 核对 Figure / Table / 公式
          ↓
  讲述主线 + 设计简报 + storyboard
          ↓
   方法页 / 实验页代表性样页
          ↓
      渲染 → 看图 → 修改
          ↓
   1–3 页一批继续制作与复审
          ↓
  事实终审 + 整套视觉终审
          ↓
PPTX + 演讲备注 + 预览 + QA 记录
```

### AI 做什么

- 判断论文真正值得讲的主线；
- 选择、裁剪和解释论文图；
- 根据听众和场景决定页面结构；
- 将风格参考转化为配色、层级、留白、密度和节奏；
- 制作样页并根据真实渲染结果修改；
- 核对页面、演讲备注与论文证据是否一致。

### 代码做什么

- 调用 MinerU 下载/校验模型和生成 Markdown；
- 用 PptxGenJS 等工具把 AI 的设计落到可编辑 PPTX；
- 用 LibreOffice / Poppler 渲染预览；
- 记录文件版本、页面哈希和审阅覆盖；
- 做必要的低层兼容性修复。

**代码不负责自动选模板、自动决定视觉风格，也不替代视觉模型做审美判断。**

## 风格不是模板

项目内置两套**视觉语言**，不是两个 PPTX 模板：

| 风格 | 特点 | 更适合 |
| --- | --- | --- |
| [Academic Clean](paper-ppt/references/academic-clean.md) | 克制、paper-faithful、论文证据优先 | 组会、精读、答辩、正式汇报 |
| [Academic Rich](paper-ppt/references/academic-rich.md) | 非对称构图、编辑式层级、页面节奏更强 | 课程展示、公开技术演讲、跨领域讲解 |

用户也可以只给一句风格描述、一张截图、几张参考图或网页 slide。**不要求提供 PPTX。**  
AI 只提炼视觉语言，并针对当前论文重新设计；不会抽取固定槽位去套版。

设计原则见：

- [学术 PPT 设计规范](paper-ppt/references/style-guide.md)
- [讲述结构](paper-ppt/references/talk-structure.md)
- [视觉 AI 审阅协议](paper-ppt/references/visual-review.md)
- [学术演讲参考原则](paper-ppt/references/academic-slide-distillation.md)
- [风格蒸馏库](paper-ppt/references/slide-style-gallery.md)：从 Kaiming He、Chris Ré、Song Han、CS231n、Jure Leskovec、VALSE、李宏毅等真实 deck 蒸馏的版式手法，含**海外组会 / 国内组会**两种风格方言

## 快速开始

### 1. 安装 Skill

把需要的目录复制到 AI 客户端支持的 Skill 路径，例如：

```text
<project>/.agents/skills/
├── paper-extract/
└── paper-ppt/
```

具体发现机制以你的 AI 客户端为准。

### 2. 可选：用 MinerU 生成 Markdown

如果宿主已经能稳定读取 PDF，可以跳过这一步。

```bash
python -m pip install -U "mineru>=4.0,<5"

python paper-extract/scripts/mineru_models.py download --tier standard
python paper-extract/scripts/mineru_models.py verify --tier standard

python paper-extract/scripts/mineru_extract.py /path/to/paper.pdf
```

模型准备和文档解析是两步；默认解析只使用本地已下载模型。

### 3. 安装本地 PPT 工具链

如果宿主已经提供 PPT 创建与渲染能力，也可以跳过。

```bash
cd paper-ppt
npm install
python -m pip install -r requirements.txt
python scripts/bridge.py doctor
```

本地渲染还需要 LibreOffice 与 Poppler（`pdftoppm`）。详见 [INSTALL.md](paper-ppt/INSTALL.md)。

### 4. 直接交给 AI

例如：

> 用 paper-ppt 做这篇论文的 8 分钟中文组会汇报。风格偏 Academic Clean。先理解论文和原始图表，再做方法页、实验页样稿；实际渲染后自己看图修改，再完成全稿。保留可编辑 PPT、演讲备注和来源，不要套固定模板，也不要编造论文结论。

## 输出原则

一份合格的结果至少应做到：

- **准确**：数字、比较对象、实验条件和结论可追溯；
- **可讲**：页面服务演讲，不是论文截图合集；
- **可读**：Figure、图例、公式和正文在实际显示尺寸下可读；
- **可编辑**：正文、标注和自绘解释图尽量保持可编辑；
- **可复核**：最终版本经过真实渲染和视觉审阅；
- **可增量修改**：局部需求只改相关页面，不默认整套重做。

## 目录

```text
paper-skills/
├── paper-extract/
│   ├── SKILL.md
│   └── scripts/
│       ├── mineru_models.py
│       └── mineru_extract.py
│
├── paper-ppt/
│   ├── SKILL.md
│   ├── INSTALL.md
│   ├── assets/
│   ├── references/
│   └── scripts/
│
└── tests/
```

其中：

- `mineru_models.py`：调用 MinerU 官方 CLI 下载、校验和查看模型配置；
- `mineru_extract.py`：无状态调用 `mineru-kit parse` 生成 Markdown；
- `bridge.py`：PPTX/PDF 渲染、总览图和文件指纹；
- `check_review.py`：检查审阅记录与当前渲染版本是否一致；
- `ppt-helpers.js`：可选的低层绘制辅助，不负责自动设计；
- `fix_pPr.py`：必要时处理特定 OOXML 段落属性问题；
- `example-build.js`：历史手工绘制案例，只作为代码参考，不是模板。

## 开发与边界

```bash
python -m unittest discover -s tests -v
```

测试用于检查工具连接、版本记录和低层脚本行为，**不能替代论文事实审查、视觉模型看图或真实 PowerPoint 兼容性测试**。

项目不会上传论文库、模型密钥、个人机器配置或字体文件，也不会擅自修改系统代理、CUDA、驱动和全局环境变量。
