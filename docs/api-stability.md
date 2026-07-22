# Version 1 public contract

API version: `1.0.0`

Boundary registry schema: `1.0.0`

Boundary contribution manifest schema: `1.0.0`

India Map Studio follows Semantic Versioning for its public runtime and data
contracts. Code that uses only the surface listed below can upgrade between
compatible `1.x` releases without application changes.

## Stable JavaScript surface

The stable runtime export is `window.IndiaMapEngine`. Its version is available
as `IndiaMapEngine.version`.

The public contract includes:

- the documented constructor configuration in [map-engine.md](map-engine.md);
- `load`, `render`, `refresh`, `select`, `clearSelection`, `hover`, `setData`,
  `getSelectedId`, `getFeatureElement`, `getFeatures`, `on`, and `destroy`;
- the `india-map:` event prefix and events listed in
  `IndiaMapEngine.events`;
- event `detail.engine` plus each event's documented detail fields; and
- the `<india-svg-map>` attributes, properties, and methods documented below.

Names beginning with `_`, DOM structure injected inside a mount, page-specific
globals, CSS beyond the documented state classes, and files under `tools/` are
implementation details.

## Stable Web Component surface

`customElements.get("india-svg-map").version` reports `1.0.0`. Stable
attributes are `src`, `selected`, `disabled`, `feature-selector`, and
`feature-key`. Stable JavaScript members are `select(id)`, `clearSelection()`,
`selected`, and `engine`. The `src`, `selected`, and `disabled` attributes react
to changes after connection; selector and key attributes are read when the
component initializes.

## Stable data contracts

`data/boundary-registry.schema.json` is the authoritative schema for
`data/boundary-registry.json`. The schema is strict: unknown top-level and layer
fields are rejected. `data/boundary-contribution.schema.json` is the strict
contract for contribution manifests.

Within version 1, compatible releases may add registry records and use new
values only where the schema already permits them. Removing or renaming a
field, changing its meaning or type, or accepting a new object property
requires a new schema version. Consumers should select records by stable IDs,
not array position.

## Change policy

- Patch releases fix behavior without changing the public contract.
- Minor releases may add optional APIs, events, or schema versions while
  retaining the version 1 surface.
- Major releases may make breaking changes and must include migration notes.
- Deprecated public members remain available for the rest of the current major
  version and are documented in the changelog before removal.

Contract checks run in both browser and Python test suites. A pull request that
changes the frozen surface must intentionally update the version, stability
guide, migration notes, and contract tests together.
