# Contributing boundary layers

India Map Studio accepts SVG and GeoJSON administrative boundaries when their
source permits public redistribution and derivative works. The same validation
contract runs in the browser assistant, local Python tools, and pull-request
automation.

## Fastest path

1. Open `contribute.html` from a local web server or use the hosted contribution
   assistant.
2. Select an `.svg`, `.geojson`, or `.json` file. The file is parsed locally in
   the browser and is not uploaded.
3. Correct feature identifiers and slugs until the geometry checks pass.
4. Enter the direct source, exact license, retrieval date, vintage,
   transformations, and reproducible process.
5. Download `boundary-contribution.json`.
6. Put the manifest and its geometry in a new directory beneath
   `contributions/`.
7. Run the local checks and open a focused pull request.

The command-line wizard provides the same guided setup without the browser:

```text
python tools/new_boundary_contribution.py
```

## Contribution layout

```text
contributions/
  in-region-27-districts/
    boundary-contribution.json
    maharashtra-districts.geojson
```

`layer.file` must be relative to the manifest and cannot leave its contribution
directory. The complete JSON contract is
`data/boundary-contribution.schema.json`.

## Geometry contract

### SVG

- The root element is `<svg>` and should declare a `viewBox`.
- `layer.featureSelector` is a simple class, ID, or element selector, such as
  `.district-region`, `#ward-layer`, or `path`.
- Every selected feature contains path, polygon, polyline, rectangle, circle,
  or ellipse geometry.
- Feature ID and slug attributes are present and unique.
- Scripts, event-handler attributes, embedded HTML, external links, and style
  URL references are rejected.

### GeoJSON

- The root is a `FeatureCollection`.
- Each item is a `Feature` with `Polygon` or `MultiPolygon` geometry.
- Coordinates are finite longitude/latitude values within WGS84 bounds.
- Feature ID and slug properties are present and unique.
- `layer.featureSelector` is `Feature`.

## Identifier contract

Layer and feature identifiers begin with `IN-`, contain uppercase alphanumeric
segments separated by hyphens, and stay separate from government codes. Slugs
use lowercase letters, numbers, and hyphens.

Example:

```text
Layer:   IN-REGION-27-DISTRICTS
Feature: IN-REGION-27-DISTRICT-521
Slug:    pune
```

Do not silently change an existing stable identifier. Document a migration when
a correction makes an identifier change unavoidable.

## Metadata contract

Every contribution records:

- the direct source name and URL;
- source release, revision, or checksum;
- retrieval date and boundary vintage;
- exact license name, SPDX identifier, and license URL;
- required attribution and explicit redistribution confirmation; and
- transformations plus the command or process needed to reproduce them.

An accessible public download does not automatically grant redistribution
rights. Contributions without a clear license remain ineligible for the public
repository.

## Local validation

Validate one manifest:

```text
python tools/validate_boundary_contribution.py path/to/boundary-contribution.json
```

Validate every contribution workspace:

```text
python tools/check_contributions.py
```

Run the complete pull-request check locally:

```text
python -m unittest discover -s tests -v
python tools/check_contributions.py
python tools/check_public_release.py
```

The validator exits with a non-zero status on malformed geometry, unsafe SVG,
missing or duplicate identifiers, feature-count mismatches, incomplete
metadata, unconfirmed rights, or unsafe file paths. Warnings do not block a
contribution but must be reviewed.

## Pull-request review and promotion

GitHub Actions runs the validator and test suite on every pull request. Passing
automation means the contribution is structurally reviewable; it does not
replace human review of boundary accuracy, official status, licensing, or
attribution.

After approval, maintainers move the asset into the appropriate `assets/maps/`
directory, update the relevant generator or data registry, rebuild
`data/boundary-registry.json`, and remove the temporary contribution workspace.
