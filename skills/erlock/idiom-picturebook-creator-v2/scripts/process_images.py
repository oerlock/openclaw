#!/usr/bin/env python3
"""Build image prompts from idiom picturebook storyboard json."""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

MAX_PAGE_TEXT_LEN = 50


def _background_prompt(page: Dict, style: Dict) -> str:
    return (
        f"儿童绘本插画背景，{page['visual_focus']}，"
        f"风格：{style.get('art_style', '明亮卡通')}，"
        f"配色：{style.get('color_palette', '暖色主导')}，"
        "画面干净、主体突出、无杂乱文字。"
    )


def _validate_storyboard(storyboard: Dict) -> Tuple[List[str], List[str]]:
    errors: List[str] = []
    warnings: List[str] = []

    pages = storyboard.get("pages", [])
    if len(pages) != 12:
        errors.append(f"pages 数量应为 12，当前为 {len(pages)}")

    page_numbers = [p.get("page_number") for p in pages]
    if page_numbers != list(range(1, len(pages) + 1)):
        warnings.append("page_number 不是连续从 1 开始，建议修正")

    for page in pages:
        text = page.get("text_content", "")
        if text and len(text) > MAX_PAGE_TEXT_LEN:
            warnings.append(f"第 {page.get('page_number')} 页文案超过 {MAX_PAGE_TEXT_LEN} 字")

    return errors, warnings


def generate_prompts(storyboard: Dict) -> Dict[str, Any]:
    style = storyboard.get("visual_style", {})
    pages = storyboard.get("pages", [])
    main_characters = storyboard.get("characters", {}).get("main_characters", [])

    prompts: Dict[str, Any] = {
        "character_portraits": [],
        "backgrounds": [],
        "compositions": [],
        "review_checklists": [],
    }

    prompts["tooling"] = {
        "character_portraits": {"generate": "txt2img_aly", "review": "img2txt_aly"},
        "backgrounds": {"generate": "txt2img_aly", "review": "img2txt_aly"},
        "compositions": {"generate": "img2img_aly", "review": "img2txt_aly"},
    }
    prompts["generation_order"] = ["character_portraits", "backgrounds", "compositions"]

    for idx, character in enumerate(main_characters, start=1):
        prompts["character_portraits"].append(
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
                "generate_tool": "txt2img_aly",
                "review_tool": "img2txt_aly",
            }
        )

    for page in pages:
        if page.get("type") in {"cover", "back_cover"}:
            continue

        page_number = page["page_number"]
        prompts["backgrounds"].append(
            {
                "page_number": page_number,
                "prompt": _background_prompt(page, style),
                "size": "1664x928",
                "generate_tool": "txt2img_aly",
                "review_tool": "img2txt_aly",
            }
        )
        prompts["compositions"].append(
            {
                "page_number": page_number,
                "prompt": (
                    "将角色放入背景并保持透视一致，"
                    f"重点突出：{page['visual_focus']}，"
                    "角色与道具交互明确。"
                ),
                "generate_tool": "img2img_aly",
                "review_tool": "img2txt_aly",
            }
        )
        prompts["review_checklists"].append(
            {
                "page_number": page_number,
                "character_check": [
                    "发型/主色服饰/标志道具与前页一致",
                    "表情和动作符合本页情绪",
                    "角色年龄感与目标年龄段匹配",
                ],
                "background_check": [
                    "时代与文化元素匹配成语语境",
                    "构图预留角色站位并避免细节过载",
                    "背景不抢夺主体注意力",
                ],
                "composition_check": [
                    "透视、光照和阴影方向一致",
                    "角色与背景交互自然且核心动作清晰",
                    "最终画面完整表达该页叙事目的",
                ],
            }
        )

    return prompts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--storyboard", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    storyboard = json.loads(Path(args.storyboard).read_text(encoding="utf-8"))
    errors, warnings = _validate_storyboard(storyboard)
    if errors:
        raise SystemExit("\n".join(["Storyboard 验证失败:", *[f"- {e}" for e in errors]]))

    prompts = generate_prompts(storyboard)
    if warnings:
        prompts["warnings"] = warnings

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prompts saved to: {output_path}")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")


if __name__ == "__main__":
    main()
