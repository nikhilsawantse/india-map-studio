#!/usr/bin/env python3
"""Prepare Mumbai administrative wards for tehsil-level SVG generation.

The published Mumbai ward GeoJSON stores latitude before longitude. This tool
normalizes the coordinates, assigns each ward to its Survey of India
subdistrict by its representative point, and writes one ward collection plus
one outline feature per tehsil. The SVG generator clips ward geometry to the
tehsil outline, so edge differences between sources remain visually contained.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence


Point = tuple[float, float]
Ring = list[Point]


WARD_NAMES = {
    "A": "A Ward",
    "B": "B Ward",
    "C": "C Ward",
    "D": "D Ward",
    "E": "E Ward",
    "F/N": "F/North Ward",
    "F/S": "F/South Ward",
    "G/N": "G/North Ward",
    "G/S": "G/South Ward",
    "H/E": "H/East Ward",
    "H/W": "H/West Ward",
    "K/E": "K/East Ward",
    "K/W": "K/West Ward",
    "L": "L Ward",
    "M/E": "M/East Ward",
    "M/W": "M/West Ward",
    "N": "N Ward",
    "P/N": "P/North Ward",
    "P/S": "P/South Ward",
    "R/C": "R/Central Ward",
    "R/N": "R/North Ward",
    "R/S": "R/South Ward",
    "S": "S Ward",
    "T": "T Ward",
}

MUMBAI_CITY_WARD_CODES = {
    "A",
    "B",
    "C",
    "D",
    "E",
    "F/N",
    "F/S",
    "G/N",
    "G/S",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wards", required=True, type=Path)
    parser.add_argument(
        "--subdistricts",
        required=True,
        nargs="+",
        type=Path,
        help="One or more Survey of India subdistrict GeoJSON files",
    )
    parser.add_argument("--output-dir", required=True, type=Path)
    return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def write_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as output:
        json.dump(document, output, ensure_ascii=False, separators=(",", ":"))
        output.write("\n")


def slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def normalize_ward_code(value: Any) -> str:
    return re.sub(r"\s+", "", str(value or "").strip()).upper()


def swap_position(position: Sequence[float]) -> list[float]:
    swapped = [position[1], position[0]]
    if len(position) > 2:
        swapped.extend(position[2:])
    return swapped


def swap_coordinates(value: Any) -> Any:
    if (
        isinstance(value, list)
        and len(value) >= 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    ):
        return swap_position(value)
    if isinstance(value, list):
        return [swap_coordinates(item) for item in value]
    return value


def normalized_ward_feature(feature: dict[str, Any]) -> dict[str, Any]:
    properties = feature.get("properties") or {}
    code = normalize_ward_code(properties.get("NAME2") or properties.get("Name"))
    if code not in WARD_NAMES:
        raise ValueError(f"Unknown Mumbai ward code: {code!r}")
    geometry = dict(feature["geometry"])
    geometry["coordinates"] = swap_coordinates(geometry["coordinates"])
    source_id = code.replace("/", "-")
    return {
        "type": "Feature",
        "properties": {
            "name": WARD_NAMES[code],
            "ward_code": code,
            "source_id": source_id,
            "source_object_id": str(properties.get("OBJECTID") or ""),
            "source": "OpenCity Mumbai administrative ward boundaries",
            "source_updated": "2026-05-26",
        },
        "geometry": geometry,
    }


def feature_name(feature: dict[str, Any]) -> str:
    properties = feature.get("properties") or {}
    return str(
        properties.get("SUB_DIST")
        or properties.get("sdtname")
        or properties.get("name")
        or ""
    ).strip()


def polygon_rings(geometry: dict[str, Any]) -> Iterator[list[Ring]]:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if geometry_type == "Polygon":
        yield [[tuple(point[:2]) for point in ring] for ring in coordinates]
    elif geometry_type == "MultiPolygon":
        for polygon in coordinates:
            yield [[tuple(point[:2]) for point in ring] for ring in polygon]


def exterior_rings(geometry: dict[str, Any]) -> list[Ring]:
    return [polygon[0] for polygon in polygon_rings(geometry) if polygon]


def all_points(geometry: dict[str, Any]) -> Iterator[Point]:
    for polygon in polygon_rings(geometry):
        for ring in polygon:
            yield from ring


def geometry_bbox(geometry: dict[str, Any]) -> tuple[float, float, float, float]:
    points = list(all_points(geometry))
    return (
        min(point[0] for point in points),
        min(point[1] for point in points),
        max(point[0] for point in points),
        max(point[1] for point in points),
    )


def signed_ring_area(ring: Ring) -> float:
    return sum(
        ring[index][0] * ring[(index + 1) % len(ring)][1]
        - ring[(index + 1) % len(ring)][0] * ring[index][1]
        for index in range(len(ring))
    ) / 2


def ring_centroid(ring: Ring) -> Point:
    area_factor = sum(
        ring[index][0] * ring[(index + 1) % len(ring)][1]
        - ring[(index + 1) % len(ring)][0] * ring[index][1]
        for index in range(len(ring))
    )
    if abs(area_factor) < 1e-15:
        return ring[0]
    centroid_x = 0.0
    centroid_y = 0.0
    for index, point in enumerate(ring):
        next_point = ring[(index + 1) % len(ring)]
        cross = point[0] * next_point[1] - next_point[0] * point[1]
        centroid_x += (point[0] + next_point[0]) * cross
        centroid_y += (point[1] + next_point[1]) * cross
    return centroid_x / (3 * area_factor), centroid_y / (3 * area_factor)


def representative_point(geometry: dict[str, Any]) -> Point:
    rings = exterior_rings(geometry)
    largest_ring = max(rings, key=lambda ring: abs(signed_ring_area(ring)))
    centroid = ring_centroid(largest_ring)
    return centroid if point_in_geometry(centroid, geometry) else largest_ring[0]


def bboxes_intersect(
    left: tuple[float, float, float, float],
    right: tuple[float, float, float, float],
) -> bool:
    return not (
        left[2] < right[0]
        or right[2] < left[0]
        or left[3] < right[1]
        or right[3] < left[1]
    )


def point_in_ring(point: Point, ring: Ring) -> bool:
    x, y = point
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous
        x2, y2 = current
        if (y1 > y) != (y2 > y):
            crossing_x = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < crossing_x:
                inside = not inside
        previous = current
    return inside


def point_in_geometry(point: Point, geometry: dict[str, Any]) -> bool:
    for polygon in polygon_rings(geometry):
        if not polygon or not point_in_ring(point, polygon[0]):
            continue
        if any(point_in_ring(point, hole) for hole in polygon[1:]):
            continue
        return True
    return False


def orientation(a: Point, b: Point, c: Point) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def on_segment(a: Point, b: Point, point: Point, epsilon: float = 1e-12) -> bool:
    return (
        min(a[0], b[0]) - epsilon <= point[0] <= max(a[0], b[0]) + epsilon
        and min(a[1], b[1]) - epsilon <= point[1] <= max(a[1], b[1]) + epsilon
        and abs(orientation(a, b, point)) <= epsilon
    )


def segments_intersect(a: Point, b: Point, c: Point, d: Point) -> bool:
    ab_c = orientation(a, b, c)
    ab_d = orientation(a, b, d)
    cd_a = orientation(c, d, a)
    cd_b = orientation(c, d, b)
    if (ab_c > 0) != (ab_d > 0) and (cd_a > 0) != (cd_b > 0):
        return True
    return (
        on_segment(a, b, c)
        or on_segment(a, b, d)
        or on_segment(c, d, a)
        or on_segment(c, d, b)
    )


def ring_segments(ring: Ring) -> Iterable[tuple[Point, Point]]:
    for index, point in enumerate(ring):
        yield point, ring[(index + 1) % len(ring)]


def geometries_intersect(
    left: dict[str, Any],
    right: dict[str, Any],
) -> bool:
    if not bboxes_intersect(geometry_bbox(left), geometry_bbox(right)):
        return False
    left_exteriors = exterior_rings(left)
    right_exteriors = exterior_rings(right)

    def sampled_points(rings: list[Ring], limit: int = 160) -> Iterator[Point]:
        for ring in rings:
            step = max(1, len(ring) // limit)
            yield from ring[::step]

    if any(point_in_geometry(point, right) for point in sampled_points(left_exteriors)):
        return True
    if any(point_in_geometry(point, left) for point in sampled_points(right_exteriors)):
        return True
    def sampled_segments(ring: Ring, limit: int = 180) -> Iterator[tuple[Point, Point]]:
        step = max(1, len(ring) // limit)
        for index in range(0, len(ring), step):
            yield ring[index], ring[(index + step) % len(ring)]

    for left_ring in left_exteriors:
        for right_ring in right_exteriors:
            for left_a, left_b in sampled_segments(left_ring):
                for right_a, right_b in sampled_segments(right_ring):
                    if not bboxes_intersect(
                        (
                            min(left_a[0], left_b[0]),
                            min(left_a[1], left_b[1]),
                            max(left_a[0], left_b[0]),
                            max(left_a[1], left_b[1]),
                        ),
                        (
                            min(right_a[0], right_b[0]),
                            min(right_a[1], right_b[1]),
                            max(right_a[0], right_b[0]),
                            max(right_a[1], right_b[1]),
                        ),
                    ):
                        continue
                    if segments_intersect(left_a, left_b, right_a, right_b):
                        return True
    return False


def main() -> None:
    args = parse_args()
    wards_document = read_json(args.wards)
    wards = [
        normalized_ward_feature(feature)
        for feature in wards_document.get("features", [])
    ]
    if len(wards) != 24:
        raise ValueError(f"Expected 24 Mumbai administrative wards, found {len(wards)}")

    subdistricts: list[dict[str, Any]] = []
    for path in args.subdistricts:
        document = read_json(path)
        subdistricts.extend(document.get("features", []))

    outlines_by_name = {feature_name(feature): feature for feature in subdistricts}
    if "Mumbai" not in outlines_by_name:
        raise ValueError("The Mumbai City subdistrict outline is required")

    ward_assignments: dict[str, list[dict[str, Any]]] = {
        name: [] for name in outlines_by_name
    }
    suburban_outlines = [
        feature
        for name, feature in outlines_by_name.items()
        if name != "Mumbai"
    ]
    for ward in wards:
        ward_code = ward["properties"]["ward_code"]
        if ward_code in MUMBAI_CITY_WARD_CODES:
            ward_assignments["Mumbai"].append(ward)
            continue
        point = representative_point(ward["geometry"])
        matching_outlines = [
            outline
            for outline in suburban_outlines
            if point_in_geometry(point, outline["geometry"])
        ]
        if len(matching_outlines) != 1:
            names = ", ".join(feature_name(feature) for feature in matching_outlines)
            raise ValueError(
                f"Ward {ward_code} did not resolve to one suburban tehsil "
                f"(matches: {names or 'none'})"
            )
        ward_assignments[feature_name(matching_outlines[0])].append(ward)

    for outline in subdistricts:
        name = feature_name(outline)
        if not name:
            raise ValueError("A subdistrict feature does not have a name")
        matching_wards = ward_assignments[name]
        matching_wards.sort(key=lambda feature: feature["properties"]["ward_code"])
        slug = slugify(name)
        write_json(
            args.output_dir / f"{slug}-wards.geojson",
            {"type": "FeatureCollection", "features": matching_wards},
        )
        write_json(args.output_dir / f"{slug}-outline.geojson", outline)
        ward_codes = ", ".join(
            feature["properties"]["ward_code"] for feature in matching_wards
        )
        print(f"{name}: {len(matching_wards)} assigned wards ({ward_codes})")


if __name__ == "__main__":
    main()
