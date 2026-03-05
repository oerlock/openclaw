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
TIMELINE_PATTERN = r"(?:\*\*(?:时间|Timeline)\*\*\s*[:：].+|第\s*[一二三四五六七八九十\d]+天)"


def scan_files(base: Path) -> List[Path]:
    return sorted([p for p in base.rglob("*.md") if p.is_file()])


def _normalize_role(role: str) -> str:
    return role.strip().lower().replace(" ", "")


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
    role_normalized_map: Dict[str, set] = defaultdict(set)
    idiom_mentions = Counter()
    per_file = defaultdict(dict)
    warnings = []

    for file_path in files:
        content = file_path.read_text(encoding="utf-8")
        terms = collect_terms(content)
        rel = str(file_path.relative_to(base))
        per_file[rel]["roles"] = terms["roles"]
        per_file[rel]["idioms"] = terms["idioms"]
        per_file[rel]["has_timeline_marker"] = bool(re.search(TIMELINE_PATTERN, content))

        role_mentions.update(terms["roles"])
        idiom_mentions.update(terms["idioms"])

        for role in terms["roles"]:
            role_normalized_map[_normalize_role(role)].add(role)

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

    role_alias_groups = {
        norm: sorted(list(names)) for norm, names in role_normalized_map.items() if len(names) > 1
    }
    if role_alias_groups:
        warnings.append(
            {
                "severity": "warning",
                "description": "检测到疑似同名角色的多种写法",
                "details": role_alias_groups,
            }
        )

    files_without_timeline = [name for name, info in per_file.items() if not info["has_timeline_marker"]]
    if files_without_timeline:
        warnings.append(
            {
                "severity": "info",
                "description": "以下文件缺少时间标记，建议与 timeline_tracker 结果交叉复核",
                "details": {"files": files_without_timeline},
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
    print(f"- 角色候选数: {len(analysis['role_mentions'])}")
    print(f"- 问题数量: {len(analysis['warnings'])}\n")

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
