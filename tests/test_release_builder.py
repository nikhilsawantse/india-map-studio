from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseBuilderTests(unittest.TestCase):
    def build(self, output: Path) -> None:
        result = subprocess.run(
            [sys.executable, "tools/build_release.py", "--output", str(output)],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_release_archives_are_complete_safe_and_reproducible(self) -> None:
        version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))[
            "version"
        ]
        with tempfile.TemporaryDirectory() as first_folder, tempfile.TemporaryDirectory() as second_folder:
            first = Path(first_folder)
            second = Path(second_folder)
            self.build(first)
            self.build(second)

            expected = {
                f"india-map-studio-{version}.zip",
                f"india-map-studio-starter-{version}.zip",
                "SHA256SUMS.txt",
            }
            self.assertEqual({path.name for path in first.iterdir()}, expected)
            for name in expected:
                self.assertEqual(
                    hashlib.sha256((first / name).read_bytes()).hexdigest(),
                    hashlib.sha256((second / name).read_bytes()).hexdigest(),
                )

            with zipfile.ZipFile(first / f"india-map-studio-{version}.zip") as archive:
                names = set(archive.namelist())
                self.assertIn(f"india-map-studio-{version}/index.html", names)
                self.assertIn(f"india-map-studio-{version}/MIGRATION.md", names)
                self.assertFalse(any("mumbai-city.svg" in name for name in names))

            with zipfile.ZipFile(
                first / f"india-map-studio-starter-{version}.zip"
            ) as archive:
                names = set(archive.namelist())
                self.assertIn(
                    f"india-map-studio-starter-{version}/starter/index.html", names
                )
                self.assertIn(
                    f"india-map-studio-starter-{version}/assets/maps/india-states.svg",
                    names,
                )


if __name__ == "__main__":
    unittest.main()
