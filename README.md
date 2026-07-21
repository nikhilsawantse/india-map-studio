# India Map Studio

A framework-free interactive administrative map explorer and map-authoring
workspace for India. It uses plain HTML, CSS, JavaScript, and reusable SVG
assets, with no application framework or build step required.

[Live demo](https://nikhilsawantse.github.io/india-map-studio/) ·
[GitHub repository](https://github.com/nikhilsawantse/india-map-studio) ·
[Use this template](https://github.com/nikhilsawantse/india-map-studio/generate)

> **Data notice:** The application code is open source under MIT, while
> third-party boundary assets keep their own terms. The public release excludes
> local Survey of India-derived assets that do not have confirmed redistribution
> rights. See [DATA_LICENSES.md](DATA_LICENSES.md).

## Project links

- [Detailed map provenance](ATTRIBUTION.md)
- [Boundary-data license inventory](DATA_LICENSES.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Contribution guide](CONTRIBUTING.md)
- [Roadmap](ROADMAP.md)
- [Security policy](SECURITY.md)
- [Citation metadata](CITATION.cff)

## What is included

- Interactive India map with state and union territory boundaries
- Reusable `IndiaMapEngine` with a documented configuration and DOM event API
- Framework-free `<india-svg-map>` Web Component with independent instances
- Versioned boundary registry with source, license, vintage, identifiers,
  verification state, and map-engine compatibility for every public layer
- Local-only boundary contribution assistant for inspecting SVG or GeoJSON,
  validating stable identifiers, documenting provenance, and exporting a
  review manifest
- Dependency-free Python contribution wizard and validator with automated
  pull-request checks for geometry, metadata, rights, and feature counts
- Runnable example library for CSV choropleths, district CSV imports,
  two-level drill-downs, accessible markers, searchable sourced POI layers,
  clustering, heatmaps, route networks, time-series maps, regional
  comparisons, custom SVG icons, and configurable iframe embeds
- Synthetic CSV and JSON example datasets, a five-minute quick start, and a
  minimal editable starter application
- Hover, keyboard focus, search, selection, and tooltips
- Navigation to a standalone page for every region
- 36 separate state and union-territory SVG files with 750 interactive
  district features across current and source-vintage layers
- Nationwide boundary audit comparing every mapped layer with the current
  Local Government Directory district count, including search, priority
  sorting, source-vintage summaries, and direct links to each map
- Ready district layers for every state and union territory, including the
  combined Dadra and Nagar Haveli and Daman and Diu map
- Source-vintage Rajasthan and Nagaland district layers regenerated from the
  MIT-licensed upstream dataset, with 33 and 11 interactive features
- Maharashtra and Karnataka division filters, with district-first controls for
  every map that has no configured intermediate administrative grouping
- Optional administrative grouping for states that do not organize districts
  into a comparable higher-level division; division-only controls, labels, and
  profile fields hide automatically
- Stable application identifiers for regions, layers, and district features
- Color-coded division toggles that isolate and highlight matching districts
- Zoom, mouse-wheel navigation, drag-to-pan, reset view, and automatic focus
- Live clickable breadcrumbs for India, state, division, and district hierarchy
- Toggleable division names, district names, administrative codes, or no labels
- Structured district profiles with codes, geometry metadata, identifiers, and copy actions
- Session-based CSV/JSON import with automatic district matching and profile fields
- Automatic numeric or categorical district coloring with a live map legend
- Four-district comparison mode with map/list selection and shareable URLs
- Collapsible layer manager for boundaries, labels, data colors, and comparison marks
- Live map styling editor with color controls and default-style restoration
- Numeric and categorical district data rules with match counts and map/list filtering
- Configurable tooltip and popup fields with templated text, links, and images
- Browser-based project snapshots that restore data, styling, filters, and map state
- Portable JSON project export and import for moving complete map setups
- Thirty-step undo and redo history with keyboard shortcuts
- In-browser district data editing with draft changes and custom fields
- Per-district click actions for profiles, templated URLs, map navigation, or no action
- Single-file standalone HTML export with map interactions, data, profiles, and actions
- Copy-ready iframe and JavaScript embed-code generation for standalone maps
- Styled SVG and high-resolution PNG export for the current view or full map
- Custom SVG/GeoJSON importer with sanitization, region detection, stable IDs,
  renaming, search, interaction previews, and identified-SVG download
- Dedicated district pages with focused outlines, hierarchical breadcrumbs,
  reserved child-layer identifiers, and future-ready layer toggles
- Pune district pilot with 14 interactive tehsil/taluka boundaries, Census and
  LGD codes, source metadata, and shareable tehsil deep links
- Release-safe outline fallbacks for districts whose deeper local boundary
  assets are not included in the public repository
- Dedicated tehsil workspaces with focused outlines, hierarchy breadcrumbs,
  reserved local-layer identifiers, and a generic engine for compatible
  block, village, gram-panchayat, ward, or local-area geometry
- Local-layer search, labels, CSV/JSON joins, validation, editing, filters,
  workspace persistence, click actions, and standalone exports whenever a
  compatible redistribution-safe layer is registered
- Mobile and keyboard accessibility polish with skip links, live result and map
  announcements, roving map focus, arrow-key navigation, larger touch targets,
  responsive legends, and reduced-motion/high-contrast support
- A populated Maharashtra demo dataset in `sample-data/maharashtra-district-demo.csv`
- A dependency-free Python generator for rebuilding the SVG files

## Run locally

SVG files are loaded with `fetch`, so use a local server from this folder:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Regenerate the SVG files

```powershell
python tools/generate_maps.py `
  --source "C:\path\to\INDIA_STATES.geojson" `
  --district-source "C:\path\to\MAHARASHTRA_DISTRICTS.geojson" `
  --district-state-slug "maharashtra" `
  --output .
```

Generate or update one state's district layer without touching the other state
assets:

```powershell
python tools/generate_state_district_map.py `
  --state-source "C:\path\to\INDIA_STATES.geojson" `
  --district-source "C:\path\to\KARNATAKA_DISTRICTS.geojson" `
  --state-slug karnataka `
  --output "assets\maps\states\karnataka.svg"
```

Regenerate all 36 state and union-territory district maps:

```powershell
python tools/generate_all_state_district_maps.py `
  --state-source "C:\path\to\INDIA_STATES.geojson" `
  --district-source-root "C:\path\to\STATES" `
  --output-directory "assets\maps\states"
```

### Local-only research workflows

The following Survey of India transformation tools remain available for
private research and source evaluation. Their generated geometry must not be
committed or included in a public release unless written redistribution
permission has been obtained. The public Rajasthan and Nagaland SVGs use the
MIT-licensed upstream source-vintage files instead.

The Rajasthan replacement GeoJSON can be recreated from the free Survey of
India `State_District_Subdistrict_PAN INDIA` archive:

```powershell
python tools/extract_soi_state_districts.py `
  --shp "C:\path\to\District Boundary.shp" `
  --dbf "C:\path\to\District Boundary.dbf" `
  --state RAJASTHAN `
  --overrides tools\rajasthan-district-overrides.json `
  --retrieved 2026-07-20 `
  --output "C:\path\to\rajasthan-soi-41.geojson"
```

The current Nagaland GeoJSON uses the same archive's district and sub-district
layers. The builder reconstructs Phek and Meluri from the source Phek
sub-districts:

```powershell
python tools/build_nagaland_current_geojson.py `
  --district-shp "C:\path\to\District Boundary.shp" `
  --district-dbf "C:\path\to\District Boundary.dbf" `
  --subdistrict-shp "C:\path\to\Sub_district Boundary.shp" `
  --subdistrict-dbf "C:\path\to\Sub_district Boundary.dbf" `
  --overrides tools\nagaland-district-overrides.json `
  --retrieved 2026-07-20 `
  --output "C:\path\to\nagaland-soi-17.geojson"
```

If a state has no entry in `DISTRICT_DIVISIONS_BY_STATE`, the generator still
creates its interactive district layer but omits division attributes. The state
page then defaults to district labels and removes division-only filters,
profile fields, and standalone-map controls.

## Project structure

```text
assets/maps/india-states.svg       Interactive national SVG
assets/maps/states/*.svg           One standalone SVG per region
map-engine.js                      Reusable SVG loading and interaction engine
india-svg-map.js                   Framework-free Web Component entry point
docs/map-engine.md                 Public configuration, methods, and events
examples/multiple-maps.html        Two independent component instances
examples/index.html                Focused example library
examples/choropleth.html           CSV-to-region numeric color join
examples/csv-data.html             District CSV import, visualization, and profiles
examples/drill-down.html           National-to-district layer navigation
examples/markers.html              Accessible SVG marker overlay
examples/poi-layers.html           Searchable reservoirs, wildlife, and station layers
examples/marker-clustering.html    Automatic grouping for nearby coordinates
examples/heatmap.html              Lightweight SVG point-density surface
examples/route-network.html        Selectable corridors between station hubs
examples/time-series.html          Scrubbable and playable regional values
examples/comparison-map.html       Side-by-side election-style scenarios
examples/custom-icons.html         Sanitized user-supplied SVG marker preview
examples/location-finder.html      Fuzzy administrative boundary search
examples/nearby-places.html        Drop-point radius and proximity search
examples/embedded-map.html         Configurable iframe integration
sample-data/                       Documented synthetic example datasets
starter/                           Minimal editable map application
docs/quick-start.md                Five-minute framework-free setup
data/boundary-registry.json        Generated public boundary-layer catalog
data/boundary-registry.schema.json Registry JSON Schema contract
registry.html                      Searchable boundary registry interface
data/boundary-contribution.schema.json
                                   Boundary contribution JSON Schema contract
contribute.html / contribute.js    Local-only guided contribution assistant
contributions/                     Pull-request boundary staging workspace
docs/contributing-boundaries.md    Boundary contribution workflow and contract
data/states.js                     Generated region metadata
data/location-index.json           Generated state, district, and tehsil search index
tools/build_boundary_registry.py   Layer discovery and compatibility validator
tools/validate_boundary_contribution.py
                                   SVG, GeoJSON, metadata, and count validator
tools/new_boundary_contribution.py Guided contribution workspace creator
tools/check_contributions.py       Repository-wide contribution discovery
tools/generate_maps.py             GeoJSON-to-SVG generator
tools/generate_state_district_map.py
                                   One-state district rollout generator
tools/generate_all_state_district_maps.py
                                   Nationwide district rollout generator
tools/extract_soi_state_districts.py
                                   Survey of India shapefile-to-GeoJSON extractor
tools/extract_soi_subdistricts.py  Survey of India sub-district extractor
tools/prepare_mumbai_wards.py      Mumbai ward normalization and tehsil assignment
tools/rajasthan-district-overrides.json
                                   Rajasthan display-name and LGD-code registry
tools/build_nagaland_current_geojson.py
                                   Current Nagaland district-layer builder
tools/nagaland-district-overrides.json
                                   Nagaland display-name and LGD-code registry
tools/generate_district_svg.mjs    Child-boundary GeoJSON-to-SVG generator
tools/extract_osm_villages.py      OSM village-to-subdistrict extractor
tools/generate_tehsil_svg.mjs      Local-boundary GeoJSON-to-tehsil-SVG generator
index.html / app.js                National map explorer
audit.html / audit.js              Nationwide district source audit
state.html / state.js              Standalone state viewer
district.html / district.js        District map and child-layer workspace
tehsil.html / tehsil.js            Tehsil map and deeper local-layer workspace
custom-map.html / custom-map.js    Custom SVG and GeoJSON map importer
data/district-maps.js              Dedicated district SVG asset registry
data/tehsil-maps.js                Dedicated tehsil SVG asset registry
standalone-export.js               Single-file interactive map exporter
styles.css                         Shared responsive styling
```

## Identifier convention

Identifiers are intentionally separate from government administrative codes:

```text
Region:           IN-REGION-27
Division layer:   IN-REGION-27-DIVISIONS
Division:         IN-REGION-27-DIVISION-PUNE
District layer:   IN-REGION-27-DISTRICTS
District feature: IN-REGION-27-DISTRICT-522
Subdivision layer: IN-REGION-27-DISTRICT-522-SUBDIVISIONS
Subdivision:       IN-REGION-27-DISTRICT-522-SUBDIVISION-{CODE}
Tehsil layer:      IN-REGION-27-DISTRICT-522-TEHSILS
Tehsil:            IN-REGION-27-DISTRICT-522-TEHSIL-{CODE}
```

The numeric administrative code remains available separately in the metadata.
For the Maharashtra and Karnataka rollouts, every district feature also carries
`data-division` and `data-division-id` attributes covering the six revenue
divisions in Maharashtra or four revenue divisions in Karnataka. The state
page exposes these as shareable `division` URL filters,
for example `state.html?state=maharashtra&division=pune`.

## District child-layer assets

District pages work immediately by focusing the matching district geometry
inside its state SVG. A future dedicated district SVG can be registered in
`data/district-maps.js`:

```js
window.INDIA_DISTRICT_MAPS = {
  "maharashtra/pune": {
    svg: "assets/maps/districts/maharashtra/pune.svg"
  }
};
```

Dedicated SVGs can provide groups with `data-layer-type` values of
`subdivisions`, `tehsils`, `blocks`, `wards`, or `other`. A layer becomes
toggleable when it has `data-status="ready"` and contains geometry. Interactive
features should use the `child-region` class and a stable `data-feature-id`.

The Pune pilot is registered at
`assets/maps/districts/maharashtra/pune.svg`. Its populated layer uses:

```text
Layer:   IN-REGION-27-DISTRICT-521-TEHSILS
Feature: IN-REGION-27-DISTRICT-521-TEHSIL-{CENSUS_CODE}
```

The public registry currently includes Pune. Mumbai City and Mumbai Suburban
continue to open as focused district outlines, but their previously prepared
Survey of India-derived tehsil assets are local-only and excluded from Git
until redistribution rights are confirmed.

Selecting a tehsil updates the breadcrumb and URL, for example:

```text
district.html?state=maharashtra&district=pune&layer=tehsils&region=junnar
```

The selected-tehsil panel opens a focused tehsil workspace:

```text
tehsil.html?state=maharashtra&district=pune&tehsil=junnar
```

That page reserves the next identifier level automatically:

```text
Block layer:       IN-REGION-27-DISTRICT-521-TEHSIL-04187-BLOCKS
Block feature:     IN-REGION-27-DISTRICT-521-TEHSIL-04187-BLOCK-{CODE}
Village layer:     IN-REGION-27-DISTRICT-521-TEHSIL-04187-VILLAGES
Village feature:   IN-REGION-27-DISTRICT-521-TEHSIL-04187-VILLAGE-{CODE}
```

Dedicated tehsil SVGs can be registered in `data/tehsil-maps.js`. Populated
groups become interactive when they use a supported `data-layer-type`, declare
`data-status="ready"`, and contain child geometry.

The public `data/tehsil-maps.js` registry starts empty. Contributors can
register a compatible open-data layer to activate the generic local-boundary
search, selection, labels, data joins, profiles, filters, and export workflow.

To regenerate a dedicated district asset from GeoJSON or GeoJSONL:

```powershell
node tools/generate_district_svg.mjs `
  --source "C:\path\to\SubDistricts_2011.geojsonl" `
  --output "assets\maps\districts\maharashtra\pune.svg" `
  --state-code 27 `
  --district-code 521 `
  --state-slug maharashtra `
  --district-slug pune `
  --district-name Pune `
  --district-feature-id IN-REGION-27-DISTRICT-521
```

Run `python tools/check_public_release.py` before committing. It verifies
the public page assets, the 36 state/UT maps, district feature totals, relative
URLs, and the exclusion of local-only boundary files.

Boundary data is suitable for visualization and prototyping, not legal or
official boundary determination. See [ATTRIBUTION.md](ATTRIBUTION.md).

## Contributing

Code, documentation, accessibility, translation, and properly licensed data
contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
opening a pull request. For boundary changes, use the
[guided contribution assistant](contribute.html) and read the
[boundary contribution workflow](docs/contributing-boundaries.md). Boundary
changes require a direct source, an exact license, a retrieval date, explicit
redistribution confirmation, and a reproducible transformation.

Validate a proposed contribution locally with:

```text
python tools/check_contributions.py
python -m unittest discover -s tests -v
```

## License

Original application code is available under the [MIT License](LICENSE).
Third-party geographic data is not relicensed by this project. Review
[DATA_LICENSES.md](DATA_LICENSES.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistributing map
assets.

## Reusable map engine

Read the [map engine API](docs/map-engine.md) or open the
[multiple-map example](examples/multiple-maps.html) to use the engine without a
framework.

## Examples and quick start

Begin with the [five-minute quick start](docs/quick-start.html), edit the
[minimal starter](starter/index.html), or browse the
[runnable example library](examples/index.html). The included CSV and JSON
files are synthetic demonstration data and should be replaced with documented
real-world sources before publishing a map.

## Boundary registry

Browse the [boundary registry](registry.html), read the
[registry format](docs/boundary-registry.md), or consume
`data/boundary-registry.json` directly. Rebuild and validate it with:

```text
python tools/build_boundary_registry.py
python tools/build_boundary_registry.py --check
```

## Next milestone

Add automated accessibility and browser tests, mobile and large-layer
performance budgets, localization infrastructure, and offline support. See
[ROADMAP.md](ROADMAP.md).
