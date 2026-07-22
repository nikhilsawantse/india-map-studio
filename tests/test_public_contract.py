import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublicContractTests(unittest.TestCase):
    def load_json(self, relative_path: str) -> dict:
        return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))

    def test_boundary_registry_schema_is_frozen_at_v1(self):
        schema = self.load_json("data/boundary-registry.schema.json")
        registry = self.load_json("data/boundary-registry.json")

        self.assertEqual(schema["properties"]["schemaVersion"], {"const": "1.0.0"})
        self.assertFalse(schema["additionalProperties"])
        self.assertIn("$schema", schema["required"])
        self.assertEqual(set(registry), set(schema["properties"]))
        self.assertEqual(registry["schemaVersion"], "1.0.0")
        self.assertEqual(registry["registryVersion"], "1.0.0")
        self.assertEqual(registry["compatibility"], {
            "engine": "IndiaMapEngine",
            "minimumVersion": "1.0.0",
        })

        layer_keys = set(schema["$defs"]["layer"]["properties"])
        source_keys = set(schema["$defs"]["source"]["properties"])
        for layer in registry["layers"]:
            self.assertEqual(set(layer), layer_keys)
            self.assertEqual(layer["engine"]["api"], "IndiaMapEngine")
            self.assertEqual(layer["engine"]["minimumVersion"], "1.0.0")
        for source in registry["sources"].values():
            self.assertEqual(set(source), source_keys)

    def test_boundary_contribution_manifest_is_frozen_at_v1(self):
        schema = self.load_json("data/boundary-contribution.schema.json")
        self.assertEqual(schema["properties"]["schemaVersion"], {"const": "1.0.0"})
        self.assertFalse(schema["additionalProperties"])

    def test_runtime_and_documentation_declare_the_same_version(self):
        engine = (ROOT / "map-engine.js").read_text(encoding="utf-8")
        component = (ROOT / "india-svg-map.js").read_text(encoding="utf-8")
        stability = (ROOT / "docs/api-stability.md").read_text(encoding="utf-8")
        self.assertIn('const API_VERSION = "1.0.0"', engine)
        self.assertIn('static version = "1.0.0"', component)
        self.assertIn("API version: `1.0.0`", stability)
        self.assertIn("Boundary registry schema: `1.0.0`", stability)


if __name__ == "__main__":
    unittest.main()
