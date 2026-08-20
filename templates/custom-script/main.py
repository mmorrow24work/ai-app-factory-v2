#!/usr/bin/env python3
"""Entry point scaffold for a custom-script project.

Placeholder name shipped by the ai-app-factory-v2 template -- CLAUDE.md.tmpl names the real
entry point as {{ENTRY_POINT}} (set via --set ENTRY_POINT=... at scaffold time, no default).
If this project's {{ENTRY_POINT}} differs from `main.py`, rename this file (and
`tests/test_main.py`) to match before adding functionality -- see CLAUDE.md's "Repo map".

A minimal, real, argparse-based CLI -- not an empty stub -- so a freshly scaffolded project has
something that actually runs (`python3 main.py --help`) before the first claude-go issue ever
fires.
"""

from __future__ import annotations

import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="main.py",
        description="Scaffold CLI -- replace this description with what the project actually does.",
    )
    parser.add_argument(
        "name",
        nargs="?",
        default="world",
        help="Who to greet (placeholder behavior -- replace with real functionality).",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Print extra diagnostic output.",
    )
    return parser


def run(args: argparse.Namespace) -> int:
    if args.verbose:
        print(f"main.py: greeting '{args.name}'", file=sys.stderr)
    print(f"Hello, {args.name}!")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return run(args)


if __name__ == "__main__":
    raise SystemExit(main())
