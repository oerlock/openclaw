---
name: idiom-picturebook-creator-v2
description: 面向中国成语绘本创作的结构化技能，支持成语选题、12页故事板编排、分镜文案、画面提示词生成，以及时间线/一致性检查。适用于创建儿童教育向图文故事或迭代已有绘本项目。
metadata: { "openclaw": { "emoji": "📚", "requires": { "bins": ["python3"] } } }
---

# Idiom Picturebook Creator v2

## 概述

该技能基于 `reference_code/storyboard-manager-v1` 的工作流重构，针对中国成语绘本提供可审查、可复用、可迭代的生产路径：

1. 成语选题与寓意抽取
2. 12 页故事板结构生成
3. 三段式产图（角色图 → 背景图 → 融合图）
4. 时间线检查
5. 一致性检查

## 推荐项目结构

```text
project-root/
├─ picturebook/
│  └─ <idiom-slug>/
│     ├─ storyboard.json
│     ├─ prompts.json
│     ├─ pages/
│     │  ├─ page-01.md
│     │  └─ ...
│     ├─ assets/
│     │  ├─ characters/
│     │  ├─ backgrounds/
│     │  └─ compositions/
│     └─ export/
├─ glossary.md
└─ notes.md
```

## 工作流决策树

```text
用户请求
├─ “从成语开始做一本绘本”
│  └─ 完整流程（选题 → 故事板 → 三段式产图 → 检查）
├─ “已有故事，补图像提示词”
│  └─ 直接进入 process_images.py + 检查
├─ “检查哪里不连贯”
│  ├─ 时间顺序问题 → timeline_tracker.py
│  └─ 角色/术语/风格问题 → consistency_checker.py
└─ “只要模板”
   └─ 读取 references/storyboard-template-v2.md
```

## 详细工作流

### 阶段 1：成语定义与受众定位

1. 明确成语：字面义、来源故事、现代语境。
2. 明确受众：建议 `4-6岁` / `7-9岁` / `10-12岁`。
3. 提炼单句寓意：避免多重道理混杂。
4. 选择叙事模式：
   - `historical`（历史复述）
   - `modern`（现代映射）
   - `hybrid`（典故+现实）

### 阶段 2：生成 12 页故事板骨架

```bash
python3 {baseDir}/scripts/generate_storyboard.py \
  --idiom "守株待兔" \
  --meaning "不能把偶然当作必然" \
  --age "7-9岁" \
  --mode hybrid \
  --orientation landscape \
  --output ./picturebook/shou-zhu-dai-tu/storyboard.json
```

脚本输出包含：`story_info`、`pages`、`visual_style`、`production_flow`。

### 阶段 3：三段式产图与检查（核心优化）

先运行提示词生成：

```bash
python3 {baseDir}/scripts/process_images.py \
  --storyboard ./picturebook/shou-zhu-dai-tu/storyboard.json \
  --output ./picturebook/shou-zhu-dai-tu/prompts.json
```

然后按固定顺序执行：

1. **角色形象图（character_portraits）**
   - 检查：发型/主色/标志道具一致性
   - 检查：年龄感与受众匹配
   - 检查：表情动作与页面情绪一致
2. **背景图（backgrounds）**
   - 检查：时代与文化元素匹配成语语境
   - 检查：构图预留角色站位
   - 检查：信息密度不过载
3. **融合图（compositions）**
   - 检查：透视、光照、阴影方向一致
   - 检查：角色与道具交互自然
   - 检查：核心动作一眼可读

> `prompts.json` 中的 `review_checklists` 可直接作为逐页验收单。

### 阶段 4：时间线检查（推荐）

```bash
python3 {baseDir}/scripts/timeline_tracker.py \
  ./picturebook/shou-zhu-dai-tu/pages --output markdown
```

重点关注：

- 缺失时间标记的页面
- 天数倒退导致的顺序异常

### 阶段 5：一致性检查（推荐）

```bash
python3 {baseDir}/scripts/consistency_checker.py \
  ./picturebook/shou-zhu-dai-tu --output markdown
```

重点关注：

- 多成语漂移（主题跑偏）
- 角色命名变体（同名多写法）
- 低频角色是否是误拼写
- 缺失时间标记文件（与时间线报告交叉）

## 交付验收清单

- [ ] 12 页结构完整，页号连续
- [ ] 每页文案建议 ≤ 50 字
- [ ] 三段式产图已按顺序执行并检查
- [ ] 时间线检查通过（或异常已解释）
- [ ] 一致性检查通过（或异常已解释）

## 资源

- `scripts/generate_storyboard.py`：生成 12 页成语绘本骨架。
- `scripts/process_images.py`：生成角色图/背景图/融合图提示词与检查清单。
- `scripts/timeline_tracker.py`：提取时间标记并检查时间顺序。
- `scripts/consistency_checker.py`：检查角色命名、成语主题与基础一致性。
- `references/storyboard-template-v2.md`：绘本模板。
- `references/visual-style-guide.md`：视觉规范。
