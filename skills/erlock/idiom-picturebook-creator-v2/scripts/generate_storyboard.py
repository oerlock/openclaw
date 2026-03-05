#!/usr/bin/env python3
"""Generate v2 idiom picturebook storyboard."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

DEFAULT_TARGET_AGE = "4-8岁"
DEFAULT_TONE = "温馨"

PAGE_BLUEPRINT = [
    (1, "cover", "封面标题与主题", "《{idiom}》\n成语故事绘本"),
    (2, "opening", "角色介绍和背景设定", ""),
    (3, "opening", "故事开始的场景", ""),
    (4, "conflict", "问题出现", ""),
    (5, "conflict", "角色面对困难", ""),
    (6, "climax", "成语关键事件", ""),
    (7, "climax", "高潮细节", ""),
    (8, "resolution", "问题解决", ""),
    (9, "resolution", "寓意表达", "这个故事告诉我们：{core_meaning}"),
    (10, "ending", "角色变化", ""),
    (11, "ending", "现实生活应用", "在生活中，我们也可以这样做。"),
    (12, "back_cover", "温馨收束", "《{idiom}》\n适合{target_age}儿童阅读"),
]


def create_storyboard(idiom: str, core_meaning: str, target_age: str, tone: str) -> dict[str, Any]:
    pages: list[dict[str, Any]] = []
    for page_number, page_type, visual_focus, text_template in PAGE_BLUEPRINT:
        pages.append(
            {
                "page_number": page_number,
                "type": page_type,
                "scene_description": "",
                "text_content": text_template.format(
                    idiom=idiom,
                    core_meaning=core_meaning,
                    target_age=target_age,
                ),
                "visual_focus": visual_focus,
            }
        )

    return {
        "story_info": {
            "idiom": idiom,
            "core_meaning": core_meaning,
            "target_age": target_age,
            "tone": tone,
            "total_pages": 12,
        },
        "characters": {
            "main_characters": [],
            "supporting_characters": [],
        },
        "pages": pages,
        "visual_style": {
            "art_style": "明亮卡通风格，融入中国传统元素",
            "color_palette": "温暖明亮",
            "composition": "主体清晰、动作明确、层次分明",
            "image_sizes": ["1664x928", "928x1664"],
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate idiom picturebook storyboard v2")
    parser.add_argument("idiom", help="成语")
    parser.add_argument("core_meaning", help="核心寓意")
    parser.add_argument("--target-age", default=DEFAULT_TARGET_AGE)
    parser.add_argument("--tone", default=DEFAULT_TONE)
    parser.add_argument("--output", required=True, help="输出 storyboard.json 文件路径")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    storyboard = create_storyboard(args.idiom, args.core_meaning, args.target_age, args.tone)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Storyboard saved: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
