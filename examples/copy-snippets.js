(function () {
  "use strict";

  const recipes = {
    "choropleth.html": {
      title: "Join values and color regions",
      code: String.raw`<div id="map"></div>
<script src="../map-engine.js"></script>
<script>
const values = { maharashtra: 82, karnataka: 68, assam: 54 };
const map = new IndiaMapEngine({ mount: "#map", src: "../assets/maps/india-states.svg" });
map.on("mapload", () => map.getFeatures().forEach(feature => {
  const value = values[feature.id];
  if (value) feature.element.style.fill = "hsl(153 45% " + (82 - value / 2) + "%)";
}));
map.load();
</script>`
    },
    "drill-down.html": {
      title: "Load a selected state's district layer",
      code: String.raw`<div id="india-map"></div><div id="district-map"></div>
<script src="../map-engine.js"></script>
<script>
const india = new IndiaMapEngine({ mount: "#india-map", src: "../assets/maps/india-states.svg" });
india.on("selectionchange", async event => {
  if (!event.detail.id) return;
  const districts = new IndiaMapEngine({
    mount: "#district-map",
    src: "../assets/maps/states/" + event.detail.id + ".svg",
    featureSelector: ".district-region"
  });
  await districts.load();
});
india.load();
</script>`
    },
    "markers.html": {
      title: "Place an SVG marker after the map loads",
      code: String.raw`const map = new IndiaMapEngine({ mount: "#map", src: "../assets/maps/india-states.svg" });
map.on("mapload", event => {
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "420"); marker.setAttribute("cy", "330");
  marker.setAttribute("r", "8"); marker.setAttribute("fill", "#b94720");
  marker.setAttribute("aria-label", "Project location");
  event.detail.svg.append(marker);
});
map.load();`
    },
    "embedded-map.html": {
      title: "Embed a selected map",
      code: String.raw`<iframe
  src="embed-frame.html?selected=maharashtra"
  title="Interactive India map"
  width="100%"
  height="650"
  loading="lazy"
></iframe>`
    },
    "csv-data.html": {
      title: "Read a CSV file and join it by district ID",
      code: String.raw`<input id="data-file" type="file" accept=".csv">
<script>
document.querySelector("#data-file").addEventListener("change", async event => {
  const text = await event.target.files[0].text();
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const fields = header.split(",");
  const rows = lines.map(line => Object.fromEntries(
    line.split(",").map((value, index) => [fields[index], value])
  ));
  map.setData(rows); // Configure dataKey: "district_id" on map.
});
</script>`
    },
    "poi-layers.html": {
      title: "Project longitude and latitude into the SVG",
      code: String.raw`const project = ExampleMapUtils.createProjector({
  geographicBounds: [68, 6, 98, 38], viewBox: [0, 0, 1000, 1000], padding: 60
});
const [x, y] = project(73.8567, 18.5204);
const marker = ExampleMapUtils.svgElement("circle", {
  cx: x, cy: y, r: 9, fill: "#b94720", "aria-label": "Pune"
});
map.svg.append(marker);`
    },
    "marker-clustering.html": {
      title: "Group nearby markers into simple grid clusters",
      code: String.raw`function cluster(markers, cellSize = 40) {
  return Object.values(markers.reduce((groups, marker) => {
    const key = Math.round(marker.x / cellSize) + ":" + Math.round(marker.y / cellSize);
    (groups[key] ||= []).push(marker);
    return groups;
  }, {}));
}
cluster(projectedMarkers).forEach(group => {
  const label = group.length === 1 ? group[0].name : group.length + " places";
  // Draw one symbol at the group's average x/y and expose label to assistive technology.
});`
    },
    "heatmap.html": {
      title: "Apply a value-driven heat scale",
      code: String.raw`const values = new Map(data.map(row => [row.slug, Number(row.value)]));
map.getFeatures().forEach(feature => {
  const value = values.get(feature.id) || 0;
  const lightness = 92 - Math.min(70, value) * 0.65;
  feature.element.style.fill = "hsl(18 82% " + lightness + "%)";
  feature.element.setAttribute("aria-label", feature.id + ": " + value);
});`
    },
    "route-network.html": {
      title: "Draw a selectable SVG route",
      code: String.raw`const route = document.createElementNS("http://www.w3.org/2000/svg", "path");
route.setAttribute("d", "M260 540 C390 410 560 470 710 300");
route.setAttribute("fill", "none");
route.setAttribute("stroke", "#115d4d");
route.setAttribute("stroke-width", "8");
route.setAttribute("role", "button");
route.setAttribute("aria-label", "Western route");
route.addEventListener("click", () => route.classList.toggle("is-selected"));
map.svg.append(route);`
    },
    "time-series.html": {
      title: "Update map colors for a selected year",
      code: String.raw`yearInput.addEventListener("input", () => {
  const rows = series.filter(row => row.year === Number(yearInput.value));
  const values = new Map(rows.map(row => [row.slug, row.value]));
  map.getFeatures().forEach(feature => {
    const value = values.get(feature.id) || 0;
    feature.element.style.fill = "hsl(153 45% " + (88 - value / 2) + "%)";
  });
});`
    },
    "comparison-map.html": {
      title: "Create two synchronized map instances",
      code: String.raw`const options = { src: "../assets/maps/india-states.svg" };
const left = new IndiaMapEngine({ ...options, mount: "#map-a" });
const right = new IndiaMapEngine({ ...options, mount: "#map-b" });
left.on("featureenter", event => right.hover(event.detail.id));
left.on("featureleave", event => right.hover(event.detail.id, false));
right.on("featureenter", event => left.hover(event.detail.id));
right.on("featureleave", event => left.hover(event.detail.id, false));
Promise.all([left.load(), right.load()]);`
    },
    "custom-icons.html": {
      title: "Add a custom SVG image marker",
      code: String.raw`const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");
icon.setAttribute("href", "../sample-data/sample-map-marker.svg");
icon.setAttribute("x", "390"); icon.setAttribute("y", "300");
icon.setAttribute("width", "34"); icon.setAttribute("height", "34");
icon.setAttribute("role", "img");
icon.setAttribute("aria-label", "Custom project marker");
map.svg.append(icon);`
    },
    "location-finder.html": {
      title: "Find and select a region by name or slug",
      code: String.raw`function findRegion(query) {
  const term = query.trim().toLowerCase();
  const feature = map.getFeatures().find(item =>
    item.id.includes(term) || (item.attributes.state || "").toLowerCase().includes(term)
  );
  if (feature) map.select(feature.id, { source: "search" });
  return feature;
}
searchInput.addEventListener("change", () => findRegion(searchInput.value));`
    },
    "nearby-places.html": {
      title: "Filter places by radius",
      code: String.raw`function distanceKm(a, b) {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude))
    * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
const nearby = places.filter(place => distanceKm(origin, place) <= 100);`
    },
    "draw-select.html": {
      title: "Select features intersecting a screen rectangle",
      code: String.raw`function selectInside(rectangle) {
  return map.getFeatures().filter(feature => {
    const box = feature.element.getBoundingClientRect();
    return box.left <= rectangle.right && box.right >= rectangle.left
      && box.top <= rectangle.bottom && box.bottom >= rectangle.top;
  });
}
const selectedIds = selectInside(drawnRectangle).map(feature => feature.id);`
    },
    "service-coverage.html": {
      title: "Assign each district to its nearest centre",
      code: String.raw`const assignments = districts.map(district => {
  const centre = centres.reduce((best, item) =>
    distanceKm(district, item) < distanceKm(district, best) ? item : best
  );
  return { districtId: district.id, centreId: centre.id };
});
const assigned = new Map(assignments.map(item => [item.districtId, item.centreId]));`
    },
    "incident-alerts.html": {
      title: "Filter and select active incidents",
      code: String.raw`function visibleIncidents(filters) {
  return incidents.filter(incident =>
    (!filters.severity || incident.severity === filters.severity)
    && (!filters.type || incident.type === filters.type)
    && (filters.includeResolved || !incident.resolved)
  );
}
marker.addEventListener("click", () => map.select(marker.dataset.districtSlug));`
    },
    "ranking-dashboard.html": {
      title: "Rank features and synchronize map selection",
      code: String.raw`function rank(rows, indicator, limit = 10) {
  return [...rows].sort((a, b) => Number(b[indicator]) - Number(a[indicator])).slice(0, limit);
}
rank(data, "literacy", 10).forEach((row, index) => {
  const button = document.createElement("button");
  button.textContent = (index + 1) + ". " + row.name;
  button.addEventListener("click", () => map.select(row.slug, { source: "ranking" }));
  rankingList.append(button);
});`
    },
    "editable-annotations.html": {
      title: "Save editable annotations locally",
      code: String.raw`const annotations = JSON.parse(localStorage.getItem("map-notes") || "[]");
function addAnnotation(annotation) {
  annotations.push({ id: crypto.randomUUID(), ...annotation });
  localStorage.setItem("map-notes", JSON.stringify(annotations));
}
function removeAnnotation(id) {
  const index = annotations.findIndex(item => item.id === id);
  if (index >= 0) annotations.splice(index, 1);
  localStorage.setItem("map-notes", JSON.stringify(annotations));
}`
    },
    "story-map.html": {
      title: "Advance through map story chapters",
      code: String.raw`const chapters = [
  { title: "Western Ghats", region: "maharashtra" },
  { title: "Brahmaputra", region: "assam" }
];
let chapterIndex = 0;
function showChapter(index) {
  chapterIndex = Math.max(0, Math.min(chapters.length - 1, index));
  heading.textContent = chapters[chapterIndex].title;
  map.select(chapters[chapterIndex].region, { source: "story" });
}
nextButton.addEventListener("click", () => showChapter(chapterIndex + 1));`
    },
    "printable-report.html": {
      title: "Print a clean map report",
      code: String.raw`<button id="print-report" type="button">Print report</button>
<section class="report">Your map, title, legend and notes</section>
<style>
@media print {
  #print-report, .site-header, .report-controls { display: none !important; }
  .report { box-shadow: none; border: 0; }
}
</style>
<script>
document.querySelector("#print-report").addEventListener("click", () => window.print());
</script>`
    },
    "pin-code-explorer.html": {
      title: "Search PIN records and highlight their district",
      code: String.raw`function searchPin(query) {
  const term = query.trim().toLowerCase();
  return records.filter(record =>
    record.pincode.includes(term)
    || record.office.toLowerCase().includes(term)
    || record.district.toLowerCase().includes(term)
  );
}
resultButton.addEventListener("click", () =>
  map.select(resultButton.dataset.districtSlug, { source: "pin-search" })
);`
    },
    "multiple-maps.html": {
      title: "Use two independent Web Components",
      code: String.raw`<india-svg-map src="../assets/maps/india-states.svg" selected="maharashtra"></india-svg-map>
<india-svg-map src="../assets/maps/india-states.svg" selected="karnataka"></india-svg-map>

<script src="../map-engine.js"></script>
<script src="../india-svg-map.js"></script>
<script>
document.querySelectorAll("india-svg-map").forEach(map => {
  map.addEventListener("india-map:selectionchange", event => console.log(event.detail.id));
});
</script>`
    }
  };

  const pageName = window.location.pathname.split("/").pop();
  const recipe = recipes[pageName];
  const main = document.querySelector("main");
  if (!recipe || !main) return;

  const section = document.createElement("section");
  section.className = "example-copy-snippet";
  section.setAttribute("aria-labelledby", "copy-snippet-title");

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const summaryText = document.createElement("span");
  const summaryTitle = document.createElement("strong");
  summaryTitle.id = "copy-snippet-title";
  summaryTitle.textContent = "Copy this recipe";
  const summaryHint = document.createElement("small");
  summaryHint.textContent = "Minimal starting point for your own project";
  summaryText.append(summaryTitle, summaryHint);
  summary.append(summaryText);

  const content = document.createElement("div");
  content.className = "example-copy-snippet-content";
  const heading = document.createElement("h2");
  heading.textContent = recipe.title;
  const actions = document.createElement("div");
  actions.className = "example-copy-snippet-actions";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy snippet";
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  actions.append(copy, status);

  const pre = document.createElement("pre");
  pre.tabIndex = 0;
  pre.setAttribute("aria-label", recipe.title + " code");
  const code = document.createElement("code");
  code.textContent = recipe.code.trim();
  pre.append(code);
  content.append(heading, actions, pre);
  details.append(summary, content);
  section.append(details);
  main.append(section);

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = "Copied.";
    } catch (_error) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Snippet selected. Press Ctrl+C or Command+C.";
    }
  });
})();
