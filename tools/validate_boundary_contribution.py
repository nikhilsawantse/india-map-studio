#!/usr/bin/env python3
"""Validate an India Map Studio boundary contribution and its geometry."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse


LAYER_ID = re.compile(r"^IN-[A-Z0-9]+(?:-[A-Z0-9]+)*$")
FEATURE_ID = re.compile(r"^IN-[A-Z0-9]+(?:-[A-Z0-9]+)*$")
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ALLOWED_LEVELS = {
    "regions",
    "divisions",
    "districts",
    "subdivisions",
    "tehsils",
    "blocks",
    "villages",
    "gram-panchayats",
    "wards",
    "other",
}
SVG_GEOMETRY = {"path", "polygon", "polyline", "rect", "circle", "ellipse"}
SVG_FORBIDDEN = {"script", "foreignobject", "iframe", "object", "embed"}
MAX_ASSET_BYTES = 50 * 1024 * 1024


@dataclass
class ValidationResult:
    manifest: Path
    asset: Path | None = None
    format: str | None = None
    feature_count: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return not self.errors

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def as_dict(self) -> dict[str, Any]:
        return {
            "manifest": self.manifest.as_posix(),
            "asset": self.asset.as_posix() if self.asset else None,
            "format": self.format,
            "valid": self.valid,
            "featureCount": self.feature_count,
            "warnings": self.warnings,
            "errors": self.errors,
        }


def local_name(value: str) -> str:
    return value.rsplit("}", 1)[-1]


def required_string(
    parent: dict[str, Any], key: str, location: str, result: ValidationResult
) -> str:
    value = parent.get(key)
    if not isinstance(value, str) or not value.strip():
        result.error(f"{location}.{key} must be a non-empty string")
        return ""
    return value.strip()


def required_object(
    parent: dict[str, Any], key: str, location: str, result: ValidationResult
) -> dict[str, Any]:
    value = parent.get(key)
    if not isinstance(value, dict):
        result.error(f"{location}.{key} must be an object")
        return {}
    return value


def valid_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def valid_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def safe_asset_path(
    manifest_path: Path, value: str, result: ValidationResult
) -> Path | None:
    relative = Path(value)
    if relative.is_absolute():
        result.error("layer.file must be relative to the contribution manifest")
        return None
    contribution_root = manifest_path.parent.resolve()
    asset = (contribution_root / relative).resolve()
    try:
        asset.relative_to(contribution_root)
    except ValueError:
        result.error("layer.file cannot leave the contribution directory")
        return None
    if not asset.is_file():
        result.error(f"layer.file does not exist: {value}")
        return asset
    if asset.stat().st_size > MAX_ASSET_BYTES:
        result.error("boundary asset exceeds the 50 MB contribution limit")
    return asset


def has_geometry(element: ET.Element) -> bool:
    return any(local_name(item.tag).lower() in SVG_GEOMETRY for item in element.iter())


def svg_features(root: ET.Element, selector: str) -> list[ET.Element]:
    selector = selector.strip()
    if selector.startswith(".") and len(selector) > 1:
        class_name = selector[1:]
        return [
            item
            for item in root.iter()
            if class_name in item.get("class", "").split()
        ]
    if selector.startswith("#") and len(selector) > 1:
        element_id = selector[1:]
        return [item for item in root.iter() if item.get("id") == element_id]
    if re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", selector):
        return [item for item in root.iter() if local_name(item.tag) == selector]
    raise ValueError(
        "SVG featureSelector must be a class (.district-region), ID (#layer), "
        "or element name (path)"
    )


def check_svg_safety(root: ET.Element, result: ValidationResult) -> None:
    for element in root.iter():
        tag = local_name(element.tag).lower()
        if tag in SVG_FORBIDDEN:
            result.error(f"SVG contains forbidden <{tag}> content")
        for attribute, value in element.attrib.items():
            name = local_name(attribute).lower()
            normalized = value.strip().lower()
            if name.startswith("on"):
                result.error(f"SVG contains event-handler attribute {name}")
            if name == "href" and normalized and not (
                normalized.startswith("#") or normalized.startswith("data:image/")
            ):
                result.error("SVG contains an external href")
            if name == "style" and "url(" in normalized:
                result.error("SVG contains a style URL reference")


def validate_identifiers(
    identifiers: Iterable[tuple[str, str]], layer_id: str, result: ValidationResult
) -> None:
    feature_ids: list[str] = []
    slugs: list[str] = []
    for index, (feature_id, slug) in enumerate(identifiers, start=1):
        if not feature_id:
            result.error(f"feature {index} is missing its stable identifier")
        elif not FEATURE_ID.fullmatch(feature_id):
            result.error(f"feature {index} has invalid identifier: {feature_id}")
        elif layer_id and not feature_id.startswith(f"{layer_id[:-1] if layer_id.endswith('S') else layer_id}-"):
            result.warn(
                f"feature {index} identifier does not share the layer prefix: {feature_id}"
            )
        if not slug:
            result.error(f"feature {index} is missing its slug")
        elif not SLUG.fullmatch(slug):
            result.error(f"feature {index} has invalid slug: {slug}")
        feature_ids.append(feature_id)
        slugs.append(slug)

    duplicate_ids = sorted(
        value for value, count in Counter(feature_ids).items() if value and count > 1
    )
    duplicate_slugs = sorted(
        value for value, count in Counter(slugs).items() if value and count > 1
    )
    if duplicate_ids:
        result.error(f"duplicate feature identifiers: {', '.join(duplicate_ids[:5])}")
    if duplicate_slugs:
        result.error(f"duplicate feature slugs: {', '.join(duplicate_slugs[:5])}")


def validate_svg(
    asset: Path,
    selector: str,
    feature_key: str,
    slug_key: str,
    layer_id: str,
    result: ValidationResult,
) -> int:
    try:
        root = ET.parse(asset).getroot()
    except ET.ParseError as error:
        result.error(f"invalid SVG XML: {error}")
        return 0
    if local_name(root.tag).lower() != "svg":
        result.error("SVG asset must have an <svg> root element")
        return 0
    if not root.get("viewBox"):
        result.warn("SVG root does not declare a viewBox")
    check_svg_safety(root, result)
    try:
        features = svg_features(root, selector)
    except ValueError as error:
        result.error(str(error))
        return 0
    if not features:
        result.error(f"featureSelector {selector!r} matched no SVG elements")
        return 0
    empty_geometry = [index for index, feature in enumerate(features, start=1) if not has_geometry(feature)]
    if empty_geometry:
        result.error(
            "features without supported geometry: "
            + ", ".join(str(index) for index in empty_geometry[:10])
        )
    validate_identifiers(
        ((item.get(feature_key, "").strip(), item.get(slug_key, "").strip()) for item in features),
        layer_id,
        result,
    )
    return len(features)


def coordinate_pairs(value: Any) -> Iterable[tuple[float, float]]:
    if isinstance(value, list):
        if len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            yield float(value[0]), float(value[1])
        else:
            for child in value:
                yield from coordinate_pairs(child)


def validate_geojson(
    asset: Path,
    feature_key: str,
    slug_key: str,
    layer_id: str,
    result: ValidationResult,
) -> int:
    try:
        document = json.loads(asset.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        result.error(f"invalid GeoJSON: {error}")
        return 0
    if not isinstance(document, dict) or document.get("type") != "FeatureCollection":
        result.error("GeoJSON root must be a FeatureCollection")
        return 0
    features = document.get("features")
    if not isinstance(features, list) or not features:
        result.error("GeoJSON FeatureCollection must contain at least one feature")
        return 0

    identifiers: list[tuple[str, str]] = []
    for index, feature in enumerate(features, start=1):
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            result.error(f"feature {index} is not a GeoJSON Feature")
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            result.error(f"feature {index} properties must be an object")
            properties = {}
        identifiers.append(
            (str(properties.get(feature_key, "")).strip(), str(properties.get(slug_key, "")).strip())
        )
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            result.error(f"feature {index} has no geometry")
            continue
        geometry_type = geometry.get("type")
        if geometry_type not in {"Polygon", "MultiPolygon"}:
            result.error(
                f"feature {index} uses unsupported geometry type {geometry_type!r}; "
                "expected Polygon or MultiPolygon"
            )
            continue
        pair_count = 0
        invalid_coordinate = False
        for longitude, latitude in coordinate_pairs(geometry.get("coordinates")):
            pair_count += 1
            if not math.isfinite(longitude) or not math.isfinite(latitude):
                result.error(f"feature {index} contains a non-finite coordinate")
                invalid_coordinate = True
                break
            if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
                result.error(f"feature {index} contains coordinates outside WGS84 bounds")
                invalid_coordinate = True
                break
        if not pair_count:
            result.error(f"feature {index} has empty coordinates")
        if invalid_coordinate:
            continue
    validate_identifiers(identifiers, layer_id, result)
    return len(features)


def validate_manifest(path: Path) -> ValidationResult:
    path = path.resolve()
    result = ValidationResult(manifest=path)
    try:
        document = json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        result.error("manifest file does not exist")
        return result
    except (UnicodeError, json.JSONDecodeError) as error:
        result.error(f"invalid manifest JSON: {error}")
        return result
    if not isinstance(document, dict):
        result.error("manifest root must be an object")
        return result

    schema_version = required_string(document, "schemaVersion", "manifest", result)
    if schema_version and not schema_version.startswith("1."):
        result.error("schemaVersion must use the supported 1.x contract")

    layer = required_object(document, "layer", "manifest", result)
    source = required_object(document, "source", "manifest", result)
    processing = required_object(document, "processing", "manifest", result)

    layer_id = required_string(layer, "id", "layer", result)
    if layer_id and not LAYER_ID.fullmatch(layer_id):
        result.error("layer.id must use uppercase stable identifier segments beginning with IN-")
    required_string(layer, "label", "layer", result)
    level = required_string(layer, "level", "layer", result)
    if level and level not in ALLOWED_LEVELS:
        result.error(f"layer.level is not supported: {level}")
    parent_id = layer.get("parentId")
    if parent_id is not None and (
        not isinstance(parent_id, str) or not LAYER_ID.fullmatch(parent_id)
    ):
        result.error("layer.parentId must be null or a stable IN- identifier")
    file_value = required_string(layer, "file", "layer", result)
    asset_format = required_string(layer, "format", "layer", result).lower()
    result.format = asset_format or None
    if asset_format not in {"svg", "geojson"}:
        result.error("layer.format must be svg or geojson")
    selector = required_string(layer, "featureSelector", "layer", result)
    identifiers = required_object(layer, "identifiers", "layer", result)
    feature_key = required_string(identifiers, "feature", "layer.identifiers", result)
    slug_key = required_string(identifiers, "slug", "layer.identifiers", result)
    declared_count = layer.get("featureCount")
    if not isinstance(declared_count, int) or isinstance(declared_count, bool) or declared_count < 1:
        result.error("layer.featureCount must be a positive integer")
        declared_count = 0

    source_name = required_string(source, "name", "source", result)
    source_url = required_string(source, "url", "source", result)
    required_string(source, "revision", "source", result)
    retrieved = required_string(source, "retrievedAt", "source", result)
    required_string(source, "vintage", "source", result)
    required_string(source, "attribution", "source", result)
    if source_url and not valid_url(source_url):
        result.error("source.url must be an absolute HTTP(S) URL")
    if retrieved and not valid_date(retrieved):
        result.error("source.retrievedAt must use YYYY-MM-DD")
    if source.get("redistributionConfirmed") is not True:
        result.error("source.redistributionConfirmed must be true")
    license_data = required_object(source, "license", "source", result)
    license_name = required_string(license_data, "name", "source.license", result)
    license_spdx = required_string(license_data, "spdx", "source.license", result)
    license_url = required_string(license_data, "url", "source.license", result)
    if license_url and not valid_url(license_url):
        result.error("source.license.url must be an absolute HTTP(S) URL")
    if license_spdx and any(character.isspace() for character in license_spdx):
        result.error("source.license.spdx must be a compact SPDX identifier")
    if source_name and license_name and source_name.lower() == license_name.lower():
        result.warn("source name and license name are identical; verify the metadata")

    transformations = processing.get("transformations")
    if not isinstance(transformations, list) or not transformations or any(
        not isinstance(item, str) or not item.strip() for item in transformations
    ):
        result.error("processing.transformations must contain at least one description")
    required_string(processing, "command", "processing", result)

    if file_value:
        result.asset = safe_asset_path(path, file_value, result)
    if result.asset and result.asset.is_file() and asset_format in {"svg", "geojson"}:
        suffix = result.asset.suffix.lower()
        if asset_format == "svg" and suffix != ".svg":
            result.error("layer.format svg requires an .svg asset")
        if asset_format == "geojson" and suffix not in {".geojson", ".json"}:
            result.error("layer.format geojson requires a .geojson or .json asset")
        if asset_format == "svg":
            result.feature_count = validate_svg(
                result.asset, selector, feature_key, slug_key, layer_id, result
            )
        else:
            if selector != "Feature":
                result.error("GeoJSON featureSelector must be Feature")
            result.feature_count = validate_geojson(
                result.asset, feature_key, slug_key, layer_id, result
            )
        if declared_count and declared_count != result.feature_count:
            result.error(
                f"declared feature count {declared_count} does not match "
                f"{result.feature_count} discovered features"
            )
    return result


def print_result(result: ValidationResult) -> None:
    state = "PASS" if result.valid else "FAIL"
    print(f"[{state}] {result.manifest}")
    if result.asset:
        print(f"  Asset: {result.asset.name} ({result.format or 'unknown'})")
    print(f"  Features: {result.feature_count}")
    for warning in result.warnings:
        print(f"  Warning: {warning}")
    for error in result.errors:
        print(f"  Error: {error}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate boundary geometry, identifiers, metadata, and feature counts."
    )
    parser.add_argument("manifests", nargs="+", type=Path)
    parser.add_argument("--json", action="store_true", help="Print machine-readable results")
    args = parser.parse_args()
    results = [validate_manifest(path) for path in args.manifests]
    if args.json:
        print(json.dumps([result.as_dict() for result in results], indent=2))
    else:
        for result in results:
            print_result(result)
    return 0 if all(result.valid for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
