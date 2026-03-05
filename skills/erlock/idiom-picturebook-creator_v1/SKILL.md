---
name: idiom-picturebook-creator
description: 协助从中国成语出发完成绘本项目全流程：选题与史料提炼、12页故事板生成、分镜文案完善、图像提示词产出与一致性检查，适用于需要“故事+插图规划”交付的儿童教育内容场景。
metadata: { "openclaw": { "emoji": "📚", "requires": { "bins": ["python3"] } } }
---

# Idiom Picturebook Creator

## 概述

该技能基于 storyboard-manager 的方法论重构，提供“规划 → 分镜 → 视觉 → 质检”的标准流程，帮助 Agent 以稳定结构产出中国成语绘本。

核心目标：

- 保证故事寓意准确，不偏离成语本义。
- 保证页面结构完整（默认 12 页）。
- 保证图像提示词与文案相互一致。
- 保证语言适龄（默认 4-8 岁，每页文案简短易读）。

## 核心能力

### 1. 选题与寓意提炼

- 将成语拆解为“字面含义 + 历史典故 + 当代启发”。
- 明确目标年龄层与阅读难度。

### 2. 结构化故事板生成

- 使用 `scripts/generate_storyboard.py` 生成标准 12 页 JSON 模板。
- 自动填入页面类型（封面、开场、冲突、高潮、解决、结尾、封底）。

### 3. 视觉提示词与分镜对齐

- 使用 `scripts/process_images.py` 产出背景、角色、合成提示词。
- 将每页“视觉重点”与画面生成提示词绑定，减少风格漂移。

### 4. 一致性与完备性检查

- 检查必填字段（成语、寓意、场景描述、角色信息）。
- 检查页数、文案长度与视觉规格是否满足约束。

## 项目结构检测

优先检测并复用以下目录：

- `picturebook/`
- `storyboard/`
- `assets/`、`images/`

若不存在，默认建议结构：

- `picturebook/<成语>/storyboard.json`
- `picturebook/<成语>/prompts.json`
- `picturebook/<成语>/draft.md`

## 工作流决策树

```text
用户请求
├─ “生成成语绘本/分镜”
│  └─ 运行 generate_storyboard.py 生成初稿结构
├─ “补全页面文案/角色”
│  └─ 更新 storyboard.json 的 pages 与 characters
├─ “生成画图提示词”
│  └─ 运行 process_images.py 输出 prompts
└─ “检查是否完整/连贯”
   └─ 运行 process_images.py 的 validate 流程并修复缺项
```

## 标准执行流程

### 第 1 步：收集上下文

先确认以下输入：

- 成语名称
- 核心寓意
- 目标年龄（默认 4-8 岁）
- 叙事风格（温馨/幽默/冒险等）

### 第 2 步：生成故事板骨架

```bash
python3 skills/erlock/idiom-picturebook-creator_v1/scripts/generate_storyboard.py \
  "守株待兔" "不应侥幸等待，要靠主动努力" \
  --target-age "5-8岁" \
  --output-dir "picturebook/守株待兔"
```

### 第 3 步：完善分镜内容

基于 `references/storyboard-template.md` 补全：

- 每页 `scene_description`
- 每页 `text_content`（建议 <= 50 字）
- 主要角色设定（名称、外观、性格、作用）

### 第 4 步：生成视觉提示词

```bash
python3 skills/erlock/idiom-picturebook-creator_v1/scripts/process_images.py \
  --storyboard "picturebook/守株待兔/守株待兔_storyboard.json" \
  --output "picturebook/守株待兔/prompts.json"
```

### 第 5 步：一致性检查

在交付前确认：

- 非封面页均已填写场景描述。
- 角色形象与故事时代背景一致。
- 高潮页是否完整承载“成语关键事件”。
- 结尾页是否给出儿童可理解的现实迁移。

## 输出标准

- 图像尺寸：`1664x928`（横向）或 `928x1664`（纵向）
- 文本长度：每页建议不超过 50 字
- 艺术风格：明亮卡通 + 中国传统元素
- 交付文件：`storyboard.json` + `prompts.json` + 可选排版稿

## 何时使用

- 用户要“把成语做成儿童绘本”。
- 用户要“图文并茂解释某个成语”。
- 用户要“标准化成语故事板流程 + 图像提示词”。
