#!/usr/bin/env python3
"""Extract one state's district polygons from the Survey of India ABDB shapefile.

The free Survey of India State/District/Sub-district Boundary Data-Base uses a
custom WGS84 Lambert Conformal Conic projection. This dependency-free utility
reads its DBF and Polygon/PolygonZ shapefile records, converts coordinates to
longitude/latitude, and writes a GeoJSON FeatureCollection for the existing SVG
generator.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path


WGS84_A = 6378137.0
WGS84_F = 1 / 298.257223563
FALSE_EASTING = 4_000_000.0
FALSE_NORTHING = 4_000_000.0
CENTRAL_MERIDIAN = math.radians(80.0)
LATITUDE_OF_ORIGIN = math.radians(24.0)
STANDARD_PARALLEL_1 = math.radians(12.472944)
STANDARD_PARALLEL_2 = math.radians(35.172806)


def projection_constants() -> tuple[float, float, float]:
    eccentricity = math.sqrt(WGS84_F * (2 - WGS84_F))

    def m(latitude: float) -> float:
        sine = math.sin(latitude)
        return math.cos(latitude) / math.sqrt(
            1 - eccentricity * eccentricity * sine * sine
        )

    def t(latitude: float) -> float:
        sine = math.sin(latitude)
        ratio = (1 - eccentricity * sine) / (1 + eccentricity * sine)
        return math.tan(math.pi / 4 - latitude / 2) / (
            ratio ** (eccentricity / 2)
        )

    m1 = m(STANDARD_PARALLEL_1)
    m2 = m(STANDARD_PARALLEL_2)
    t1 = t(STANDARD_PARALLEL_1)
    t2 = t(STANDARD_PARALLEL_2)
    cone = (math.log(m1) - math.log(m2)) / (
        math.log(t1) - math.log(t2)
    )
    factor = m1 / (cone * (t1**cone))
    origin_radius = WGS84_A * factor * (t(LATITUDE_OF_ORIGIN) ** cone)
    return eccentricity, cone, factor, origin_radius


ECCENTRICITY, CONE, FACTOR, ORIGIN_RADIUS = projection_constants()


def inverse_lcc(easting: float, northing: float) -> list[float]:
    x = easting - FALSE_EASTING
    y = northing - FALSE_NORTHING
    radius = math.copysign(
        math.hypot(x, ORIGIN_RADIUS - y),
        CONE,
    )
    theta = math.atan2(x, ORIGIN_RADIUS - y)
    t_value = (radius / (WGS84_A * FACTOR)) ** (1 / CONE)
    latitude = math.pi / 2 - 2 * math.atan(t_value)

    for _ in range(12):
        sine = math.sin(latitude)
        ratio = (1 - ECCENTRICITY * sine) / (
            1 + ECCENTRICITY * sine
        )
        updated = math.pi / 2 - 2 * math.atan(
            t_value * (ratio ** (ECCENTRICITY / 2))
        )
        if abs(updated - latitude) < 1e-13:
            latitude = updated
            break
        latitude = updated

    longitude = CENTRAL_MERIDIAN + theta / CONE
    return [round(math.degrees(longitude), 7), round(math.degrees(latitude), 7)]


def read_dbf(path: Path) -> list[dict[str, str]]:
    with path.open("rb") as source:
        header = source.read(32)
        if len(header) != 32:
            raise ValueError(f"{path} has an incomplete DBF header")

        record_count = struct.unpack("<I", header[4:8])[0]
        header_length = struct.unpack("<H", header[8:10])[0]
        record_length = struct.unpack("<H", header[10:12])[0]
        fields: list[tuple[str, int]] = []

        while source.tell() < header_length - 1:
            descriptor = source.read(32)
            name = descriptor[:11].split(b"\0", 1)[0].decode("ascii")
            fields.append((name, descriptor[16]))

        source.seek(header_length)
        rows = []
        for _ in range(record_count):
            record = source.read(record_length)
            if len(record) != record_length:
                raise ValueError(f"{path} ended before all DBF records")
            position = 1
            row = {}
            for name, length in fields:
                raw = record[position : position + length]
                position += length
                row[name] = raw.decode("latin1", errors="ignore").strip()
            rows.append(row)
        return rows


def signed_area(ring: list[list[float]]) -> float:
    return sum(
        first[0] * second[1] - second[0] * first[1]
        for first, second in zip(ring, ring[1:])
    ) / 2


def point_in_ring(point: list[float], ring: list[list[float]]) -> bool:
    x, y = point
    inside = False
    for first, second in zip(ring, ring[1:]):
        x1, y1 = first
        x2, y2 = second
        if (y1 > y) != (y2 > y):
            crossing = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < crossing:
                inside = not inside
    return inside


def polygon_geometry(rings: list[list[list[float]]]) -> dict:
    prepared = []
    for ring in rings:
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        if len(ring) >= 4 and abs(signed_area(ring)) > 1e-12:
            prepared.append(
                {
                    "ring": ring,
                    "area": abs(signed_area(ring)),
                    "parent": None,
                    "depth": 0,
                }
            )

    for index, candidate in enumerate(prepared):
        containers = [
            (other["area"], other_index)
            for other_index, other in enumerate(prepared)
            if other_index != index
            and other["area"] > candidate["area"]
            and point_in_ring(candidate["ring"][0], other["ring"])
        ]
        if containers:
            candidate["parent"] = min(containers)[1]

    def depth(index: int) -> int:
        parent = prepared[index]["parent"]
        if parent is None:
            return 0
        return depth(parent) + 1

    for index, candidate in enumerate(prepared):
        candidate["depth"] = depth(index)

    polygons = []
    outer_indexes = [
        index
        for index, candidate in enumerate(prepared)
        if candidate["depth"] % 2 == 0
    ]
    for outer_index in outer_indexes:
        outer = prepared[outer_index]
        holes = [
            candidate["ring"]
            for candidate in prepared
            if candidate["parent"] == outer_index
            and candidate["depth"] == outer["depth"] + 1
        ]
        polygons.append([outer["ring"], *holes])

    if len(polygons) == 1:
        return {"type": "Polygon", "coordinates": polygons[0]}
    return {"type": "MultiPolygon", "coordinates": polygons}


def read_shapes(path: Path) -> list[dict]:
    shapes = []
    with path.open("rb") as source:
        header = source.read(100)
        if len(header) != 100 or struct.unpack(">i", header[:4])[0] != 9994:
            raise ValueError(f"{path} is not a valid shapefile")

        declared_length = struct.unpack(">i", header[24:28])[0] * 2
        if path.stat().st_size != declared_length:
            raise ValueError(
                f"{path} is incomplete: expected {declared_length} bytes"
            )

        while source.tell() < declared_length:
            record_header = source.read(8)
            _, content_words = struct.unpack(">ii", record_header)
            content = source.read(content_words * 2)
            if len(content) != content_words * 2:
                raise ValueError(f"{path} contains a truncated shape record")

            shape_type = struct.unpack("<i", content[:4])[0]
            if shape_type == 0:
                shapes.append({"type": "GeometryCollection", "geometries": []})
                continue
            if shape_type not in (5, 15, 25):
                raise ValueError(f"Unsupported shapefile shape type: {shape_type}")

            part_count, point_count = struct.unpack("<ii", content[36:44])
            parts_start = 44
            points_start = parts_start + part_count * 4
            part_starts = list(
                struct.unpack(
                    f"<{part_count}i",
                    content[parts_start:points_start],
                )
            )
            raw_points = [
                struct.unpack(
                    "<2d",
                    content[
                        points_start + index * 16 : points_start + (index + 1) * 16
                    ],
                )
                for index in range(point_count)
            ]
            part_starts.append(point_count)
            rings = [
                [
                    inverse_lcc(*point)
                    for point in raw_points[start:end]
                ]
                for start, end in zip(part_starts, part_starts[1:])
            ]
            shapes.append(polygon_geometry(rings))
    return shapes


def read_name_overrides(path: Path | None) -> dict[str, dict[str, str]]:
    if not path:
        return {}
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise ValueError("Name override file must contain a JSON object")
    return {
        str(key).upper(): value
        for key, value in document.items()
        if isinstance(value, dict)
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shp", required=True, type=Path)
    parser.add_argument("--dbf", required=True, type=Path)
    parser.add_argument("--state", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--overrides", type=Path)
    parser.add_argument("--retrieved", default="")
    args = parser.parse_args()

    rows = read_dbf(args.dbf)
    shapes = read_shapes(args.shp)
    if len(rows) != len(shapes):
        raise ValueError(
            f"DBF has {len(rows)} records but shapefile has {len(shapes)}"
        )

    overrides = read_name_overrides(args.overrides)
    state_name = args.state.upper()
    features = []
    for row, geometry in zip(rows, shapes):
        if row.get("STATE_UT", "").upper() != state_name:
            continue

        source_name = row.get("DISTRICT", "").strip()
        override = overrides.get(source_name.upper(), {})
        properties = {
            "DISTRICT": override.get("name", source_name.title()),
            "SLUG": override.get("slug", ""),
            "dist_code": row.get("DIST_LGD", ""),
            "D_CODE": override.get("lgd_code", ""),
            "STATE": row.get("STATE_UT", ""),
            "state_code": row.get("STATE_LGD", ""),
            "source": "Survey of India Administrative Boundary Data Base",
            "retrieved": args.retrieved,
        }
        features.append(
            {
                "type": "Feature",
                "properties": properties,
                "geometry": geometry,
            }
        )

    if not features:
        raise ValueError(f"No district features found for state {args.state!r}")

    output = {
        "type": "FeatureCollection",
        "name": f"{args.state.title()} districts",
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
