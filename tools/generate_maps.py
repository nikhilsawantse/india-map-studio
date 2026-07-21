#!/usr/bin/env python3
"""Generate browser-ready SVG maps from the India states GeoJSON file.

This script uses only Python's standard library. It creates:
  - assets/maps/india-states.svg
  - assets/maps/states/<state-slug>.svg
  - data/states.js

The source currently contains Dadra & Nagar Haveli and Daman & Diu as separate
features. They are grouped into the current combined union territory.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import re
import unicodedata
from pathlib import Path
from typing import Iterable


VIEWBOX_WIDTH = 1000
VIEWBOX_HEIGHT = 1100
INDIA_PADDING = 28
STATE_PADDING = 46


STATE_META = {
    "ANDAMAN & NICOBAR": {
        "name": "Andaman and Nicobar Islands",
        "slug": "andaman-and-nicobar-islands",
        "type": "Union Territory",
        "code": "35",
    },
    "ANDHRA PRADESH": {
        "name": "Andhra Pradesh",
        "slug": "andhra-pradesh",
        "type": "State",
        "code": "37",
    },
    "ARUNACHAL PRADESH": {
        "name": "Arunachal Pradesh",
        "slug": "arunachal-pradesh",
        "type": "State",
        "code": "12",
    },
    "ASSAM": {"name": "Assam", "slug": "assam", "type": "State", "code": "18"},
    "BIHAR": {"name": "Bihar", "slug": "bihar", "type": "State", "code": "10"},
    "CHANDIGARH": {
        "name": "Chandigarh",
        "slug": "chandigarh",
        "type": "Union Territory",
        "code": "04",
    },
    "CHHATTISGARH": {
        "name": "Chhattisgarh",
        "slug": "chhattisgarh",
        "type": "State",
        "code": "22",
    },
    "DADRA & NAGAR HAVELI": {
        "name": "Dadra and Nagar Haveli and Daman and Diu",
        "slug": "dadra-and-nagar-haveli-and-daman-and-diu",
        "type": "Union Territory",
        "code": "26/25",
    },
    "DAMAN & DIU": {
        "name": "Dadra and Nagar Haveli and Daman and Diu",
        "slug": "dadra-and-nagar-haveli-and-daman-and-diu",
        "type": "Union Territory",
        "code": "26/25",
    },
    "DELHI": {
        "name": "Delhi",
        "slug": "delhi",
        "type": "Union Territory",
        "code": "07",
    },
    "GOA": {"name": "Goa", "slug": "goa", "type": "State", "code": "30"},
    "GUJARAT": {
        "name": "Gujarat",
        "slug": "gujarat",
        "type": "State",
        "code": "24",
    },
    "HARYANA": {
        "name": "Haryana",
        "slug": "haryana",
        "type": "State",
        "code": "06",
    },
    "HIMACHAL PRADESH": {
        "name": "Himachal Pradesh",
        "slug": "himachal-pradesh",
        "type": "State",
        "code": "02",
    },
    "JAMMU & KASHMIR": {
        "name": "Jammu and Kashmir",
        "slug": "jammu-and-kashmir",
        "type": "Union Territory",
        "code": "01",
    },
    "JHARKHAND": {
        "name": "Jharkhand",
        "slug": "jharkhand",
        "type": "State",
        "code": "20",
    },
    "KARNATAKA": {
        "name": "Karnataka",
        "slug": "karnataka",
        "type": "State",
        "code": "29",
    },
    "KERALA": {
        "name": "Kerala",
        "slug": "kerala",
        "type": "State",
        "code": "32",
    },
    "LADAKH": {
        "name": "Ladakh",
        "slug": "ladakh",
        "type": "Union Territory",
        "code": "38",
    },
    "LAKSHADWEEP": {
        "name": "Lakshadweep",
        "slug": "lakshadweep",
        "type": "Union Territory",
        "code": "31",
    },
    "MADHYA PRADESH": {
        "name": "Madhya Pradesh",
        "slug": "madhya-pradesh",
        "type": "State",
        "code": "23",
    },
    "MAHARASHTRA": {
        "name": "Maharashtra",
        "slug": "maharashtra",
        "type": "State",
        "code": "27",
    },
    "MANIPUR": {
        "name": "Manipur",
        "slug": "manipur",
        "type": "State",
        "code": "14",
    },
    "MEGHALAYA": {
        "name": "Meghalaya",
        "slug": "meghalaya",
        "type": "State",
        "code": "17",
    },
    "MIZORAM": {
        "name": "Mizoram",
        "slug": "mizoram",
        "type": "State",
        "code": "15",
    },
    "NAGALAND": {
        "name": "Nagaland",
        "slug": "nagaland",
        "type": "State",
        "code": "13",
    },
    "ODISHA": {
        "name": "Odisha",
        "slug": "odisha",
        "type": "State",
        "code": "21",
    },
    "PUDUCHERRY": {
        "name": "Puducherry",
        "slug": "puducherry",
        "type": "Union Territory",
        "code": "34",
    },
    "PUNJAB": {
        "name": "Punjab",
        "slug": "punjab",
        "type": "State",
        "code": "03",
    },
    "RAJASTHAN": {
        "name": "Rajasthan",
        "slug": "rajasthan",
        "type": "State",
        "code": "08",
    },
    "SIKKIM": {
        "name": "Sikkim",
        "slug": "sikkim",
        "type": "State",
        "code": "11",
    },
    "TAMIL NADU": {
        "name": "Tamil Nadu",
        "slug": "tamil-nadu",
        "type": "State",
        "code": "33",
    },
    "TELANGANA": {
        "name": "Telangana",
        "slug": "telangana",
        "type": "State",
        "code": "36",
    },
    "TRIPURA": {
        "name": "Tripura",
        "slug": "tripura",
        "type": "State",
        "code": "16",
    },
    "UTTAR PRADESH": {
        "name": "Uttar Pradesh",
        "slug": "uttar-pradesh",
        "type": "State",
        "code": "09",
    },
    "UTTARAKHAND": {
        "name": "Uttarakhand",
        "slug": "uttarakhand",
        "type": "State",
        "code": "05",
    },
    "WEST BENGAL": {
        "name": "West Bengal",
        "slug": "west-bengal",
        "type": "State",
        "code": "19",
    },
}

DISTRICT_NAME_ALIASES = {
    "AlluriSitharama Raju District": "Alluri Sitharama Raju",
    "Ananthapuram": "Ananthapuramu",
    "Annamayya District": "Annamayya",
    "KonaSeema": "Dr. B.R. Ambedkar Konaseema",
    "Manyam District": "Parvathipuram Manyam",
    "NTR District": "NTR",
    "Sri Balaji Dist.": "Tirupati",
    "Sri Satyasai District": "Sri Sathya Sai",
    "sri potti sriramulu Nellore": "Sri Potti Sriramulu Nellore",
}

DISTRICT_NAME_ALIASES_BY_STATE = {
    "KARNATAKA": {
        "Bangalore": "Bengaluru Urban",
    },
    "MAHARASHTRA": {
        "Ahmadnagar": "Ahilyanagar",
        "Aurangabad": "Chhatrapati Sambhajinagar",
        "Bid": "Beed",
        "Buldana": "Buldhana",
        "Gondiya": "Gondia",
        "Mumbai": "Mumbai City",
        "Osmanabad": "Dharashiv",
        "Raigarh": "Raigad",
    },
    "MIZORAM": {
        "Saiha": "Siaha",
    },
    "PUNJAB": {
        "Sahibzada Ajit Singh Nag*": "Sahibzada Ajit Singh Nagar",
    },
    "TRIPURA": {
        "Sipahijala": "Sepahijala",
        "Unokoti": "Unakoti",
    },
    "WEST BENGAL": {
        "Darjiling": "Darjeeling",
        "Maldah": "Malda",
        "Medinipur West": "Paschim Medinipur",
        "North Twenty Four Pargan*": "North 24 Parganas",
        "Puruliya": "Purulia",
        "South Twenty Four Pargan*": "South 24 Parganas",
    },
}

DISTRICT_DIVISIONS_BY_STATE = {
    "karnataka": {
        "Bengaluru": {
            "Bengaluru Urban",
            "Bengaluru Rural",
            "Chikkaballapura",
            "Chitradurga",
            "Davanagere",
            "Kolar",
            "Ramanagara",
            "Shivamogga",
            "Tumakuru",
        },
        "Mysuru": {
            "Chamarajanagara",
            "Chikkamagaluru",
            "Dakshina Kannada",
            "Hassan",
            "Kodagu",
            "Mandya",
            "Mysuru",
            "Udupi",
        },
        "Belagavi": {
            "Bagalkote",
            "Belagavi",
            "Vijayapura",
            "Dharwad",
            "Gadag",
            "Haveri",
            "Uttara Kannada",
        },
        "Kalaburagi": {
            "Ballari",
            "Bidar",
            "Kalaburagi",
            "Koppal",
            "Raichur",
            "Yadgir",
        },
    },
    "maharashtra": {
        "Konkan": {
            "Mumbai City",
            "Mumbai Suburban",
            "Thane",
            "Palghar",
            "Raigad",
            "Ratnagiri",
            "Sindhudurg",
        },
        "Pune": {"Pune", "Satara", "Sangli", "Solapur", "Kolhapur"},
        "Nashik": {"Nashik", "Dhule", "Nandurbar", "Jalgaon", "Ahilyanagar"},
        "Chhatrapati Sambhajinagar": {
            "Chhatrapati Sambhajinagar",
            "Jalna",
            "Parbhani",
            "Hingoli",
            "Beed",
            "Nanded",
            "Dharashiv",
            "Latur",
        },
        "Amravati": {"Amravati", "Akola", "Washim", "Buldhana", "Yavatmal"},
        "Nagpur": {
            "Nagpur",
            "Wardha",
            "Bhandara",
            "Gondia",
            "Chandrapur",
            "Gadchiroli",
        },
    }
}


def project_point(point: list[float]) -> tuple[float, float]:
    longitude, latitude = point[:2]
    x = math.radians(longitude)
    latitude = max(min(latitude, 85.05112878), -85.05112878)
    y = -math.log(math.tan((math.pi / 4) + (math.radians(latitude) / 2)))
    return x, y


def geometry_rings(geometry: dict) -> Iterable[list[list[float]]]:
    geometry_type = geometry["type"]
    coordinates = geometry["coordinates"]

    if geometry_type == "Polygon":
        yield from coordinates
    elif geometry_type == "MultiPolygon":
        for polygon in coordinates:
            yield from polygon
    else:
        raise ValueError(f"Unsupported geometry type: {geometry_type}")


def projected_geometry_points(geometry: dict) -> Iterable[tuple[float, float]]:
    for ring in geometry_rings(geometry):
        for point in ring:
            yield project_point(point)


def get_bounds(features: list[dict]) -> tuple[float, float, float, float]:
    points = (
        point
        for feature in features
        for point in projected_geometry_points(feature["geometry"])
    )
    first_x, first_y = next(points)
    min_x = max_x = first_x
    min_y = max_y = first_y

    for x, y in points:
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y)
        max_y = max(max_y, y)

    return min_x, min_y, max_x, max_y


def build_transform(
    bounds: tuple[float, float, float, float],
    width: int,
    height: int,
    padding: int,
):
    min_x, min_y, max_x, max_y = bounds
    content_width = max_x - min_x
    content_height = max_y - min_y
    scale = min(
        (width - (padding * 2)) / content_width,
        (height - (padding * 2)) / content_height,
    )
    offset_x = (width - (content_width * scale)) / 2
    offset_y = (height - (content_height * scale)) / 2

    def transform(point: list[float]) -> tuple[float, float]:
        x, y = project_point(point)
        return (
            offset_x + ((x - min_x) * scale),
            offset_y + ((y - min_y) * scale),
        )

    return transform


def format_number(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")


def simplify_ring(
    points: list[tuple[float, float]],
    tolerance: float,
) -> list[tuple[float, float]]:
    if tolerance <= 0 or len(points) < 5:
        return points

    is_closed = points[0] == points[-1]
    candidates = points[:-1] if is_closed else points
    if len(candidates) < 4:
        return points

    tolerance_squared = tolerance * tolerance
    simplified = [candidates[0]]

    for point in candidates[1:]:
        last_x, last_y = simplified[-1]
        x, y = point
        if ((x - last_x) ** 2) + ((y - last_y) ** 2) >= tolerance_squared:
            simplified.append(point)

    if len(simplified) < 3:
        return points

    if is_closed:
        simplified.append(simplified[0])
    return simplified


def geometry_to_path(
    geometry: dict,
    transform,
    simplify_tolerance: float = 0,
) -> str:
    commands: list[str] = []

    for ring in geometry_rings(geometry):
        if not ring:
            continue
        transformed = simplify_ring(
            [transform(point) for point in ring],
            simplify_tolerance,
        )
        first_x, first_y = transformed[0]
        commands.append(f"M{format_number(first_x)} {format_number(first_y)}")
        commands.extend(
            f"L{format_number(x)} {format_number(y)}"
            for x, y in transformed[1:]
        )
        commands.append("Z")

    return "".join(commands)


def canonical_groups(features: list[dict]) -> dict[str, dict]:
    groups: dict[str, dict] = {}

    for feature in features:
        raw_name = feature["properties"]["STNAME"].strip().upper()
        if raw_name not in STATE_META:
            raise KeyError(f"No metadata configured for {raw_name!r}")
        meta = STATE_META[raw_name]
        group = groups.setdefault(
            meta["slug"],
            {
                **meta,
                "features": [],
            },
        )
        group["features"].append(feature)

    return groups


def region_identifier(group: dict) -> str:
    normalized_code = str(group["code"]).replace("/", "-")
    return f"IN-REGION-{normalized_code}"


def district_layer_identifier(group: dict) -> str:
    return f"{region_identifier(group)}-DISTRICTS"


def division_layer_identifier(group: dict) -> str:
    return f"{region_identifier(group)}-DIVISIONS"


def division_metadata(group: dict, district_name: str) -> dict | None:
    divisions = DISTRICT_DIVISIONS_BY_STATE.get(group["slug"])
    if not divisions:
        return None
    for division_name, district_names in divisions.items():
        if district_name in district_names:
            return {
                "name": division_name,
                "slug": slugify(division_name),
                "identifier": (
                    f"{region_identifier(group)}-DIVISION-"
                    f"{slugify(division_name).upper()}"
                ),
            }
    raise KeyError(
        f"No division configured for {district_name!r} in {group['name']}"
    )


def svg_document(
    body: str,
    title: str,
    description: str,
    root_attributes: str = "",
) -> str:
    attributes = f" {root_attributes.strip()}" if root_attributes.strip() else ""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '
        f'{VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}" role="img" '
        f'aria-labelledby="map-title map-description"{attributes}>\n'
        f"  <title id=\"map-title\">{html.escape(title)}</title>\n"
        f"  <desc id=\"map-description\">{html.escape(description)}</desc>\n"
        f"{body}\n"
        "</svg>\n"
    )


def generate_india_svg(features: list[dict], groups: dict[str, dict]) -> str:
    transform = build_transform(
        get_bounds(features),
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
        INDIA_PADDING,
    )
    group_markup: list[str] = []

    for slug, group in sorted(groups.items(), key=lambda item: item[1]["name"]):
        identifier = region_identifier(group)
        paths = "\n".join(
            "      "
            + f'<path d="{geometry_to_path(feature["geometry"], transform)}" '
            + 'vector-effect="non-scaling-stroke"/>'
            for feature in group["features"]
        )
        group_markup.append(
            f'  <g id="state-{html.escape(slug)}" class="map-region" '
            f'data-state="{html.escape(group["name"])}" '
            f'data-slug="{html.escape(slug)}" '
            f'data-type="{html.escape(group["type"])}" '
            f'data-region-id="{html.escape(identifier)}" '
            'tabindex="0" role="link" '
            f'aria-label="Open {html.escape(group["name"])} map">\n'
            f"{paths}\n"
            "  </g>"
        )

    body = "\n".join(group_markup)
    return svg_document(
        body,
        "India map with state and union territory boundaries",
        "Interactive vector map containing 28 states and 8 union territories.",
        'data-layer-id="IN-REGIONS" data-layer-type="regions" '
        'data-feature-count="36"',
    )


def generate_state_svg(group: dict) -> str:
    transform = build_transform(
        get_bounds(group["features"]),
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
        STATE_PADDING,
    )
    paths = "\n".join(
        "    "
        + f'<path d="{geometry_to_path(feature["geometry"], transform)}" '
        + 'vector-effect="non-scaling-stroke"/>'
        for feature in group["features"]
    )
    identifier = region_identifier(group)
    layer_identifier = district_layer_identifier(group)
    division_layer_id = division_layer_identifier(group)
    body = (
        f'  <g id="state-outline" data-state="{html.escape(group["name"])}" '
        f'data-region-id="{html.escape(identifier)}">\n'
        f"{paths}\n"
        "  </g>\n"
        '  <g id="district-layer" data-status="placeholder" '
        f'data-layer-id="{html.escape(layer_identifier)}" '
        f'data-division-layer-id="{html.escape(division_layer_id)}" '
        'aria-label="District boundaries will be added in the next milestone"></g>'
    )
    return svg_document(
        body,
        f"{group['name']} outline map",
        (
            f"Standalone vector outline of {group['name']}. "
            "The district-layer group is reserved for district boundaries."
        ),
    )


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def district_metadata(feature: dict) -> dict:
    properties = feature.get("properties", {})

    def first_property(*keys: str):
        for key in keys:
            value = properties.get(key)
            if value is not None and str(value).strip():
                return value
        return ""

    name = (
        first_property("dtname", "DISTRICT", "district", "District", "NAME")
    )
    if not name:
        raise KeyError("District feature is missing a recognized name property")

    code = first_property(
        "dtcode11",
        "district_code",
        "dist_code",
        "DIST_CODE",
        "CODE",
    )
    lgd_code = first_property(
        "Dist_LGD",
        "district_lgd",
        "D_CODE",
    )
    boundary_year = first_property("year_stat", "year", "boundary_year")
    state_name = str(
        first_property("stname", "STNAME", "state", "STATE")
    ).strip().upper()
    source_name = re.sub(r"\s+", " ", str(name)).strip()
    if source_name.isupper():
        source_name = source_name.title()
    state_aliases = DISTRICT_NAME_ALIASES_BY_STATE.get(state_name, {})
    display_name = state_aliases.get(
        source_name,
        DISTRICT_NAME_ALIASES.get(source_name, source_name),
    )
    supplied_slug = str(first_property("slug", "SLUG")).strip()
    boundary_year_text = str(boundary_year).strip()
    if boundary_year_text == "201920":
        boundary_year_text = "2019-20"
    return {
        "name": display_name,
        "slug": supplied_slug or slugify(display_name),
        "code": str(code or lgd_code).strip(),
        "lgd_code": str(lgd_code).strip(),
        "boundary_year": boundary_year_text,
        "geometry_type": feature.get("geometry", {}).get("type", ""),
    }


def generate_district_state_svg(
    group: dict,
    district_features: list[dict],
    simplify_tolerance: float,
) -> str:
    transform = build_transform(
        get_bounds(district_features),
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
        STATE_PADDING,
    )
    districts = []
    identifier = region_identifier(group)
    layer_identifier = district_layer_identifier(group)
    division_layer_id = division_layer_identifier(group)
    division_names = set()

    for feature in sorted(
        district_features,
        key=lambda item: district_metadata(item)["name"],
    ):
        district = district_metadata(feature)
        division = division_metadata(group, district["name"])
        if division:
            division_names.add(division["name"])
        feature_identifier = (
            f'{identifier}-DISTRICT-{district["code"] or district["slug"]}'
        )
        path = geometry_to_path(
            feature["geometry"],
            transform,
            simplify_tolerance,
        )
        division_attributes = (
            f'data-division="{html.escape(division["name"])}" '
            f'data-division-slug="{html.escape(division["slug"])}" '
            f'data-division-id="{html.escape(division["identifier"])}" '
            if division
            else ""
        )
        districts.append(
            f'    <g id="district-{html.escape(district["slug"])}" '
            'class="district-region" '
            f'data-district="{html.escape(district["name"])}" '
            f'data-slug="{html.escape(district["slug"])}" '
            f'data-code="{html.escape(district["code"])}" '
            f'data-lgd-code="{html.escape(district["lgd_code"])}" '
            f'data-boundary-year="{html.escape(district["boundary_year"])}" '
            f'data-geometry-type="{html.escape(district["geometry_type"])}" '
            f'data-feature-id="{html.escape(feature_identifier)}" '
            f"{division_attributes}"
            'tabindex="0" role="link" '
            f'aria-label="Select {html.escape(district["name"])} district">\n'
            f'      <path d="{path}" vector-effect="non-scaling-stroke"/>\n'
            "    </g>"
        )

    district_markup = "\n".join(districts)
    outline_paths = "\n".join(
        "    "
        + f'<path d="{geometry_to_path(feature["geometry"], transform)}" '
        + 'vector-effect="non-scaling-stroke"/>'
        for feature in group["features"]
    )
    body = (
        f'  <g id="district-layer" data-status="ready" '
        f'data-district-count="{len(district_features)}" '
        f'data-layer-id="{html.escape(layer_identifier)}" '
        f'data-division-layer-id="{html.escape(division_layer_id)}" '
        f'data-division-count="{len(division_names)}" '
        f'data-division-status="{"ready" if division_names else "not-applicable"}">\n'
        f"{district_markup}\n"
        "  </g>\n"
        f'  <g id="state-outline" data-state="{html.escape(group["name"])}" '
        f'data-region-id="{html.escape(identifier)}">\n'
        f"{outline_paths}\n"
        "  </g>"
    )
    return svg_document(
        body,
        f"{group['name']} district map",
        (
            f"Interactive vector map of {group['name']} containing "
            f"{len(district_features)} district "
            f"{'boundary' if len(district_features) == 1 else 'boundaries'}."
        ),
    )


def write_state_data(groups: dict[str, dict], output_root: Path) -> None:
    states = [
        {
            "name": group["name"],
            "slug": group["slug"],
            "type": group["type"],
            "code": group["code"],
            "identifier": region_identifier(group),
            "districtLayerId": district_layer_identifier(group),
            "divisionLayerId": division_layer_identifier(group),
            "svg": f"assets/maps/states/{group['slug']}.svg",
        }
        for group in sorted(groups.values(), key=lambda item: item["name"])
    ]
    content = (
        "// Generated by tools/generate_maps.py. Do not edit manually.\n"
        f"window.INDIA_STATES = {json.dumps(states, indent=2, ensure_ascii=False)};\n"
    )
    data_directory = output_root / "data"
    data_directory.mkdir(parents=True, exist_ok=True)
    (data_directory / "states.js").write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        required=True,
        type=Path,
        help="Path to INDIA_STATES.geojson",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Project root where assets/ and data/ will be created",
    )
    parser.add_argument(
        "--district-source",
        type=Path,
        help="Optional district GeoJSON file to embed into one state SVG",
    )
    parser.add_argument(
        "--district-state-slug",
        help="State slug that owns --district-source, for example maharashtra",
    )
    parser.add_argument(
        "--district-simplify",
        type=float,
        default=0.35,
        help="Minimum rendered point spacing in SVG units for district paths",
    )
    args = parser.parse_args()

    with args.source.open("r", encoding="utf-8") as source_file:
        geojson = json.load(source_file)

    features = geojson["features"]
    groups = canonical_groups(features)
    if len(groups) != 36:
        raise ValueError(f"Expected 36 canonical regions, found {len(groups)}")

    maps_directory = args.output / "assets" / "maps"
    state_directory = maps_directory / "states"
    state_directory.mkdir(parents=True, exist_ok=True)

    (maps_directory / "india-states.svg").write_text(
        generate_india_svg(features, groups),
        encoding="utf-8",
    )

    for group in groups.values():
        (state_directory / f"{group['slug']}.svg").write_text(
            generate_state_svg(group),
            encoding="utf-8",
        )

    district_count = 0
    if args.district_source:
        if not args.district_state_slug:
            parser.error("--district-state-slug is required with --district-source")
        district_group = groups.get(args.district_state_slug)
        if not district_group:
            parser.error(
                f"Unknown district state slug: {args.district_state_slug}"
            )
        with args.district_source.open("r", encoding="utf-8") as district_file:
            district_geojson = json.load(district_file)
        district_features = district_geojson["features"]
        district_count = len(district_features)
        (state_directory / f"{district_group['slug']}.svg").write_text(
            generate_district_state_svg(
                district_group,
                district_features,
                args.district_simplify,
            ),
            encoding="utf-8",
        )

    write_state_data(groups, args.output)
    district_message = (
        f" Embedded {district_count} districts in {args.district_state_slug}."
        if district_count
        else ""
    )
    print(
        f"Generated India map and {len(groups)} standalone region SVG files."
        f"{district_message}"
    )


if __name__ == "__main__":
    main()
