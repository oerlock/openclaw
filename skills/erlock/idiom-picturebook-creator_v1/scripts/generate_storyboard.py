#!/usr/bin/env python3
"""
Generate a structured storyboard for Chinese idiom picture books.
This script creates a standardized story structure based on the idiom provided.
"""

import json
import os
from typing import Dict, List

def create_storyboard_structure(idiom: str, core_meaning: str, target_age: str = "4-8岁") -> Dict:
    """
    Create a standardized storyboard structure for an idiom picture book.
    
    Args:
        idiom: The Chinese idiom to illustrate
        core_meaning: The core meaning or moral of the idiom
        target_age: Target age group for the story
    
    Returns:
        Dictionary containing the complete storyboard structure
    """
    
    # Basic story info
    storyboard = {
        "story_info": {
            "idiom": idiom,
            "core_meaning": core_meaning,
            "target_age": target_age,
            "total_pages": 12
        },
        "characters": {
            "main_characters": [],
            "supporting_characters": []
        },
        "pages": [
            {
                "page_number": 1,
                "type": "cover",
                "scene_description": "",
                "text_content": f"《{idiom}》\n成语故事绘本",
                "visual_focus": ""
            },
            {
                "page_number": 2,
                "type": "opening",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "角色介绍和背景设定"
            },
            {
                "page_number": 3,
                "type": "opening",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "故事开始的场景"
            },
            {
                "page_number": 4,
                "type": "conflict_start",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "问题或挑战的出现"
            },
            {
                "page_number": 5,
                "type": "conflict_start",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "角色面对困难"
            },
            {
                "page_number": 6,
                "type": "climax",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "成语典故的关键时刻"
            },
            {
                "page_number": 7,
                "type": "climax",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "高潮场景的细节"
            },
            {
                "page_number": 8,
                "type": "resolution",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "问题的解决"
            },
            {
                "page_number": 9,
                "type": "resolution",
                "scene_description": "",
                "text_content": f"这个故事告诉我们：{core_meaning}",
                "visual_focus": "寓意的视觉化表达"
            },
            {
                "page_number": 10,
                "type": "ending",
                "scene_description": "",
                "text_content": "",
                "visual_focus": "角色的成长或变化"
            },
            {
                "page_number": 11,
                "type": "ending",
                "scene_description": "",
                "text_content": "在生活中，我们也要记住这个道理！",
                "visual_focus": "现代生活中的应用"
            },
            {
                "page_number": 12,
                "type": "back_cover",
                "scene_description": "",
                "text_content": f"《{idiom}》成语故事\n适合{target_age}儿童阅读",
                "visual_focus": "温馨的结束画面"
            }
        ],
        "visual_style": {
            "art_style": "明亮卡通风格，融入中国传统元素",
            "color_palette": "温暖明亮的色彩，适合儿童",
            "composition": "清晰的构图，重点突出角色和关键动作",
            "cultural_elements": "根据成语背景适当融入传统中国元素"
        }
    }
    
    return storyboard

def save_storyboard(storyboard: Dict, output_dir: str, idiom: str) -> str:
    """Save the storyboard to a JSON file."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{idiom}_storyboard.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(storyboard, f, ensure_ascii=False, indent=2)
    
    return filepath

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python generate_storyboard.py <idiom> <core_meaning>")
        sys.exit(1)
    
    idiom = sys.argv[1]
    core_meaning = sys.argv[2]
    
    storyboard = create_storyboard_structure(idiom, core_meaning)
    output_file = save_storyboard(storyboard, "./output", idiom)
    print(f"Storyboard saved to: {output_file}")