#!/usr/bin/env python3
"""Build the current 17-district Nagaland GeoJSON used by the SVG generator.

The Survey of India ABDB district layer contains 16 Nagaland districts and
predates Meluri district. This utility keeps those district geometries, then
rebuilds Phek and Meluri from the source's Phek sub-district polygons. Nagaland
government records place Meluri, Phokhungri, Phor, and Liphori/Lephori in the
new Meluri district.
"""

from __future__ import annotations

import argparse
import json
import struct
from collections import defaultdict
from pathlib import Path

from extract_soi_state_districts import (
    inverse_lcc,
    polygon_geometry,
    read_dbf,
    read_name_overrides,
)


STATE_NAME = "NAGALAND"
PHEK_NAME = "PHEK"
MELURI_NAME = "MELURI"
MELURI_SOURCE_CODE = "788"
MELURI_SUBDISTRICTS = {"MELURI", "PHOKHUNGRI", "PHOR", "LIPHORI"}


def read_selected_shapes(path: Path, indexes: set[int]) -> dict[int, dict]:
    """Read only the requested zero-based records from a Polygon shapefile."""

    shapes: dict[int, dict] = {}
    with path.open("rb") as source:
        header = source.read(100)
        if len(header) != 100 or struct.unpack(">i", header[:4])[0] != 9994:
            raise ValueError(f"{path} is not a valid shapefile")

        declared_length = struct.unpack(">i", header[24:28])[0] * 2
        if path.stat().st_size != declared_length:
            raise ValueError(
                f"{path} is incomplete: expected {declared_length} bytes"
            )

        record_index = 0
        while source.tell() < declared_length:
            record_header = source.read(8)
            if len(record_header) != 8:
                raise ValueError(f"{path} contains a truncated record header")
            _, content_words = struct.unpack(">ii", record_header)
            content = source.read(content_words * 2)
            if len(content) != content_words * 2:
                raise ValueError(f"{path} contains a truncated shape record")

            if record_index not in indexes:
                record_index += 1
                continue

            shape_type = struct.unpack("<i", content[:4])[0]
            if shape_type not in (5, 15, 25):
                raise ValueError(
                    f"Unsupported shapefile shape type at record "
                    f"{record_index}: {shape_type}"
                )

            part_count, point_count = struct.unpack("<ii", content[36:44])
            parts_start = 44
            points_start = parts_start + part_count * 4
            part_starts = list(
                struct.unpack(
                    f"<{part_count}i",
                    content[parts_start:points_start],
                )
            )
            part_starts.append(point_count)
            rings = []
            for start, end in zip(part_starts, part_starts[1:]):
                ring = []
                for point_index in range(start, end):
                    offset = points_start + point_index * 16
                    ring.append(
                        inverse_lcc(
                            *struct.unpack("<2d", content[offset : offset + 16])
                        )
                    )
                rings.append(ring)
            shapes[record_index] = polygon_geometry(rings)
            record_index += 1

    missing = indexes.difference(shapes)
    if missing:
        raise ValueError(f"{path} is missing requested records: {sorted(missing)}")
    return shapes


def geometry_rings(geometry: dict) -> list[list[list[float]]]:
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [
            ring
            for polygon in geometry["coordinates"]
            for ring in polygon
        ]
    raise ValueError(f"Cannot dissolve geometry type {geometry['type']}")


def point_key(point: list[float]) -> tuple[float, float]:
    return round(point[0], 7), round(point[1], 7)


def edge_key(
    first: tuple[float, float],
    second: tuple[float, float],
) -> tuple[tuple[float, float], tuple[float, float]]:
    return (first, second) if first < second else (second, first)


