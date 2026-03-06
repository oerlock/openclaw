#!/usr/bin/env python3
"""
故事板画面生成脚本
基于分镜脚本和角色设计生成视觉画面提示词，支持多种艺术风格
"""

import json
import sys
from pathlib import Path

def load_characters(characters_dir: Path) -> dict:
    """加载所有角色设计"""
    characters = {}
    for char_file in sorted(characters_dir.glob("*.json")):
        with open(char_file, 'r', encoding='utf-8') as f:
            char_data = json.load(f)
            char_name = char_data["name"]
            characters[char_name] = char_data
    return characters

def get_style_prompts(style: str) -> dict:
    """获取不同艺术风格的提示词模板"""
    style_templates = {
        "cinematic": {
            "base": "cinematic photography, film still, high quality, 8k resolution",
            "lighting": "dramatic lighting, cinematic shadows",
            "camera": "professional cinematography"
        },
        "cartoon": {
            "base": "cartoon style, animated movie, clean lines, vibrant colors",
            "lighting": "bright and cheerful lighting",
            "camera": "animated film composition"
        },
        "watercolor": {
            "base": "watercolor painting, artistic illustration, soft edges, painterly",
            "lighting": "soft natural lighting",
            "camera": "artistic composition"
        },
        "anime": {
            "base": "anime style, Japanese animation, detailed eyes, vibrant colors",
            "lighting": "anime lighting with rim lights",
            "camera": "anime cinematography"
        },
        "comic": {
            "base": "comic book style, bold lines, halftone dots, comic art",
            "lighting": "high contrast comic lighting",
            "camera": "comic panel composition"
        },
        "realistic": {
            "base": "photorealistic, ultra realistic, detailed textures, 8k",
            "lighting": "natural realistic lighting",
            "camera": "professional photography"
        }
    }
    
    return style_templates.get(style, style_templates["cinematic"])

def generate_image_prompt(shot: dict, characters: dict, style: str = "cinematic") -> str:
    """
    为特定镜头生成图像提示词
    
    Args:
        shot: 分镜信息
        characters: 角色设计字典
        style: 艺术风格
        
    Returns:
        图像生成提示词
    """
    # 获取风格模板
    style_prompts = get_style_prompts(style)
    
    # 构建基础提示词
    prompt_parts = [style_prompts["base"]]
    
    # 添加镜头类型描述
    shot_type_descriptions = {
        "extreme_wide_shot": "extreme wide shot showing vast environment",
        "wide_shot": "wide shot establishing scene and characters",
        "medium_shot": "medium shot showing character from waist up",
        "medium_close_up": "medium close up focusing on upper body and face",
        "close_up": "close up shot of face and expressions",
        "extreme_close_up": "extreme close up of specific details",
        "over_the_shoulder": "over the shoulder shot showing perspective",
        "low_angle": "low angle shot making subject appear powerful",
        "high_angle": "high angle shot making subject appear vulnerable"
    }
    
    shot_type = shot["shot_type"]
    if shot_type in shot_type_descriptions:
        prompt_parts.append(shot_type_descriptions[shot_type])
    else:
        prompt_parts.append(shot_type.replace('_', ' '))
    
    # 添加场景描述
    prompt_parts.append(shot["description"])
    
    # 添加角色信息（如果描述中包含角色名称）
    description_lower = shot["description"].lower()
    for char_name, char_data in characters.items():
        if char_name.lower() in description_lower:
            # 添加角色外观特征
            appearance = char_data["appearance"]
            char_features = []
            
            if "clothing" in appearance and appearance["clothing"]:
                char_features.append(appearance["clothing"])
            if "hair" in appearance and appearance["hair"]:
                char_features.append(f"with {appearance['hair']} hair")
            if "distinctive_features" in appearance and appearance["distinctive_features"]:
                features = ", ".join(appearance["distinctive_features"])
                char_features.append(f"featuring {features}")
            
            if char_features:
                prompt_parts.append(f"character {char_name} {' '.join(char_features)}")
    
    # 添加技术细节
    prompt_parts.extend([
        style_prompts["lighting"],
        style_prompts["camera"],
        "sharp focus, well composed, professional quality"
    ])
    
    return ", ".join(prompt_parts)

def main():
    if len(sys.argv) < 4:
        print("Usage: generate_storyboard_images.py <shots_file> <characters_dir> <output_images_dir> [style]")
        print("Available styles: cinematic, cartoon, watercolor, anime, comic, realistic")
        print("Example: generate_storyboard_images.py ./shot_list.json ./characters ./shots cinematic")
        sys.exit(1)
    
    shots_file = Path(sys.argv[1])
    characters_dir = Path(sys.argv[2])
    output_dir = Path(sys.argv[3])
    style = sys.argv[4] if len(sys.argv) > 4 else "cinematic"
    
    if not shots_file.exists():
        print(f"Error: Shots file {shots_file} does not exist")
        sys.exit(1)
    
    if not characters_dir.exists():
        print(f"Error: Characters directory {characters_dir} does not exist")
        sys.exit(1)
    
    try:
        # 加载分镜
        with open(shots_file, 'r', encoding='utf-8') as f:
            shots = json.load(f)
        
        # 加载角色设计
        characters = load_characters(characters_dir)
        
        # 为每个镜头生成图像提示词
        image_prompts = []
        for shot in shots:
            prompt = generate_image_prompt(shot, characters, style)
            image_prompts.append({
                "shot_id": shot["shot_id"],
                "shot_description": shot["description"],
                "prompt": prompt,
                "output_file": f"shot_{shot['shot_id']}.png",
                "style": style
            })
        
        # 创建输出目录
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 输出图像提示词文件
        prompts_file = output_dir / "image_prompts.json"
        with open(prompts_file, 'w', encoding='utf-8') as f:
            json.dump(image_prompts, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Image prompts generated successfully: {prompts_file}")
        print(f"  Style: {style}")
        print(f"  Total prompts: {len(image_prompts)}")
        print("Note: Actual image generation should be handled by AI image generation tools")
        
    except Exception as e:
        print(f"Error generating image prompts: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()