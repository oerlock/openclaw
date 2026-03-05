---
name: storyboard-manager
description: 用于长篇故事创作与管理：角色设定、剧情结构规划、章节写作、时间线追踪与一致性检查。适用于包含 characters/、chapters/、story-planning/ 等目录的 Markdown 写作项目。
metadata: { "openclaw": { "emoji": "🎬", "requires": { "bins": ["python3"] } } }
---

# Storyboard Manager

## 概览

`storyboard-manager` 是一个面向创作工作流的技能，帮助你在写作过程中保持：

- 角色设定一致
- 剧情结构清晰
- 章节推进有节奏
- 时间线与事实不冲突

该技能适配常见小说/剧本目录结构，并提供两个可执行脚本：

- `scripts/timeline_tracker.py`：时间线提取与追踪
- `scripts/consistency_checker.py`：一致性问题检测

## 适用目录结构（自动识别）

常见目录/文件：

- 角色：`characters/`、`Characters/`、`cast/`
- 正文：`chapters/`、`Chapters/`、`scenes/`、`story/`
- 规划：`story-planning/`、`planning/`、`outline/`、`notes/`
- 总览：`summary.md`、`overview.md`、`README.md`

若项目尚未规范，建议最小结构：

- `characters/`
- `chapters/`
- `story-planning/`
- `summary.md`

## 工作流选择

根据用户诉求选择流程：

1. **角色相关**（“完善角色”“写人物小传”“角色弧线”）
   - 进入「角色开发流程」
2. **剧情规划相关**（“大纲”“Act 2”“节奏设计”）
   - 进入「故事规划流程」
3. **正文创作相关**（“写下一章”“续写场景”）
   - 进入「章节写作流程」
4. **检查分析相关**（“查冲突”“看时间线”）
   - 时间线：运行 `timeline_tracker.py`
   - 一致性：运行 `consistency_checker.py`

---

## 角色开发流程

### 1) 收集上下文

先阅读现有角色文件，确认：

- 现有模板风格
- 角色关系网
- 题材与语气
- 已占用的人设功能位

### 2) 按需加载参考资料

需要深度人物设计时，读取：

- `{baseDir}/references/character_development.md`

可用 `rg` 快速定位：

```bash
rg -n "角色弧|动机|创伤|关系" {baseDir}/references/character_development.md
```

### 3) 输出角色档案（建议字段）

- 基础信息：姓名、年龄、外观、定位
- 背景与创伤：关键过去事件、形成原因
- 目标系统：Want/Need、动机、风险
- 弧线变化：起点误信念 → 转折 → 终点
- 关系动态：盟友/对手/导师等及演变
- 声音标签：语气、词汇、习惯表达

### 4) 一致性回看

与以下内容交叉检查：

- 其他角色档案
- 剧情规划文档
- `summary.md` 的世界观与主题

### 5) 写入文件

建议路径：`characters/<character-name>.md`

---

## 故事规划流程

### 1) 评估当前规划状态

先阅读已有大纲/计划，明确：

- 核心 premise
- 已确定关键情节节点
- 目标读者与题材
- 主题问题
- 当前采用的结构范式

### 2) 按需加载结构参考

读取：

- `{baseDir}/references/story_structures.md`

可用 `rg` 快速定位：

```bash
rg -n "三幕|英雄之旅|Save the Cat|节奏" {baseDir}/references/story_structures.md
```

### 3) 选择结构框架（示例）

- 悬疑/惊悚：三幕 + 强中点反转
- 冒险/奇幻：英雄之旅
- 青春/当代：Save the Cat 强情绪节点
- 文学向：角色弧优先
- 浪漫向：关系推进节点优先

### 4) 产出规划文档

建议包含：

- 故事概述（2~3 句）
- 结构分解（Act/章节）
- 角色弧与主线对齐
- 世界规则（如有）
- 时间线骨架

### 5) 写入文件

建议路径：`story-planning/<document-name>.md`

---

## 章节写作流程

### 1) 写前读取

写章节前至少阅读：

- 相关角色档案
- 结构/大纲文档
- 前 1~2 章正文
- `summary.md`

### 2) 明确章节目标

- 所处位置（全书进度）
- POV 角色
- 场景目标（角色想要什么）
- 冲突来源
- 场景结果（最好带新问题）

### 3) 场景组织建议

- **Scene（行动）**：目标 → 冲突 → 受挫
- **Sequel（反应）**：反应 → 困境 → 决策

并穿插高张力与低张力段落。

### 4) 保持角色声音稳定

写作时对齐角色：

- 性格与价值取向
- 语言习惯
- 压力下行为模式
- 当前弧线阶段

### 5) 添加时间标记

可使用：

- `**Timeline:** Day 5, Evening`
- 或叙述型时间提示（如“事发三天后”）

### 6) 文件建议

建议路径：`chapters/chapter-<number>.md` 或 `chapters/<chapter-name>.md`

可用头部模板：

```markdown
# Chapter <Number>: <Title>

**Timeline:** <time>
**POV:** <character>
**Location:** <location>
```

### 7) 章节后登记

记录本章新增信息：

- 角色新事实
- 线索与伏笔
- 世界设定新增条目
- 时间节点

---

## 时间线追踪

### 何时使用

- 用户要求梳理事件先后
- 发现时间跳跃不清晰
- 需要找缺失时间标记

### 运行命令

```bash
python3 {baseDir}/scripts/timeline_tracker.py . --output markdown
```

输出格式：

- `markdown`（默认）
- `json`

### 结果解读与处理

重点关注：

- 总事件数 / 总角色数
- 章节级事件顺序
- 缺失时间标记的片段

处理方式：

1. 补全章节时间标记
2. 修正前后顺序冲突
3. 标记“空白时间段”是否需要补写

---

## 一致性检查

### 何时使用

- 用户要求检查逻辑或设定冲突
- 大幅修改角色/剧情后
- 完成阶段稿前的质量检查

### 运行命令

```bash
python3 {baseDir}/scripts/consistency_checker.py . --output markdown
```

输出格式：

- `markdown`（默认）
- `json`

### 严重级别

- `critical`：关键冲突（应优先修复）
- `warning`：高风险不一致
- `info`：轻微差异（如命名大小写）

### 建议修复流程

1. 读取报告中的文件位置
2. 确认以哪份信息为准（通常人物档案更权威）
3. 修正文稿
4. 重新运行脚本确认问题已消失

---

## 最佳实践

- 渐进加载上下文：先看结构，再按任务加载参考文档
- 避免一次性把所有参考文件塞入上下文
- 每次产出后记录新增事实，降低后续冲突概率
- 多 POV 作品中，明确“谁知道什么”

## 资源说明

### `scripts/timeline_tracker.py`

提取并组织 Markdown 文档中的事件时间信息，帮助建立可追踪的故事时间线。

### `scripts/consistency_checker.py`

扫描角色属性、描述、命名与基础世界设定，输出分级一致性问题。

### `references/character_development.md`

角色塑造参考：角色核心要素、动机系统、创伤模型、关系与弧线设计。

### `references/story_structures.md`

结构参考：三幕、英雄之旅、Save the Cat、场景与节奏组织方法。
