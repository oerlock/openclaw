#!/usr/bin/env python3
"""
角色设计脚本
为故事中的主要角色创建详细的设计文档，支持多角色和复杂特征
"""

import json
import sys
import re
from pathlib import Path

def extract_characters_from_story(story_text: str, word_count: int) -> list:
    """
    从故事文本中提取主要角色
    
    Args:
        story_text: 故事文本
        word_count: 故事字数
        
    Returns:
        角色列表
    """
    # 这里应该使用NLP技术来识别角色
    # 为了示例，根据故事长度返回不同数量的角色
    
    if word_count < 500:
        # 短故事 - 2个主要角色
        characters = [
            {
                "name": "主角",
                "role": "protagonist",
                "description": "故事的主要推动者"
            },
            {
                "name": "对手", 
                "role": "antagonist_or_obstacle",
                "description": "为主角制造障碍的角色或力量"
            }
        ]
    elif word_count < 2000:
        # 中等故事 - 3-4个角色
        characters = [
            {
                "name": "主角",
                "role": "protagonist",
                "description": "故事的核心人物"
            },
            {
                "name": "反派",
                "role": "antagonist", 
                "description": "主要的对立角色"
            },
            {
                "name": "导师",
                "role": "mentor",
                "description": "指导主角的角色"
            },
            {
                "name": "盟友",
                "role": "ally",
                "description": "支持主角的角色"
            }
        ]
    else:
        # 长篇故事 - 5-6个角色
        characters = [
            {
                "name": "主角",
                "role": "protagonist",
                "description": "故事的主要英雄"
            },
            {
                "name": "主要反派",
                "role": "main_antagonist",
                "description": "核心对立力量"
            },
            {
                "name": "次要反派",
                "role": "secondary_antagonist",
                "description": "辅助性的对立角色"
            },
            {
                "name": "导师",
                "role": "mentor",
                "description": "提供智慧和指导的角色"
            },
            {
                "name": "盟友",
                "role": "ally",
                "description": "主角的忠实伙伴"
            },
            {
                "name": "爱情兴趣",
                "role": "love_interest",
                "description": "情感线索相关角色"
            }
        ]
    
    return characters

def generate_character_design(character: dict, story_title: str, word_count: int) -> dict:
    """
    为单个角色生成详细设计
    
    Args:
        character: 基本角色信息
        story_title: 故事标题
        word_count: 故事字数
        
    Returns:
        详细的角色设计
    """
    role = character["role"]
    name = character["name"]
    
    # 根据角色类型和故事长度生成不同的设计细节
    design = {
        "name": name,
        "role": role,
        "story_title": story_title,
        "appearance": {
            "age_range": "",
            "height": "",
            "build": "",
            "hair": "",
            "eyes": "",
            "clothing": "",
            "distinctive_features": []
        },
        "personality_traits": [],
        "visual_consistency_notes": f"在所有镜头中保持{name}的外观特征一致",
        "reference_images": []  # 将在图像生成阶段填充
    }
    
    # 基于角色类型设置默认特征
    if "protagonist" in role:
        design["appearance"].update({
            "age_range": "25-35",
            "height": "average to tall",
            "build": "athletic or average",
            "hair": "dark brown, medium length with slight waves",
            "eyes": "determined brown eyes",
            "clothing": "practical but distinctive clothing that reflects their journey",
            "distinctive_features": ["small scar on left eyebrow", "wears a meaningful pendant"]
        })
        design["personality_traits"] = ["determined", "resourceful", "loyal", "growth-oriented"]
        
    elif "antagonist" in role:
        design["appearance"].update({
            "age_range": "30-45",
            "height": "tall and imposing",
            "build": "strong or lean",
            "hair": "slicked back black hair or bald",
            "eyes": "cold, calculating eyes",
            "clothing": "expensive, dark clothing that conveys power",
            "distinctive_features": ["sharp facial features", "always wears gloves"]
        })
        design["personality_traits"] = ["manipulative", "intelligent", "ruthless", "confident"]
        
    elif "mentor" in role:
        design["appearance"].update({
            "age_range": "50-70",
            "height": "average",
            "build": "slender or slightly overweight",
            "hair": "gray or white, neatly styled",
            "eyes": "wise, kind eyes with laugh lines",
            "clothing": "comfortable, scholarly or traditional clothing",
            "distinctive_features": ["glasses", "walking cane or staff"]
        })
        design["personality_traits"] = ["wise", "patient", "mysterious", "caring"]
        
    elif "ally" in role:
        design["appearance"].update({
            "age_range": "20-30",
            "height": "average",
            "build": "athletic",
            "hair": "blonde or red, practical short style",
            "eyes": "friendly blue or green eyes",
            "clothing": "casual, functional clothing suitable for action",
            "distinctive_features": ["freckles", "always carries a utility belt"]
        })
        design["personality_traits"] = ["loyal", "brave", "humorous", "reliable"]
        
    elif "love_interest" in role:
        design["appearance"].update({
            "age_range": "25-35",
            "height": "average to tall",
            "build": "graceful",
            "hair": "long, flowing hair in warm tones",
            "eyes": "expressive, warm eyes",
            "clothing": "elegant but practical clothing",
            "distinctive_features": ["unique jewelry", "gentle smile"]
        })
        design["personality_traits"] = ["compassionate", "strong-willed", "supportive", "independent"]
    
    # 根据故事长度调整细节丰富度
    if word_count > 2000:
        # 长篇故事 - 添加更多细节
        design["appearance"]["posture"] = "confident and purposeful"
        design["appearance"]["voice_description"] = "clear and expressive"
        design["background_notes"] = f"{name} has a complex backstory that influences their appearance and behavior"
    
    return design

def sanitize_filename(name: str) -> str:
    """清理角色名称以用作文件名"""
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', name)
    return sanitized.strip()

def main():
    if len(sys.argv) != 4:
        print("Usage: design_characters.py <input_story_file> <output_characters_dir> <story_title>")
        print("Example: design_characters.py ./input/story.txt ./output/characters 'My Story'")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    story_title = sys.argv[3]
    
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            story_text = f.read()
        
        # 估算字数
        word_count = len(story_text.split())
        
        # 提取角色
        characters = extract_characters_from_story(story_text, word_count)
        
        # 创建输出目录
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 为每个角色生成设计
        for i, character in enumerate(characters):
            design = generate_character_design(character, story_title, word_count)
            safe_name = sanitize_filename(character["name"])
            output_file = output_dir / f"character_{i+1:02d}_{safe_name}.json"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(design, f, ensure_ascii=False, indent=2)
            
            print(f"✓ Character design generated: {output_file.name}")
        
        print(f"Total characters designed: {len(characters)}")
        
    except Exception as e:
        print(f"Error designing characters: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()