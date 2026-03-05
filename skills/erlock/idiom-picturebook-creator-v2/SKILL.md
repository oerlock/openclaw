---
name: idiom-picturebook-creator-v2
description: 面向中文儿童教育场景的成语绘本生产技能。提供“成语解析 → 12页分镜 → 图像提示词 → 自动质检 → Markdown排版稿”一体化流程，适合稳定批量产出。
metadata: { "openclaw": { "emoji": "📖", "requires": { "bins": ["python3"] } } }
---

# Idiom Picturebook Creator v2

## 能力概览

- 基于成语生成**固定12页**故事板（JSON）。
- 自动产出背景/角色/合成提示词（JSON）。
- 自动执行质量检查（页数、字段完整、文案长度、角色信息）。
- 生成可直接审稿的 Markdown 草稿。

## 目录约定

建议每个成语使用独立目录：

- `picturebook/<成语>/storyboard.json`
- `picturebook/<成语>/prompts.json`
- `picturebook/<成语>/draft.md`

## 决策树

```text
用户请求
├─ “先起一个成语绘本骨架”
│  └─ generate_storyboard.py
├─ “生成画图提示词”
│  └─ process_images.py --mode prompts
├─ “检查质量/是否可交付”
│  └─ process_images.py --mode validate
└─ “导出审稿稿件”
   └─ process_images.py --mode markdown
```

## 标准流程

### 1) 生成故事板

```bash
python3 skills/erlock/idiom-picturebook-creator-v2/scripts/generate_storyboard.py \
  "守株待兔" "不要侥幸等待，要主动努力" \
  --target-age "5-8岁" \
  --tone "温馨" \
  --output "picturebook/守株待兔/storyboard.json"
```

### 2) 补全内容

按 `references/storyboard-template.md` 补齐：

- 非封面页 `scene_description`
- 每页 `text_content`（建议 ≤ 50 字）
- `main_characters` 的名称/外观/性格/作用

### 3) 生成提示词

```bash
python3 skills/erlock/idiom-picturebook-creator-v2/scripts/process_images.py \
  --mode prompts \
  --storyboard picturebook/守株待兔/storyboard.json \
  --output picturebook/守株待兔/prompts.json
```

### 4) 质量检查

```bash
python3 skills/erlock/idiom-picturebook-creator-v2/scripts/process_images.py \
  --mode validate \
  --storyboard picturebook/守株待兔/storyboard.json
```

### 5) 导出 Markdown 审稿稿

```bash
python3 skills/erlock/idiom-picturebook-creator-v2/scripts/process_images.py \
  --mode markdown \
  --storyboard picturebook/守株待兔/storyboard.json \
  --output picturebook/守株待兔/draft.md
```

## 输出规范

- 页面总数：12
- 尺寸：1664x928（横）/ 928x1664（竖）
- 文案建议：每页 ≤ 50 字
- 风格建议：明亮卡通 + 中国传统元素
