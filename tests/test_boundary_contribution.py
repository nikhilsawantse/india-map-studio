from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from validate_boundary_contribution import validate_manifest  # noqa: E402


class BoundaryContributionValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.folder = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def manifest(self, *, asset: str, asset_format: str, count: int = 2) -> dict:
        return {
            "schemaVersion": "1.0.0",
            "layer": {
                "id": "IN-REGION-27-DISTRICTS",
                "label": "Example districts",
                "level": "districts",
                "parentId": "IN-REGION-27",
                "file": asset,
                "format": asset_format,
                "featureCount": count,
                "featureSelector": ".district-region" if asset_format == "svg" else "Feature",
                "identifiers": {
                    "feature": "data-feature-id" if asset_format == "svg" else "feature_id",
                    "slug": "data-slug" if asset_format == "svg" else "slug",
                },
            },
            "source": {
                "name": "Example open boundary source",
                "url": "https://example.org/boundaries",
                "revision": "release-1",
                "retrievedAt": "2026-07-21",
                "vintage": "2026",
                "license": {
                    "name": "Creative Commons Zero 1.0",
                    "spdx": "CC0-1.0",
                    "url": "https://creativecommons.org/publicdomain/zero/1.0/",
                },
                "attribution": "Example boundary publisher",
                "redistributionConfirmed": True,
            },
            "processing": {
                "transformations": ["Simplified to six decimal places"],
                "command": "python tools/example_generator.py",
            },
        }

    def write_manifest(self, document: dict) -> Path:
        path = self.folder / "boundary-contribution.json"
        path.write_text(json.dumps(document), encoding="utf-8")
        return path

    def test_valid_svg_checks_geometry_identifiers_and_count(self) -> None:
        (self.folder / "districts.svg").write_text(
            """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10">
              <g class="district-region" data-feature-id="IN-REGION-27-DISTRICT-001" data-slug="north"><path d="M0 0h10v10z"/></g>
              <g class="district-region" data-feature-id="IN-REGION-27-DISTRICT-002" data-slug="south"><path d="M10 0h10v10z"/></g>
            </svg>""",
            encoding="utf-8",
        )
        result = validate_manifest(
            self.write_manifest(self.manifest(asset="districts.svg", asset_format="svg"))
        )
        self.assertTrue(result.valid, result.errors)
        self.assertEqual(result.feature_count, 2)

    def test_valid_geojson_checks_properties_and_wgs84_geometry(self) -> None:
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"feature_id": "IN-REGION-27-DISTRICT-001", "slug": "north"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[72, 18], [73, 18], [73, 19], [72, 18]]],
                    },
                },
                {
                    "type": "Feature",
                    "properties": {"feature_id": "IN-REGION-27-DISTRICT-002", "slug": "south"},
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [[[[73, 17], [74, 17], [74, 18], [73, 17]]]],
                    },
                },
            ],
        }
        (self.folder / "districts.geojson").write_text(json.dumps(geojson), encoding="utf-8")
        result = validate_manifest(
            self.write_manifest(
                self.manifest(asset="districts.geojson", asset_format="geojson")
            )
        )
        self.assertTrue(result.valid, result.errors)
        self.assertEqual(result.feature_count, 2)

    def test_svg_rejects_scripts_handlers_duplicates_and_count_mismatch(self) -> None:
        (self.folder / "unsafe.svg").write_text(
            """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
              <script>alert(1)</script>
              <path class="district-region" data-feature-id="IN-REGION-27-DISTRICT-001" data-slug="same" d="M0 0h5v5z" onclick="alert(1)"/>
              <path class="district-region" data-feature-id="IN-REGION-27-DISTRICT-001" data-slug="same" d="M5 5h5v5z"/>
            </svg>""",
            encoding="utf-8",
        )
        document = self.manifest(asset="unsafe.svg", asset_format="svg", count=3)
        result = validate_manifest(self.write_manifest(document))
        self.assertFalse(result.valid)
        combined = " ".join(result.errors)
        self.assertIn("forbidden <script>", combined)
        self.assertIn("event-handler", combined)
        self.assertIn("duplicate feature identifiers", combined)
        self.assertIn("declared feature count 3", combined)

    def test_manifest_rejects_unconfirmed_rights_and_path_escape(self) -> None:
        document = self.manifest(asset="../outside.svg", asset_format="svg")
        document["source"]["redistributionConfirmed"] = False
        result = validate_manifest(self.write_manifest(document))
        self.assertFalse(result.valid)
        self.assertTrue(any("redistributionConfirmed" in item for item in result.errors))
        self.assertTrue(any("cannot leave" in item for item in result.errors))


if __name__ == "__main__":
    unittest.main()
