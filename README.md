# paper-skills：AI 主导的论文阅读与视觉汇报工作流

**不是把论文灌进固定模板，而是让 AI 理解论文、设计表达、看图修改，直到做出能讲清楚的学术 PPT。**

两个可独立安装的 Skill：

| Skill | 用途 | 触发示例 |
| --- | --- | --- |
| [paper-extract](paper-extract/SKILL.md) | PDF 提取、论文库检索与进程级代理排障 | “提取这篇论文并入库” |
| [paper-ppt](paper-ppt/SKILL.md) | AI 读论文、视觉设计、逐页制作、事实校核、看图迭代 | “做成 8 分钟课堂汇报，正式学术风格” |

## 谁做决定？

**AI 负责内容和视觉决策；代码只连接提取、绘制、渲染、记录与检查工具。**

不提供 `deck-plan → 固定布局 → 自动填充` 的幻灯片编译器。逐页计划是 AI 的创作说明，不是模板引擎输入。AI 可以使用宿主的演示文稿工具，也可以编写临时 PptxGenJS 绘制指令；这些指令落实当次设计，不替代设计判断。

```text
论文正文 + 原始页面 + 用户参考图
              ↓ 视觉 AI 看原图 / 校核图表
       研究主线 + 证据笔记
              ↓ 视觉 AI 分析参考 / 制定视觉方案
       设计简报 + 逐页创作说明
              ↓ AI 制作代表性样页，渲染后看图修改
       方法页 / 实验页的视觉样板
              ↓ AI 每次制作 1–3 页，逐页看图修复
       全文汇报 + 可编辑图文 + 演讲备注
              ↓ 事实核对 + 全页视觉审阅 + 全套节奏审阅
       PPTX + 备注 + 预览 + 可追溯审阅记录
```

## 视觉模型不是最后一道装饰

五个必经节点：**原图审阅、设计定调、样页审阅、逐页审阅、整套终审**。修改后的页面必须重新渲染和看图。

使用当前客户端实际可用的多模态模型或视觉工具。没有独立审稿 Agent 时，由具备看图能力的主 Agent 分开执行设计与审阅，并明确记录“自审”。**没有视觉能力就标记 `blocked_visual`，不能靠图片尺寸、XML 或假造的评分声称视觉通过。** 本仓库不附带模型、不自动提供 API 额度、不假定某个插件一定存在。

## 两套学术视觉风格

保留两套由 AI 选择和运用的视觉语言，而不是两个自动套版模板：

| 风格 | 表达重点 | 适用场景 |
| --- | --- | --- |
| [Academic Clean](paper-ppt/references/academic-clean.md) | 克制、论文证据优先、简洁标注 | 组会、论文精读、答辩、正式简约 |
| [Academic Rich](paper-ppt/references/academic-rich.md) | 非对称构图、层级与页面节奏、视觉叙事 | 课程展示、公开技术演讲、跨领域讲解 |

用户指定优先；未指定时由 AI 根据场景选择，不确定就用 Clean。两者都必须忠实论文，不能用商业卡片或装饰代替技术解释。[学术设计参考原则](paper-ppt/references/academic-slide-distillation.md)供 AI 提炼表达方式，实际设计仍要用真实样页和视觉审阅验证。\n\n**风格输入不等于 PPTX 模板。** 用户可以只给一个风格名、文字描述、截图/图片或网页/slide 参考；不要求提供 `.pptx`。AI 只提炼配色、层级、密度、留白、构图和节奏等视觉语言，再针对当前论文重新设计，不把参考文件当成可套版资产。

## 设计要求

正式学术、教学友好、可编辑。统一字体、颜色、对齐与间距，但允许 AI 根据内容自由安排页面。方法要有讲得清楚的示意图，实验要保留比较对象和条件，图注与数据必须可追溯。不堆装饰卡片，不靠缩小字号塞内容，不用 AI 生成实验曲线，不把整页截图冒充可编辑 PPT。

详见 [设计规范](paper-ppt/references/style-guide.md)、[讲述结构](paper-ppt/references/talk-structure.md)、[视觉审阅协议](paper-ppt/references/visual-review.md)。

## 安装与开始

将两个目录复制到客户端支持的 Skill 目录，例如 `<项目>/.agents/skills/`。发现机制以客户端为准；无需修改已有系统提示词或删除其他 Skill。

宿主已有 PPT 制作和渲染工具时，优先使用。需要本地备用工具链时，在 `paper-ppt/` 下安装：

```bash
npm install
python -m pip install -r requirements.txt
python scripts/bridge.py doctor
```

LibreOffice 和 Poppler 另装；MinerU / paper-mcp 只在需要该提取路径时安装。完整说明见 [INSTALL.md](paper-ppt/INSTALL.md)。`doctor` 只检查本地工具，**不检查视觉模型是否已连接**。

可以直接对 AI 说：

> 用 paper-ppt 做这篇论文的 8 分钟中文汇报。先看原论文图和我的参考图，制定设计简报，做方法和实验样页；由你自行评审后继续。全程实际看图，保留可编辑 PPT、演讲备注、来源和审阅记录。不要固定模板套版，不要编造论文结论。

## 仓库中的代码

- `paper-ppt/scripts/bridge.py`：工具检测、PPTX/PDF → PNG、缩略图总览、文件指纹。
- `paper-ppt/scripts/check_review.py`：检查审阅记录覆盖与文件版本；**不是视觉评分器**。
- `paper-ppt/assets/ppt-helpers.js`：可选低层绘制辅助，无自动生成副作用。
- `paper-ppt/assets/fix_pPr.py`：按需修复重复段落属性，默认另存，不覆盖原文件。
- `paper-ppt/assets/smoke-build.js`：无外部论文素材的工具链自测，**不是设计模板**。
- `paper-ppt/assets/example-build.js`：保留的历史 DVLA 手工绘制参考；需要作者原始图片和路径，不是开箱可运行示例，也不作为论文事实来源。

不上传论文库、API 密钥、个人机器配置和工作目录。保留每轮预览用于回溯，交付时不要删除用户原始文件。

## 开发自测

```bash
python -m unittest discover -s tests -v
```

单元测试检查连接层与记录校验；不能替代视觉 AI 审美、论文事实审查或真实 PowerPoint 打开测试。
