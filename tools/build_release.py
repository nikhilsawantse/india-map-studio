#!/usr/bin/env python3
"""Build deterministic Version 1 release archives from Git-tracked files."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
FIXED_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
VERSION_PATTERN = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
BANNED_RELEASE_PATHS = {
    "assets/maps/districts/maharashtra/mumbai-city.svg",
    "assets/maps/districts/maharashtra/mumbai-suburban.svg",
    "assets/maps/tehsils/maharashtra/pune/junnar.svg",
    "assets/maps/tehsils/maharashtra/mumbai-city/mumbai.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/andheri.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/borivali.svg",
    "assets/maps/tehsils/maharashtra/mumbai-suburban/kurla.svg",
    "sample-data/junnar-village-demo.csv",
    "sample-data/junnar-village-validation-demo.csv",
    "sample-data/junnar-village-field-types-demo.csv",
}
STARTER_FILES = {
    "assets/maps/india-states.svg",
    "map-engine.js",
    "india-svg-map.js",
    "starter/index.html",
    "starter/app.js",
    "starter/styles.css",
    "starter/README.md",
    "LICENSE",
    "DATA_LICENSES.md",
    "THIRD_PARTY_NOTICES.md",
    "ATTRIBUTION.md",
    "CITATION.cff",
}


def project_version() -> str:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    version = str(package.get("version", ""))
    if not VERSION_PATTERN.fullmatch(version):
        raise ValueError(f"package.json has an invalid release version: {version!r}")
    citation = (ROOT / "CITATION.cff").read_text(encoding="utf-8")
    if f"version: {version}" not in citation:
        raise ValueError("CITATION.cff does not match package.json")
    notes = (ROOT / "RELEASE_NOTES.md").read_text(encoding="utf-8")
    if f"# India Map Studio {version}" not in notes:
        raise ValueError("RELEASE_NOTES.md does not match package.json")
    tag = os.environ.get("GITHUB_REF_NAME", "")
    if tag and tag.startswith("v") and tag != f"v{version}":
        raise ValueError(f"Tag {tag} does not match package version {version}")
    return version


def tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=False,
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError("git ls-files failed; release archives require a Git checkout")
    files = sorted(
        value.decode("utf-8").replace("\\", "/")
        for value in result.stdout.split(b"\0")
        if value
    )
    missing = [relative for relative in files if not (ROOT / relative).is_file()]
    if missing:
        raise ValueError("Tracked release files are missing: " + ", ".join(missing))
    banned = sorted(set(files) & BANNED_RELEASE_PATHS)
    if banned:
        raise ValueError("Held local-only files are tracked: " + ", ".join(banned))
    return files


def archive_bytes(relative: str) -> bytes:
    return (ROOT / relative).read_bytes()


def write_archive(path: Path, root_name: str, files: list[str]) -> None:
    with zipfile.ZipFile(
        path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
    ) as archive:
        for relative in sorted(files):
            name = str(PurePosixPath(root_name) / PurePosixPath(relative))
            info = zipfile.ZipInfo(name, date_time=FIXED_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, archive_bytes(relative), compresslevel=9)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_archive(path: Path, root_name: str, expected_files: set[str]) -> None:
    expected = {
        str(PurePosixPath(root_name) / PurePosixPath(relative))
        for relative in expected_files
    }
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        if names != expected:
            missing = sorted(expected - names)
            extra = sorted(names - expected)
            raise ValueError(
                f"{path.name} entry mismatch; missing={missing[:5]}, extra={extra[:5]}"
            )
        if any(info.date_time != FIXED_TIMESTAMP for info in archive.infolist()):
            raise ValueError(f"{path.name} contains a non-deterministic timestamp")


def build(output: Path) -> list[Path]:
    version = project_version()
    files = tracked_files()
    starter_missing = sorted(STARTER_FILES - set(files))
    if starter_missing:
        raise ValueError("Starter release files are not tracked: " + ", ".join(starter_missing))

    output.mkdir(parents=True, exist_ok=True)
    full_path = output / f"india-map-studio-{version}.zip"
    starter_path = output / f"india-map-studio-starter-{version}.zip"
    checksum_path = output / "SHA256SUMS.txt"
    for path in (full_path, starter_path, checksum_path):
        if path.exists():
            path.unlink()

    write_archive(full_path, f"india-map-studio-{version}", files)
    write_archive(
        starter_path,
        f"india-map-studio-starter-{version}",
        sorted(STARTER_FILES),
    )
    validate_archive(full_path, f"india-map-studio-{version}", set(files))
    validate_archive(
        starter_path,
        f"india-map-studio-starter-{version}",
        STARTER_FILES,
    )

    checksums = [
        f"{sha256(full_path)}  {full_path.name}",
        f"{sha256(starter_path)}  {starter_path.name}",
    ]
    checksum_path.write_text("\n".join(checksums) + "\n", encoding="utf-8")
    return [full_path, starter_path, checksum_path]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Build and validate in a temporary directory without keeping artifacts",
    )
    args = parser.parse_args()

    if args.check:
        with tempfile.TemporaryDirectory() as folder:
            artifacts = build(Path(folder))
            print(
                "Release package validation passed: "
                + ", ".join(f"{path.name} ({path.stat().st_size} bytes)" for path in artifacts)
            )
        return 0

    output = args.output.resolve()
    artifacts = build(output)
    for artifact in artifacts:
        print(f"Wrote {artifact}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
