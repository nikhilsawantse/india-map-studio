#!/usr/bin/env python3
"""Extract village relations inside one subdistrict boundary.

The input OSM file is expected to contain administrative village relations.
The boundary source may be GeoJSON or GeoJSONL and must include a Census
subdistrict code such as ``sdtcode11``.
"""

from __future__ import annotations

import argparse
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def normalize_code(value: object) -> str:
    text = str(value or "").strip()
    return text.lstrip("0") or "0"


def read_boundary(source: Path, subdistrict_code: str) -> dict:
    wanted = normalize_code(subdistrict_code)
    if source.suffix.lower() == ".geojsonl":
        with source.open("r", encoding="utf-8") as source_file:
            for line in source_file:
                if not line.strip():
                    continue
                feature = json.loads(line)
                properties = feature.get("properties", {})
                code = properties.get("sdtcode11") or properties.get(
                    "subdistrict_code"
                )
                if normalize_code(code) == wanted:
                    return feature
    else:
        document = json.loads(source.read_text(encoding="utf-8"))
        features = (
            document.get("features", [])
            if document.get("type") == "FeatureCollection"
            else [document]
        )
        for feature in features:
            properties = feature.get("properties", {})
            code = properties.get("sdtcode11") or properties.get(
                "subdistrict_code"
            )
            if normalize_code(code) == wanted:
                return feature
    raise ValueError(f"Subdistrict code {subdistrict_code} was not found")


def parse_osm(source: Path) -> tuple[dict, dict, list]:
    nodes: dict[str, tuple[float, float]] = {}
    ways: dict[str, list[str]] = {}
    relations: list[dict] = []

    for _, element in ET.iterparse(source, events=("end",)):
        if element.tag == "node":
            nodes[element.attrib["id"]] = (
                float(element.attrib["lon"]),
                float(element.attrib["lat"]),
            )
        elif element.tag == "way":
            ways[element.attrib["id"]] = [
                child.attrib["ref"]
                for child in element
                if child.tag == "nd" and child.attrib.get("ref")
            ]
        elif element.tag == "relation":
            tags = {
                child.attrib["k"]: child.attrib["v"]
                for child in element
                if child.tag == "tag"
            }
            if tags.get("boundary") == "administrative" and tags.get("name"):
                relations.append(
                    {
                        "id": element.attrib["id"],
                        "name": tags["name"],
                        "members": [
                            {
                                "ref": child.attrib["ref"],
                                "role": child.attrib.get("role", "outer"),
                            }
                            for child in element
                            if child.tag == "member"
                            and child.attrib.get("type") == "way"
                        ],
                    }
                )
        if element.tag in {"node", "way", "relation"}:
            element.clear()
    return nodes, ways, relations


def stitch_rings(segments: list[list[str]]) -> list[list[str]]:
    remaining = [segment[:] for segment in segments if len(segment) > 1]
    rings: list[list[str]] = []

    while remaining:
        ring = remaining.pop(0)
        progress = True
        while ring[0] != ring[-1] and progress:
            progress = False
            for index, segment in enumerate(remaining):
                if ring[-1] == segment[0]:
                    ring.extend(segment[1:])
                elif ring[-1] == segment[-1]:
                    ring.extend(reversed(segment[:-1]))
                elif ring[0] == segment[-1]:
                    ring = segment[:-1] + ring
                elif ring[0] == segment[0]:
                    ring = list(reversed(segment[1:])) + ring
                else:
                    continue
                remaining.pop(index)
                progress = True
                break
        if len(ring) >= 4 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings


def relation_geometry(relation: dict, nodes: dict, ways: dict) -> dict | None:
    outer_segments = [
        ways[member["ref"]]
        for member in relation["members"]
        if member["role"] != "inner" and member["ref"] in ways
    ]
    inner_segments = [
        ways[member["ref"]]
        for member in relation["members"]
        if member["role"] == "inner" and member["ref"] in ways
    ]
    outer_rings = stitch_rings(outer_segments)
    inner_rings = stitch_rings(inner_segments)
    if not outer_rings:
        return None

    coordinate_rings = [
        [nodes[node_id] for node_id in ring if node_id in nodes]
        for ring in outer_rings
    ]
    coordinate_rings = [ring for ring in coordinate_rings if len(ring) >= 4]
    holes = [
        [nodes[node_id] for node_id in ring if node_id in nodes]
        for ring in inner_rings
    ]
    holes = [ring for ring in holes if len(ring) >= 4]
    if not coordinate_rings:
        return None

    if len(coordinate_rings) == 1:
        return {"type": "Polygon", "coordinates": [coordinate_rings[0], *holes]}
    return {
        "type": "MultiPolygon",
        "coordinates": [[[point for point in ring]] for ring in coordinate_rings],
    }


def polygon_sets(geometry: dict) -> list[list[list[float]]]:
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in geometry["coordinates"] for ring in polygon]
    raise ValueError(f"Unsupported boundary geometry: {geometry['type']}")


def point_in_ring(point: tuple[float, float], ring: list[list[float]]) -> bool:
    x, y = point
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous
        x2, y2 = current
        if (y1 > y) != (y2 > y):
            crossing = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < crossing:
                inside = not inside
        previous = current
    return inside


def representative_point(geometry: dict) -> tuple[float, float]:
    if geometry["type"] == "Polygon":
        ring = geometry["coordinates"][0]
    else:
        ring = max(
            (polygon[0] for polygon in geometry["coordinates"]),
            key=len,
        )
    unique = ring[:-1] if ring[0] == ring[-1] else ring
    return (
        sum(point[0] for point in unique) / len(unique),
        sum(point[1] for point in unique) / len(unique),
    )


def inside_boundary(point: tuple[float, float], boundary: dict) -> bool:
    return any(point_in_ring(point, ring) for ring in polygon_sets(boundary))


def extract_features(osm_source: Path, boundary: dict) -> list[dict]:
    nodes, ways, relations = parse_osm(osm_source)
    features = []
    for relation in relations:
        geometry = relation_geometry(relation, nodes, ways)
        if not geometry or not inside_boundary(
            representative_point(geometry),
            boundary["geometry"],
        ):
            continue
        source_id = f"SOI-PUNE-{abs(int(relation['id'])):04d}"
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "name": relation["name"],
                    "source_id": source_id,
                    "osm_relation_id": relation["id"],
                },
                "geometry": geometry,
            }
        )
    return sorted(features, key=lambda feature: feature["properties"]["name"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--osm-source", required=True, type=Path)
    parser.add_argument("--boundary-source", required=True, type=Path)
    parser.add_argument("--subdistrict-code", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--boundary-output",
        type=Path,
        help="Optional GeoJSON output for the matched subdistrict outline",
    )
    args = parser.parse_args()

    boundary = read_boundary(args.boundary_source, args.subdistrict_code)
    features = extract_features(args.osm_source, boundary)
    if not features:
        raise ValueError("No village relations fell inside the selected boundary")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": features},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    if args.boundary_output:
        args.boundary_output.parent.mkdir(parents=True, exist_ok=True)
        args.boundary_output.write_text(
            json.dumps(boundary, ensure_ascii=False),
            encoding="utf-8",
        )
    print(
        f"Extracted {len(features)} villages inside subdistrict "
        f"{args.subdistrict_code}."
    )


if __name__ == "__main__":
    main()
