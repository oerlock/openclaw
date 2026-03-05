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

## 与图像工具的绑定（本次优化）

当前与生成相关工具为：

- `txt2img_aly`：从文字提示直接生成角色图或背景图
- `img2img_aly`：在已有图基础上做融合/重绘/细化
- `img2txt_aly`：对生成结果做视觉复核（描述画面以便对照检查项）

固定执行顺序：

1. `txt2img_aly` 产角色图 → `img2txt_aly` 检查
2. `txt2img_aly` 产背景图 → `img2txt_aly` 检查
3. `img2img_aly` 做融合图 → `img2txt_aly` 终检

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

## 详细工作流

### 阶段 1：成语定义与受众定位

1. 明确成语：字面义、来源故事、现代语境。
2. 明确受众：建议 `4-6岁` / `7-9岁` / `10-12岁`。
3. 提炼单句寓意：避免多重道理混杂。
4. 选择叙事模式：`historical` / `modern` / `hybrid`。

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

### 阶段 3：生成提示词与三段式产图

先生成统一提示词文件：

```bash
python3 {baseDir}/scripts/process_images.py \
  --storyboard ./picturebook/shou-zhu-dai-tu/storyboard.json \
  --output ./picturebook/shou-zhu-dai-tu/prompts.json
```

然后严格按顺序执行：

1. **角色形象图（character_portraits）**
   - 生成：`txt2img_aly`
   - 检查：`img2txt_aly` 对照 `character_check`
2. **背景图（backgrounds）**
   - 生成：`txt2img_aly`
   - 检查：`img2txt_aly` 对照 `background_check`
3. **融合图（compositions）**
   - 生成：`img2img_aly`
   - 检查：`img2txt_aly` 对照 `composition_check`

> `prompts.json` 中提供了 `tooling`、`generation_order` 与 `review_checklists`，可直接按页执行与验收。

### 阶段 4：时间线检查（推荐）

```bash
python3 {baseDir}/scripts/timeline_tracker.py \
  ./picturebook/shou-zhu-dai-tu/pages --output markdown
```

关注：缺失时间标记、天数倒退。

### 阶段 5：一致性检查（推荐）

```bash
python3 {baseDir}/scripts/consistency_checker.py \
  ./picturebook/shou-zhu-dai-tu --output markdown
```

关注：多成语漂移、角色命名变体、低频角色、缺失时间标记。

## 交付验收清单

- [ ] 12 页结构完整，页号连续
- [ ] 每页文案建议 ≤ 50 字
- [ ] `txt2img_aly` 角色图 + `img2txt_aly` 检查完成
- [ ] `txt2img_aly` 背景图 + `img2txt_aly` 检查完成
- [ ] `img2img_aly` 融合图 + `img2txt_aly` 检查完成
- [ ] 时间线检查通过（或异常已解释）
- [ ] 一致性检查通过（或异常已解释）

## 资源

- `scripts/generate_storyboard.py`：生成 12 页成语绘本骨架。
- `scripts/process_images.py`：生成角色图/背景图/融合图提示词与检查清单。
- `scripts/timeline_tracker.py`：提取时间标记并检查时间顺序。
- `scripts/consistency_checker.py`：检查角色命名、成语主题与基础一致性。
- `references/storyboard-template-v2.md`：绘本模板。
- `references/visual-style-guide.md`：视觉规范。
