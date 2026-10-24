#!/usr/bin/env python3
"""Build the continuous course plan from the topic inventory (ADR-0018).

Inputs:
  curriculum/inventory.json        topics per level, in teaching order, with dependencies
  docs/domain/curriculum-skeleton.csv  the lesson IDs, blocks, checkpoints and depth tags

Outputs (generated, do not edit by hand):
  curriculum/README.md             overview, chaining rules, course tiers
  curriculum/course.json           every lesson: topic, kind, depth, previous lesson, builds_on
  curriculum/<LEVEL>/README.md     instructions and counts for the level
  curriculum/<LEVEL>/lessons.md    one row per lesson: topic, stage, previous lesson, dependencies

Every lesson is linked to the one before it, so the course is a single chain from A0.1.1 to
C2. Scenario lessons apply the grammar of the lessons before them. Every topic must depend
only on topics that come earlier, so the build fails on an out-of-order inventory.

Planning output only: no teaching text. Titles are topic names for reviewers to replace
with approved content (CONTENT_CONTRACT). Usage:
  python3 scripts/curriculum_plan.py          # write all files
  python3 scripts/curriculum_plan.py --check  # fail if committed files are stale
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from curriculum_skeleton import LEVELS, build_rows  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CURRICULUM = ROOT / "curriculum"
STAGES = [("Einführung", "Introduction"), ("Übung", "Practice"), ("Anwendung", "Application"),
          ("Vertiefung", "Deepening"), ("Wiederholung", "Review")]
SCENARIO_EVERY = 6  # every sixth lesson of a level applies the grammar in a real situation
TIER_BY_DEPTH = {"core": "fast, medium, full", "standard": "medium, full", "deep": "full"}


class PlanError(ValueError):
    pass


def load_inventory() -> dict:
    return json.loads((CURRICULUM / "inventory.json").read_text(encoding="utf-8"))["levels"]


def check_dependencies(levels: dict) -> None:
    """Every concept must depend on concepts that come before it: same level or an earlier one."""
    seen: set[str] = set()
    for level, _ in LEVELS:
        spec = levels.get(level)
        if spec is None:
            raise PlanError(f"{level}: missing from inventory.json")
        keys = [c["key"] for c in spec["concepts"]]
        if len(keys) != len(set(keys)):
            raise PlanError(f"{level}: duplicate concept keys")
        for concept in spec["concepts"]:
            for dep in concept["after"]:
                if dep not in seen and dep not in keys:
                    raise PlanError(f"{level}.{concept['key']} depends on unknown or later topic '{dep}'")
                if dep in keys and keys.index(dep) >= keys.index(concept["key"]):
                    raise PlanError(f"{level}.{concept['key']} depends on '{dep}', which comes after it")
        seen.update(keys)


def allocate(concepts: list[dict], total: int) -> dict[str, int]:
    """Lessons per concept, proportional to weight, at least one each, summing to total."""
    weights = {c["key"]: c["weight"] for c in concepts}
    if total < len(concepts):
        raise PlanError("fewer lessons than topics")
    weight_sum = sum(weights.values())
    raw = {k: total * w / weight_sum for k, w in weights.items()}
    counts = {k: max(1, int(v)) for k, v in raw.items()}
    remaining = total - sum(counts.values())
    order = sorted(raw, key=lambda k: raw[k] - int(raw[k]), reverse=True)
    i = 0
    while remaining != 0:
        key = order[i % len(order)]
        if remaining > 0:
            counts[key] += 1
            remaining -= 1
        elif counts[key] > 1:
            counts[key] -= 1
            remaining += 1
        i += 1
    return counts


def stage_names(index: int) -> tuple[str, str]:
    de, en = STAGES[index % len(STAGES)]
    cycle = index // len(STAGES) + 1
    if cycle == 1:
        return de, en
    return f"{de} {cycle}", f"{en} {cycle}"


def build_level(level: str, spec: dict, rows: list[dict], previous_id: str | None) -> list[dict]:
    """Lesson records for one level, in order, each linked to the previous record."""
    lesson_rows = [r for r in rows if r["kind"] == "lesson"]
    n = len(lesson_rows)
    scenarios = spec["scenarios"]
    concept_slots = n - n // SCENARIO_EVERY
    counts = allocate(spec["concepts"], concept_slots)

    # The stream of concept lessons, concept by concept, with stage names per occurrence.
    stream: list[dict] = []
    for concept in spec["concepts"]:
        for i in range(counts[concept["key"]]):
            de, en = stage_names(i)
            stream.append({"concept": concept, "de": f"{concept['de']} — {de}", "en": f"{concept['en']} — {en}", "stage": i})

    records: list[dict] = []
    stream_pos = 0
    scenario_pos = 0
    recent: list[str] = []  # concept keys of the most recent concept lessons
    block_concepts: dict[str, list[str]] = {}
    prev = previous_id
    for idx, row in enumerate(lesson_rows):
        position = idx + 1
        if position % SCENARIO_EVERY == 0:
            text = scenarios[scenario_pos % len(scenarios)]
            scenario_pos += 1
            needs = sorted(set(recent[-6:]))
            record = {"id": row["id"], "block": row["block"], "de": text, "en": "Scenario application",
                      "stage": "Szenario", "depth": row["depth"], "kind": "scenario", "needs": needs,
                      "topic": f"scenario:{scenario_pos}"}
        else:
            item = stream[stream_pos]
            stream_pos += 1
            concept = item["concept"]
            needs = list(concept["after"])
            recent.append(concept["key"])
            block_concepts.setdefault(row["block"], [])
            if concept["key"] not in block_concepts[row["block"]]:
                block_concepts[row["block"]].append(concept["key"])
            record = {"id": row["id"], "block": row["block"], "de": item["de"], "en": item["en"],
                      "stage": f"{item['stage'] + 1}", "depth": row["depth"], "kind": "lesson", "needs": needs,
                      "topic": concept["key"]}
        record["previous"] = prev or "—"
        records.append(record)
        prev = row["id"]

    # Checkpoints close each block: they check every topic taught in that block.
    checkpoint_rows = [r for r in rows if r["kind"] == "checkpoint"]
    by_id = {r["id"]: r for r in records}
    for cp in checkpoint_rows:
        block = cp["block"]
        in_block = [r for r in records if r["block"] == block and r["kind"] != "checkpoint"]
        if not in_block:
            continue
        topics = block_concepts.get(block, [])
        record = {"id": cp["id"], "block": block, "de": "Blockkontrolle", "en": "Block checkpoint",
                  "stage": "Kontrolle", "depth": "core", "kind": "checkpoint", "needs": topics,
                  "previous": in_block[-1]["id"], "topic": f"checkpoint:{block}"}
        records.append(record)
        by_id[cp["id"]] = record
    # The checkpoint is part of the chain: the next block's first lesson follows it.
    order = {row["id"]: i for i, row in enumerate(rows)}
    records.sort(key=lambda r: order[r["id"]])
    for i, r in enumerate(records):
        r["previous"] = (previous_id or "—") if i == 0 else records[i - 1]["id"]
    return records


def new_words(level: str, levels: dict) -> tuple[int, int]:
    return levels[level]["new_words"], levels[level]["review_words"]


def tiers(depth: str, kind: str) -> str:
    return "fast, medium, full" if kind == "checkpoint" else TIER_BY_DEPTH[depth]


def lesson_table(records: list[dict], level: str, levels: dict) -> str:
    new, review = new_words(level, levels)
    lines = [
        f"# {level} — lessons",
        "",
        "Generated by `scripts/curriculum_plan.py`. Topics are planning titles for review. "
        "`Previous` is the lesson directly before this one in the course chain. "
        "`Builds on` lists the topics this lesson needs. Words are per lesson: new and review.",
        "",
        "| ID | Block | Topic (DE) | Topic (EN) | Stage | Depth | Previous | Builds on | New words | Review words | Tiers |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in records:
        if r["kind"] == "checkpoint":
            new_w, rev_w = 0, review
        else:
            new_w, rev_w = new, review
        needs = ", ".join(r["needs"]) if r["needs"] else "—"
        lines.append(
            f"| {r['id']} | {r['block']} | {r['de']} | {r['en']} | {r['stage']} | {r['depth']} | "
            f"{r['previous']} | {needs} | {new_w} | {rev_w} | {tiers(r['depth'], r['kind'])} |"
        )
    return "\n".join(lines) + "\n"


def level_readme(level: str, spec: dict, records: list[dict], levels: dict) -> str:
    lessons = [r for r in records if r["kind"] != "checkpoint"]
    checkpoints = [r for r in records if r["kind"] == "checkpoint"]
    blocks = len(checkpoints)
    scenarios = [r for r in records if r["kind"] == "scenario"]
    depth_counts = {d: sum(1 for r in lessons if r["depth"] == d) for d in ("core", "standard", "deep")}
    new, review = new_words(level, levels)
    total_new = len(lessons) * new
    fast = depth_counts["core"] + len(checkpoints)
    medium = depth_counts["core"] + depth_counts["standard"] + len(checkpoints)
    return f"""# Level {level}

