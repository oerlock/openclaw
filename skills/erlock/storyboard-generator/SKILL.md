---
name: storyboard-generator
description: 基于输入的故事文本生成完整的故事板，包含智能剧本结构分析、动态分镜脚本生成、多角色设计、AI图像提示词生成、角色一致性控制和Markdown格式输出。支持多种艺术风格（电影、卡通、水彩、动漫、漫画、写实）和不同长度故事的自适应处理。当用户需要将故事转换为可视化故事板、创建动画或电影预制作素材、或需要结构化的视觉叙事输出时使用此技能。
---

# Storyboard Generator

本技能将输入的故事文本转换为完整的可视化故事板，遵循专业的故事板制作流程，并根据故事长度和内容智能调整输出复杂度。

## 工作流程

1. **智能剧本结构生成** - 分析输入故事并生成三幕式剧本结构，根据故事长度自动调整复杂度
2. **动态分镜脚本生成** - 将剧本分解为具体的镜头序列，短故事生成6个镜头，中等故事9个，长篇最多15个
3. **多角色设计** - 为故事中的主要角色创建详细的设计文档，支持2-6个角色的自适应生成
4. **AI图像提示词生成** - 为每个关键镜头生成详细的AI图像生成提示词，支持6种艺术风格
5. **角色一致性控制** - 确保所有画面中角色外观保持一致，提供详细的视觉指南和一致性报告
6. **结构化Markdown输出** - 输出完整的Markdown故事板文档，包含所有视觉和文本信息

## 使用方法

### 输入要求
- 提供完整的故事文本文件（UTF-8编码）
- 可选：指定艺术风格（cinematic, cartoon, watercolor, anime, comic, realistic）
- 故事长度支持：短篇(<500字)、中篇(500-2000字)、长篇(>2000字)

### 输出格式
所有输出文件将保存在项目根目录的 `output/storyboard/<story_name>/` 目录中：

```
output/storyboard/<故事名称>/
├── storyboard.md              # 完整的故事板Markdown文档
├── script_structure.json      # 剧本结构数据
├── shot_list.json            # 分镜脚本数据  
├── characters/               # 角色设计JSON文件
│   ├── character_01_<name>.json
│   └── ...
└── shots/                    # 图像提示词和一致性控制
    ├── shot_001.png          # (需手动生成)
    ├── image_prompts.json
    └── consistent_image_prompts.json
```

## 资源目录

### scripts/
- `main_workflow.py` - 主工作流脚本（推荐使用，包含错误处理和进度跟踪）
- `generate_script_structure.py` - 智能剧本结构分析和生成
- `create_shot_list.py` - 动态分镜脚本生成（根据故事长度调整镜头数量）
- `design_characters.py` - 多角色设计生成（2-6个角色自适应）
- `generate_storyboard_images.py` - AI图像提示词生成（支持6种艺术风格）
- `ensure_character_consistency.py` - 角色一致性控制和报告生成
- `compile_storyboard.py` - 结构化Markdown故事板编译

### references/
- `storyboard_templates.md` - 现代故事板标准格式和最佳实践
- `shot_types_reference.md` - 镜头类型和技术术语参考
- `character_design_guidelines.md` - 角色设计最佳实践

### assets/
- `templates/` - Markdown模板和示例文件
- `style_references/` - 不同艺术风格的参考图像

## 执行步骤

### 推荐方式：使用主工作流脚本
```bash
python3 scripts/main_workflow.py <input_story_file> <base_output_directory> [style]
```

**示例：**
```bash
# 电影风格
python3 scripts/main_workflow.py ./stories/my_story.txt ./output cinematic

# 卡通风格  
python3 scripts/main_workflow.py ./stories/short_tale.txt ./output cartoon
```

### 手动执行步骤：
1. 在 `output/storyboard/<story_name>/` 目录中生成剧本结构文档 (`script_structure.json`)
2. 在 `output/storyboard/<story_name>/` 目录中创建详细的分镜脚本 (`shot_list.json`)
3. 在 `output/storyboard/<story_name>/characters/` 目录中为每个主要角色生成设计文档
4. 在 ` `output/storyboard/<story_name>/shots/` 目录中生成AI图像提示词
5. 应用角色一致性控制确保视觉统一
6. 在 `output/storyboard/<story_name>/` 目录中编译最终的故事板输出 (`storyboard.md`)

## 支持的艺术风格

- **cinematic**: 电影摄影风格（默认）
- **cartoon**: 动画卡通风格
- **watercolor**: 水彩绘画风格  
- **anime**: 日式动漫风格
- **comic**: 漫画书风格
- **realistic**: 超写实风格

## 注意事项

- **输入文件**: 必须是UTF-8编码的文本文件
- **图像生成**: 脚本生成提示词，实际图像需要使用AI图像生成工具手动创建
- **文件命名**: 故事名称会自动清理特殊字符以确保文件系统兼容性
- **错误处理**: 主工作流包含完整的错误处理和超时保护（5分钟每步）
- **调试建议**: 如遇问题，可单独运行各个脚本进行调试