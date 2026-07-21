(function () {
  "use strict";

  const { createProjector, loadPresentationMap, svgElement } = window.ExampleMapUtils;
  const elements = {
    mount: document.querySelector("#route-map"), status: document.querySelector("#route-status"),
    caption: document.querySelector("#route-caption"), reset: document.querySelector("#route-reset"),
    toggles: [...document.querySelectorAll(".example-poi-toggles input")],
    selection: document.querySelector("#route-selection"), meta: document.querySelector("#route-selection-meta"),
  };
  const routes = [
    { id: "new-delhi-ahmedabad", group: "western", from: "new-delhi-station", to: "ahmedabad-station", label: "New Delhi–Ahmedabad" },
    { id: "ahmedabad-mumbai", group: "western", from: "ahmedabad-station", to: "csmt-station", label: "Ahmedabad–Mumbai" },
    { id: "new-delhi-patna", group: "eastern", from: "new-delhi-station", to: "patna-station", label: "New Delhi–Patna" },
    { id: "patna-howrah", group: "eastern", from: "patna-station", to: "howrah-station", label: "Patna–Howrah" },
    { id: "howrah-guwahati", group: "eastern", from: "howrah-station", to: "guwahati-station", label: "Howrah–Guwahati" },
    { id: "mumbai-secunderabad", group: "southern", from: "csmt-station", to: "secunderabad-station", label: "Mumbai–Secunderabad" },
    { id: "secunderabad-chennai", group: "southern", from: "secunderabad-station", to: "chennai-central-station", label: "Secunderabad–Chennai" },
    { id: "mumbai-bengaluru", group: "southern", from: "csmt-station", to: "bengaluru-city-station", label: "Mumbai–Bengaluru" },
  ];
  let routeElements = [];

  function curve(from, to, bend) {
    const midpointX = (from.x + to.x) / 2;
    const midpointY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const controlX = midpointX - (dy / length) * bend;
    const controlY = midpointY + (dx / length) * bend;
    return `M${from.x.toFixed(2)} ${from.y.toFixed(2)}Q${controlX.toFixed(2)} ${controlY.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  function updateVisibility() {
    const active = new Set(elements.toggles.filter((toggle) => toggle.checked).map((toggle) => toggle.value));
    routeElements.forEach(({ route, group }) => group.classList.toggle("is-hidden", !active.has(route.group)));
    const visible = routes.filter((route) => active.has(route.group)).length;
    elements.status.textContent = `${visible} of ${routes.length} demonstration routes visible`;
  }

  function selectRoute(route, from, to) {
    routeElements.forEach((entry) => entry.group.classList.toggle("is-active", entry.route.id === route.id));
    elements.selection.textContent = route.label;
    elements.meta.textContent = `${from.name} to ${to.name}. Illustrative connection between sourced station coordinates.`;
    elements.caption.textContent = `${route.label} selected in the ${route.group} corridor.`;
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-poi-layers-demo.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Station dataset request failed (${response.status}).`);
    const dataset = await response.json();
    const project = createProjector(dataset.projection);
    const stations = new Map(dataset.markers.filter((marker) => marker.category === "station").map((marker) => {
      const [x, y] = project(marker.longitude, marker.latitude);
      return [marker.id, { ...marker, x, y }];
    }));
    const map = await loadPresentationMap(elements.mount);
    const routeLayer = svgElement("g", { class: "example-route-layer", "aria-label": "Demonstration routes" });
    routes.forEach((route, index) => {
      const from = stations.get(route.from);
      const to = stations.get(route.to);
      const group = svgElement("g", { class: `example-route is-${route.group}`, tabindex: "0", role: "button", "aria-label": `${route.label} demonstration route` });
      group.append(svgElement("path", { d: curve(from, to, index % 2 ? 20 : -20), class: "example-route-hit" }), svgElement("path", { d: curve(from, to, index % 2 ? 20 : -20), class: "example-route-line" }));
      group.addEventListener("click", () => selectRoute(route, from, to));
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectRoute(route, from, to); } });
      routeElements.push({ route, group });
      routeLayer.append(group);
    });
    const nodeLayer = svgElement("g", { class: "example-route-nodes", "aria-hidden": "true" });
    stations.forEach((station) => nodeLayer.append(svgElement("circle", { cx: station.x.toFixed(2), cy: station.y.toFixed(2), r: "5" })));
    map.svg.append(routeLayer, nodeLayer);
    updateVisibility();
  }

  elements.toggles.forEach((toggle) => toggle.addEventListener("change", updateVisibility));
  elements.reset.addEventListener("click", () => { elements.toggles.forEach((toggle) => { toggle.checked = true; }); updateVisibility(); });
  initialize().catch((error) => { elements.status.textContent = "The route example could not load."; elements.caption.textContent = error.message; console.error(error); });
})();
