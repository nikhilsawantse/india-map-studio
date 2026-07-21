#!/usr/bin/env python3
"""Generate one interactive state district SVG without rebuilding other maps."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from generate_maps import (
    canonical_groups,
    generate_district_state_svg,
)


def read_features(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as source_file:
        document = json.load(source_file)

    if document.get("type") != "FeatureCollection":
        raise ValueError(f"{path} must contain a GeoJSON FeatureCollection")
    features = document.get("features")
    if not isinstance(features, list) or not features:
        raise ValueError(f"{path} does not contain any features")
    return features


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--state-source",
        required=True,
        type=Path,
        help="Path to the national state-boundary GeoJSON",
    )
    parser.add_argument(
        "--district-source",
        required=True,
        type=Path,
        help="Path to the selected state's district GeoJSON",
    )
    parser.add_argument(
        "--state-slug",
        required=True,
        help="Canonical project state slug, for example karnataka",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Destination SVG path",
    )
    parser.add_argument(
        "--district-simplify",
        type=float,
        default=0.35,
        help="Minimum rendered point spacing in SVG units",
    )
    args = parser.parse_args()

    groups = canonical_groups(read_features(args.state_source))
    group = groups.get(args.state_slug)
    if not group:
        parser.error(f"Unknown state slug: {args.state_slug}")

    district_features = read_features(args.district_source)
    svg = generate_district_state_svg(
        group,
        district_features,
        args.district_simplify,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(svg, encoding="utf-8")
    print(
        f"Generated {args.output} with {len(district_features)} "
        f"interactive {group['name']} districts."
    )


if __name__ == "__main__":
    main()
