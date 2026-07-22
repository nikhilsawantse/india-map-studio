# India Map Studio 1.0.0

India Map Studio 1.0.0 is the first stable release of the framework-free India
administrative map explorer and authoring toolkit.

## Highlights

- Stable `IndiaMapEngine` and `<india-svg-map>` Version 1 APIs.
- 36 state and union-territory SVGs with 750 interactive district features.
- Versioned boundary registry with strict source, license, vintage, identifier,
  compatibility, and verification metadata.
- Twenty-two focused gallery examples plus a reusable multiple-map demo, each
  with a copy-ready starter recipe.
- CSV and JSON joins, styling, filters, profiles, annotations, guided stories,
  printable reports, SVG/PNG export, and standalone HTML export.
- Keyboard, touch, narrow-screen, accessibility, and performance regression
  coverage.
- Contributor validation for SVG, GeoJSON, identifiers, provenance, licensing,
  and feature counts.
- Landing-page links to the maintainer profile plus live repository star and
  fork counts with direct GitHub actions.

## Release assets

- `india-map-studio-1.0.0.zip`: complete Git-tracked source and public assets.
- `india-map-studio-starter-1.0.0.zip`: minimal starter, engine, component,
  national SVG, and required notices.
- `SHA256SUMS.txt`: SHA-256 checksums for both archives.

Serve either extracted package through HTTP because SVG assets are loaded with
`fetch`. For example: `python -m http.server 8000`.

## Compatibility

The runtime and data contracts are documented in
`docs/api-stability.md`. Projects created before Version 1 should read
`MIGRATION.md`. There are no removed stable APIs because this release
establishes the first stable contract.

## Data notice

Application code is MIT licensed. Third-party geographic data retains its own
terms. The release excludes held local prototypes without confirmed
redistribution rights. Boundary data is intended for visualization and
prototyping, not legal boundary determination.

## Deferred work

Localization infrastructure, offline support, and deeper nationwide local
boundary datasets remain intentionally outside Version 1.0.
