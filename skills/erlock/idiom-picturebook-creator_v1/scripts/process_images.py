#!/usr/bin/env python3
"""Generate image prompts and run completeness checks for storyboard JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

EXCLUDED_PAGE_TYPES = {"cover", "back_cover"}


def load_storyboard(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def prepare_image_prompts(storyboard: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    prompts: dict[str, list[dict[str, Any]]] = {
        "backgrounds": [],
        "characters": [],
        "compositions": [],
    }

    visual_style = storyboard.get("visual_style", {})
    main_characters = storyboard.get("characters", {}).get("main_characters", [])

    for page in storyboard.get("pages", []):
        if page.get("type") in EXCLUDED_PAGE_TYPES:
            continue

        prompts["backgrounds"].append(
            {
                "page_number": page["page_number"],
                "scene_type": page["type"],
                "prompt": (
                    f"儿童绘本插画背景，{page.get('visual_focus', '')}，"
                    f"{visual_style.get('art_style', '')}，{visual_style.get('color_palette', '')}"
                ),
                "size": "1664x928",
            }
        )

        prompts["compositions"].append(
            {
                "page_number": page["page_number"],
                "composition_guide": (
                    f"将角色置于合理位置，突出{page.get('visual_focus', '画面重点')}，"
                    "保留前景/中景/背景层次，确保儿童可读性。"
                ),
            }
        )

    for index, character in enumerate(main_characters, start=1):
        prompts["characters"].append(
            {
                "character_index": index,
                "name": character.get("name", f"角色{index}"),
                "prompt": (
                    f"儿童绘本角色设计，{character.get('appearance', '')}，"
                    f"{character.get('personality', '')}，{visual_style.get('art_style', '')}，可爱风格"
                ),
                "size": "928x1664",
            }
        )

    return prompts


def validate_storyboard_completeness(storyboard: dict[str, Any]) -> tuple[bool, list[str]]:
    issues: list[str] = []
    story_info = storyboard.get("story_info", {})

    if not story_info.get("idiom"):
        issues.append("缺少 story_info.idiom")
    if not story_info.get("core_meaning"):
        issues.append("缺少 story_info.core_meaning")

    pages = storyboard.get("pages", [])
    if len(pages) != story_info.get("total_pages", len(pages)):
        issues.append("pages 数量与 total_pages 不一致")

    for page in pages:
        page_type = page.get("type")
        if page_type not in EXCLUDED_PAGE_TYPES and not page.get("scene_description", "").strip():
            issues.append(f"第 {page.get('page_number')} 页缺少 scene_description")

    return (len(issues) == 0, issues)


def save_json(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare image prompts for idiom storyboard")
    parser.add_argument("--storyboard", required=True, help="Input storyboard JSON path")
    parser.add_argument("--output", help="Output JSON path for prompts")
    parser.add_argument("--validate-only", action="store_true", help="Only run completeness checks")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    storyboard = load_storyboard(Path(args.storyboard))
    is_valid, issues = validate_storyboard_completeness(storyboard)

    if issues:
        print("Validation issues:")
        for issue in issues:
            print(f"- {issue}")
    else:
        print("Validation passed.")

    if args.validate_only:
        return 0 if is_valid else 1

    prompts = prepare_image_prompts(storyboard)
    if args.output:
        save_json(prompts, Path(args.output))
        print(f"Prompts saved to: {args.output}")
    else:
        print(json.dumps(prompts, ensure_ascii=False, indent=2))

    return 0 if is_valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