Status: **planned**. Topics and order are a draft for review. No lesson in this folder is approved, and no teaching text is written here (CONTENT_CONTRACT, CLAUDE.md principle 3).

## Counts
| | |
|---|---|
| Lessons | {len(lessons)} |
| Blocks (about 25 slots each) | {blocks} |
| Checkpoints (one per block) | {len(checkpoints)} |
| Scenario lessons (apply the grammar) | {len(scenarios)} |
| Topics in the inventory | {len(spec['concepts'])} |
| New words per lesson | {new} |
| Review words per lesson | {review} |
| Word introductions in the level | {total_new} |

Depth among lessons: core {depth_counts['core']}, standard {depth_counts['standard']}, deep {depth_counts['deep']}.
Course tiers at this level: fast {fast} lessons, medium {medium}, full {len(records)}.

## Instructions for this level
- Each lesson takes 8–12 minutes and teaches one or two rules. Use the lesson before as the starting point: the `Previous` column is the chain.
- A lesson may only use topics listed under `Builds on`, and those must already appear earlier in the course.
- Introduce at most {new} new words per lesson. Repeat {review} words from earlier lessons in every lesson.
- Every sixth lesson is a scenario: a real situation that uses what was just learned. Scenarios in this level: {"; ".join(spec['scenarios'])}.
- Every block ends with a checkpoint. A checkpoint may not introduce new topics.
- Explanations come from reviewed content only. Topic titles here are not text shown to learners.

