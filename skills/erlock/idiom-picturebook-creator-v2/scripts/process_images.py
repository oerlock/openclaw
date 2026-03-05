#!/usr/bin/env python3
"""Build image prompts from idiom picturebook storyboard json."""

import argparse
import json
from pathlib import Path
from typing import Dict, List


def _background_prompt(page: Dict, style: Dict) -> str:
    return (
        f"儿童绘本插画背景，{page['visual_focus']}，"
        f"风格：{style['art_style']}，配色：{style['color_palette']}，"
        "画面干净、主体突出、无杂乱文字。"
    )


def generate_prompts(storyboard: Dict) -> Dict[str, List[Dict]]:
    style = storyboard.get("visual_style", {})
    main_characters = storyboard.get("characters", {}).get("main_characters", [])
    prompts: Dict[str, List[Dict]] = {
        "backgrounds": [],
        "characters": [],
        "compositions": [],
        "review_checklists": [],
    }

    for page in storyboard.get("pages", []):
        if page["type"] not in {"cover", "back_cover"}:
            prompts["backgrounds"].append(
                {
                    "page_number": page["page_number"],
                    "prompt": _background_prompt(page, style),
                    "size": "1664x928",
                }
            )
            prompts["compositions"].append(
                {
                    "page_number": page["page_number"],
                    "prompt": (
                        "将角色放入背景并保持透视一致，"
                        f"重点突出：{page['visual_focus']}，"
                        "角色与道具交互明确。"
                    ),
                }
            )
            prompts["review_checklists"].append(
                {
                    "page_number": page["page_number"],
                    "character_check": [
                        "发型/主色服饰/标志道具与前页一致",
                        "表情和动作符合本页情绪",
                    ],
                    "background_check": [
                        "时代与文化元素匹配成语语境",
                        "构图预留角色站位并避免细节过载",
                    ],
                    "composition_check": [
                        "透视、光照和阴影方向一致",
                        "角色与背景交互自然且核心动作清晰",
                    ],
                }
            )

    for idx, character in enumerate(main_characters, start=1):
        prompts["characters"].append(
            {
                "character_index": idx,
                "name": character.get("name", f"角色{idx}"),
                "prompt": (
                    "儿童绘本角色立绘，"
                    f"外观：{character.get('appearance', '待补充')}，"
                    f"性格：{character.get('personality', '待补充')}，"
                    f"风格：{style.get('art_style', '明亮卡通')}。"
                ),
                "size": "928x1664",
            }
        )

    return prompts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--storyboard", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    storyboard = json.loads(Path(args.storyboard).read_text(encoding="utf-8"))
    prompts = generate_prompts(storyboard)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prompts saved to: {output_path}")


if __name__ == "__main__":
    main()
