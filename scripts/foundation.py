#!/usr/bin/env python3
"""Runs the foundation check and its self-tests. CI and `npm run foundation` both use this."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

import check_foundation  # noqa: E402


def main() -> int:
    if check_foundation.main() != 0:
        return 1
    suite = unittest.defaultTestLoader.discover(str(SCRIPTS), pattern="test_*.py")
    result = unittest.TextTestRunner(verbosity=0).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
