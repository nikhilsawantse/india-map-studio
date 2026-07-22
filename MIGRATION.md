# Migrating to Version 1.0

Version 1.0 is the first stable India Map Studio contract. Existing pages built
from repository internals should move to the public runtime and schema surface
before adopting future `1.x` updates.

## Runtime integration

Load `map-engine.js`, create `IndiaMapEngine`, and configure the feature
selector and stable key explicitly:

```html
<div id="map"></div>
<script src="map-engine.js"></script>
<script>
  const map = new IndiaMapEngine({
    mount: "#map",
    src: "assets/maps/india-states.svg",
    featureSelector: ".map-region",
    featureKey: "slug"
  });
  map.load();
</script>
```

Do not depend on underscore-prefixed methods, injected SVG DOM ordering,
page-specific globals, or undocumented CSS. The stable methods, defaults, and
events are listed in [docs/api-stability.md](docs/api-stability.md).

## Events and selection

Replace page-specific click coupling with bubbling `india-map:` events:

```js
const unsubscribe = map.on("selectionchange", event => {
  console.log(event.detail.id, event.detail.feature, event.detail.source);
});

map.select("maharashtra", { source: "application" });
// Call unsubscribe() when the surrounding UI is removed.
```

Every public event includes `event.detail.engine`. Selection identifiers are
strings. Clearing selection produces `id: null`.

## Web Component

For the smallest integration, load the engine before `india-svg-map.js`:

```html
<india-svg-map
  src="assets/maps/india-states.svg"
  selected="maharashtra"
></india-svg-map>
<script src="map-engine.js"></script>
<script src="india-svg-map.js"></script>
```

Stable component attributes are `src`, `selected`, `disabled`,
`feature-selector`, and `feature-key`. Stable JavaScript members are
`select(id)`, `clearSelection()`, `selected`, and `engine`.

## Boundary registry and contribution manifests

Both public schemas are frozen at `1.0.0`. The registry schema is strict, so
remove unknown top-level or layer properties before validation. Continue to
join records using stable IDs rather than array position.

- Registry: `data/boundary-registry.json`
- Registry schema: `data/boundary-registry.schema.json`
- Contribution schema: `data/boundary-contribution.schema.json`

Administrative codes such as Census or LGD codes are metadata, not application
identifiers. Keep identifiers such as `IN-REGION-27-DISTRICT-521` unchanged
unless a documented migration accompanies the change.

## Data and publication safety

Version 1.0 packages only Git-tracked, redistribution-safe public assets. Local
Survey of India-derived prototypes remain excluded. Recheck `DATA_LICENSES.md`,
`THIRD_PARTY_NOTICES.md`, and `ATTRIBUTION.md` before redistributing boundary
files.

## Upgrade checklist

1. Replace internal page coupling with `IndiaMapEngine` or `<india-svg-map>`.
2. Use documented methods and `india-map:` events only.
3. Join data through stable slugs or feature IDs.
4. Validate registry and contribution JSON against schema `1.0.0`.
5. Run `python tools/check_public_release.py`.
6. Run `pnpm test:browser` and `pnpm test:performance` for modified examples.

There are no removed stable APIs because Version 1.0 establishes the first
stable surface. Future breaking changes will receive versioned migration notes.
