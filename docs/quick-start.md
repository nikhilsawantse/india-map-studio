# Five-minute quick start

Build a keyboard-accessible interactive India map with plain HTML and
JavaScript. No package installation or build step is required.

## 1. Create or clone the project

Use this repository as a GitHub template, or clone it:

```text
git clone https://github.com/nikhilsawantse/india-map-studio.git
cd india-map-studio
```

## 2. Start a local server

SVG assets are loaded with `fetch`, so opening an HTML file directly is not
enough.

```text
python -m http.server 8000
```

Open `http://localhost:8000/starter/`.

## 3. Add the map element

```html
<india-svg-map
  id="my-map"
  src="../assets/maps/india-states.svg"
  aria-label="Interactive map of India"
></india-svg-map>
```

## 4. Load the framework-free engine

```html
<script src="../map-engine.js"></script>
<script src="../india-svg-map.js"></script>
```

## 5. Respond to selection

```js
const map = document.querySelector("#my-map");

map.addEventListener("india-map:selectionchange", (event) => {
  console.log(event.detail.id);
});
```

The starter page in `starter/` contains this complete setup. The selected value
is a stable region slug such as `maharashtra`, not a display label.

## Next choices

- Join numeric CSV data with the [choropleth example](../examples/choropleth.html).
- Import district CSV files, switch numeric or categorical fields, and inspect
  joined profiles with the [CSV data example](../examples/csv-data.html).
- Replace the national SVG with district layers in the
  [drill-down example](../examples/drill-down.html).
- Add an SVG overlay with the [marker example](../examples/markers.html).
- Project sourced coordinates with searchable category toggles in the
  [POI layer example](../examples/poi-layers.html).
- Reduce marker overlap with the
  [clustering example](../examples/marker-clustering.html), or reveal point
  concentration with the [heatmap example](../examples/heatmap.html).
- Connect coordinate hubs with the
  [route-network example](../examples/route-network.html).
- Explore changing values with the
  [time-series example](../examples/time-series.html), or compare matching
  regional scenarios with the
  [comparison-map example](../examples/comparison-map.html).
- Let users bring their own symbol with the
  [custom SVG icon example](../examples/custom-icons.html).
- Find a published state, district, or tehsil by name, administrative code,
  slug, or stable identifier with the
  [India location finder](../examples/location-finder.html).
- Discover sourced public-interest points around a selected place, entered
  coordinate, or dropped map origin with the
  [nearby-places example](../examples/nearby-places.html).
- Build a reusable district set with click, rectangle, or lasso selection and
  export its identifiers with the
  [draw-and-select example](../examples/draw-select.html).
- Explore service-centre placement, coverage gaps, and overlapping assignments
  across any public district layer with the
  [service-area example](../examples/service-coverage.html).
- Publish a clean iframe with the
  [embedded-map example](../examples/embedded-map.html).
- Read the full [map engine API](map-engine.md).

Boundary assets may use licenses different from the application code. Review
`DATA_LICENSES.md` and `ATTRIBUTION.md` before redistributing them.
