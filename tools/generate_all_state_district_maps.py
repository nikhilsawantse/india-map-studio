#!/usr/bin/env python3
"""Generate interactive district SVGs for every project state and union territory."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from generate_maps import (
    canonical_groups,
    district_metadata,
    generate_district_state_svg,
)
from generate_state_district_map import read_features


SPECIAL_SOURCE_FOLDERS = {
    "andaman-and-nicobar-islands": ("ANDAMAN & NICOBAR",),
    "dadra-and-nagar-haveli-and-daman-and-diu": (
        "DADRA & NAGAR HAVELI",
        "DAMAN & DIU",
    ),
    "odisha": ("ORISSA",),
}


def normalized_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().replace("&", "and"))


def district_sources(
    source_root: Path,
    state_slug: str,
    state_name: str,
) -> list[Path]:
    folder_names = SPECIAL_SOURCE_FOLDERS.get(state_slug)
    if folder_names is None:
        normalized_state_name = normalized_name(state_name)
        matching_folders = [
            folder
            for folder in source_root.iterdir()
            if folder.is_dir()
            and normalized_name(folder.name) == normalized_state_name
        ]
        if len(matching_folders) != 1:
            raise FileNotFoundError(
                f"Could not resolve a unique source folder for {state_name}"
            )
        folders = matching_folders
    else:
        folders = [source_root / folder_name for folder_name in folder_names]

    sources: list[Path] = []
    for folder in folders:
        candidates = sorted(
            path
            for path in folder.glob("*.geojson")
            if "DISTRICTS" in path.name.upper()
            and "SUBDISTRICTS" not in path.name.upper()
        )
        if state_slug == "andhra-pradesh":
            candidates = [
                path for path in candidates if "NEW_DISTRICTS" in path.name.upper()
            ]
        if len(candidates) != 1:
            raise FileNotFoundError(
                f"Could not resolve a unique district source in {folder}"
            )
        sources.extend(candidates)
    return sources


def district_features(state_slug: str, sources: list[Path]) -> list[dict]:
    features = [
        feature
        for source in sources
        for feature in read_features(source)
    ]
    if state_slug == "jammu-and-kashmir":
        features = [
            feature
            for feature in features
            if district_metadata(feature)["lgd_code"]
        ]
    return features


def source_overrides(values: list[str]) -> dict[str, Path]:
    overrides = {}
    for value in values:
        state_slug, separator, source_path = value.partition("=")
        if not separator or not state_slug.strip() or not source_path.strip():
            raise ValueError(
                "District source overrides must use state-slug=path"
            )
        overrides[state_slug.strip()] = Path(source_path.strip())
    return overrides


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--state-source",
        required=True,
        type=Path,
        help="Path to the national state-boundary GeoJSON",
    )
    parser.add_argument(
        "--district-source-root",
        required=True,
        type=Path,
        help="Directory containing one source folder per state or union territory",
    )
    parser.add_argument(
        "--output-directory",
        required=True,
        type=Path,
        help="Destination directory for generated state SVG files",
    )
    parser.add_argument(
        "--district-simplify",
        type=float,
        default=0.35,
        help="Minimum rendered point spacing in SVG units",
    )
    parser.add_argument(
        "--district-source-override",
        action="append",
        default=[],
        metavar="STATE_SLUG=PATH",
        help=(
            "Use a replacement GeoJSON for one state; repeat for multiple "
            "states. Example: rajasthan=C:\\data\\rajasthan-soi-41.geojson"
        ),
    )
    args = parser.parse_args()

    groups = canonical_groups(read_features(args.state_source))
    overrides = source_overrides(args.district_source_override)
    unknown_overrides = sorted(set(overrides) - set(groups))
    if unknown_overrides:
        parser.error(
            "Unknown state slug in district source override: "
            + ", ".join(unknown_overrides)
        )
    args.output_directory.mkdir(parents=True, exist_ok=True)
    total_districts = 0

    for state_slug, group in sorted(groups.items()):
        sources = (
            [overrides[state_slug]]
            if state_slug in overrides
            else district_sources(
                args.district_source_root,
                state_slug,
                group["name"],
            )
        )
        features = district_features(state_slug, sources)
        output = args.output_directory / f"{state_slug}.svg"
        output.write_text(
            generate_district_state_svg(
                group,
                features,
                args.district_simplify,
            ),
            encoding="utf-8",
        )
        total_districts += len(features)
        source_labels = ", ".join(source.name for source in sources)
        print(
            f"{group['name']}: {len(features)} districts "
            f"({source_labels})"
        )

    print(
        f"Generated {len(groups)} state and union-territory SVGs "
        f"with {total_districts} district features."
    )


if __name__ == "__main__":
    main()
