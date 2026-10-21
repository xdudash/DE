"""Tests for check_foundation.py. Run: python -m unittest discover -s scripts -p "test_*.py"."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import check_foundation


class RelativeLinkTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name).resolve()
        self._original_root = check_foundation.ROOT
        check_foundation.ROOT = self.root

    def tearDown(self) -> None:
        check_foundation.ROOT = self._original_root
        self._tmp.cleanup()

    def write(self, rel: str, text: str) -> None:
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def link_errors(self) -> list[str]:
        errors: list[str] = []
        check_foundation.check_relative_markdown_links(errors)
        return errors

    def test_broken_link_in_repository_docs_is_reported(self) -> None:
        self.write("docs/A.md", "[missing](./NOPE.md)")
        errors = self.link_errors()
        self.assertEqual(len(errors), 1)
        self.assertIn("NOPE.md", errors[0])

    def test_working_link_passes(self) -> None:
        self.write("docs/A.md", "[b](./B.md)")
        self.write("docs/B.md", "# B")
        self.assertEqual(self.link_errors(), [])

    def test_dependency_and_build_output_are_skipped(self) -> None:
        for directory in ("node_modules/pkg", "apps/web/node_modules/pkg", "apps/web/.next", "apps/web/test-results"):
            self.write(f"{directory}/README.md", "[gone](./CONTRIBUTING.md)")
        self.assertEqual(self.link_errors(), [])

    def test_skip_applies_only_inside_the_repository(self) -> None:
        nested = self.root / "node_modules" / "checkout"
        check_foundation.ROOT = nested
        self.write("node_modules/checkout/docs/A.md", "[missing](./NOPE.md)")
        self.assertEqual(len(self.link_errors()), 1)


if __name__ == "__main__":
    unittest.main()
