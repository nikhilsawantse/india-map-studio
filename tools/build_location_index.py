#!/usr/bin/env python3
"""Build the compact administrative-location index used by the finder example."""

from __future__ import annotations

import argparse
import json
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATE_DATA = ROOT / "data/states.js"
OUTPUT = ROOT / "data/location-index.json"
PUNE_TEHSILS = ROOT / "assets/maps/districts/maharashtra/pune.svg"

STATE_ALIASES = {
    "delhi": ["NCT Delhi", "National Capital Territory of Delhi"],
    "odisha": ["Orissa"],
    "puducherry": ["Pondicherry"],
    "uttarakhand": ["Uttaranchal"],
}


def load_states() -> list[dict[str, str]]:
    source = STATE_DATA.read_text(encoding="utf-8")
    start = source.index("[")
    end = source.rindex("]") + 1
    return json.loads(source[start:end])


def class_names(element: ET.Element) -> set[str]:
    return set(element.attrib.get("class", "").split())


def state_entry(state: dict[str, str]) -> dict[str, object]:
    return {
        "id": f"state:{state['slug']}",
        "level": "state",
        "name": state["name"],
        "slug": state["slug"],
        "type": state["type"],
        "code": state["code"],
        "identifier": state["identifier"],
        "stateName": state["name"],
        "stateSlug": state["slug"],
        "mapSrc": "assets/maps/india-states.svg",
        "aliases": STATE_ALIASES.get(state["slug"], []),
    }


def district_entries(state: dict[str, str]) -> list[dict[str, object]]:
    svg_path = ROOT / state["svg"]
    root = ET.parse(svg_path).getroot()
    entries: list[dict[str, object]] = []
    for element in root.iter():
        if "district-region" not in class_names(element):
            continue
        attributes = element.attrib
        name = attributes.get("data-district") or attributes.get("data-name")
        slug = attributes.get("data-slug")
        identifier = attributes.get("data-feature-id")
        if not name or not slug or not identifier:
            raise ValueError(f"Incomplete district metadata in {svg_path}")
        entries.append(
            {
                "id": f"district:{state['slug']}:{slug}",
                "level": "district",
                "name": name,
                "slug": slug,
                "type": "District",
                "code": attributes.get("data-code", ""),
                "lgdCode": attributes.get("data-lgd-code", ""),
                "identifier": identifier,
                "stateName": state["name"],
                "stateSlug": state["slug"],
                "mapSrc": state["svg"],
                "aliases": [],
            }
        )
    return sorted(entries, key=lambda entry: str(entry["name"]))


def pune_tehsil_entries() -> list[dict[str, object]]:
    root = ET.parse(PUNE_TEHSILS).getroot()
    entries: list[dict[str, object]] = []
    for element in root.iter():
        if "child-region" not in class_names(element):
            continue
        attributes = element.attrib
        name = attributes.get("data-name")
        slug = attributes.get("data-slug")
        identifier = attributes.get("data-feature-id")
        if not name or not slug or not identifier:
            raise ValueError(f"Incomplete tehsil metadata in {PUNE_TEHSILS}")
        entries.append(
            {
                "id": f"tehsil:maharashtra:pune:{slug}",
                "level": "tehsil",
                "name": name,
                "slug": slug,
                "type": "Tehsil",
                "code": attributes.get("data-census-code", ""),
                "lgdCode": attributes.get("data-lgd-code", ""),
                "identifier": identifier,
                "stateName": "Maharashtra",
                "stateSlug": "maharashtra",
                "districtName": "Pune",
                "districtSlug": "pune",
                "mapSrc": "assets/maps/districts/maharashtra/pune.svg",
                "aliases": [],
            }
        )
    return sorted(entries, key=lambda entry: str(entry["name"]))


def build_index() -> dict[str, object]:
    states = load_states()
    state_locations = [state_entry(state) for state in states]
    districts = [entry for state in states for entry in district_entries(state)]
    tehsils = pune_tehsil_entries()
    return {
        "schemaVersion": "1.0.0",
        "counts": {
            "states": len(state_locations),
            "districts": len(districts),
            "tehsils": len(tehsils),
            "total": len(state_locations) + len(districts) + len(tehsils),
        },
        "locations": state_locations + districts + tehsils,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the committed index differs from the generated index.",
    )
    arguments = parser.parse_args()
    payload = build_index()
    serialized = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if arguments.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != serialized:
            raise SystemExit(
                "Location index is stale. Run tools/build_location_index.py."
            )
    else:
        OUTPUT.write_text(serialized, encoding="utf-8")
    counts = payload["counts"]
    prefix = "Location index is current: " if arguments.check else "Built location index: "
    print(
        prefix
        + f"{counts['states']} states/UTs, {counts['districts']} districts, "
        f"{counts['tehsils']} tehsils."
    )


if __name__ == "__main__":
    main()
