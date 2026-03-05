#!/usr/bin/env python3
"""Generate a standardized 12-page storyboard for Chinese idiom picturebooks."""

import argparse
import json
from pathlib import Path
from typing import Dict


PAGE_BLUEPRINT = [
    (1, "cover", "建立书名识别与主角色视觉锚点"),
    (2, "opening", "交代背景与角色目标"),
    (3, "opening", "引入触发事件"),
    (4, "conflict", "第一次尝试与受阻"),
    (5, "conflict", "冲突升级"),
    (6, "climax", "关键决策或误判"),
    (7, "climax", "成语典故核心画面"),
    (8, "resolution", "后果显现"),
    (9, "resolution", "寓意显性化"),
    (10, "ending", "角色形成新认知"),
    (11, "ending", "现实迁移场景"),
    (12, "back_cover", "温和收束与阅读引导"),
]


def build_storyboard(idiom: str, meaning: str, age: str) -> Dict:
    pages = []
    for number, page_type, visual_focus in PAGE_BLUEPRINT:
        text = ""
        if number == 1:
            text = f"《{idiom}》"
        elif number == 9:
            text = f"这个故事告诉我们：{meaning}"
        elif number == 12:
            text = f"{age}儿童友好成语绘本"

        pages.append(
            {
                "page_number": number,
                "type": page_type,
                "scene_description": "",
                "text_content": text,
                "visual_focus": visual_focus,
            }
        )

    return {
        "story_info": {
            "idiom": idiom,
            "core_meaning": meaning,
            "target_age": age,
            "total_pages": 12,
        },
        "characters": {"main_characters": [], "supporting_characters": []},
        "pages": pages,
        "visual_style": {
            "art_style": "明亮卡通+中国传统元素",
            "color_palette": "暖色高明度，局部冷色点缀",
            "composition": "主体明确，前中后景层次清晰",
            "cultural_elements": "服饰、建筑、器物与成语时代语境一致",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--idiom", required=True)
    parser.add_argument("--meaning", required=True)
    parser.add_argument("--age", default="4-8岁")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    storyboard = build_storyboard(args.idiom, args.meaning, args.age)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Storyboard saved to: {output_path}")


if __name__ == "__main__":
    main()
