#!/usr/bin/env python3
"""Validate that the repository is safe to publish as a static site."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "index.html",
    "state.html",
    "district.html",
    "tehsil.html",
    "custom-map.html",
    "audit.html",
    "404.html",
    "LICENSE",
    "DATA_LICENSES.md",
    "THIRD_PARTY_NOTICES.md",
    "assets/maps/india-states.svg",
)

LOCAL_ONLY_FILES = (
    "assets/maps/districts/maharashtra/mumbai-city.svg",
    "assets/maps/districts/maharashtra/mumbai-suburban.svg",
    "assets/maps/tehsils/maharashtra/pune/junnar.svg",
    "assets/maps/tehsils/maharashtra/mumbai-city/mumbai.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/andheri.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/borivali.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/kurla.svg",
    "sample-data/junnar-village-demo.csv",
    "sample-data/junnar-village-validation-demo.csv",
    "sample-data/junnar-village-field-types-demo.csv",
)

LOCAL_REFERENCE = re.compile(
    r"""(?:src|href)=["'](?!https?://|data:|mailto:|#)([^"'?#]+)""",
    re.IGNORECASE,
)
DISTRICT_FEATURE = re.compile(
    r"""class=["'][^"']*\bdistrict-region\b[^"']*["']""",
    re.IGNORECASE,
)
MAPPED_DISTRICT_BADGE = re.compile(
    r""">\s*36 regions\s*&middot;\s*(\d+) mapped districts\s*<""",
    re.IGNORECASE,
)


def tracked_files() -> set[str]:
    result = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return set()
    return {
        line.strip().replace("\\", "/")
        for line in result.stdout.splitlines()
        if line.strip()
    }


def main() -> int:
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if not (ROOT / relative).is_file():
            errors.append(f"Missing required public file: {relative}")

    tracked = tracked_files()
    for relative in LOCAL_ONLY_FILES:
        if relative in tracked:
            errors.append(f"Local-only data is tracked by Git: {relative}")

    for html_path in ROOT.glob("*.html"):
        source = html_path.read_text(encoding="utf-8")
        for match in LOCAL_REFERENCE.finditer(source):
            reference = match.group(1)
            if reference.startswith("/"):
                errors.append(
                    f"{html_path.name} uses a root-relative URL: {reference}"
                )
                continue
            target = (html_path.parent / reference).resolve()
            if not target.exists():
                errors.append(
                    f"{html_path.name} references a missing file: {reference}"
                )
                continue
            if target.is_dir():
                target = target / "index.html"
            try:
                tracked_reference = target.relative_to(ROOT).as_posix()
            except ValueError:
                errors.append(
                    f"{html_path.name} references a file outside the repository: "
                    f"{reference}"
                )
                continue
            if tracked and tracked_reference not in tracked:
                errors.append(
                    f"{html_path.name} references an untracked file: {reference}"
                )

    state_maps = sorted((ROOT / "assets/maps/states").glob("*.svg"))
    if len(state_maps) != 36:
        errors.append(
            f"Expected 36 public state/UT SVG files, found {len(state_maps)}"
        )

    district_count = 0
    for svg_path in state_maps:
        source = svg_path.read_text(encoding="utf-8")
        district_count += len(DISTRICT_FEATURE.findall(source))

    index_source = (ROOT / "index.html").read_text(encoding="utf-8")
    badge_match = MAPPED_DISTRICT_BADGE.search(index_source)
    if not badge_match:
        errors.append("The homepage mapped-district badge could not be validated")
    elif int(badge_match.group(1)) != district_count:
        errors.append(
            "The homepage mapped-district badge does not match the public SVGs: "
            f"{badge_match.group(1)} shown, {district_count} found"
        )

    district_registry = (ROOT / "data/district-maps.js").read_text(
        encoding="utf-8"
    )
    if "mumbai-city.svg" in district_registry:
        errors.append("The public district registry references held Mumbai data")
    if "mumbai-suburban.svg" in district_registry:
        errors.append("The public district registry references held Mumbai data")

    tehsil_registry = (ROOT / "data/tehsil-maps.js").read_text(encoding="utf-8")
    for relative in LOCAL_ONLY_FILES:
        if relative in tehsil_registry:
            errors.append(
                f"The public tehsil registry references local-only data: {relative}"
            )

    if errors:
        print("Public release validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "Public release validation passed: "
        f"{len(state_maps)} state/UT maps and {district_count} district features."
    )
    if not tracked:
        print("Git has no tracked files yet; the tracked-file check was skipped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
