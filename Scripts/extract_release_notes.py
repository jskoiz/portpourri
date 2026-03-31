#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: extract_release_notes.py <version> [CHANGELOG.md]", file=sys.stderr)
        return 1

    version = sys.argv[1]
    changelog_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("CHANGELOG.md")
    text = changelog_path.read_text(encoding="utf-8")

    heading_pattern = re.compile(rf"^## \[{re.escape(version)}\] - .*$", re.MULTILINE)
    match = heading_pattern.search(text)
    if match is None:
        print(f"version {version} not found in {changelog_path}", file=sys.stderr)
        return 2

    remaining = text[match.end():]
    next_heading = re.search(r"^## \[", remaining, re.MULTILINE)
    next_reference = re.search(r"^\[[0-9]", remaining, re.MULTILINE)

    end_offsets = [len(remaining)]
    if next_heading:
        end_offsets.append(next_heading.start())
    if next_reference:
        end_offsets.append(next_reference.start())

    section = text[match.start():match.end() + min(end_offsets)].strip()
    print(section)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
