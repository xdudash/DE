#!/usr/bin/env python3
"""Generate the 5000-lesson curriculum skeleton (ADR-0018).

Writes docs/domain/curriculum-skeleton.csv: one planned row per lesson or checkpoint.
Rows hold only stable IDs, level, block, position, kind, depth tag and status. No titles
and no teaching text: content is authored under content/ and linked by these IDs.

Usage:
  python3 scripts/curriculum_skeleton.py          # regenerate the CSV and print counts
  python3 scripts/curriculum_skeleton.py --check  # fail if the committed CSV is stale
"""
from __future__ import annotations

import csv
import io
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "domain" / "curriculum-skeleton.csv"

# ADR-0018: lessons per level. Each block is 25 slots: 24 lessons, then one checkpoint.
LEVELS = [("A0", 150), ("A1", 600), ("A2", 750), ("B1", 1000), ("B2", 1000), ("C1", 1000), ("C2", 500)]
BLOCK_SIZE = 25
LESSONS_PER_BLOCK = BLOCK_SIZE - 1
# Depth of the 24 lessons in a block, in slot order: 7 core, 10 standard, 7 deep (about 30/40/30).
# The order interleaves the depths so that no tier sees long runs of one kind.
DEPTH_BY_SLOT = {
    0: "core", 1: "standard", 2: "deep", 3: "standard", 4: "core", 5: "standard",
    6: "deep", 7: "core", 8: "standard", 9: "deep", 10: "standard", 11: "core",
    12: "standard", 13: "deep", 14: "standard", 15: "core", 16: "standard", 17: "deep",
    18: "standard", 19: "core", 20: "deep", 21: "standard", 22: "core", 23: "deep",
}
FIELDS = ["id", "level", "block", "position", "kind", "depth", "status"]


def build_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for level, total in LEVELS:
        if total % BLOCK_SIZE:
            raise ValueError(f"{level}: {total} lessons do not split into blocks of {BLOCK_SIZE}")
        for block in range(1, total // BLOCK_SIZE + 1):
            block_id = f"{level}.{block:02d}"
            for pos in range(1, LESSONS_PER_BLOCK + 1):
                rows.append(_row(level, block_id, pos, "lesson", DEPTH_BY_SLOT[pos - 1]))
            rows.append(_row(level, block_id, BLOCK_SIZE, "checkpoint", "core"))
    return rows


def _row(level: str, block_id: str, pos: int, kind: str, depth: str) -> dict[str, str]:
    suffix = f"{pos:02d}" if kind == "lesson" else "CP"
    return {
        "id": f"{block_id}.{suffix}",
        "level": level,
        "block": block_id,
        "position": str(pos),
        "kind": kind,
        "depth": depth,
        "status": "planned",
    }


def serialise(rows: list[dict[str, str]]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


def summary(rows: list[dict[str, str]]) -> dict[str, object]:
    lessons = [r for r in rows if r["kind"] == "lesson"]
    return {
        "total": len(rows),
        "per_level": dict(Counter(r["level"] for r in rows)),
        "lessons": len(lessons),
        "checkpoints": len(rows) - len(lessons),
        "lesson_depth": dict(Counter(r["depth"] for r in lessons)),
        "tier_fast (core + checkpoints)": sum(1 for r in rows if r["depth"] == "core"),
        "tier_medium (core + standard + checkpoints)": sum(1 for r in rows if r["depth"] in ("core", "standard")),
        "tier_full": len(rows),
    }


def main(argv: list[str]) -> int:
    text = serialise(build_rows())
    if "--check" in argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print("curriculum-skeleton.csv is stale; run scripts/curriculum_skeleton.py", file=sys.stderr)
            return 1
        print("curriculum-skeleton.csv is up to date")
        return 0
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    for key, value in summary(build_rows()).items():
        print(f"{key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