def dissolve_geometries(geometries: list[dict]) -> dict:
    """Dissolve edge-matched polygons without third-party GIS dependencies."""

    edge_counts: dict[
        tuple[tuple[float, float], tuple[float, float]], int
    ] = defaultdict(int)
    for geometry in geometries:
        for ring in geometry_rings(geometry):
            if ring[0] != ring[-1]:
                ring = [*ring, ring[0]]
            for first, second in zip(ring, ring[1:]):
                first_key = point_key(first)
                second_key = point_key(second)
                if first_key == second_key:
                    continue
                edge_counts[edge_key(first_key, second_key)] += 1

    boundary_edges = {
        edge for edge, count in edge_counts.items() if count % 2 == 1
    }
    adjacency: dict[
        tuple[float, float], list[tuple[float, float]]
    ] = defaultdict(list)
    for first, second in boundary_edges:
        adjacency[first].append(second)
        adjacency[second].append(first)

    irregular = {
        point: neighbors
        for point, neighbors in adjacency.items()
        if len(neighbors) != 2
    }
    if irregular:
        raise ValueError(
            "Sub-district boundaries are not edge matched; "
            f"{len(irregular)} boundary vertices have degree other than two"
        )

    unused = set(boundary_edges)
    rings: list[list[list[float]]] = []
    while unused:
        first, second = next(iter(unused))
        unused.remove(edge_key(first, second))
        ring = [first, second]
        previous = first
        current = second

        while current != ring[0]:
            candidates = [
                neighbor
                for neighbor in adjacency[current]
                if neighbor != previous
            ]
            if len(candidates) != 1:
                raise ValueError(
                    f"Cannot continue dissolved boundary at {current}"
                )
            following = candidates[0]
            key = edge_key(current, following)
            if key not in unused:
                raise ValueError(
                    "Dissolved boundary encountered an already-used edge"
                )
            unused.remove(key)
            ring.append(following)
            previous, current = current, following

        rings.append([[longitude, latitude] for longitude, latitude in ring])

    return polygon_geometry(rings)


def feature_properties(
    source_name: str,
    source_code: str,
    overrides: dict[str, dict[str, str]],
    retrieved: str,
) -> dict[str, str]:
    override = overrides.get(source_name.upper(), {})
    return {
        "DISTRICT": override.get("name", source_name.title()),
        "SLUG": override.get("slug", ""),
        "dist_code": source_code,
        "D_CODE": override.get("lgd_code", source_code),
        "STATE": STATE_NAME,
        "state_code": "13",
        "source": "Survey of India Administrative Boundary Data Base",
        "retrieved": retrieved,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--district-shp", required=True, type=Path)
    parser.add_argument("--district-dbf", required=True, type=Path)
    parser.add_argument("--subdistrict-shp", required=True, type=Path)
    parser.add_argument("--subdistrict-dbf", required=True, type=Path)
    parser.add_argument("--overrides", required=True, type=Path)
    parser.add_argument("--retrieved", default="")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    district_rows = read_dbf(args.district_dbf)
    district_indexes = {
        index
        for index, row in enumerate(district_rows)
        if row.get("STATE_UT", "").upper() == STATE_NAME
    }
    district_shapes = read_selected_shapes(args.district_shp, district_indexes)
    overrides = read_name_overrides(args.overrides)

    subdistrict_rows = read_dbf(args.subdistrict_dbf)
    phek_subdistrict_indexes = {
        index
        for index, row in enumerate(subdistrict_rows)
        if row.get("STATE_UT", "").upper() == STATE_NAME
        and row.get("DISTRICT", "").upper() == PHEK_NAME
    }
    phek_subdistrict_shapes = read_selected_shapes(
        args.subdistrict_shp,
        phek_subdistrict_indexes,
    )

    meluri_geometries = []
    remaining_phek_geometries = []
    found_meluri_names = set()
    for index in sorted(phek_subdistrict_indexes):
        subdistrict_name = subdistrict_rows[index].get("SUB_DIST", "").upper()
        geometry = phek_subdistrict_shapes[index]
        if subdistrict_name in MELURI_SUBDISTRICTS:
            meluri_geometries.append(geometry)
            found_meluri_names.add(subdistrict_name)
        else:
            remaining_phek_geometries.append(geometry)

    if found_meluri_names != MELURI_SUBDISTRICTS:
        raise ValueError(
            "Meluri source sub-district set differs from expectation: "
            f"{sorted(found_meluri_names)}"
        )

    phek_geometry = dissolve_geometries(remaining_phek_geometries)
    meluri_geometry = dissolve_geometries(meluri_geometries)

    features = []
    for index in sorted(district_indexes):
        row = district_rows[index]
        source_name = row.get("DISTRICT", "").strip()
        source_code = row.get("DIST_LGD", "").strip()
        geometry = (
            phek_geometry
            if source_name.upper() == PHEK_NAME
            else district_shapes[index]
        )
        features.append(
            {
                "type": "Feature",
                "properties": feature_properties(
                    source_name,
                    source_code,
                    overrides,
                    args.retrieved,
                ),
                "geometry": geometry,
            }
        )

    features.append(
        {
            "type": "Feature",
            "properties": feature_properties(
                MELURI_NAME,
                MELURI_SOURCE_CODE,
                overrides,
                args.retrieved,
            ),
            "geometry": meluri_geometry,
        }
    )

    output = {
        "type": "FeatureCollection",
        "name": "Nagaland districts",
        "source": "Survey of India Administrative Boundary Data Base",
        "retrieved": args.retrieved,
        "features": features,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(features)} district features to {args.output}")


if __name__ == "__main__":
    main()
