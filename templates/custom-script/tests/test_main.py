"""Tests for main.py -- rename alongside main.py if {{ENTRY_POINT}} differs from main.py."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

MAIN = Path(__file__).resolve().parent.parent / "main.py"


def run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(MAIN), *args],
        capture_output=True,
        text=True,
        check=False,
    )


def test_default_greeting() -> None:
    result = run_cli()
    assert result.returncode == 0
    assert "Hello, world!" in result.stdout


def test_custom_name() -> None:
    result = run_cli("Ada")
    assert result.returncode == 0
    assert "Hello, Ada!" in result.stdout


def test_help_exits_zero() -> None:
    result = run_cli("--help")
    assert result.returncode == 0
    assert "usage" in result.stdout.lower()
