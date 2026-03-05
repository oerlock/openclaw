#!/usr/bin/env python3
"""Check consistency for idiom picturebook project content."""

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List

ROLE_PATTERNS = [r"主角[：:]\s*(.+)", r"角色[：:]\s*(.+)"]
IDIOM_PATTERN = r"成语[：:]\s*(.+)"


def scan_files(base: Path) -> List[Path]:
    return sorted([p for p in base.rglob("*.md") if p.is_file()])


def collect_terms(text: str) -> Dict[str, List[str]]:
    roles: List[str] = []
    idioms: List[str] = []

    for pattern in ROLE_PATTERNS:
        for match in re.finditer(pattern, text):
            roles.extend([v.strip() for v in re.split(r"[，,、/ ]+", match.group(1)) if v.strip()])

    for match in re.finditer(IDIOM_PATTERN, text):
        idioms.append(match.group(1).strip())

    return {"roles": roles, "idioms": idioms}


def analyze(base: Path) -> Dict:
    files = scan_files(base)
    role_mentions = Counter()
    idiom_mentions = Counter()
    per_file = defaultdict(dict)

    for file_path in files:
        content = file_path.read_text(encoding="utf-8")
        terms = collect_terms(content)
        rel = str(file_path.relative_to(base))
        per_file[rel]["roles"] = terms["roles"]
        per_file[rel]["idioms"] = terms["idioms"]
        role_mentions.update(terms["roles"])
        idiom_mentions.update(terms["idioms"])

    warnings = []
    if len(idiom_mentions) > 1:
        warnings.append(
            {
                "severity": "warning",
                "description": "检测到多个成语名，可能存在主题漂移",
                "details": dict(idiom_mentions),
            }
        )

    rare_roles = {name: count for name, count in role_mentions.items() if count == 1}
    if rare_roles:
        warnings.append(
            {
                "severity": "info",
                "description": "以下角色仅出现一次，建议确认是否命名不一致",
                "details": rare_roles,
            }
        )

    return {
        "total_files": len(files),
        "role_mentions": dict(role_mentions),
        "idiom_mentions": dict(idiom_mentions),
        "warnings": warnings,
        "per_file": dict(per_file),
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

    print("# 一致性分析\n")
    print(f"- 分析文件数: {analysis['total_files']}")
    print(f"- 成语候选: {', '.join(analysis['idiom_mentions'].keys()) or '未检测到'}")
    print(f"- 角色候选数: {len(analysis['role_mentions'])}\n")

    if not analysis["warnings"]:
        print("✅ 未发现明显一致性问题")
        return

    print("## 问题列表")
    for issue in analysis["warnings"]:
        icon = "⚠️" if issue["severity"] == "warning" else "ℹ️"
        print(f"- {icon} {issue['description']}")
        for key, value in issue["details"].items():
            print(f"  - {key}: {value}")


if __name__ == "__main__":
    main()
