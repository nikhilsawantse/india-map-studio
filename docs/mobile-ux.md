# Mobile workspace UX

India Map Studio keeps long controls and the map one tap apart on touch and
narrow-screen devices.

## What changes below the mobile breakpoint

- A sticky **Controls / Map** jump bar appears in supported workspaces.
- Report builders place controls before the preview so users configure first
  and inspect the result second.
- Form fields use a mobile-safe 16 pixel font size to prevent unwanted browser
  zoom.
- Primary controls and navigation targets are at least 44 pixels high on coarse
  pointers.
- Region geometry uses touch-friendly interaction behavior.
- Map and control targets reserve scroll space for the sticky jump bar.
- Desktop layouts and sticky side-by-side maps remain unchanged.

The shared helper recognizes the national explorer, state, district, tehsil,
custom-map, standard example, embedded-preview, Story Map, and printable-report
layouts.

## Use the mobile helper

Place the helper after the page-specific JavaScript:

```html
<link rel="stylesheet" href="styles.css">

<!-- Your map and page scripts -->
<script src="mobile-workspace.js"></script>
```

The helper uses existing semantic containers and inserts native navigation
buttons only when a matching controls-and-map layout exists. It stays hidden on
desktop screens.

## Validate mobile behavior

```text
pnpm test:browser -- tests/browser/mobile.spec.js tests/browser/mobile-accessibility.spec.js --workers=1
```

The automated suite checks jump navigation, touch-target height, form sizing,
mobile report ordering, horizontal overflow, and serious accessibility issues
at a 390 by 844 pixel touch viewport.
