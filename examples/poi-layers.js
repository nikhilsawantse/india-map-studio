(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const DATA_URL = "../sample-data/india-poi-layers-demo.json";
  const elements = {
    mount: document.querySelector("#poi-map"),
    status: document.querySelector("#poi-status"),
    reset: document.querySelector("#poi-reset"),
    caption: document.querySelector("#poi-caption"),
    search: document.querySelector("#poi-search"),
    toggles: [...document.querySelectorAll('.example-poi-toggles input[type="checkbox"]')],
    summary: document.querySelector("#poi-results-summary"),
    results: document.querySelector("#poi-results"),
    selection: document.querySelector("#poi-selection"),
    selectionMeta: document.querySelector("#poi-selection-meta"),
    source: document.querySelector("#poi-source"),
  };

  let dataset = null;
  let markerElements = new Map();
  let selectedId = null;

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function rawMercator(longitude, latitude) {
    const limitedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
    return [
      (longitude * Math.PI) / 180,
      -Math.log(Math.tan(Math.PI / 4 + ((limitedLatitude * Math.PI) / 180) / 2)),
    ];
  }

  function createProjector(configuration) {
    const [west, south, east, north] = configuration.geographicBounds;
    const [, , width, height] = configuration.viewBox;
    const padding = configuration.padding;
    const [minimumX, maximumY] = rawMercator(west, south);
    const [maximumX, minimumY] = rawMercator(east, north);
    const contentWidth = maximumX - minimumX;
    const contentHeight = maximumY - minimumY;
    const scale = Math.min(
      (width - padding * 2) / contentWidth,
      (height - padding * 2) / contentHeight,
    );
    const offsetX = (width - contentWidth * scale) / 2;
    const offsetY = (height - contentHeight * scale) / 2;
    return (longitude, latitude) => {
      const [x, y] = rawMercator(longitude, latitude);
      return [offsetX + (x - minimumX) * scale, offsetY + (y - minimumY) * scale];
    };
  }

  function appendSymbol(group, category) {
    const hitArea = svgElement("circle", { r: "18", class: "example-poi-hit" });
    group.append(hitArea);
    if (category === "reservoir") {
      group.append(svgElement("circle", { r: "9", class: "example-poi-symbol" }));
      group.append(
        svgElement("path", {
          d: "M-5 -1C-2 -4 1 2 5 -1M-5 3C-2 0 1 6 5 3",
          class: "example-poi-glyph",
        }),
      );
      return;
    }
    if (category === "sanctuary") {
      group.append(
        svgElement("path", {
          d: "M0 -11L10 7L0 11L-10 7Z",
          class: "example-poi-symbol",
        }),
      );
      group.append(
        svgElement("path", {
          d: "M0 -5V6M0 -1L-4 -4M0 2L4 -1",
          class: "example-poi-glyph",
        }),
      );
      return;
    }
    group.append(
      svgElement("rect", {
        x: "-9",
        y: "-9",
        width: "18",
        height: "18",
        rx: "3",
        class: "example-poi-symbol",
      }),
    );
    group.append(
      svgElement("path", {
        d: "M-4 -4H4V3H-4ZM-3 6L-5 9M3 6L5 9",
        class: "example-poi-glyph",
      }),
    );
  }

  function describe(marker) {
    elements.selection.textContent = marker.name;
    elements.selectionMeta.textContent = `${marker.categoryLabel} in ${marker.state}. ${marker.latitude.toFixed(
      4,
    )}, ${marker.longitude.toFixed(4)}. ${marker.description}`;
    elements.source.href = marker.sourceUrl;
    elements.source.textContent = "Open coordinate source";
    elements.caption.textContent = `${marker.name} selected in the ${marker.categoryLabel.toLocaleLowerCase()} layer.`;
  }

  function clearSelection() {
    selectedId = null;
    markerElements.forEach((element) => element.classList.remove("is-active"));
    elements.selection.textContent = "Nothing selected";
    elements.selectionMeta.textContent = "Choose a marker to inspect its category and coordinates.";
    elements.source.href = dataset.source.url;
    elements.source.textContent = "Dataset license";
  }

  function selectMarker(marker) {
    selectedId = marker.id;
    markerElements.forEach((element, id) => element.classList.toggle("is-active", id === marker.id));
    describe(marker);
    renderResults();
  }

  function createMarker(marker, project) {
    const [x, y] = project(marker.longitude, marker.latitude);
    const group = svgElement("g", {
      class: `example-poi-marker is-${marker.category}`,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${marker.name}, ${marker.categoryLabel}, ${marker.state}`,
    });
    group.dataset.markerId = marker.id;
    group.dataset.longitude = marker.longitude;
    group.dataset.latitude = marker.latitude;
    appendSymbol(group, marker.category);
    group.addEventListener("click", () => selectMarker(marker));
    group.addEventListener("focus", () => {
      elements.caption.textContent = `${marker.name}: ${marker.categoryLabel}, ${marker.state}.`;
    });
    group.addEventListener("pointerenter", () => {
      elements.caption.textContent = `${marker.name}: ${marker.categoryLabel}, ${marker.state}.`;
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectMarker(marker);
      }
    });
    return group;
  }

  function visibleMarkers() {
    const categories = new Set(elements.toggles.filter((input) => input.checked).map((input) => input.value));
    const query = elements.search.value.trim().toLocaleLowerCase();
    return dataset.markers.filter((marker) => {
      if (!categories.has(marker.category)) return false;
      if (!query) return true;
      return [marker.name, marker.state, marker.categoryLabel]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
  }

  function resultItem(marker) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const state = document.createElement("small");
    button.type = "button";
    button.classList.toggle("is-active", marker.id === selectedId);
    button.setAttribute("aria-pressed", String(marker.id === selectedId));
    label.textContent = marker.name;
    state.textContent = marker.state;
    button.append(label, state);
    button.addEventListener("click", () => selectMarker(marker));
    item.append(button);
    return item;
  }

  function renderResults() {
    const visible = visibleMarkers();
    const visibleIds = new Set(visible.map((marker) => marker.id));
    markerElements.forEach((element, id) => {
      element.classList.toggle("is-hidden", !visibleIds.has(id));
    });
    if (selectedId && !visibleIds.has(selectedId)) clearSelection();

    const shown = visible.slice(0, 8);
    elements.results.replaceChildren(...shown.map(resultItem));
    const remaining = Math.max(0, visible.length - shown.length);
    elements.summary.textContent = `${visible.length} of ${dataset.markers.length} places visible${
      remaining ? `; narrow the search to list the remaining ${remaining}` : ""
    }.`;
    elements.status.textContent = `${visible.length} POI markers across ${
      elements.toggles.filter((input) => input.checked).length
    } active layers`;
  }

  async function initialize() {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`POI dataset request failed (${response.status}).`);
    dataset = await response.json();
    const map = new IndiaMapEngine({
      mount: elements.mount,
      src: "../assets/maps/india-states.svg",
      featureSelector: ".map-region",
      featureKey: "slug",
      interactive: false,
    });
    await map.load();
    map.getFeatures().forEach((feature) => {
      feature.element.removeAttribute("tabindex");
      feature.element.removeAttribute("aria-label");
      feature.element.setAttribute("role", "presentation");
    });

    const project = createProjector(dataset.projection);
    const layer = svgElement("g", { class: "example-poi-layer", "aria-label": "POI markers" });
    dataset.markers.forEach((marker) => {
      const markerElement = createMarker(marker, project);
      markerElements.set(marker.id, markerElement);
      layer.append(markerElement);
    });
    map.svg.append(layer);
    renderResults();
  }

  elements.toggles.forEach((input) => input.addEventListener("change", renderResults));
  elements.search.addEventListener("input", renderResults);
  elements.reset.addEventListener("click", () => {
    elements.toggles.forEach((input) => {
      input.checked = true;
    });
    elements.search.value = "";
    clearSelection();
    renderResults();
    elements.search.focus();
  });

  initialize().catch((error) => {
    elements.status.textContent = "The POI example could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  });
})();
