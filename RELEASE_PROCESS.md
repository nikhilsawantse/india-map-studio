# Release process

Version 1 releases are produced from a clean, validated commit on `main`.

1. Confirm `package.json`, `CITATION.cff`, `CHANGELOG.md`, API markers, registry
   compatibility, release notes, and the intended tag use the same version.
2. Run `python -m unittest discover -s tests -v`.
3. Run `python tools/check_public_release.py`.
4. Run `pnpm test:browser` and `pnpm test:performance`.
5. Run `python tools/build_release.py` and inspect `dist/SHA256SUMS.txt`.
6. Commit the release preparation and ensure all required GitHub checks pass.
7. Create and push the signed or annotated tag `v1.0.0`.

Pushing the tag starts `.github/workflows/release.yml`. The workflow rebuilds
the deterministic archives, verifies the release gate, and creates the GitHub
release from `RELEASE_NOTES.md`. Do not upload locally modified archives.

If a workflow fails after tagging, fix the release commit and create a new
SemVer tag. Do not silently move a published tag.
