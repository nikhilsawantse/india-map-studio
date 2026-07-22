#!/usr/bin/env python3
"""Validate that the repository is safe to publish as a static site."""

from __future__ import annotations

import csv
import json
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
    "registry.html",
    "contribute.html",
    "404.html",
    "LICENSE",
    "DATA_LICENSES.md",
    "THIRD_PARTY_NOTICES.md",
    "assets/maps/india-states.svg",
    "map-engine.js",
    "india-svg-map.js",
    "docs/map-engine.md",
    "docs/map-engine.html",
    "examples/multiple-maps.html",
    "examples/index.html",
    "examples/choropleth.html",
    "examples/choropleth.js",
    "examples/csv-data.html",
    "examples/csv-data.js",
    "examples/drill-down.html",
    "examples/drill-down.js",
    "examples/markers.html",
    "examples/markers.js",
    "examples/poi-layers.html",
    "examples/poi-layers.js",
    "examples/advanced-map-utils.js",
    "examples/marker-clustering.html",
    "examples/marker-clustering.js",
    "examples/heatmap.html",
    "examples/heatmap.js",
    "examples/route-network.html",
    "examples/route-network.js",
    "examples/time-series.html",
    "examples/time-series.js",
    "examples/comparison-map.html",
    "examples/comparison-map.js",
    "examples/custom-icons.html",
    "examples/custom-icons.js",
    "examples/location-finder.html",
    "examples/location-finder.js",
    "examples/nearby-places.html",
    "examples/nearby-places.js",
    "examples/draw-select.html",
    "examples/draw-select.js",
    "examples/service-coverage.html",
    "examples/service-coverage.js",
    "examples/incident-alerts.html",
    "examples/incident-alerts.js",
    "examples/embedded-map.html",
    "examples/embedded-map.js",
    "examples/embed-frame.html",
    "examples/examples.css",
    "sample-data/india-state-demo.csv",
    "sample-data/maharashtra-district-demo.csv",
    "sample-data/india-marker-demo.json",
    "sample-data/india-poi-layers-demo.json",
    "sample-data/sample-map-marker.svg",
    "sample-data/README.md",
    "starter/index.html",
    "starter/app.js",
    "starter/styles.css",
    "starter/README.md",
    "docs/quick-start.md",
    "docs/quick-start.html",
    "data/boundary-registry.json",
    "data/location-index.json",
    "data/boundary-registry.schema.json",
    "data/boundary-contribution.schema.json",
    "docs/boundary-registry.md",
    "docs/contributing-boundaries.md",
    "tools/build_boundary_registry.py",
    "tools/build_location_index.py",
    "tools/validate_boundary_contribution.py",
    "tools/check_contributions.py",
    "tools/new_boundary_contribution.py",
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
STATE_SLUG = re.compile(r'"slug"\s*:\s*"([a-z0-9-]+)"')
MAHARASHTRA_DISTRICT_ID = re.compile(
    r'data-feature-id="(IN-REGION-27-DISTRICT-[^"]+)"'
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

    for html_path in ROOT.rglob("*.html"):
        html_relative = html_path.relative_to(ROOT).as_posix()
        if ".git" in html_path.parts:
            continue
        if tracked and html_relative not in tracked:
            continue
        source = html_path.read_text(encoding="utf-8")
        for match in LOCAL_REFERENCE.finditer(source):
            reference = match.group(1)
            if reference.startswith("/"):
                errors.append(
                    f"{html_relative} uses a root-relative URL: {reference}"
                )
                continue
            target = (html_path.parent / reference).resolve()
            if not target.exists():
                errors.append(
                    f"{html_relative} references a missing file: {reference}"
                )
                continue
            if target.is_dir():
                target = target / "index.html"
            try:
                tracked_reference = target.relative_to(ROOT).as_posix()
            except ValueError:
                errors.append(
                    f"{html_relative} references a file outside the repository: "
                    f"{reference}"
                )
                continue
            if tracked and tracked_reference not in tracked:
                errors.append(
                    f"{html_relative} references an untracked file: {reference}"
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

    state_data_source = (ROOT / "data/states.js").read_text(encoding="utf-8")
    state_slugs = set(STATE_SLUG.findall(state_data_source))
    with (ROOT / "sample-data/india-state-demo.csv").open(
        encoding="utf-8", newline=""
    ) as source:
        sample_rows = list(csv.DictReader(source))
    sample_slugs = {row.get("slug", "") for row in sample_rows}
    if len(sample_rows) != 36 or sample_slugs != state_slugs:
        errors.append(
            "The choropleth sample must contain one unique row for every public region"
        )
    for row in sample_rows:
        try:
            float(row.get("demo_index", ""))
        except ValueError:
            errors.append(
                f"The choropleth sample has a non-numeric demo_index: {row.get('slug', '')}"
            )

    with (ROOT / "sample-data/maharashtra-district-demo.csv").open(
        encoding="utf-8", newline=""
    ) as source:
        district_sample_rows = list(csv.DictReader(source))
    district_sample_ids = {
        row.get("district_id", "") for row in district_sample_rows
    }
    maharashtra_source = (
        ROOT / "assets/maps/states/maharashtra.svg"
    ).read_text(encoding="utf-8")
    maharashtra_district_ids = set(
        MAHARASHTRA_DISTRICT_ID.findall(maharashtra_source)
    )
    if (
        len(district_sample_rows) != len(maharashtra_district_ids)
        or district_sample_ids != maharashtra_district_ids
    ):
        errors.append(
            "The Maharashtra CSV sample must contain one unique row for every district"
        )
    for row in district_sample_rows:
        for field in ("population_index", "literacy_rate", "priority_score"):
            try:
                float(row.get(field, ""))
            except ValueError:
                errors.append(
                    "The Maharashtra CSV sample has a non-numeric "
                    f"{field}: {row.get('district_id', '')}"
                )

    marker_sample = json.loads(
        (ROOT / "sample-data/india-marker-demo.json").read_text(encoding="utf-8")
    )
    markers = marker_sample.get("markers", [])
    marker_slugs = [marker.get("slug", "") for marker in markers]
    if not markers or len(marker_slugs) != len(set(marker_slugs)):
        errors.append("The marker sample must contain unique marker region slugs")
    unknown_markers = sorted(set(marker_slugs) - state_slugs)
    if unknown_markers:
        errors.append(
            "The marker sample references unknown regions: " + ", ".join(unknown_markers)
        )
    if any(
        not isinstance(marker.get("value"), (int, float)) or marker["value"] <= 0
        for marker in markers
    ):
        errors.append("Every marker sample value must be a positive number")

    poi_sample = json.loads(
        (ROOT / "sample-data/india-poi-layers-demo.json").read_text(
            encoding="utf-8"
        )
    )
    poi_markers = poi_sample.get("markers", [])
    poi_ids = [marker.get("id", "") for marker in poi_markers]
    poi_categories = {marker.get("category", "") for marker in poi_markers}
    if len(poi_markers) < 12 or len(poi_ids) != len(set(poi_ids)):
        errors.append(
            "The POI layer sample must contain at least 12 uniquely identified places"
        )
    if poi_categories != {"reservoir", "sanctuary", "station"}:
        errors.append(
            "The POI layer sample must cover reservoir, sanctuary, and station categories"
        )
    for marker in poi_markers:
        longitude = marker.get("longitude")
        latitude = marker.get("latitude")
        if (
            not isinstance(longitude, (int, float))
            or not isinstance(latitude, (int, float))
            or not 68 <= longitude <= 98
            or not 6 <= latitude <= 38
        ):
            errors.append(
                f"The POI sample has invalid India coordinates: {marker.get('id', '')}"
            )
        if not str(marker.get("sourceUrl", "")).startswith(
            "https://www.wikidata.org/wiki/Q"
        ):
            errors.append(
                f"The POI sample has an invalid source URL: {marker.get('id', '')}"
            )

    registry_check = subprocess.run(
        [sys.executable, "tools/build_boundary_registry.py", "--check"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if registry_check.returncode != 0:
        errors.append(registry_check.stdout.strip() or registry_check.stderr.strip())

    contribution_check = subprocess.run(
        [sys.executable, "tools/check_contributions.py"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if contribution_check.returncode != 0:
        errors.append(
            contribution_check.stdout.strip() or contribution_check.stderr.strip()
        )

    location_index_check = subprocess.run(
        [sys.executable, "tools/build_location_index.py", "--check"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if location_index_check.returncode != 0:
        errors.append(
            location_index_check.stdout.strip()
            or location_index_check.stderr.strip()
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