## Files
- [lessons.md](./lessons.md): all {len(records)} rows of this level, in order.

Regenerate with `python3 scripts/curriculum_plan.py` after editing `curriculum/inventory.json`.
"""


def overview(levels: dict, totals: dict[str, int]) -> str:
    rows = "\n".join(
        f"| [{lvl}](./{lvl}/README.md) | {totals[lvl]} | {levels[lvl]['new_words']} | {levels[lvl]['review_words']} | {len(levels[lvl]['concepts'])} | {len(levels[lvl]['scenarios'])} |"
        for lvl, _ in LEVELS
    )
    return f"""# DeutschGo curriculum

Status: **planned**. This folder is the course plan from A0 to C2 (ADR-0018). The course teaches general German first; regional German (Austria, Switzerland) is planned for later (ADR-0020). It contains the order of topics, the lesson chain and the word counts. It contains no teaching text. Every lesson is still to be written and reviewed.

## Levels
| Level | Lessons | New words per lesson | Review words per lesson | Topics | Scenarios |
|---|---|---|---|---|---|
{rows}

## One continuous chain
- Lessons are ordered A0.01.01 → C2. Each lesson lists the lesson before it in `Previous`. The first lesson of each level follows the last lesson of the level before.
- Each lesson lists the topics it `Builds on`. A topic may depend only on topics that come earlier in the course. The generator fails if not.
- Every sixth lesson applies what was learned in the lessons before it (scenario lessons).
- Every block ends with a checkpoint that revisits the topics of that block.

