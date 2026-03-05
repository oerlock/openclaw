#!/usr/bin/env python3
"""Prompt generation + QA + markdown export for idiom picturebook v2."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

EXCLUDED_TYPES = {"cover", "back_cover"}
MAX_TEXT_LEN = 50


def load_storyboard(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_storyboard(storyboard: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    story_info = storyboard.get("story_info", {})

    if story_info.get("total_pages") != 12:
        issues.append("total_pages 必须为 12")
    if not story_info.get("idiom"):
        issues.append("缺少 story_info.idiom")
    if not story_info.get("core_meaning"):
        issues.append("缺少 story_info.core_meaning")

    pages = storyboard.get("pages", [])
    if len(pages) != 12:
        issues.append("pages 数量必须为 12")

    climax_pages = {6, 7}
    meaning_pages = {9}

    for page in pages:
        page_number = page.get("page_number")
        page_type = page.get("type")
        scene = (page.get("scene_description") or "").strip()
        text_content = (page.get("text_content") or "").strip()

        if page_type not in EXCLUDED_TYPES and not scene:
            issues.append(f"第{page_number}页缺少 scene_description")
        if text_content and len(text_content) > MAX_TEXT_LEN:
            issues.append(f"第{page_number}页文字超过{MAX_TEXT_LEN}字")

        if page_number in climax_pages and not page.get("visual_focus"):
            issues.append(f"第{page_number}页缺少视觉重点")
        if page_number in meaning_pages and not text_content:
            issues.append(f"第{page_number}页需明确寓意文案")

    main_characters = storyboard.get("characters", {}).get("main_characters", [])
    if not main_characters:
        issues.append("至少需要 1 个 main_characters")

    for index, character in enumerate(main_characters, start=1):
        for field in ["name", "appearance", "personality", "role"]:
            if not (character.get(field) or "").strip():
                issues.append(f"main_characters[{index}] 缺少字段 {field}")

    return issues


def build_prompts(storyboard: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    visual_style = storyboard.get("visual_style", {})
    art_style = visual_style.get("art_style", "明亮卡通")
    color_palette = visual_style.get("color_palette", "温暖明亮")

    prompts: dict[str, list[dict[str, Any]]] = {
        "backgrounds": [],
        "characters": [],
        "compositions": [],
    }

    for page in storyboard.get("pages", []):
        page_number = page.get("page_number")
        page_type = page.get("type")
        visual_focus = page.get("visual_focus", "画面重点")

        if page_type not in EXCLUDED_TYPES:
            prompts["backgrounds"].append(
                {
                    "page_number": page_number,
                    "prompt": f"儿童绘本背景，{visual_focus}，{art_style}，{color_palette}",
                    "size": "1664x928",
                }
            )
            prompts["compositions"].append(
                {
                    "page_number": page_number,
                    "guide": f"角色与背景融合，突出{visual_focus}，保证前中后景层次",
                }
            )

    for index, character in enumerate(
        storyboard.get("characters", {}).get("main_characters", []), start=1
    ):
        prompts["characters"].append(
            {
                "character_index": index,
                "name": character.get("name", f"角色{index}"),
                "prompt": (
                    f"儿童绘本角色，{character.get('appearance', '')}，"
                    f"{character.get('personality', '')}，{art_style}"
                ),
                "size": "928x1664",
            }
        )

    return prompts


def build_markdown(storyboard: dict[str, Any]) -> str:
    story_info = storyboard.get("story_info", {})
    lines = [
        f"# 《{story_info.get('idiom', '未命名')}》绘本草稿",
        "",
        f"- 核心寓意：{story_info.get('core_meaning', '')}",
        f"- 目标年龄：{story_info.get('target_age', '')}",
        f"- 叙事语气：{story_info.get('tone', '')}",
        "",
    ]

    for page in storyboard.get("pages", []):
        lines.extend(
            [
                f"## Page {page.get('page_number')} ({page.get('type')})",
                f"- 场景：{page.get('scene_description', '')}",
                f"- 文案：{page.get('text_content', '')}",
                f"- 视觉重点：{page.get('visual_focus', '')}",
                "",
            ]
        )

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Process idiom picturebook storyboard v2")
    parser.add_argument("--mode", choices=["validate", "prompts", "markdown"], required=True)
    parser.add_argument("--storyboard", required=True, help="storyboard.json 路径")
    parser.add_argument("--output", help="输出路径（prompts/markdown 模式需要）")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    storyboard = load_storyboard(Path(args.storyboard))
    issues = validate_storyboard(storyboard)

    if args.mode == "validate":
        if issues:
            print("Validation issues:")
            for issue in issues:
                print(f"- {issue}")
            return 1
        print("Validation passed.")
        return 0

    if args.mode == "prompts":
        if not args.output:
            print("--mode prompts 需要 --output")
            return 2
        payload = build_prompts(storyboard)
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Prompts saved: {output_path}")
        return 0 if not issues else 1

    if not args.output:
        print("--mode markdown 需要 --output")
        return 2

    markdown = build_markdown(storyboard)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown, encoding="utf-8")
    print(f"Markdown saved: {output_path}")
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
