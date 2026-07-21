#!/usr/bin/env python3
"""Extract selected Survey of India ABDB sub-districts to GeoJSON.

This dependency-free helper reads the ABDB sub-district DBF and shapefile,
converts the source Lambert Conformal Conic coordinates to WGS84 longitude and
latitude, and writes properties understood by generate_district_svg.mjs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from build_nagaland_current_geojson import read_selected_shapes
from extract_soi_state_districts import read_dbf


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shp", required=True, type=Path)
    parser.add_argument("--dbf", required=True, type=Path)
    parser.add_argument("--state", required=True)
    parser.add_argument("--district", required=True)
    parser.add_argument("--retrieved", default="")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    rows = read_dbf(args.dbf)
    state_name = args.state.upper()
    district_name = args.district.upper()
    indexes = {
        index
        for index, row in enumerate(rows)
        if row.get("STATE_UT", "").upper() == state_name
        and row.get("DISTRICT", "").upper() == district_name
    }
    if not indexes:
        raise ValueError(
            f"No sub-districts found for {args.district!r}, {args.state!r}"
        )

    shapes = read_selected_shapes(args.shp, indexes)
    features = []
    for index in sorted(indexes):
        row = rows[index]
        source_name = row.get("SUB_DIST", "").strip()
        display_name = source_name.title()
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "STATE_UT": row.get("STATE_UT", ""),
                    "State_LGD": row.get("STATE_LGD", ""),
                    "DISTRICT": row.get("DISTRICT", ""),
                    "Dist_LGD": row.get("DIST_LGD", ""),
                    "SUB_DIST": display_name,
                    "SUBDIS_LGD": row.get("SUBDIS_LGD", ""),
                    "sdtname": display_name,
                    "Subdt_LGD": row.get("SUBDIS_LGD", ""),
                    "source_name": source_name,
                    "source_id": row.get("OBJECTID", ""),
                    "source": (
                        "Survey of India Administrative Boundary Data Base"
                    ),
                    "retrieved": args.retrieved,
                },
                "geometry": shapes[index],
            }
        )

    output = {
        "type": "FeatureCollection",
        "name": f"{args.district.title()} sub-districts",
        "source": "Survey of India Administrative Boundary Data Base",
        "retrieved": args.retrieved,
        "features": features,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(features)} sub-district features to {args.output}")


if __name__ == "__main__":
    main()
