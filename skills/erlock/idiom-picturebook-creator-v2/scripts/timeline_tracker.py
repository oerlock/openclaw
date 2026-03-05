#!/usr/bin/env python3
"""Track timeline markers for idiom picturebook page markdown files."""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Optional

TIME_PATTERNS = [
    r"第\s*([一二三四五六七八九十\d]+)天",
    r"(清晨|早晨|上午|中午|下午|傍晚|夜晚|深夜)",
    r"(\d+\s*(?:天|周|个月|年)后)",
    r"\*\*(?:时间|Timeline)\*\*\s*[:：]\s*(.+?)(?:\n|$)",
]


CHINESE_NUM_MAP = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
}


def _to_int_day(value: str) -> Optional[int]:
    if value.isdigit():
        return int(value)
    if value in CHINESE_NUM_MAP:
        return CHINESE_NUM_MAP[value]
    return None


def _extract_page_index(file_path: Path) -> Optional[int]:
    match = re.search(r"(\d+)", file_path.stem)
    return int(match.group(1)) if match else None


def scan_markdown_files(base: Path) -> List[Path]:
    return sorted(
        [p for p in base.rglob("*.md") if p.is_file()],
        key=lambda p: (_extract_page_index(p) is None, _extract_page_index(p) or 9999, str(p)),
    )


def extract_markers(text: str) -> List[str]:
    markers: List[str] = []
    for pattern in TIME_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            markers.append((match.group(1) or match.group(0)).strip())
    return markers


def _extract_day(markers: List[str]) -> Optional[int]:
    for marker in markers:
        day = _to_int_day(marker)
        if day is not None:
            return day
    return None


def analyze(directory: Path) -> Dict:
    files = scan_markdown_files(directory)
    timeline = []
    missing = []
    warnings: List[str] = []
    previous_day: Optional[int] = None

    for file_path in files:
        content = file_path.read_text(encoding="utf-8")
        markers = extract_markers(content)
        rel = str(file_path.relative_to(directory))
        day = _extract_day(markers)

        if not markers:
            missing.append(rel)

        if day is not None and previous_day is not None and day < previous_day:
            warnings.append(f"{rel} 的天数（第{day}天）小于前一页（第{previous_day}天），可能时间倒退")

        if day is not None:
            previous_day = day

        preview = content.strip().replace("\n", " ")[:120]
        timeline.append({"file": rel, "time_markers": markers, "day": day, "preview": preview})

    return {
        "total_files": len(files),
        "files_without_markers": missing,
        "warnings": warnings,
        "timeline": timeline,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory")
    parser.add_argument("--output", choices=["markdown", "json"], default="markdown")
    args = parser.parse_args()

    analysis = analyze(Path(args.directory))

    if args.output == "json":
        print(json.dumps(analysis, ensure_ascii=False, indent=2))
        return

    print("# 时间线分析\n")
    print(f"- 总文件数: {analysis['total_files']}")
    print(f"- 未标注时间文件: {len(analysis['files_without_markers'])}")
    print(f"- 潜在时间顺序警告: {len(analysis['warnings'])}\n")
    print("## 文件时间线")
    for item in analysis["timeline"]:
        marker_text = "、".join(item["time_markers"]) if item["time_markers"] else "未标注"
        print(f"- **{item['file']}**: {marker_text}")

    if analysis["files_without_markers"]:
        print("\n## 缺失标记")
        for file in analysis["files_without_markers"]:
            print(f"- ⚠️ {file} 缺少时间标记")

    if analysis["warnings"]:
        print("\n## 顺序警告")
        for warning in analysis["warnings"]:
            print(f"- ⚠️ {warning}")


if __name__ == "__main__":
    main()
