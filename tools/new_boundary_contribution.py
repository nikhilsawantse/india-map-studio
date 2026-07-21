#!/usr/bin/env python3
"""Interactively create a boundary contribution workspace."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

from validate_boundary_contribution import local_name, print_result, svg_features, validate_manifest


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROOT = ROOT / "contributions"
LEVELS = (
    "regions",
    "divisions",
    "districts",
    "subdivisions",
    "tehsils",
    "blocks",
    "villages",
    "gram-panchayats",
    "wards",
    "other",
)


def ask(label: str, default: str = "", *, required: bool = True) -> str:
    suffix = f" [{default}]" if default else ""
    while True:
        value = input(f"{label}{suffix}: ").strip() or default
        if value or not required:
            return value
        print("  A value is required.")


def ask_yes(label: str) -> bool:
    return ask(f"{label} (type yes)", required=True).lower() == "yes"


def directory_name(layer_id: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", layer_id.lower()).strip("-")


def detected_format(asset: Path) -> str:
    return "svg" if asset.suffix.lower() == ".svg" else "geojson"


def detected_count(asset: Path, asset_format: str, selector: str) -> int:
    if asset_format == "svg":
        root = ET.parse(asset).getroot()
        if local_name(root.tag).lower() != "svg":
            raise ValueError("the selected file does not have an SVG root")
        return len(svg_features(root, selector))
    document = json.loads(asset.read_text(encoding="utf-8-sig"))
    if not isinstance(document, dict) or document.get("type") != "FeatureCollection":
        raise ValueError("the selected file is not a GeoJSON FeatureCollection")
    features = document.get("features")
    if not isinstance(features, list):
        raise ValueError("the GeoJSON features member is not an array")
    return len(features)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a guided India Map Studio boundary contribution."
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=DEFAULT_ROOT,
        help="Parent directory for the new contribution (default: contributions)",
    )
    args = parser.parse_args()

    print("India Map Studio boundary contribution guide")
    print("Geometry stays on this computer. No file is uploaded by this tool.\n")
    asset = Path(ask("SVG or GeoJSON source file")).expanduser().resolve()
    if not asset.is_file():
        print(f"Error: file not found: {asset}")
        return 1
    if asset.suffix.lower() not in {".svg", ".geojson", ".json"}:
        print("Error: select an .svg, .geojson, or .json file")
        return 1
    asset_format = detected_format(asset)

    layer_id = ask("Stable layer ID", "IN-REGION-00-DISTRICTS")
    label = ask("Human-readable layer label")
    level = ask("Administrative level", "districts")
    if level not in LEVELS:
        print(f"Error: level must be one of {', '.join(LEVELS)}")
        return 1
    parent_id = ask("Parent feature ID (blank only for national layer)", required=False) or None
    selector = ask(
        "Feature selector",
        ".district-region" if asset_format == "svg" else "Feature",
    )
    feature_key = ask(
        "Stable feature identifier attribute/property",
        "data-feature-id" if asset_format == "svg" else "feature_id",
    )
    slug_key = ask(
        "Feature slug attribute/property",
        "data-slug" if asset_format == "svg" else "slug",
    )
    try:
        feature_count = detected_count(asset, asset_format, selector)
    except (ET.ParseError, UnicodeError, json.JSONDecodeError, ValueError) as error:
        print(f"Error: could not inspect the asset: {error}")
        return 1
    print(f"  Detected {feature_count} feature(s).")

    source_name = ask("Direct source name")
    source_url = ask("Direct source URL")
    source_revision = ask("Source release, revision, or checksum")
    retrieved_at = ask("Retrieval date (YYYY-MM-DD)", date.today().isoformat())
    vintage = ask("Boundary vintage or effective date")
    license_name = ask("Exact license name")
    license_spdx = ask("SPDX license identifier", "LicenseRef-Custom")
    license_url = ask("License URL")
    attribution = ask("Required attribution")
    transformation = ask("Transformations performed", "None; source used as published")
    command = ask("Reproducible generator command", "Manual source export; no generator")
    if not ask_yes("Confirmed: redistribution and derivatives are permitted?"):
        print("Stopped: unconfirmed geometry cannot enter the public contribution workspace.")
        return 1

    destination = args.output_root.resolve() / directory_name(layer_id)
    if destination.exists():
        print(f"Error: contribution directory already exists: {destination}")
        return 1
    destination.mkdir(parents=True)
    copied_asset = destination / asset.name
    shutil.copy2(asset, copied_asset)
    manifest = {
        "schemaVersion": "1.0.0",
        "layer": {
            "id": layer_id,
            "label": label,
            "level": level,
            "parentId": parent_id,
            "file": copied_asset.name,
            "format": asset_format,
            "featureCount": feature_count,
            "featureSelector": selector,
            "identifiers": {"feature": feature_key, "slug": slug_key},
        },
        "source": {
            "name": source_name,
            "url": source_url,
            "revision": source_revision,
            "retrievedAt": retrieved_at,
            "vintage": vintage,
            "license": {
                "name": license_name,
                "spdx": license_spdx,
                "url": license_url,
            },
            "attribution": attribution,
            "redistributionConfirmed": True,
        },
        "processing": {
            "transformations": [transformation],
            "command": command,
        },
    }
    manifest_path = destination / "boundary-contribution.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    result = validate_manifest(manifest_path)
    print()
    print_result(result)
    if result.valid:
        print(f"\nCreated contribution workspace: {destination}")
        print("Next: run python tools/check_contributions.py and open a pull request.")
        return 0
    print("\nThe workspace was kept so you can correct the reported fields.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
