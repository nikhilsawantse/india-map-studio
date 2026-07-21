#!/usr/bin/env python3
"""Discover public SVG boundary layers and build their registry manifest."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data/boundary-registry.json"
REGISTRY_VERSION = "1.0.0"
SCHEMA_VERSION = "1.0.0"
PUBLISHED_AT = "2026-07-21"
LEVEL_ORDER = {
    "regions": 0,
    "districts": 1,
    "tehsils": 2,
    "subdivisions": 3,
    "blocks": 4,
    "wards": 5,
    "other": 6,
}

SOURCES = {
    "datta07-indian-shapefiles": {
        "name": "INDIAN-SHAPEFILES",
        "publisher": "datta07",
        "url": "https://github.com/datta07/INDIAN-SHAPEFILES",
        "revision": "2c028f5c30fb4191ca1639ff136b152cecdbb69f",
        "license": {
            "name": "MIT License",
            "spdx": "MIT",
            "url": "https://opensource.org/license/mit",
        },
        "attribution": "datta07/INDIAN-SHAPEFILES",
        "redistribution": "ready",
    },
    "india-census-2011-admin-boundaries": {
        "name": "India Census 2011 administrative boundaries",
        "publisher": "DataMeet and original government sources",
        "url": "https://github.com/ramSeraph/indian_admin_boundaries/releases/tag/census-2011",
        "revision": "census-2011 release",
        "license": {
            "name": "CC0 1.0",
            "spdx": "CC0-1.0",
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
        },
        "attribution": "DataMeet and the original government source where possible",
        "redistribution": "ready",
    },
}


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def has_class(element: ET.Element, class_name: str) -> bool:
    return class_name in element.get("class", "").split()


def find_by_id(root: ET.Element, element_id: str) -> ET.Element | None:
    return next((item for item in root.iter() if item.get("id") == element_id), None)


def elements_with_class(root: ET.Element, class_name: str) -> list[ET.Element]:
    return [item for item in root.iter() if has_class(item, class_name)]


def text_of(root: ET.Element, tag_name: str) -> str:
    for element in root:
        if local_name(element.tag) == tag_name:
            return "".join(element.itertext()).strip()
    return ""


def parse_svg(path: Path) -> ET.Element:
    try:
        return ET.parse(path).getroot()
    except ET.ParseError as error:
        raise ValueError(f"{path.relative_to(ROOT).as_posix()}: invalid SVG ({error})") from error


def tracked_svg_paths() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "assets/maps/*.svg", "assets/maps/**/*.svg"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return sorted(
            ROOT / line.strip()
            for line in result.stdout.splitlines()
            if line.strip().endswith(".svg")
        )
    return sorted((ROOT / "assets/maps").rglob("*.svg"))


def source_id_for(path: Path, element: ET.Element | None = None) -> str:
    source_url = element.get("data-source-url", "") if element is not None else ""
    if "indian_admin_boundaries" in source_url or "assets/maps/districts" in path.as_posix():
        return "india-census-2011-admin-boundaries"
    return "datta07-indian-shapefiles"


def unique_values(features: list[ET.Element], attribute: str) -> list[str]:
    return sorted({value for feature in features if (value := feature.get(attribute, "").strip())})


def verify_features(
    features: list[ET.Element],
    declared_count: int,
    id_attribute: str,
    slug_attribute: str,
    optional_attributes: tuple[str, ...] = (),
) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    identifiers = [feature.get(id_attribute, "").strip() for feature in features]
    slugs = [feature.get(slug_attribute, "").strip() for feature in features]

    if declared_count != len(features):
        errors.append(
            f"declared feature count {declared_count} does not match {len(features)} discovered features"
        )
    if any(not value for value in identifiers):
        errors.append(f"one or more features are missing {id_attribute}")
    if len(set(identifiers)) != len(identifiers):
        errors.append(f"{id_attribute} values are not unique")
    if any(not value for value in slugs):
        errors.append(f"one or more features are missing {slug_attribute}")
    if len(set(slugs)) != len(slugs):
        errors.append(f"{slug_attribute} values are not unique")

    for attribute in optional_attributes:
        missing = sum(not feature.get(attribute, "").strip() for feature in features)
        if missing:
            warnings.append(
                f"{missing} of {len(features)} features do not declare {attribute}"
            )

    if errors:
        status = "invalid"
    elif warnings:
        status = "compatible"
    else:
        status = "verified"

    return {
        "status": status,
        "checkedAt": PUBLISHED_AT,
        "checks": {
            "declaredCountMatches": declared_count == len(features),
            "featureIdsPresent": all(identifiers),
            "featureIdsUnique": len(set(identifiers)) == len(identifiers),
            "featureSlugsPresent": all(slugs),
            "featureSlugsUnique": len(set(slugs)) == len(slugs),
        },
        "warnings": warnings,
        "errors": errors,
    }


def make_layer(
    *,
    layer_id: str,
    parent_id: str | None,
    level: str,
    label: str,
    region_slug: str,
    path: Path,
    status: str,
    features: list[ET.Element],
    declared_count: int,
    feature_selector: str,
    feature_key: str,
    id_attribute: str,
    slug_attribute: str,
    source_id: str,
    vintages: list[str],
    verification: dict,
) -> dict:
    return {
        "id": layer_id,
        "parentId": parent_id,
        "level": level,
        "label": label,
        "regionSlug": region_slug,
        "path": path.relative_to(ROOT).as_posix(),
        "format": "svg",
        "status": status,
        "featureCount": len(features),
        "declaredFeatureCount": declared_count,
        "identifiers": {
            "layer": "data-layer-id",
            "feature": id_attribute,
            "slug": slug_attribute,
        },
        "sourceId": source_id,
        "vintages": vintages,
        "engine": {
            "api": "IndiaMapEngine",
            "minimumVersion": "1.0.0",
            "featureSelector": feature_selector,
            "featureKey": feature_key,
        },
        "verification": verification,
    }


def national_layer(path: Path) -> dict:
    root = parse_svg(path)
    features = elements_with_class(root, "map-region")
    declared = int(root.get("data-feature-count", len(features)))
    verification = verify_features(
        features, declared, "data-region-id", "data-slug"
    )
    if root.get("data-layer-id") != "IN-REGIONS":
        verification["status"] = "invalid"
        verification["errors"].append("SVG root must declare data-layer-id IN-REGIONS")
    return make_layer(
        layer_id="IN-REGIONS",
        parent_id=None,
        level="regions",
        label="India states and union territories",
        region_slug="india",
        path=path,
        status="ready",
        features=features,
        declared_count=declared,
        feature_selector=".map-region",
        feature_key="slug",
        id_attribute="data-region-id",
        slug_attribute="data-slug",
        source_id="datta07-indian-shapefiles",
        vintages=["source-vintage"],
        verification=verification,
    )


def district_layer(path: Path) -> dict:
    root = parse_svg(path)
    group = find_by_id(root, "district-layer")
    if group is None:
        raise ValueError(f"{path.relative_to(ROOT).as_posix()}: missing #district-layer")
    features = elements_with_class(group, "district-region")
    declared = int(group.get("data-district-count", len(features)))
    verification = verify_features(
        features,
        declared,
        "data-feature-id",
        "data-slug",
        ("data-lgd-code", "data-boundary-year"),
    )
    title = text_of(root, "title")
    label = title.removesuffix(" district map").strip() or path.stem.replace("-", " ").title()
    return make_layer(
        layer_id=group.get("data-layer-id", ""),
        parent_id=group.get("data-layer-id", "").removesuffix("-DISTRICTS"),
        level="districts",
        label=f"{label} districts",
        region_slug=path.stem,
        path=path,
        status=group.get("data-status", "ready"),
        features=features,
        declared_count=declared,
        feature_selector=".district-region",
        feature_key="slug",
        id_attribute="data-feature-id",
        slug_attribute="data-slug",
        source_id="datta07-indian-shapefiles",
        vintages=unique_values(features, "data-boundary-year"),
        verification=verification,
    )


def child_layers(path: Path) -> list[dict]:
    root = parse_svg(path)
    parent_id = root.get("data-feature-id", "")
    region_slug = "/".join(
        value
        for value in (root.get("data-state-slug", ""), root.get("data-district-slug", ""))
        if value
    )
    region_name = root.get("data-district", path.stem.replace("-", " ").title())
    layers: list[dict] = []
    for group in elements_with_class(root, "district-child-layer"):
        level = group.get("data-layer-type", "other")
        status = group.get("data-status", "placeholder")
        features = elements_with_class(group, "child-region")
        declared = int(group.get("data-feature-count", len(features)))
        if status == "placeholder":
            verification = {
                "status": "declared",
                "checkedAt": PUBLISHED_AT,
                "checks": {
                    "declaredCountMatches": declared == len(features),
                    "featureIdsPresent": True,
                    "featureIdsUnique": True,
                    "featureSlugsPresent": True,
                    "featureSlugsUnique": True,
                },
                "warnings": ["Layer is declared but no public geometry is available"],
                "errors": [],
            }
        else:
            verification = verify_features(
                features,
                declared,
                "data-feature-id",
                "data-slug",
                ("data-lgd-code", "data-boundary-year"),
            )
        source_id = source_id_for(path, group)
        vintages = unique_values(features, "data-boundary-year")
        if not vintages and group.get("data-boundary-year"):
            vintages = [group.get("data-boundary-year", "")]
        layers.append(
            make_layer(
                layer_id=group.get("data-layer-id", ""),
                parent_id=parent_id,
                level=level,
                label=f"{region_name} {level}",
                region_slug=region_slug,
                path=path,
                status=status,
                features=features,
                declared_count=declared,
                feature_selector=".child-region",
                feature_key="slug",
                id_attribute="data-feature-id",
                slug_attribute="data-slug",
                source_id=source_id,
                vintages=vintages,
                verification=verification,
            )
        )
    return layers


def build_registry() -> dict:
    paths = tracked_svg_paths()
    national = ROOT / "assets/maps/india-states.svg"
    layers = [national_layer(national)]
    layers.extend(
        district_layer(path)
        for path in paths
        if path.parent == ROOT / "assets/maps/states"
    )
    for path in paths:
        if ROOT / "assets/maps/districts" in path.parents:
            layers.extend(child_layers(path))

    layer_ids = [layer["id"] for layer in layers]
    duplicate_ids = sorted({item for item in layer_ids if layer_ids.count(item) > 1})
    missing_ids = [layer["path"] for layer in layers if not layer["id"]]
    invalid = [layer["id"] for layer in layers if layer["verification"]["status"] == "invalid"]
    if duplicate_ids or missing_ids or invalid:
        messages = []
        if duplicate_ids:
            messages.append(f"duplicate layer IDs: {', '.join(duplicate_ids)}")
        if missing_ids:
            messages.append(f"layers missing IDs: {', '.join(missing_ids)}")
        if invalid:
            messages.append(f"incompatible layers: {', '.join(invalid)}")
        raise ValueError("; ".join(messages))

    layers.sort(
        key=lambda layer: (
            layer["status"] != "ready",
            LEVEL_ORDER.get(layer["level"], 99),
            layer["label"],
            layer["id"],
        )
    )
    return {
        "$schema": "boundary-registry.schema.json",
        "schemaVersion": SCHEMA_VERSION,
        "registryVersion": REGISTRY_VERSION,
        "publishedAt": PUBLISHED_AT,
        "compatibility": {
            "engine": "IndiaMapEngine",
            "minimumVersion": "1.0.0",
        },
        "sources": SOURCES,
        "layers": layers,
    }


def serialized_registry(registry: dict) -> str:
    return json.dumps(registry, indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate discovery and fail when the committed registry is stale",
    )
    args = parser.parse_args()

    try:
        registry = build_registry()
    except (OSError, ValueError) as error:
        print(f"Boundary registry validation failed: {error}")
        return 1

    expected = serialized_registry(registry)
    if args.check:
        if not OUTPUT.is_file():
            print(f"Boundary registry validation failed: missing {OUTPUT.relative_to(ROOT)}")
            return 1
        if OUTPUT.read_text(encoding="utf-8") != expected:
            print("Boundary registry validation failed: data/boundary-registry.json is stale")
            print("Run: python tools/build_boundary_registry.py")
            return 1
        ready = sum(layer["status"] == "ready" for layer in registry["layers"])
        print(
            "Boundary registry validation passed: "
            f"{len(registry['layers'])} layers discovered, {ready} ready."
        )
        return 0

    OUTPUT.write_text(expected, encoding="utf-8", newline="\n")
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)} with {len(registry['layers'])} discovered layers."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
