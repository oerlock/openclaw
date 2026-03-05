#!/usr/bin/env python3
"""Track timeline markers for idiom picturebook page markdown files."""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List

TIME_PATTERNS = [
    r"第\s*([一二三四五六七八九十\d]+)天",
    r"(清晨|早晨|上午|中午|下午|傍晚|夜晚|深夜)",
    r"(\d+\s*(?:天|周|个月|年)后)",
    r"\*\*(?:时间|Timeline)\*\*\s*[:：]\s*(.+?)(?:\n|$)",
]


def scan_markdown_files(base: Path) -> List[Path]:
    return sorted([p for p in base.rglob("*.md") if p.is_file()])


def extract_markers(text: str) -> List[str]:
    markers: List[str] = []
    for pattern in TIME_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            markers.append((match.group(1) or match.group(0)).strip())
    return markers


def analyze(directory: Path) -> Dict:
    files = scan_markdown_files(directory)
    timeline = []
    missing = []

    for file_path in files:
        content = file_path.read_text(encoding="utf-8")
        markers = extract_markers(content)
        rel = str(file_path.relative_to(directory))
        if not markers:
            missing.append(rel)
            marker_value = "未标注"
        else:
            marker_value = " | ".join(markers)

        preview = content.strip().replace("\n", " ")[:120]
        timeline.append({"file": rel, "time_markers": markers, "preview": preview})

    return {
        "total_files": len(files),
        "files_without_markers": missing,
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
    print(f"- 未标注时间文件: {len(analysis['files_without_markers'])}\n")
    print("## 文件时间线")
    for item in analysis["timeline"]:
        marker_text = "、".join(item["time_markers"]) if item["time_markers"] else "未标注"
        print(f"- **{item['file']}**: {marker_text}")

    if analysis["files_without_markers"]:
        print("\n## 警告")
        for file in analysis["files_without_markers"]:
            print(f"- ⚠️ {file} 缺少时间标记")


if __name__ == "__main__":
    main()
