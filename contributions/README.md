# Boundary contribution workspace

Each proposed layer belongs in its own directory beneath `contributions/` and
contains:

- `boundary-contribution.json`, following
  `data/boundary-contribution.schema.json`; and
- the SVG or GeoJSON asset named by `layer.file` in that manifest.

Create the pair with the guided command:

```text
python tools/new_boundary_contribution.py
```

Validate one contribution or every contribution in the workspace:

```text
python tools/validate_boundary_contribution.py contributions/example/boundary-contribution.json
python tools/check_contributions.py
```

Directories beginning with `_` are treated as documentation or templates and
are not included in automatic discovery. A validated contribution still needs
maintainer review before its geometry can move into `assets/maps/` and the
public boundary registry.
