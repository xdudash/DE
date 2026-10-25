"""Lesson builder: writes canonical unit YAML and its l10n files from a Python lesson spec.

The YAML it writes is the source of truth; a spec is an authoring aid and is not kept in the
repository. The validator (`npm run content:validate`) enforces the lesson norms in
packages/content-kit/src/norms.ts; this builder only refuses what it can see itself (missing
feedback on a wrong option, missing translations) and computes estimated_minutes with the same
numbers as norms.ts.

Usage from a spec file:

    import sys; sys.path.insert(0, "scripts")
    from lesson_builder import L, build
    build(dict(id="unit.lex.a0_0113_...", dir="lexicon", concepts=[...], ...))

Status is always needs_review; en is a draft, other languages are machine_draft (ADR-0021).
See docs/domain/LESSON_PRODUCTION_PLAN.md for the workflow and the spec fields.
"""
from __future__ import annotations

import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ("en", "uk", "ru")
STATUS = {"en": "draft", "uk": "machine_draft", "ru": "machine_draft"}

# Mirrors packages/content-kit/src/norms.ts (EXERCISE_SECONDS, READING_SECONDS, FEEDBACK_FACTOR).
EXERCISE_SECONDS = {
    "single_choice": 15, "multi_choice": 22, "true_false": 12, "reply_choice": 18, "match_pairs": 35,
    "word_order": 30, "cloze": 25, "transform": 35, "article_input": 15, "form_input": 22,
    "gap_fill_input": 22, "spelling_input": 22, "number_input": 15, "time_input": 18,
}
TEXT_INPUTS = {"article_input", "form_input", "gap_fill_input", "spelling_input", "number_input", "time_input"}
READ_EXPLANATION, READ_EXAMPLE_ITEM = 30, 10
FEEDBACK_FACTOR = 1.2

q = lambda s: json.dumps(s, ensure_ascii=False)  # a double-quoted YAML scalar


def L(en: str, uk: str, ru: str) -> dict:
    """One explanation-language string in every language."""
    return {"en": en, "uk": uk, "ru": ru}


class SpecError(ValueError):
    pass


def _need(cond: bool, msg: str) -> None:
    if not cond:
        raise SpecError(msg)


def _is_l(v) -> bool:
    return isinstance(v, dict) and all(isinstance(v.get(k), str) and v.get(k).strip() for k in LANGS)


def estimate_minutes(spec: dict) -> int:
    ex = sum(EXERCISE_SECONDS[x["type"]] for x in spec["exercises"])
    reading = READ_EXPLANATION * (2 + (1 if spec.get("tip") else 0)) + READ_EXAMPLE_ITEM * len(spec["examples"])
    return max(1, math.floor((ex * FEEDBACK_FACTOR + reading) / 60 + 0.5))


