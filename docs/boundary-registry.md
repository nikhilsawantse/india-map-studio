# Boundary registry

`data/boundary-registry.json` is the versioned, machine-readable catalog of
public boundary layers distributed by India Map Studio. It is generated from
tracked SVG assets rather than maintained as a separate handwritten inventory.

## Versioning

- `schemaVersion` identifies the structure of registry records and is frozen at
  `1.0.0` for the Version 1 contract.
- `registryVersion` identifies the published catalog release.
- `compatibility.minimumVersion` declares the oldest compatible
  `IndiaMapEngine` API.
- `data/boundary-registry.schema.json` provides the JSON Schema contract.

The schema rejects unknown top-level and layer fields. A schema-version change
is required before adding an object field or removing, renaming, retyping, or
reinterpreting an existing field. Registry minor and patch releases may add
records and use values already permitted by the schema. See the
[Version 1 stability contract](api-stability.md).

## Layer records

Every layer declares:

- a stable layer ID and optional parent feature ID;
- administrative level, public asset path, status, and feature count;
- feature ID and slug attributes;
- source, exact license, revision, attribution, and redistribution state;
- source boundary-vintage values without claiming that they are legally
  current;
- the map-engine selector and key needed to load the layer; and
- verification checks, warnings, errors, and verification state.

Verification states are:

- `verified`: required identifiers and counts pass, with no metadata warning;
- `compatible`: structurally compatible, with documented metadata gaps;
- `declared`: a stable future layer exists without public geometry; and
- `invalid`: one or more required compatibility checks fail.

## Rebuild and validate

Run:

```text
python tools/build_boundary_registry.py
python tools/build_boundary_registry.py --check
```

The builder discovers tracked national, state, and district SVG assets. It
checks declared counts, stable feature IDs, slug presence, uniqueness, and
engine configuration. `--check` also fails when the committed registry is
stale.

Only Git-tracked SVG files are discovered when Git is available. This prevents
ignored, held, or local-only research geometry from entering the public
registry accidentally.

## Using the registry

Applications may fetch `data/boundary-registry.json`, select a ready layer, and
pass `path`, `engine.featureSelector`, and `engine.featureKey` to
`IndiaMapEngine`. Always inspect the referenced source and license before
redistributing geographic assets.