## Course tiers (choice by the learner)
The learner chooses how much to take. Tiers select by depth tag, and every tier passes every level:
- **Fast:** core lessons and checkpoints.
- **Medium:** core, standard and checkpoints.
- **Full:** every lesson.

Topics can also be wanted or skipped by the learner (see the app rules in the project docs). A skipped topic removes its lessons only when no wanted lesson depends on it.

## Regenerate
`python3 scripts/curriculum_plan.py` writes all files here from `inventory.json` and `docs/domain/curriculum-skeleton.csv`. `--check` fails if they are stale.

## Caveats
- Topic counts per level are a draft. Above about 12 lessons per topic, the stages repeat; reviewers must write distinct sub-topics before those lessons are authored.
- Word counts are targets for planning. Distinct vocabulary per level is set by the lexicon work (DG-050), not by these numbers.
"""


def outputs() -> dict[Path, str]:
    levels = load_inventory()
    check_dependencies(levels)
    rows = build_rows()
    files: dict[Path, str] = {}
    totals: dict[str, int] = {}
    chain: list[dict] = []
    previous_id: str | None = None
    for level, _ in LEVELS:
        level_rows = [r for r in rows if r["level"] == level]
        records = build_level(level, levels[level], level_rows, previous_id)
        totals[level] = len(records)
        previous_id = records[-1]["id"]
        chain.extend(records)
        files[CURRICULUM / level / "lessons.md"] = lesson_table(records, level, levels)
        files[CURRICULUM / level / "README.md"] = level_readme(level, levels[level], records, levels)
    verify_chain(rows, chain)
    files[CURRICULUM / "course.json"] = course_json(chain)
    files[CURRICULUM / "README.md"] = overview(levels, totals)
    return files


def verify_chain(rows: list[dict], chain: list[dict]) -> None:
    """The course is one chain: every lesson follows exactly the row before it in the skeleton."""
    if [r["id"] for r in chain] != [r["id"] for r in rows]:
        raise PlanError("the plan does not list the skeleton's lessons in the same order")
    for i, record in enumerate(chain):
        expected = chain[i - 1]["id"] if i else "—"
        if record["previous"] != expected:
            raise PlanError(f"{record['id']} follows {record['previous']}, expected {expected}")


def course_json(chain_records: list[dict]) -> str:
    """Machine-readable course: what the app and the choice rules read."""
    course = [
        {"id": r["id"], "level": r["id"].split(".")[0], "block": r["block"], "kind": r["kind"],
         "depth": r["depth"], "topic": r["topic"], "previous": r["previous"], "builds_on": r["needs"]}
        for r in chain_records
    ]
    return json.dumps({"lessons": course}, ensure_ascii=False, indent=1) + "\n"


def main(argv: list[str]) -> int:
    files = outputs()
    if "--check" in argv:
        stale = [p for p, text in files.items() if not p.exists() or p.read_text(encoding="utf-8") != text]
        if stale:
            for p in stale:
                print(f"stale: {p.relative_to(ROOT)}", file=sys.stderr)
            print("run scripts/curriculum_plan.py", file=sys.stderr)
            return 1
        print("curriculum files are up to date")
        return 0
    for path, text in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    print(f"wrote {len(files)} files under {CURRICULUM.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except PlanError as err:
        print(f"curriculum plan error: {err}", file=sys.stderr)
        raise SystemExit(2)
