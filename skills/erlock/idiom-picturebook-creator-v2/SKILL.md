---
name: idiom-picturebook-creator-v2
description: 面向中国成语绘本创作的结构化技能，支持成语选题、12页故事板编排、分镜文案、画面提示词生成，以及时间线/一致性检查。适用于创建儿童教育向图文故事或迭代已有绘本项目。
metadata: { "openclaw": { "emoji": "📚", "requires": { "bins": ["python3"] } } }
---

# Idiom Picturebook Creator v2

## 概述

该技能基于 `reference_code/storyboard-manager-v1` 的工作流进行重构，针对「中国成语绘本」场景提供更清晰的分阶段执行路径：

1. 成语选题与寓意抽取
2. 故事板结构生成
3. 分页文案与视觉提示词生成
4. 项目级时间线检查
5. 跨页面一致性检查

与 v1 相比，v2 强调**可审查、可复用、可迭代**：你可以先自动生成骨架，再做局部补写，并通过脚本发现问题。

## 推荐项目结构

```text
project-root/
├─ picturebook/
│  └─ <idiom-slug>/
│     ├─ storyboard.json
│     ├─ pages/
│     │  ├─ page-01.md
│     │  └─ ...
│     ├─ assets/
│     │  ├─ backgrounds/
│     │  └─ characters/
│     └─ export/
├─ glossary.md
└─ notes.md
```

如果用户尚未提供结构，先建议创建上述目录，再继续生成。

## 工作流决策树

```text
用户请求
├─ “从成语开始做一本绘本”
│  └─ 走完整工作流（选题 → 故事板 → 图文提示词 → 检查）
├─ “已有故事，补分镜/补图提示词”
│  └─ 跳过选题，直接进入分页生成与图像处理
├─ “检查哪里不连贯”
│  ├─ 时间顺序问题 → scripts/timeline_tracker.py
│  └─ 角色/术语/风格问题 → scripts/consistency_checker.py
└─ “只要模板或规范”
   └─ 读取 references/storyboard-template-v2.md
```

## 详细工作流

### 阶段 1：成语定义与受众定位

1. 明确成语：字面义、来源故事、现代语境含义。
2. 明确受众：建议 `4-6岁` / `7-9岁` / `10-12岁`。
3. 提炼单句寓意：避免复合价值观混杂。
4. 选择叙事模式：
   - 历史复述型（贴近典故）
   - 现代映射型（校园/家庭场景）
   - 混合型（典故 + 现实应用）

### 阶段 2：生成 12 页故事板骨架

在项目目录运行：

```bash
python3 {baseDir}/scripts/generate_storyboard.py \
  --idiom "守株待兔" \
  --meaning "不能把偶然当作必然" \
  --age "7-9岁" \
  --output ./picturebook/shou-zhu-dai-tu/storyboard.json
```

该脚本会提供：

- 标准 12 页页型（封面/铺垫/冲突/高潮/收束/封底）
- 每页的叙事职能与视觉焦点
- 基础风格配置（配色、构图、文化元素）

### 阶段 3：填充分页文案与视觉提示词

1. 为每页补齐 `scene_description` 和 `text_content`（建议每页 ≤ 50 字）。
2. 运行图像处理脚本生成提示词：

```bash
python3 {baseDir}/scripts/process_images.py \
  --storyboard ./picturebook/shou-zhu-dai-tu/storyboard.json \
  --output ./picturebook/shou-zhu-dai-tu/prompts.json
```

3. 调用图像工具（例如 `txt2img_aly` / `img2img_aly`）逐页产图。
4. 对每页图像执行视觉核验，确保角色外观与时代元素一致。

### 阶段 4：时间线检查（可选但推荐）

若故事含“几日后/次日/当晚”等时间推进，请执行：

```bash
python3 {baseDir}/scripts/timeline_tracker.py \
  ./picturebook/shou-zhu-dai-tu/pages --output markdown
```

重点关注：

- 是否存在未标注时间的页面
- 事件顺序是否倒置
- 同一角色是否出现不合理跨场景跳转

### 阶段 5：一致性检查（强烈推荐）

```bash
python3 {baseDir}/scripts/consistency_checker.py \
  ./picturebook/shou-zhu-dai-tu --output markdown
```

检查维度：

- 角色名与称呼是否统一
- 关键词（成语术语、关键道具）是否漂移
- 风格元素（朝代、服饰、场景）是否冲突
- 寓意表达是否与成语核心含义一致

## 常见请求处理模板

### “帮我把某个成语做成绘本”

1. 先确认成语、受众年龄、风格偏好。
2. 运行 `generate_storyboard.py` 产出骨架。
3. 按页生成文案并补图像提示词。
4. 运行时间线与一致性检查，输出修订建议。

### “我只要图像提示词”

1. 读取现有 `storyboard.json`。
2. 运行 `process_images.py` 生成 `prompts.json`。
3. 按页面类型给出背景图、角色图、合成图三层提示词。

### “检查我的绘本哪里不通顺”

1. 先跑 `timeline_tracker.py` 看顺序。
2. 再跑 `consistency_checker.py` 看命名和世界观冲突。
3. 按严重级别给出修复列表（先改 Critical，再改 Warning）。

## 资源

- `scripts/generate_storyboard.py`：生成 12 页成语绘本结构骨架。
- `scripts/process_images.py`：将故事板转换为背景/角色/合成提示词。
- `scripts/timeline_tracker.py`：抽取并分析分页中的时间线事件。
- `scripts/consistency_checker.py`：检查角色、术语与画风一致性。
- `references/storyboard-template-v2.md`：可直接复用的绘本模板。
- `references/visual-style-guide.md`：儿童向成语绘本视觉规范。

## 最佳实践

1. **先骨架后润色**：先把 12 页跑通，再优化语言。
2. **每页一个核心动作**：减少低龄阅读认知负担。
3. **同一角色固定视觉锚点**：发型、主色、配饰至少固定两项。
4. **寓意只在末段强化一次**：避免说教过度。
5. **改稿后重跑检查脚本**：确保修订不引入新冲突。
