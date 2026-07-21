# Reusable map engine

`map-engine.js` exposes a dependency-free `window.IndiaMapEngine` class. It
loads an SVG into a supplied element, discovers features, manages hover and
selection state, and publishes DOM events. Page-specific panels, routing,
tooltips, and data presentation remain outside the engine.

## Quick start

```html
<div id="map"></div>
<script src="map-engine.js"></script>
<script>
  const map = new IndiaMapEngine({
    mount: "#map",
    src: "assets/maps/india-states.svg",
    featureSelector: ".map-region",
    featureKey: "slug"
  });

  map.on("selectionchange", (event) => {
    console.log(event.detail.id);
  });

  map.load();
</script>
```

## Configuration

| Option | Default | Purpose |
| --- | --- | --- |
| `mount` | required | Element or selector that receives the SVG. |
| `src` | `""` | Relative or absolute SVG URL. |
| `svgText` | `""` | Inline SVG source used instead of `src`. |
| `featureSelector` | `.map-region` | Selector for interactive SVG features. |
| `featureKey` | `slug` | Dataset property or callback that returns a stable feature ID. |
| `dataKey` | feature key | Metadata property used when `featureKey` is a callback. |
| `data` | `[]` | Array, object, or `Map` joined to features by ID. |
| `selectedClass` | `is-selected` | Class applied to the selected feature. |
| `hoveredClass` | `is-hovered` | Class applied to the hovered or focused feature. |
| `interactive` | `true` | Enables pointer, click, and focus behavior. |
| `keyboard` | `true` | Enables arrow, Home, and End focus navigation. |
| `sanitize` | `true` | Removes executable or embedded content from loaded SVG. |
| `fetchOptions` | `{}` | Additional options passed to `fetch`. |

## Methods

- `load()` fetches and mounts the configured SVG.
- `render(svgText)` mounts SVG source immediately.
- `refresh()` rediscovers features after SVG content changes.
- `select(id, options)` and `clearSelection(options)` update selection.
- `hover(id, active, options)` updates preview state from an external control.
- `setData(data)` replaces feature metadata without reloading geometry.
- `getSelectedId()`, `getFeatureElement(id)`, and `getFeatures()` expose state.
- `on(name, handler)` subscribes and returns an unsubscribe function.
- `destroy()` removes listeners and releases the instance.

## Events

Events bubble from the mount element and use the `india-map:` prefix. Event
details always contain the originating `engine`.

| Event | Important detail fields |
| --- | --- |
| `mapload` | `featureCount`, `svg` |
| `maperror` | `error` |
| `featureenter`, `featuremove`, `featureleave` | `id`, `feature`, `source`, pointer coordinates |
| `featurefocus`, `featureblur` | `id`, `feature`, `source` |
| `featureselect` | `id`, `feature`, `source` |
| `featureactivate` | `id`, `feature`, `source` |
| `selectionchange` | `id`, `previousId`, `feature`, `source` |
| `datachange` | `size` |

The short `map.on("selectionchange", handler)` form and the native
`element.addEventListener("india-map:selectionchange", handler)` form are
equivalent.

## Web Component

Load `india-svg-map.js` after the engine and use the light-DOM component:

```html
<india-svg-map
  src="assets/maps/india-states.svg"
  selected="maharashtra"
></india-svg-map>

<script src="map-engine.js"></script>
<script src="india-svg-map.js"></script>
```

The component supports `src`, `selected`, `disabled`, `feature-selector`, and
`feature-key` attributes, plus `select(id)`, `clearSelection()`, `selected`, and
`engine` JavaScript APIs. Each component creates an independent engine
instance. See [the two-map example](../examples/multiple-maps.html).

For complete working recipes, browse the
[choropleth, drill-down, marker, and embed examples](../examples/index.html) or
start with the [five-minute setup](quick-start.md).
