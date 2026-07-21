(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const elements = {
    mount: document.querySelector("#marker-map"),
    status: document.querySelector("#marker-status"),
    detail: document.querySelector("#marker-detail"),
    list: document.querySelector("#marker-list"),
  };
  let map = null;
  let markerElements = new Map();
  let listButtons = new Map();

  function markerRadius(value) {
    return 8 + Math.sqrt(value) * 1.7;
  }

  function setActive(slug) {
    markerElements.forEach((element, key) => element.classList.toggle("is-active", key === slug));
    listButtons.forEach((button, key) => button.classList.toggle("is-active", key === slug));
  }

  function describe(marker) {
    elements.detail.textContent = `${marker.label}: ${marker.value} synthetic volume units in ${marker.regionName}.`;
  }

  function activate(marker) {
    map.select(marker.slug, { source: "marker" });
    setActive(marker.slug);
    describe(marker);
  }

  function createSvgMarker(marker, feature) {
    const box = feature.element.getBBox();
    const group = document.createElementNS(SVG_NAMESPACE, "g");
    const circle = document.createElementNS(SVG_NAMESPACE, "circle");
    group.classList.add("example-marker");
    group.dataset.markerSlug = marker.slug;
    group.setAttribute("transform", `translate(${box.x + box.width / 2} ${box.y + box.height / 2})`);
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute(
      "aria-label",
      `${marker.label}, ${marker.value} synthetic volume units, ${marker.regionName}`,
    );
    circle.setAttribute("r", markerRadius(marker.value));
    group.append(circle);
    group.addEventListener("click", () => activate(marker));
    group.addEventListener("focus", () => describe(marker));
    group.addEventListener("pointerenter", () => describe(marker));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(marker);
      }
    });
    return group;
  }

  function createListButton(marker) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    button.type = "button";
    label.textContent = marker.label;
    value.textContent = marker.value;
    button.append(label, value);
    button.addEventListener("click", () => activate(marker));
    item.append(button);
    listButtons.set(marker.slug, button);
    return item;
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-marker-demo.json");
    if (!response.ok) throw new Error(`Marker request failed (${response.status})`);
    const dataset = await response.json();
    map = new IndiaMapEngine({
      mount: elements.mount,
      src: "../assets/maps/india-states.svg",
      featureSelector: ".map-region",
      featureKey: "slug",
    });
    await map.load();
    const layer = document.createElementNS(SVG_NAMESPACE, "g");
    layer.classList.add("example-marker-layer");
    const ready = dataset.markers.flatMap((marker) => {
      const feature = map.describe(marker.slug);
      if (!feature?.element) return [];
      const enriched = {
        ...marker,
        regionName: feature.attributes.state || marker.slug,
      };
      const svgMarker = createSvgMarker(enriched, feature);
      markerElements.set(marker.slug, svgMarker);
      layer.append(svgMarker);
      return [enriched];
    });
    map.svg.append(layer);
    elements.list.replaceChildren(...ready.map(createListButton));
    map.on("selectionchange", (event) => setActive(event.detail.id));
    elements.status.textContent = `${ready.length} markers added to ${map.getFeatures().length} regions`;
  }

  initialize().catch((error) => {
    elements.status.textContent = "The marker example could not load.";
    elements.detail.textContent = error.message;
    console.error(error);
  });
})();
