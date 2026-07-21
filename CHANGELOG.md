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

### Changed

- Open-source publication now treats code and geographic datasets as
  independently licensed works.
- The public release contains 36 state and union-territory maps with 750
  district features; held prototype layers remain local and Git-ignored.
- The national explorer now delegates SVG loading and feature interaction to
  the reusable map engine while keeping page-specific panels and routing local.
- Map previews now remain visible while scrolling through long desktop control
  panels in the state, district, and custom-map workspaces.
