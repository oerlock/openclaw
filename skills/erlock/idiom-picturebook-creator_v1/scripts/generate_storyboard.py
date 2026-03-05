#!/usr/bin/env python3
"""Generate a normalized storyboard JSON for Chinese idiom picture books."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

DEFAULT_TARGET_AGE = "4-8岁"
DEFAULT_TOTAL_PAGES = 12


PAGE_BLUEPRINT = [
    (1, "cover", "封面标题与主题", "《{idiom}》\n成语故事绘本"),
    (2, "opening", "角色介绍和背景设定", ""),
    (3, "opening", "故事开始的场景", ""),
    (4, "conflict_start", "问题或挑战的出现", ""),
    (5, "conflict_start", "角色面对困难", ""),
    (6, "climax", "成语典故的关键时刻", ""),
    (7, "climax", "高潮场景的细节", ""),
    (8, "resolution", "问题的解决", ""),
    (9, "resolution", "寓意的视觉化表达", "这个故事告诉我们：{core_meaning}"),
    (10, "ending", "角色的成长或变化", ""),
    (11, "ending", "现实生活中的应用", "在生活中，我们也要记住这个道理！"),
    (12, "back_cover", "温馨收束画面", "《{idiom}》成语故事\n适合{target_age}儿童阅读"),
]


def create_storyboard_structure(idiom: str, core_meaning: str, target_age: str = DEFAULT_TARGET_AGE) -> dict[str, Any]:
    """Create a storyboard skeleton with deterministic page layout."""
    pages: list[dict[str, Any]] = []
    for page_number, page_type, visual_focus, text_tpl in PAGE_BLUEPRINT:
        pages.append(
            {
                "page_number": page_number,
                "type": page_type,
                "scene_description": "",
                "text_content": text_tpl.format(
                    idiom=idiom, core_meaning=core_meaning, target_age=target_age
                ),
                "visual_focus": visual_focus,
            }
        )

    return {
        "story_info": {
            "idiom": idiom,
            "core_meaning": core_meaning,
            "target_age": target_age,
            "total_pages": DEFAULT_TOTAL_PAGES,
        },
        "characters": {"main_characters": [], "supporting_characters": []},
        "pages": pages,
        "visual_style": {
            "art_style": "明亮卡通风格，融入中国传统元素",
            "color_palette": "温暖明亮的色彩，适合儿童",
            "composition": "清晰构图，重点突出角色与关键动作",
            "cultural_elements": "根据成语背景融入传统中国元素",
        },
    }


def save_storyboard(storyboard: dict[str, Any], output_dir: Path, idiom: str) -> Path:
    """Persist storyboard JSON and return written file path."""
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{idiom}_storyboard.json"
    output_file.write_text(json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
    return output_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a Chinese idiom picturebook storyboard")
    parser.add_argument("idiom", help="Chinese idiom")
    parser.add_argument("core_meaning", help="Core meaning / moral")
    parser.add_argument("--target-age", default=DEFAULT_TARGET_AGE, help="Target age range")
    parser.add_argument("--output-dir", default="./output", help="Output directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    storyboard = create_storyboard_structure(args.idiom, args.core_meaning, args.target_age)
    output_file = save_storyboard(storyboard, Path(args.output_dir), args.idiom)
    print(f"Storyboard saved to: {output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
