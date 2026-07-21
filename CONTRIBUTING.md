# Contributing to India Map Studio

Thank you for helping make administrative maps easier to explore, customize,
and reuse. Contributions may include code, documentation, tests, accessibility
improvements, translations, data corrections, or new boundary layers.

By participating, you agree to follow CODE_OF_CONDUCT.md.

## Before opening work

- Search existing issues to avoid duplicate work.
- For a substantial feature or new boundary family, open a proposal first.
- Keep pull requests focused on one problem.
- Never include credentials, private data, or data without redistribution
  rights.

## Run the application

The application uses plain HTML, CSS, and JavaScript. Because SVG assets are
loaded with fetch, serve the project directory over HTTP:

    python -m http.server 8000

Open http://localhost:8000/ and exercise the pages affected by your change.

## Code contributions

- Preserve the framework-free architecture unless a proposal is accepted.
- Use semantic HTML and keep all interactions keyboard accessible.
- Avoid changing stable feature identifiers unless the change includes a
  migration and backward-compatibility explanation.
- Sanitize all user-provided SVG, GeoJSON, URLs, and rich text.
- Keep generated files reproducible and update the relevant generator when
  appropriate.
- Do not reformat unrelated files.

## Boundary-data contributions

New or updated map layers must include all provenance fields requested in
DATA_LICENSES.md. The pull request must identify:

1. the direct source and retrieval date;
2. the exact license and required attribution;
3. whether redistribution and derivatives are permitted;
4. transformations, clipping, dissolving, renaming, or code mapping performed;
5. the expected feature count; and
6. the generator command or reproducible process.

Do not submit geometry copied from a visual map, reverse-engineered from a
restricted service, or published without clear redistribution permission.

Use the local contribution assistant at `contribute.html` or run the guided
command-line workflow:

    python tools/new_boundary_contribution.py

Both workflows produce the versioned `boundary-contribution.json` required for
review. Read `docs/contributing-boundaries.md` for the geometry, identifier,
metadata, and folder contracts.

After adding or changing a public boundary SVG, rebuild and check the registry:

    python tools/build_boundary_registry.py
    python tools/build_boundary_registry.py --check

## Validate your change

At minimum:

- run a local HTTP server;
- check the browser console for errors;
- test mouse and keyboard interaction;
- test the narrow/mobile layout;
- verify direct links still restore the selected feature;
- verify imported and exported data if those paths changed; and
- check map attribution and metadata when geometry changed.

Run `python tools/check_public_release.py` before opening a pull request. It
checks publication safety, public routes, feature totals, and registry
compatibility.

When adding a staged SVG or GeoJSON contribution, also run:

    python tools/check_contributions.py
    python -m unittest discover -s tests -v

The same checks run automatically on every pull request.

## Pull requests

Complete the pull-request template, explain the user-facing result, and attach
screenshots for visible changes. By submitting a contribution, you confirm
that you have the right to provide it under the repository's applicable
licenses.

Maintainers may request changes when a contribution has unclear provenance,
breaks stable identifiers, or makes the map less accessible.
