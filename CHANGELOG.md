# Changelog

All notable user-facing changes will be documented here. Stable releases follow
Semantic Versioning.

## Unreleased

No changes yet.

## [1.0.0] - 2026-07-22

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
- Advanced copyable recipes for marker clustering, SVG heatmaps, selectable
  route networks, regional time-series playback, election-style side-by-side
  comparisons, and sanitized custom SVG marker uploads.
- Typo-tolerant India location finder covering 36 states and union territories,
  750 districts, and 14 published Pune tehsils with code and stable-identifier
  lookup, keyboard result navigation, and automatic layer highlighting.
- Nearby-place and radius-search example with preset or custom origins,
  click-to-drop positioning, adjustable distance and category filters, geodesic
  ranking, accessible results, and sourced POI details.
- Multi-district drawing example for every public state layer with click,
  rectangle, and freehand-lasso selection, keyboard toggles, removable result
  lists, and CSV or JSON identifier exports.
- Service-area planning example for every public district layer with editable
  office, warehouse, and field-team centres, adjustable illustrative reach,
  coverage-gap and overlap highlighting, accessible district details, and CSV
  assignment export.
- Synthetic incident-response example for every public district layer with
  severity, type, time-window, and resolved-status filters, accessible alert
  markers and district inspection, local acknowledge/resolve actions, and CSV
  export of the visible queue.
- Automated Playwright smoke coverage for national selection, district-layer
  switching, incident filters, and narrow layouts, plus axe checks for serious
  WCAG violations on representative public pages and a dedicated pull-request
  workflow with failure artifacts.
- State and district ranking dashboard with multiple deterministic indicators,
  top/bottom filters, synchronized statistics, list selection, and map colors.
- Editable district-map annotations with categories, drag and keyboard
  movement, local persistence, and validated JSON export/import.
- Four-step guided story map with state/district layer changes, narrative
  images, highlighted targets, and hash-addressable chapters.
- Printable district report builder with editable title, legend, notes,
  accessible multi-selection, print layout, and SVG or PNG export.
- India Post PIN directory adapter with an attributed downloadable sample,
  text search, official record links, and clearly labeled containing-district
  highlights plus a link to the official PIN boundary GeoJSON catalog.
- Search, goal filters, live result counts, an accessible empty state, and a
  denser responsive layout for the runnable example gallery.
- Versioned raw-asset, desktop, mobile, large-layer, and interaction performance
  budgets with automated GitHub Actions enforcement and timing reports.
- Performance documentation with current baselines, budget-change guidance,
  and a copyable map-load measurement snippet.
- Persistent Controls/Map navigation for long mobile workspaces, touch-safe
  target sizing, mobile form sizing, and controls-first printable reports.
- Mobile layout, overflow, touch-target, and accessibility regression coverage
  plus a copyable shared-helper setup guide.
- Frozen Version 1 contracts for `IndiaMapEngine`, `<india-svg-map>`, the
  boundary registry, and contribution manifests, with runtime version markers,
  strict schemas, compatibility documentation, and automated contract tests.
- Collapsed, copy-ready starter recipes for all 22 gallery demos and the
  reusable multiple-map example, with clipboard fallback, mobile-safe code
  presentation, and automated coverage checks.
- Version 1 migration guidance, release notes, citation metadata, deterministic
  source and starter archives, checksum generation, and a tag-driven GitHub
  release workflow.

### Changed

- Open-source publication now treats code and geographic datasets as
  independently licensed works.
- The public release contains 36 state and union-territory maps with 750
  district features; held prototype layers remain local and Git-ignored.
- The national explorer now delegates SVG loading and feature interaction to
  the reusable map engine while keeping page-specific panels and routing local.
- Map previews now remain visible while scrolling through long desktop control
  panels in the state, district, and custom-map workspaces.
- Map SVG roots containing keyboard controls now use group semantics so their
  interactive regions are exposed without nested-control accessibility errors.

### Fixed

- Interactive state, district, and tehsil SVG roots now use group semantics so
  their child boundary controls are not exposed as nested interactive content.
- Printable SVG and PNG reports now preserve selected-district colors and keep
  the state outline transparent instead of covering the exported map in black.
- District chapters in the Story Map now render the state outline as a border,
  keeping Pune and the surrounding district boundaries visible.
- District maps in the drill-down example now expose clickable district
  geometry instead of letting the state-outline overlay cover and intercept it.
- The drill-down control panel now provides a synchronized district picker as
  an accessible alternative to selecting directly on the map.
