# Storyboard Templates

## 现代故事板标准格式

### Markdown 输出结构
```
output/storyboard/<story_name>/
├── storyboard.md              # 主故事板文档
├── script_structure.json      # 剧本结构数据
├── shot_list.json            # 分镜脚本数据  
├── characters/
│   ├── character_01_<name>.json
│   └── character_02_<name>.json
└── shots/
    ├── shot_001.png
    ├── shot_002.png
    ├── image_prompts.json
    └── consistent_image_prompts.json
```

### Markdown 故事板模板
```markdown
# Storyboard: [Story Title]

*Generated on: [timestamp]*
*Total shots: [number]*

## Character Designs

### [Character Name] ([Role])
- **Story**: [Story Title]
- **Age Range**: [age range]
- **Height**: [height description]  
- **Build**: [build description]
- **Hair**: [hair description]
- **Eyes**: [eye description]
- **Clothing**: [clothing description]
- **Distinctive Features**: [unique features]
- **Personality Traits**: [personality traits]
- **Consistency Notes**: [visual consistency guidance]

## Shot List

### Shot [001]: [Description]
- **Scene**: [act_1/act_2/act_3]
- **Type**: [Shot Type]
- **Duration**: [duration]
- **Camera Movement**: [movement type]

![Shot 001 - Description](./shots/shot_001.png)
```

## 支持的艺术风格

### Cinematic (电影风格)
- **特点**: 电影摄影质感，戏剧性光影，专业构图
- **适用**: 电影预制作，严肃叙事
- **提示词**: "cinematic photography, film still, high quality, 8k resolution"

### Cartoon (卡通风格)  
- **特点**: 动画电影风格，清晰线条，鲜艳色彩
- **适用**: 动画项目，儿童内容
- **提示词**: "cartoon style, animated movie, clean lines, vibrant colors"

### Watercolor (水彩风格)
- **特点**: 水彩绘画效果，柔和边缘，艺术感强
- **适用**: 艺术项目，温馨故事
- **提示词**: "watercolor painting, artistic illustration, soft edges, painterly"

### Anime (动漫风格)
- **特点**: 日式动画风格，大眼睛，鲜艳色彩
- **适用**: 动漫项目，年轻受众
- **提示词**: "anime style, Japanese animation, detailed eyes, vibrant colors"

### Comic (漫画风格)
- **特点**: 漫画书风格，粗线条，网点效果
- **适用**: 漫画创作，超级英雄故事
- **提示词**: "comic book style, bold lines, halftone dots, comic art"

### Realistic (写实风格)
- **特点**: 超写实质感，详细纹理，真实光影
- **适用**: 写实项目，产品演示
- **提示词**: "photorealistic, ultra realistic, detailed textures, 8k"

## 角色设计最佳实践

### 文件命名规范
- `character_01_protagonist.json` - 主角
- `character_02_antagonist.json` - 反派  
- `character_03_mentor.json` - 导师
- 使用数字前缀确保排序正确

### JSON 结构标准
```json
{
  "name": "角色名称",
  "role": "protagonist|antagonist|mentor|ally|love_interest",
  "story_title": "故事标题",
  "appearance": {
    "age_range": "年龄范围",
    "height": "身高描述", 
    "build": "体型描述",
    "hair": "发型和发色",
    "eyes": "眼睛颜色和特征",
    "clothing": "服装描述",
    "distinctive_features": ["独特特征1", "独特特征2"]
  },
  "personality_traits": ["性格特征1", "性格特征2"],
  "visual_consistency_notes": "视觉一致性说明"
}
```

## 工作流程优化建议

### 短故事 (<500字)
- 生成6个关键镜头
- 2个主要角色
- 简化剧本结构

### 中等故事 (500-2000字)  
- 生成9个详细镜头
- 3-4个角色
- 标准三幕式结构

### 长篇故事 (>2000字)
- 生成最多15个镜头
- 5-6个角色
- 复杂多层结构

### 错误处理和调试
- 检查输入文件编码（必须是UTF-8）
- 验证输出目录权限
- 查看各步骤的日志输出
- 使用单个脚本进行独立测试