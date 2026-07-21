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
- Replace the national SVG with district layers in the
  [drill-down example](../examples/drill-down.html).
- Add an SVG overlay with the [marker example](../examples/markers.html).
- Publish a clean iframe with the
  [embedded-map example](../examples/embedded-map.html).
- Read the full [map engine API](map-engine.md).

Boundary assets may use licenses different from the application code. Review
`DATA_LICENSES.md` and `ATTRIBUTION.md` before redistributing them.
