# Changelog

All notable user-facing changes will be documented here.

The project intends to follow Semantic Versioning after its first public
release.

## Unreleased

### Added

- MIT license for original application code.
- Separate boundary-data license and publication-status inventory.
- Third-party notices.
- Contribution, community-conduct, security, and support policies.
- Structured GitHub issue forms and pull-request checklist.
- Release-safety validation for public assets and routes.
- Automated GitHub Pages deployment from the `main` branch.
- Framework-free `IndiaMapEngine` with documented configuration, methods, and
  bubbling DOM events.
- `<india-svg-map>` Web Component and a two-instance independence example.
- Versioned boundary registry, JSON Schema, searchable registry page, and
  automatic public-layer discovery with compatibility validation.
- Guided local boundary contribution assistant with SVG and GeoJSON inspection,
  stable-identifier checks, provenance collection, and manifest export.
- Dependency-free contribution schema, command-line wizard, validator, test
  suite, and pull-request validation workflow.
- Focused, runnable choropleth, drill-down, marker, and iframe-embed examples.
- Synthetic national sample datasets, five-minute quick start, and minimal
  starter application for repositories created from the GitHub template.
- Runnable Maharashtra district CSV example with file import, automatic
  identifier matching, numeric and categorical coloring, profile fields, and
  a downloadable synthetic dataset.
- Searchable POI layer example with coordinate projection, distinct accessible
  symbols, category toggles, selection details, and downloadable CC0 source
  data for reservoirs, protected wildlife areas, and major railway stations.

### Changed

- Open-source publication now treats code and geographic datasets as
  independently licensed works.
- The public release contains 36 state and union-territory maps with 750
  district features; held prototype layers remain local and Git-ignored.
- The national explorer now delegates SVG loading and feature interaction to
  the reusable map engine while keeping page-specific panels and routing local.
- Map previews now remain visible while scrolling through long desktop control
  panels in the state, district, and custom-map workspaces.

### Fixed

- District maps in the drill-down example now expose clickable district
  geometry instead of letting the state-outline overlay cover and intercept it.
- The drill-down control panel now provides a synchronized district picker as
  an accessible alternative to selecting directly on the map.
