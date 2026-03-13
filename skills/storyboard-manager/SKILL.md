---
name: storyboard-manager
description: 用于小说/剧本/连载创作管理：支持角色设定、剧情结构规划、章节与场景写作、时间线追踪与一致性检查。适用于含 characters、chapters、story-planning、summary.md 等目录/文件的写作项目。
---

# Storyboard Manager（中文）

## 概述

`storyboard-manager` 是一个面向创作项目的写作辅助技能，目标是把“灵感型写作”变成“可验证、可维护”的工程化流程：

- **角色管理**：人物设定、动机、关系、成长弧。
- **结构规划**：三幕式、英雄之旅、Save the Cat 等。
- **内容产出**：章节/场景拆解、对白与节奏建议。
- **质量校验**：时间线梳理与跨文件一致性检查。

> 触发示例：
>
> - “帮我完善主角人设”
> - “把第二幕细化成章节大纲”
> - “继续写下一章”
> - “检查时间线是否矛盾”

## 项目结构识别

触发后先扫描项目根目录，优先识别以下常见结构：

- **角色目录**：`characters/`、`Characters/`、`cast/`
- **正文目录**：`chapters/`、`Chapters/`、`scenes/`、`story/`
- **规划目录**：`story-planning/`、`planning/`、`outline/`、`notes/`
- **总览文件**：`summary.md`、`README.md`、`overview.md`

若目录不标准，建议迁移到：

```text
project/
├── characters/
├── chapters/
├── story-planning/
└── summary.md
```

## 工作流路由

根据用户请求选择流程：

- **角色类请求**（设定、动机、弧线、关系）
  - 走“角色开发流程”
- **剧情规划请求**（大纲、幕结构、节拍）
  - 走“故事规划流程”
- **内容生成请求**（写章、写场景、续写）
  - 走“章节/场景写作流程”
- **分析检查请求**（冲突、设定矛盾、时间线）
  - 时间线问题：使用 `scripts/timeline_tracker.py`
  - 一致性问题：使用 `scripts/consistency_checker.py`

---

## 角色开发流程

### 1）读取上下文

先阅读既有角色文件，确认：

- 文件模板与字段命名习惯
- 现有角色分工与关系网络
- 作品类型、语气与叙事视角

### 2）按参考框架补全

需要细化角色时，读取：

- `references/character_development.md`

建议优先覆盖这些字段：

- **基础信息**：姓名/年龄/外形/定位
- **核心驱动**：外在目标、内在需求、恐惧与执念
- **创伤与误信念**：过去事件如何影响当下选择
- **成长弧线**：起点→转折→终点
- **关系系统**：盟友、对手、导师、情感线
- **声音特征**：词汇偏好、语速、口头禅

### 3）输出与落盘

- 新角色：创建 `characters/<name>.md`
- 旧角色：在原文件补充缺失字段
- 严格复用项目既有格式（标题层级、加粗字段、命名风格）

### 4）一致性复核

创建/更新后，交叉检查：

- 是否与已有设定冲突（年龄、身份、关系）
- 是否满足剧情推进需要（冲突、阻力、选择空间）

---

## 故事规划流程

### 1）盘点已有材料

读取 `summary.md`、`story-planning/`、`outline/` 等，提取：

- 故事 premise（一句话命题）
- 类型与受众
- 已落地关键节点
- 主题、母题、情感目标

### 2）选择结构框架

读取：

- `references/story_structures.md`

可按需求采用：

- 三幕式（通用）
- 英雄之旅（成长冒险）
- Save the Cat（商业叙事节拍）

### 3）形成可执行大纲

建议输出层级：

1. 全书/全季一页纸梗概
2. 按幕拆分关键转折
3. 按章节列：目标、冲突、结果、悬念
4. 标注伏笔与回收点

### 4）风险扫描

重点识别：

- 中段塌陷（冲突不足）
- 结尾失重（主题未收束）
- 主线与支线互抢资源

---

## 章节/场景写作流程

### 1）写前对齐

写作前必须确认：

- 本章在整体结构中的位置
- 主视角与时态
- 本章“目标-冲突-变化”三元组

### 2）场景级拆解

每个场景建议包含：

- **进入状态**：人物当下目标
- **阻力来源**：人物/环境/信息差
- **行动与反应**：推动情节并暴露角色
- **场景结尾**：状态变化 + 新问题

### 3）对白与叙事控制

- 对白优先承载意图与关系变化，不只传递信息
- 每章至少有一个“不可逆变化”
- 保持角色语气稳定，避免同质化台词

### 4）落盘建议

- 章节文件：`chapters/ch-XX-<slug>.md`
- 文件头可加元数据（可选）：视角、时间点、地点、出场角色

---

## 时间线追踪

使用脚本：`scripts/timeline_tracker.py`

### 常用命令

```bash
# 生成 Markdown 报告
python3 skills/storyboard-manager/scripts/timeline_tracker.py . --output markdown

# 生成 JSON 报告
python3 skills/storyboard-manager/scripts/timeline_tracker.py . --output json

# 指定章节目录
python3 skills/storyboard-manager/scripts/timeline_tracker.py ./chapters --output markdown
```

### 适用场景

- 检查“几天后/几周后”等相对时间是否自洽
- 梳理并行事件线
- 快速定位时间跳跃造成的叙事断裂

---

## 一致性检查

使用脚本：`scripts/consistency_checker.py`

### 常用命令

```bash
# Markdown 报告
python3 skills/storyboard-manager/scripts/consistency_checker.py . --output markdown

# JSON 报告
python3 skills/storyboard-manager/scripts/consistency_checker.py . --output json

# 仅扫描角色目录（按你的项目结构调整）
python3 skills/storyboard-manager/scripts/consistency_checker.py ./characters --output markdown
```

### 检查重点

- 角色属性冲突（年龄、外形、身份、称呼）
- 世界观冲突（规则前后不一致）
- 情节逻辑冲突（先后因果断裂）

---

## 推荐协作方式

1. 先让模型完成“结构化分析”（目录扫描 + 问题清单）
2. 再进行“定向产出”（仅改指定角色/章节）
3. 每轮改动后运行脚本复核
4. 大改前保留旧版大纲，避免误覆盖

## 输出风格约束（建议）

- 结论先行：先给“改什么、为什么、影响范围”
- 给可落盘文本，不只给建议
- 标注不确定项，避免模型臆断覆盖既有设定

## 故障排查

- 若脚本无输出：先确认目录是否包含 `.md` 文件
- 若结果噪声大：缩小扫描范围到 `chapters/` 或 `characters/`
- 若命名混乱：先统一角色文件命名与章节前缀

## 最小使用模板

```text
你现在使用 storyboard-manager。
请先扫描项目结构，再：
1) 输出角色与章节文件清单；
2) 给出当前主要一致性风险（最多 5 条）；
3) 按三幕式重排现有大纲；
4) 生成下一章（1200-1800 字），并保持与既有设定一致。
```
