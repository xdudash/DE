#!/usr/bin/env python3
"""Dependency-free sanity checks for the DeutschGo documentation foundation."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "README.md",
    "CLAUDE.md",
    "docs/product/PRODUCT_VISION.md",
    "docs/product/RELEASE_STAGES.md",
    "docs/product/USER_FLOWS.md",
    "docs/product/PRODUCT_SPEC.md",
    "docs/product/MONETIZATION.md",
    "docs/domain/CONTENT_CONTRACT.md",
    "docs/domain/LOCALIZATION_POLICY.md",
    "docs/architecture/DATA_AND_PRIVACY.md",
    "docs/quality/CONTENT_REVIEW.md",
    "docs/development/BACKLOG.md",
    "content/languages.yaml",
    "content/sources.yaml",
    "packages/content-kit/schemas/unit.schema.json",
    "docs/architecture/ARCHITECTURE.md",
    "docs/architecture/decisions/README.md",
    "docs/domain/KNOWLEDGE_MODEL.md",
    "docs/domain/LEARNING_ENGINE.md",
    "docs/domain/CONTENT_STANDARD.md",
    "docs/quality/QUALITY_GATES.md",
    "docs/sources/SOURCE_REGISTER.md",
    "docs/development/ROADMAP.md",
    "docs/development/WORKFLOW.md",
    "docs/development/PROJECT_STATUS.md",
    ".claude/rules/code-quality.md",
    ".claude/rules/content-data.md",
    ".claude/rules/testing.md",
    ".github/workflows/ci.yml",
)

LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")


def check_required_files(errors: list[str]) -> None:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            errors.append(f"Required file is missing: {rel}")


def check_claude_instruction_size(errors: list[str]) -> None:
    path = ROOT / "CLAUDE.md"
    if not path.is_file():
        return
    count = len(path.read_text(encoding="utf-8").splitlines())
    if count > 200:
        errors.append(f"CLAUDE.md has {count} lines; keep global instructions <= 200 lines.")


def check_relative_markdown_links(errors: list[str]) -> None:
    for md_path in ROOT.rglob("*.md"):
        if ".git" in md_path.parts:
            continue
        try:
            content = md_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            errors.append(f"Markdown file is not UTF-8: {md_path.relative_to(ROOT)}")
            continue

        for match in LINK_RE.finditer(content):
            target = match.group(1).strip()
            parts = urlsplit(target)
            if parts.scheme or parts.netloc or not parts.path:
                continue
            path = (md_path.parent / unquote(parts.path)).resolve()
            try:
                path.relative_to(ROOT)
            except ValueError:
                errors.append(f"Link escapes repository in {md_path.relative_to(ROOT)}: {target}")
                continue
            if not path.exists():
                errors.append(f"Broken relative link in {md_path.relative_to(ROOT)}: {target}")


def main() -> int:
    errors: list[str] = []
    check_required_files(errors)
    check_claude_instruction_size(errors)
    check_relative_markdown_links(errors)

    if errors:
        print("Foundation checks failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Foundation checks passed: required files exist, CLAUDE.md is concise, and local Markdown links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
