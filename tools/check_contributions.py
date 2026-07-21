#!/usr/bin/env python3
"""Discover and validate every staged boundary contribution."""

from __future__ import annotations

import sys
from pathlib import Path

from validate_boundary_contribution import print_result, validate_manifest


ROOT = Path(__file__).resolve().parents[1]
CONTRIBUTIONS = ROOT / "contributions"


def manifests() -> list[Path]:
    return sorted(
        path
        for path in CONTRIBUTIONS.glob("**/boundary-contribution.json")
        if not any(part.startswith("_") for part in path.relative_to(CONTRIBUTIONS).parts)
    )


def main() -> int:
    discovered = manifests()
    if not discovered:
        print("Contribution validation passed: no pending boundary manifests.")
        return 0

    results = [validate_manifest(path) for path in discovered]
    for result in results:
        print_result(result)
    passed = sum(result.valid for result in results)
    if passed != len(results):
        print(f"Contribution validation failed: {passed} of {len(results)} passed.")
        return 1
    features = sum(result.feature_count for result in results)
    print(
        "Contribution validation passed: "
        f"{len(results)} manifest(s) and {features} feature(s)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