def build(spec: dict, date: str = "2026-10-25") -> str:
    uid = spec["id"]
    concepts = spec["concepts"]
    version = spec.get("version", "1.0.0")
    _need(uid.startswith("unit."), f"{uid}: unit ids start with unit.")
    strings: dict[str, dict] = {}

    def put(key: str, value: dict) -> str:
        _need(_is_l(value), f"{uid}: string {key} needs en, uk and ru")
        _need(key not in strings, f"{uid}: key {key} is set twice")
        strings[key] = value
        return f'"@{key}"'

    for k in ("title", "summary", "obj", "intro", "examples_title", "summary_block"):
        _need(k in spec, f"{uid}: spec field {k} is missing")
    put("title", spec["title"])
    put("summary", spec["summary"])
    put("obj", spec["obj"])
    put("intro", spec["intro"])
    put("examples", spec["examples_title"])
    put("summary_block", spec["summary_block"])
    put("practice", L("Practice", "Практика", "Практика"))
    put("fb.correct", L("Correct.", "Правильно.", "Правильно."))
    put("fb.incorrect", L("Not quite. Read the explanation.", "Не зовсім. Прочитайте пояснення.", "Не совсем. Прочитайте объяснение."))

    ex_lines = []
    for i, ex in enumerate(spec["examples"], 1):
        ex_lines.append(f'      - {{ id: ex_{i}, de: {q(ex["de"])}, gloss: {put(f"ex.{i}", ex["gloss"])}, highlight: [] }}')

    items = []
    for n, x in enumerate(spec["exercises"], 1):
        t = x["type"]
        _need(t in EXERCISE_SECONDS, f"{uid} x{n}: unknown type {t}")
        head = (f"      - id: x{n}\n        type: {t}\n        objective: obj_main\n"
                f"        concepts: [{', '.join(x.get('concepts', concepts))}]\n"
                f"        difficulty: {x.get('difficulty', 1)}\n        prompt: {put(f'x{n}.prompt', x['prompt'])}\n")
        body = ""
        if t in ("single_choice", "multi_choice", "reply_choice"):
            if t == "reply_choice":
                body += f"        line_de: {q(x['line'])}\n"
            if x.get("stem"):
                body += f"        stem_de: {q(x['stem'])}\n"
            body += "        options:\n"
            n_correct = sum(1 for o in x["options"] if o["c"])
            _need(n_correct >= 1, f"{uid} x{n}: no correct option")
            if t != "multi_choice":
                _need(n_correct == 1, f"{uid} x{n}: {t} needs exactly one correct option")
            for k, o in enumerate(x["options"], 1):
                letter = "abcdefgh"[k - 1]
                ref = f"text: {put(f'x{n}.o{k}', o['t'])}" if "t" in o else f"de: {q(o['de'])}"
                extra = ""
                if not o["c"]:
                    _need("fb" in o, f"{uid} x{n}: wrong option {letter} needs its own feedback (fb)")
                    extra = f", feedback: {put(f'x{n}.o{k}.fb', o['fb'])}"
                body += f"          - {{ id: {letter}, {ref}, correct: {'true' if o['c'] else 'false'}{extra} }}\n"
        elif t == "true_false":
            _need("wrong" in x, f"{uid} x{n}: true_false needs wrong (feedback for the wrong pick)")
            body += f"        statement_de: {q(x['statement'])}\n        correct: {'true' if x['correct'] else 'false'}\n"
            body += f"        wrong_feedback: {put(f'x{n}.wrong', x['wrong'])}\n"
        elif t == "match_pairs":
            _need(2 <= len(x["pairs"]) <= 6, f"{uid} x{n}: match_pairs needs 2 to 6 pairs")
            body += "        pairs:\n"
            for k, (left, right) in enumerate(x["pairs"], 1):
                body += f"          - {{ id: {'abcdef'[k - 1]}, left_de: {q(left)}, right_de: {q(right)} }}\n"
        elif t == "word_order":
            body += "        tokens: [" + ", ".join(q(tok) for tok in x["tokens"]) + "]\n"
            body += f"        final_punctuation: {q(x.get('punct', '.'))}\n"
            body += "        accept: [" + ", ".join(q(a) for a in x["accept"]) + "]\n"
        elif t == "cloze":
            body += f"        text_de: {q(x['text'])}\n        gaps:\n"
            for g in x["gaps"]:
                body += "          - { accept: [" + ", ".join(q(a) for a in g) + "] }\n"
        elif t == "transform":
            body += f"        source_de: {q(x['source'])}\n"
            body += "        accept: [" + ", ".join(q(a) for a in x["accept"]) + "]\n"
        elif t in TEXT_INPUTS:
            if x.get("stem"):
                body += f"        stem_de: {q(x['stem'])}\n"
            _need(len(x["accept"]) >= 1, f"{uid} x{n}: accept list is empty")
            body += "        accept: [" + ", ".join(q(a) for a in x["accept"]) + "]\n"
        rules = ""
        for k, (match, fb) in enumerate(x.get("rules", []), 1):
            rules += f"\n          - {{ match: [{', '.join(q(m) for m in match)}], feedback: {put(f'x{n}.r{k}', fb)} }}"
        if rules:
            fb_line = '        feedback:\n          correct: "@fb.correct"\n          incorrect: "@fb.incorrect"\n          rules:' + rules
        else:
            fb_line = '        feedback: { correct: "@fb.correct", incorrect: "@fb.incorrect" }'
        items.append(head + body + fb_line + f"\n        explanation: {put(f'x{n}.expl', x['expl'])}\n")

    tip_block = ""
    if spec.get("tip"):
        tip_block = f"\n  - {{ type: explanation, id: b_tip, body: {put('tip', spec['tip'])} }}\n"
    prereq = "[" + ", ".join(spec.get("prerequisites", [])) + "]"
    notes = spec.get("review_notes", "Batch draft (ADR-0021). Needs a qualified German teacher or native speaker (DG-007).")
    unit = f"""# A0 lesson, authored for DeutschGo with scripts/lesson_builder.py. Status needs_review: not reviewed by a human yet (DG-007, ADR-0021).
schema: deutschgo.unit/1
id: {uid}
version: {version}
status: needs_review
title: "@title"
summary: "@summary"
cefr: {spec.get('cefr', 'A0')}
concepts: [{', '.join(concepts)}]
prerequisites: {prereq}
goals: [{', '.join(spec.get('goals', ['general', 'everyday']))}]
estimated_minutes: {estimate_minutes(spec)}
objectives:
  - {{ id: obj_main, text: "@obj", skill: {spec.get('skill', 'knowledge')} }}
sources:
  - {{ source: src.deutschgo_original }}

blocks:
  - {{ type: explanation, id: b_intro, body: "@intro" }}

  - type: examples
    id: b_examples
    title: "@examples"
    items:
{chr(10).join(ex_lines)}
{tip_block}
  - {{ type: explanation, id: b_summary, body: "@summary_block" }}

  - type: exercises
    id: b_practice
    title: "@practice"
    items:
{chr(10).join(items)}
review:
  linguistic: {{ status: pending, notes: {q(notes)} }}
  pedagogical: {{ status: pending{', notes: ' + q(spec['pedagogical_notes']) if spec.get('pedagogical_notes') else ''} }}
  rights: {{ status: pending, notes: "Authored for DeutschGo; owner confirmation pending." }}
"""
    out_dir = ROOT / "content/units" / spec.get("dir", "lexicon")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{uid}.yaml").write_text(unit, encoding="utf-8")
    for lang in LANGS:
        lines = ["schema: deutschgo.l10n/1", f"entity: {uid}", f"lang: {lang}", f"based_on_version: {version}",
                 f"status: {STATUS[lang]}", f"translator: claude (AI draft, {date})", "strings:"]
        lines += [f"  {k}: {q(v[lang])}" for k, v in strings.items()]
        (ROOT / "content/i18n" / lang / f"{uid}.yaml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return uid
