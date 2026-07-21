(function () {
  "use strict";

  const DATA_URL = "../sample-data/india-poi-layers-demo.json";
  const EARTH_RADIUS_KM = 6371.0088;
  const DEFAULT_ORIGIN_ID = "new-delhi-station";
  const { loadPresentationMap, svgElement } = window.ExampleMapUtils;
  const elements = {
    mount: document.querySelector("#nearby-map"),
    status: document.querySelector("#nearby-status"),
    caption: document.querySelector("#nearby-caption"),
    origin: document.querySelector("#nearby-origin"),
    latitude: document.querySelector("#nearby-latitude"),
    longitude: document.querySelector("#nearby-longitude"),
    useCoordinates: document.querySelector("#nearby-use-coordinates"),
    radius: document.querySelector("#nearby-radius"),
    category: document.querySelector("#nearby-category"),
    summary: document.querySelector("#nearby-summary"),
    results: document.querySelector("#nearby-results"),
    empty: document.querySelector("#nearby-empty"),
    detail: document.querySelector("#nearby-detail"),
    selection: document.querySelector("#nearby-selection"),
    selectionMeta: document.querySelector("#nearby-selection-meta"),
    source: document.querySelector("#nearby-source"),
  };

  let dataset = null;
  let map = null;
  let projection = null;
  let radiusPath = null;
  let originMarker = null;
  let markerElements = new Map();
  let selectedId = null;
  let origin = null;

  function radians(value) {
    return (value * Math.PI) / 180;
  }

  function haversineDistance(left, right) {
    const latitudeDelta = radians(right.latitude - left.latitude);
    const longitudeDelta = radians(right.longitude - left.longitude);
    const leftLatitude = radians(left.latitude);
    const rightLatitude = radians(right.latitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function createProjection(configuration) {
    const [west, south, east, north] = configuration.geographicBounds;
    const [, , width, height] = configuration.viewBox;
    const padding = configuration.padding;
    const rawProjection = window.d3.geoMercator().scale(1).translate([0, 0]);
    const southWest = rawProjection([west, south]);
    const northEast = rawProjection([east, north]);
    const contentWidth = northEast[0] - southWest[0];
    const contentHeight = southWest[1] - northEast[1];
    const scale = Math.min(
      (width - padding * 2) / contentWidth,
      (height - padding * 2) / contentHeight,
    );
    const offsetX = (width - contentWidth * scale) / 2;
    const offsetY = (height - contentHeight * scale) / 2;
    return window.d3
      .geoMercator()
      .scale(scale)
      .translate([offsetX - southWest[0] * scale, offsetY - northEast[1] * scale]);
  }

  function appendSymbol(group, category) {
    group.append(svgElement("circle", { r: "18", class: "example-poi-hit" }));
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

  function createMarker(marker) {
    const [x, y] = projection([marker.longitude, marker.latitude]);
    const group = svgElement("g", {
      class: `example-poi-marker example-nearby-place is-${marker.category}`,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${marker.name}, ${marker.categoryLabel}, ${marker.state}`,
    });
    group.dataset.markerId = marker.id;
    appendSymbol(group, marker.category);
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      selectResult(marker);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectResult(marker);
      }
    });
    return group;
  }

  function createOriginMarker() {
    const group = svgElement("g", {
      class: "example-nearby-origin",
      role: "img",
      "aria-label": "Current radius-search origin",
    });
    group.append(svgElement("circle", { r: "14" }));
    group.append(svgElement("path", { d: "M-7 0H7M0 -7V7" }));
    group.addEventListener("click", (event) => event.stopPropagation());
    return group;
  }

  function currentRadius() {
    return Number(elements.radius.value);
  }

  function visibleCategory(marker) {
    return elements.category.value === "all" || marker.category === elements.category.value;
  }

  function nearbyPlaces() {
    return dataset.markers
      .filter((marker) => visibleCategory(marker) && marker.id !== origin.markerId)
      .map((marker) => ({ marker, distance: haversineDistance(origin, marker) }))
      .filter((entry) => entry.distance <= currentRadius())
      .sort((left, right) => left.distance - right.distance);
  }

  function distanceLabel(distance) {
    return distance < 10 ? `${distance.toFixed(1)} km` : `${Math.round(distance)} km`;
  }

  function setSelectedMarkerState() {
    markerElements.forEach((element, id) => {
      element.classList.toggle("is-active", id === selectedId);
    });
  }

  function selectResult(marker) {
    const distance = haversineDistance(origin, marker);
    selectedId = marker.id;
    setSelectedMarkerState();
    elements.detail.hidden = false;
    elements.selection.textContent = marker.name;
    elements.selectionMeta.textContent = `${distanceLabel(distance)} from ${origin.label}. ${marker.categoryLabel} in ${marker.state}.`;
    elements.source.href = marker.sourceUrl;
    renderResults();
    elements.caption.textContent = `${marker.name} is ${distanceLabel(distance)} from the current search origin.`;
  }

  function createResultItem(entry) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const distance = document.createElement("small");
    button.type = "button";
    button.classList.toggle("is-active", entry.marker.id === selectedId);
    button.setAttribute("aria-pressed", String(entry.marker.id === selectedId));
    label.textContent = entry.marker.name;
    distance.textContent = distanceLabel(entry.distance);
    button.append(label, distance);
    button.addEventListener("click", () => selectResult(entry.marker));
    item.append(button);
    return item;
  }

  function updateRadiusGeometry() {
    const circle = window.d3
      .geoCircle()
      .center([origin.longitude, origin.latitude])
      .radius(currentRadius() / 111.195)
      .precision(2)();
    radiusPath.setAttribute("d", window.d3.geoPath(projection)(circle));
    const [x, y] = projection([origin.longitude, origin.latitude]);
    originMarker.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  }

  function renderResults() {
    if (!origin || !dataset) return;
    updateRadiusGeometry();
    const nearby = nearbyPlaces();
    const nearbyIds = new Set(nearby.map((entry) => entry.marker.id));
    markerElements.forEach((element, id) => {
      const marker = dataset.markers.find((item) => item.id === id);
      const categoryVisible = visibleCategory(marker);
      const isNearby = nearbyIds.has(id);
      element.classList.toggle("is-hidden", !categoryVisible);
      element.classList.toggle("is-nearby", isNearby);
      element.classList.toggle("is-outside", categoryVisible && !isNearby);
      element.classList.toggle("is-origin-place", id === origin.markerId);
      element.setAttribute("tabindex", isNearby ? "0" : "-1");
      element.setAttribute("aria-disabled", String(!isNearby));
    });
    if (selectedId && !nearbyIds.has(selectedId)) {
      selectedId = null;
      elements.detail.hidden = true;
      setSelectedMarkerState();
    }
    elements.results.replaceChildren(...nearby.slice(0, 8).map(createResultItem));
    elements.empty.hidden = nearby.length > 0;
    elements.summary.textContent = `${nearby.length} ${nearby.length === 1 ? "place" : "places"} within ${currentRadius().toLocaleString()} km of ${origin.label}.${nearby.length > 8 ? " Showing the closest 8." : ""}`;
    elements.status.textContent = `${nearby.length} nearby places from ${dataset.markers.length} sample points`;
    elements.caption.textContent = `${origin.label}: ${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)} with a ${currentRadius().toLocaleString()} km radius.`;
  }

  function setOrigin(nextOrigin, selectValue = "custom") {
    origin = nextOrigin;
    elements.origin.value = selectValue;
    elements.latitude.value = nextOrigin.latitude.toFixed(4);
    elements.longitude.value = nextOrigin.longitude.toFixed(4);
    selectedId = null;
    elements.detail.hidden = true;
    setSelectedMarkerState();
    renderResults();
  }

  function useEnteredCoordinates() {
    const latitude = Number(elements.latitude.value);
    const longitude = Number(elements.longitude.value);
    if (!elements.latitude.reportValidity() || !elements.longitude.reportValidity()) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setOrigin({ latitude, longitude, label: "Custom coordinates", markerId: null });
  }

  function mapPoint(event) {
    const point = map.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(map.svg.getScreenCTM().inverse());
  }

  function useMapClick(event) {
    const point = mapPoint(event);
    const coordinates = projection.invert([point.x, point.y]);
    if (!coordinates) return;
    const [longitude, latitude] = coordinates;
    if (longitude < 68 || longitude > 98 || latitude < 6 || latitude > 38) return;
    setOrigin({ latitude, longitude, label: "Dropped map point", markerId: null });
  }

  async function initialize() {
    if (!window.d3?.geoMercator) throw new Error("The geographic projection library could not load.");
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`POI dataset request failed (${response.status}).`);
    dataset = await response.json();
    map = await loadPresentationMap(elements.mount);
    projection = createProjection(dataset.projection);

    elements.origin.append(
      ...dataset.markers
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((marker) => new Option(`${marker.name} · ${marker.state}`, marker.id)),
    );

    const overlay = svgElement("g", { class: "example-nearby-overlay" });
    radiusPath = svgElement("path", { class: "example-nearby-radius" });
    const markerLayer = svgElement("g", { class: "example-poi-layer" });
    dataset.markers.forEach((marker) => {
      const markerElement = createMarker(marker);
      markerElements.set(marker.id, markerElement);
      markerLayer.append(markerElement);
    });
    originMarker = createOriginMarker();
    overlay.append(radiusPath, markerLayer, originMarker);
    map.svg.append(overlay);
    map.svg.addEventListener("click", useMapClick);

    const defaultMarker = dataset.markers.find((marker) => marker.id === DEFAULT_ORIGIN_ID);
    setOrigin(
      {
        latitude: defaultMarker.latitude,
        longitude: defaultMarker.longitude,
        label: defaultMarker.name,
        markerId: defaultMarker.id,
      },
      defaultMarker.id,
    );
  }

  elements.origin.addEventListener("change", () => {
    if (elements.origin.value === "custom") {
      setOrigin({
        latitude: Number(elements.latitude.value),
        longitude: Number(elements.longitude.value),
        label: "Custom coordinates",
        markerId: null,
      });
      return;
    }
    const marker = dataset.markers.find((item) => item.id === elements.origin.value);
    if (!marker) return;
    setOrigin(
      {
        latitude: marker.latitude,
        longitude: marker.longitude,
        label: marker.name,
        markerId: marker.id,
      },
      marker.id,
    );
  });
  elements.useCoordinates.addEventListener("click", useEnteredCoordinates);
  elements.radius.addEventListener("change", renderResults);
  elements.category.addEventListener("change", renderResults);

  initialize().catch((error) => {
    elements.status.textContent = "The nearby-places example could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  });
})();
