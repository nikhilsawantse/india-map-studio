# Sample datasets

These small files exercise public examples and import workflows. They are
demonstration data, not official statistics.

- `india-state-demo.csv` joins a synthetic numeric index to all 36 national
  map regions by `slug` for the choropleth example.
- `india-marker-demo.json` places six synthetic marker volumes at their
  referenced region's visual centroid. The values are not geographic
  coordinates.
- `india-poi-layers-demo.json` provides a compact, non-exhaustive CC0 Wikidata
  coordinate sample for reservoirs and dams, protected wildlife areas, and
  major railway stations. It powers the POI, nearby-place, clustering, heatmap,
  route, and custom-icon examples.
- `sample-map-marker.svg` is a safe, compact upload fixture for the custom SVG
  marker example.
- `maharashtra-district-demo.csv` exercises district-level data import in the
  authoring workspace and the runnable CSV district-data example. It includes
  numeric, categorical, URL, image, and summary fields for all 36 districts.
- `india-pin-demo.json` is a compact, attributed subset of official India Post
  directory records. It links twelve Maharashtra PIN codes to the repository's
  district slugs for the PIN explorer and does not claim that district polygons
  are postal boundaries.

Every synthetic example labels its values clearly. Replace demonstration data
with a documented source before publishing a real map, and retain the source
and license metadata when extending the official PIN sample.
