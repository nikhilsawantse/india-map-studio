(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const XLINK_NS = "http://www.w3.org/1999/xlink";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_REGIONS = 2000;
  const SHAPE_SELECTOR = "path,polygon,rect,circle,ellipse";
  const EXCLUDED_CONTAINER_SELECTOR =
    "defs,clipPath,mask,pattern,symbol,marker";
  const EXPLICIT_REGION_SELECTOR = [
    "[data-region]",
    "[data-name]",
    "[data-district]",
    "[data-feature-id]",
    ".region",
    ".district-region",
    ".map-region",
  ].join(",");

  const elements = {
    file: document.querySelector("#custom-map-file"),
    status: document.querySelector("#custom-import-status"),
    summary: document.querySelector("#custom-map-summary"),
    sourceName: document.querySelector("#custom-source-name"),
    sourceFormat: document.querySelector("#custom-source-format"),
    regionCount: document.querySelector("#custom-region-count"),
    geojsonField: document.querySelector("#geojson-name-property-field"),
    geojsonProperty: document.querySelector("#geojson-name-property"),
    editor: document.querySelector("#custom-region-editor"),
    selectedName: document.querySelector("#custom-selected-name"),
    regionName: document.querySelector("#custom-region-name"),
    regionIdentifier: document.querySelector("#custom-region-identifier"),
    saveName: document.querySelector("#save-custom-region-name"),
    searchField: document.querySelector("#custom-region-search-field"),
    search: document.querySelector("#custom-region-search"),
    listSummary: document.querySelector("#custom-region-list-summary"),
    visibleCount: document.querySelector("#custom-visible-count"),
    clearSelection: document.querySelector("#clear-custom-selection"),
    list: document.querySelector("#custom-region-list"),
    download: document.querySelector("#download-identified-svg"),
    previewStatus: document.querySelector("#custom-preview-status"),
    canvas: document.querySelector("#custom-map-canvas"),
    empty: document.querySelector("#custom-map-empty"),
    tooltip: document.querySelector("#custom-map-tooltip"),
    tooltipName: document.querySelector("#custom-tooltip-name"),
    tooltipId: document.querySelector("#custom-tooltip-id"),
  };

  let regions = [];
  let selectedRegionId = "";
  let currentSvg = null;
  let sourceFileName = "";
  let sourceFormat = "";
  let geojsonFeatures = [];
  let nameProperty = "";
  let d3GeoPromise = null;

  function setStatus(message, state = "ready") {
    elements.status.textContent = message;
    elements.status.dataset.state = state;
  }

  function setPreviewStatus(message) {
    elements.previewStatus.textContent = message;
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70);
  }

  function humanize(value) {
    return String(value || "")
      .replace(/^custom[-_: ]*/i, "")
      .replace(/^(district|region|state|feature)[-_: ]*/i, "")
      .replace(/[-_.:]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function cleanRegionName(value, fallback) {
    const cleaned = String(value || "")
      .replace(/^\s*(select|open|view)\s+/i, "")
      .replace(/\s+(district|region)\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    return cleaned || fallback;
  }

  function makeRegionId(index) {
    return `CUSTOM-REGION-${String(index + 1).padStart(3, "0")}`;
  }

  function isScalar(value) {
    return (
      value === null ||
      ["string", "number", "boolean"].includes(typeof value)
    );
  }

  function getScalarProperty(properties, key) {
    if (!key || !properties || !isScalar(properties[key])) {
      return "";
    }
    return String(properties[key] ?? "").trim();
  }

  function resetWorkspace() {
    hideTooltip();
    regions = [];
    selectedRegionId = "";
    currentSvg = null;
    sourceFileName = "";
    sourceFormat = "";
    geojsonFeatures = [];
    nameProperty = "";

    elements.canvas.replaceChildren(elements.empty);
    elements.empty.hidden = false;
    elements.summary.hidden = true;
    elements.geojsonField.hidden = true;
    elements.editor.hidden = true;
    elements.searchField.hidden = true;
    elements.listSummary.hidden = true;
    elements.list.replaceChildren();
    elements.search.value = "";
    elements.download.disabled = true;
    setPreviewStatus("Waiting for a map file");
  }

  function showLoadedWorkspace() {
    elements.empty.hidden = true;
    elements.summary.hidden = false;
    elements.searchField.hidden = false;
    elements.listSummary.hidden = false;
    elements.download.disabled = false;
    elements.sourceName.textContent = sourceFileName;
    elements.sourceFormat.textContent = sourceFormat;
    elements.regionCount.textContent = String(regions.length);
    setPreviewStatus(`${regions.length} interactive regions detected`);
  }

  function prefixSvgIds(svg) {
    const idMap = new Map();
    Array.from(svg.querySelectorAll("[id]")).forEach((node, index) => {
      const oldId = node.id;
      if (!oldId) {
        return;
      }
      const prefix = slugify(oldId) || `element-${index + 1}`;
      const newId = `imported-${index + 1}-${prefix}`;
      node.dataset.sourceId = oldId;
      node.id = newId;
      idMap.set(oldId, newId);
    });

    if (!idMap.size) {
      return;
    }

    const referenceAttributes = new Set([
      "href",
      "xlink:href",
      "fill",
      "stroke",
      "clip-path",
      "mask",
      "filter",
      "marker-start",
      "marker-mid",
      "marker-end",
      "aria-labelledby",
      "aria-describedby",
      "style",
    ]);

    Array.from(svg.querySelectorAll("*")).forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        if (!referenceAttributes.has(attribute.name)) {
          return;
        }
        let value = attribute.value;
        idMap.forEach((newId, oldId) => {
          value = value
            .replaceAll(`url(#${oldId})`, `url(#${newId})`)
            .replaceAll(`#${oldId}`, `#${newId}`);
          if (attribute.name === "aria-labelledby" ||
              attribute.name === "aria-describedby") {
            value = value
              .split(/\s+/)
              .map((token) => (token === oldId ? newId : token))
              .join(" ");
          }
        });
        node.setAttribute(attribute.name, value);
      });
    });
  }

  function sanitizeSvg(svg) {
    const fallbackWidth = Number.parseFloat(svg.getAttribute("width")) || 1000;
    const fallbackHeight = Number.parseFloat(svg.getAttribute("height")) || 700;

    svg
      .querySelectorAll(
        "script,foreignObject,iframe,object,embed,image,audio,video,style,animate,animateMotion,animateTransform,set"
      )
      .forEach((node) => node.remove());

    svg.querySelectorAll("a").forEach((anchor) => {
      anchor.replaceWith(...Array.from(anchor.childNodes));
    });

    Array.from(svg.querySelectorAll("*")).forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();
        if (
          name.startsWith("on") ||
          name === "src" ||
          /expression\s*\(/i.test(value) ||
          /url\s*\(\s*['"]?(?!#)/i.test(value)
        ) {
          node.removeAttribute(attribute.name);
          return;
        }
        if (
          (name === "href" || name === "xlink:href") &&
          value &&
          !value.startsWith("#")
        ) {
          node.removeAttribute(attribute.name);
        }
      });
    });

    svg.removeAttribute("onload");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");

    if (!svg.hasAttribute("viewBox")) {
      svg.setAttribute("viewBox", `0 0 ${fallbackWidth} ${fallbackHeight}`);
    }

    prefixSvgIds(svg);
  }

  function getSvgRegionCandidates(svg) {
    const isUsable = (node) =>
      !node.closest(EXCLUDED_CONTAINER_SELECTOR) &&
      (node.matches(SHAPE_SELECTOR) || Boolean(node.querySelector(SHAPE_SELECTOR)));

    const explicit = Array.from(
      svg.querySelectorAll(EXPLICIT_REGION_SELECTOR)
    ).filter(isUsable);
    if (explicit.length) {
      const explicitSet = new Set(explicit);
      return explicit.filter(
        (candidate) =>
          !Array.from(candidate.querySelectorAll(EXPLICIT_REGION_SELECTOR)).some(
            (descendant) => explicitSet.has(descendant)
          )
      );
    }

    const groups = Array.from(svg.querySelectorAll("g")).filter((group) => {
      if (group.closest(EXCLUDED_CONTAINER_SELECTOR)) {
        return false;
      }
      const hasSourceIdentity =
        group.hasAttribute("data-source-id") ||
        group.hasAttribute("aria-label") ||
        group.hasAttribute("data-name");
      const directShapes = Array.from(group.children).some((child) =>
        child.matches(SHAPE_SELECTOR)
      );
      const nestedIdentifiedGroup = Array.from(group.children).some(
        (child) =>
          child.matches("g") &&
          (child.hasAttribute("data-source-id") ||
            child.hasAttribute("data-name")) &&
          Boolean(child.querySelector(SHAPE_SELECTOR))
      );
      return hasSourceIdentity && directShapes && !nestedIdentifiedGroup;
    });
    if (groups.length) {
      return groups;
    }

    const identifiedShapes = Array.from(
      svg.querySelectorAll(SHAPE_SELECTOR)
    ).filter(
      (shape) =>
        !shape.closest(EXCLUDED_CONTAINER_SELECTOR) &&
        (shape.hasAttribute("data-source-id") ||
          shape.hasAttribute("data-name") ||
          shape.hasAttribute("aria-label"))
    );
    if (identifiedShapes.length) {
      return identifiedShapes;
    }

    return Array.from(svg.querySelectorAll(SHAPE_SELECTOR)).filter(
      (shape) => !shape.closest(EXCLUDED_CONTAINER_SELECTOR)
    );
  }

  function svgCandidateName(candidate, index) {
    const fallback = `Region ${index + 1}`;
    const title = candidate.querySelector(":scope > title")?.textContent;
    const sourceId = candidate.dataset.sourceId || "";
    const rawName =
      candidate.dataset.name ||
      candidate.dataset.region ||
      candidate.dataset.district ||
      candidate.dataset.label ||
      candidate.getAttribute("aria-label") ||
      title ||
      sourceId;
    return cleanRegionName(humanize(rawName), fallback);
  }

  function assignRegionIdentity(element, region) {
    element.classList.add("custom-region");
    element.classList.remove("is-selected");
    element.id = `custom-region-${String(region.index + 1).padStart(3, "0")}`;
    element.dataset.regionId = region.id;
    element.dataset.regionName = region.name;
    element.dataset.sourceId = region.sourceId || "";
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute(
      "aria-label",
      `Select ${region.name}, identifier ${region.id}`
    );
  }

  function parseSvgText(text) {
    const documentNode = new DOMParser().parseFromString(
      text,
      "image/svg+xml"
    );
    if (documentNode.querySelector("parsererror")) {
      throw new Error("The SVG file could not be parsed.");
    }
    const svg = documentNode.documentElement;
    if (svg.localName.toLowerCase() !== "svg") {
      throw new Error("The selected file does not contain an SVG root.");
    }

    sanitizeSvg(svg);
    const candidates = getSvgRegionCandidates(svg);
    if (!candidates.length) {
      throw new Error(
        "No path, polygon, rectangle, circle, or ellipse regions were found."
      );
    }
    if (candidates.length > MAX_REGIONS) {
      throw new Error(
        `This map contains more than ${MAX_REGIONS.toLocaleString()} detected regions.`
      );
    }

    regions = candidates.map((element, index) => {
      const sourceId =
        element.dataset.featureId ||
        element.dataset.sourceId ||
        element.dataset.slug ||
        "";
      const region = {
        id: makeRegionId(index),
        index,
        name: svgCandidateName(element, index),
        sourceId,
        element,
        properties: null,
        manuallyNamed: false,
      };
      assignRegionIdentity(element, region);
      return region;
    });

    return document.importNode(svg, true);
  }

  function normalizeGeoJson(data) {
    if (data?.type === "FeatureCollection" && Array.isArray(data.features)) {
      return data.features;
    }
    if (data?.type === "Feature") {
      return [data];
    }
    if (Array.isArray(data)) {
      return data;
    }
    throw new Error("Expected a GeoJSON FeatureCollection or Feature.");
  }

  function listGeoJsonProperties(features) {
    const keys = new Set();
    features.forEach((feature) => {
      Object.entries(feature.properties || {}).forEach(([key, value]) => {
        if (isScalar(value)) {
          keys.add(key);
        }
      });
    });
    return Array.from(keys).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function preferredGeoJsonProperty(keys) {
    const preferences = [
      "name",
      "district",
      "state",
      "region",
      "title",
      "label",
      "name_1",
      "name_2",
      "shapeName",
    ];
    for (const preferred of preferences) {
      const match = keys.find(
        (key) => key.toLowerCase() === preferred.toLowerCase()
      );
      if (match) {
        return match;
      }
    }
    return keys[0] || "";
  }

  function populateGeoJsonPropertySelect(keys) {
    elements.geojsonProperty.replaceChildren();
    const fallbackOption = document.createElement("option");
    fallbackOption.value = "";
    fallbackOption.textContent = "Generated region names";
    elements.geojsonProperty.append(fallbackOption);
    keys.forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      elements.geojsonProperty.append(option);
    });
    nameProperty = preferredGeoJsonProperty(keys);
    elements.geojsonProperty.value = nameProperty;
    elements.geojsonField.hidden = false;
  }

  function walkCoordinates(value, visit) {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      Number.isFinite(value[0]) &&
      Number.isFinite(value[1])
    ) {
      visit(value[0], value[1]);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((child) => walkCoordinates(child, visit));
    }
  }

  function hasLongitudeLatitudeCoordinates(features) {
    let coordinateCount = 0;
    let isLonLat = true;
    features.forEach((feature) => {
      walkCoordinates(feature.geometry?.coordinates, (x, y) => {
        coordinateCount += 1;
        if (Math.abs(x) > 180 || Math.abs(y) > 90) {
          isLonLat = false;
        }
      });
    });
    return coordinateCount > 0 && isLonLat;
  }

  function loadD3Geo() {
    if (!d3GeoPromise) {
      d3GeoPromise = import(
        "https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm"
      );
    }
    return d3GeoPromise;
  }

  function geoJsonRegionName(feature, index) {
    const fallback = `Region ${index + 1}`;
    return cleanRegionName(
      getScalarProperty(feature.properties, nameProperty),
      fallback
    );
  }

  async function buildGeoJsonSvg(features) {
    let d3;
    try {
      d3 = await loadD3Geo();
    } catch {
      throw new Error(
        "The GeoJSON renderer could not load. Check your internet connection and try again."
      );
    }

    const featureCollection = {
      type: "FeatureCollection",
      features,
    };
    const projection = hasLongitudeLatitudeCoordinates(features)
      ? d3.geoMercator()
      : d3.geoIdentity().reflectY(true);
    projection.fitExtent(
      [
        [32, 32],
        [968, 768],
      ],
      featureCollection
    );
    const path = d3.geoPath(projection);

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("viewBox", "0 0 1000 800");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${sourceFileName} identified map`;
    const description = document.createElementNS(SVG_NS, "desc");
    description.textContent = `Custom map with ${features.length} interactive regions.`;
    const layer = document.createElementNS(SVG_NS, "g");
    layer.id = "custom-region-layer";
    layer.dataset.layerId = "CUSTOM-REGIONS";

    regions = features.map((feature, index) => {
      const element = document.createElementNS(SVG_NS, "path");
      const pathData = path(feature);
      if (!pathData) {
        throw new Error(`Region ${index + 1} has invalid polygon geometry.`);
      }
      element.setAttribute("d", pathData);
      element.setAttribute("vector-effect", "non-scaling-stroke");
      layer.append(element);

      const sourceId =
        String(feature.id ?? "").trim() ||
        getScalarProperty(feature.properties, nameProperty);
      const region = {
        id: makeRegionId(index),
        index,
        name: geoJsonRegionName(feature, index),
        sourceId,
        element,
        properties: feature.properties || {},
        manuallyNamed: false,
      };
      assignRegionIdentity(element, region);
      return region;
    });

    svg.append(title, description, layer);
    return svg;
  }

  async function parseGeoJsonText(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("The GeoJSON file is not valid JSON.");
    }
    const features = normalizeGeoJson(data).filter((feature) =>
      ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type)
    );
    if (!features.length) {
      throw new Error(
        "No Polygon or MultiPolygon features were found in this GeoJSON file."
      );
    }
    if (features.length > MAX_REGIONS) {
      throw new Error(
        `This file contains more than ${MAX_REGIONS.toLocaleString()} polygon features.`
      );
    }
    geojsonFeatures = features;
    populateGeoJsonPropertySelect(listGeoJsonProperties(features));
    return buildGeoJsonSvg(features);
  }

  function findRegion(id) {
    return regions.find((region) => region.id === id) || null;
  }

  function positionTooltip(clientX, clientY) {
    const padding = 14;
    const rect = elements.tooltip.getBoundingClientRect();
    let left = clientX + 14;
    let top = clientY + 14;
    if (left + rect.width + padding > window.innerWidth) {
      left = clientX - rect.width - 14;
    }
    if (top + rect.height + padding > window.innerHeight) {
      top = clientY - rect.height - 14;
    }
    elements.tooltip.style.left = `${Math.max(padding, left)}px`;
    elements.tooltip.style.top = `${Math.max(padding, top)}px`;
  }

  function showTooltip(region, clientX, clientY) {
    elements.tooltipName.textContent = region.name;
    elements.tooltipId.textContent = region.id;
    elements.tooltip.hidden = false;
    positionTooltip(clientX, clientY);
  }

  function hideTooltip() {
    elements.tooltip.hidden = true;
  }

  function wireRegionInteractions() {
    regions.forEach((region) => {
      const element = currentSvg.querySelector(
        `[data-region-id="${region.id}"]`
      );
      region.element = element;
      element.addEventListener("pointerenter", (event) => {
        showTooltip(region, event.clientX, event.clientY);
      });
      element.addEventListener("pointermove", (event) => {
        positionTooltip(event.clientX, event.clientY);
      });
      element.addEventListener("pointerleave", hideTooltip);
      element.addEventListener("focus", () => {
        const rect = element.getBoundingClientRect();
        showTooltip(
          region,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
      });
      element.addEventListener("blur", hideTooltip);
      element.addEventListener("click", () => selectRegion(region.id));
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRegion(region.id);
        }
      });
    });
  }

  function renderRegionList() {
    const query = elements.search.value.trim().toLowerCase();
    const visibleRegions = regions.filter((region) =>
      [region.name, region.id, region.sourceId]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    const fragment = document.createDocumentFragment();
    visibleRegions.forEach((region) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "custom-region-list-button";
      button.classList.toggle("is-active", region.id === selectedRegionId);
      button.dataset.regionId = region.id;

      const name = document.createElement("strong");
      name.textContent = region.name;
      const source = document.createElement("small");
      source.textContent = region.sourceId
        ? `Source: ${region.sourceId}`
        : "No source identifier";
      const identifier = document.createElement("code");
      identifier.textContent = region.id;
      button.append(name, source, identifier);
      button.addEventListener("click", () => selectRegion(region.id, true));
      fragment.append(button);
    });
    elements.list.replaceChildren(fragment);
    elements.visibleCount.textContent = `${visibleRegions.length} ${
      visibleRegions.length === 1 ? "region" : "regions"
    }`;
  }

  function updateEditor(region) {
    if (!region) {
      elements.editor.hidden = true;
      return;
    }
    elements.editor.hidden = false;
    elements.selectedName.textContent = region.name;
    elements.regionName.value = region.name;
    elements.regionIdentifier.textContent = region.id;
  }

  function selectRegion(id, focusMap = false) {
    selectedRegionId = id;
    regions.forEach((region) => {
      region.element.classList.toggle("is-selected", region.id === id);
    });
    const region = findRegion(id);
    updateEditor(region);
    renderRegionList();
    if (region && focusMap) {
      region.element.focus({ preventScroll: true });
    }
  }

  function clearSelection() {
    selectedRegionId = "";
    regions.forEach((region) => region.element.classList.remove("is-selected"));
    updateEditor(null);
    renderRegionList();
    hideTooltip();
  }

  function saveSelectedRegionName() {
    const region = findRegion(selectedRegionId);
    if (!region) {
      return;
    }
    const name = cleanRegionName(elements.regionName.value, "");
    if (!name) {
      setStatus("Enter a region name before saving.", "error");
      elements.regionName.focus();
      return;
    }
    region.name = name;
    region.manuallyNamed = true;
    region.element.dataset.regionName = name;
    region.element.setAttribute(
      "aria-label",
      `Select ${name}, identifier ${region.id}`
    );
    updateEditor(region);
    renderRegionList();
    setStatus(`${region.id} is now named ${name}.`);
  }

  function applyGeoJsonNameProperty() {
    nameProperty = elements.geojsonProperty.value;
    regions.forEach((region, index) => {
      if (region.manuallyNamed) {
        return;
      }
      region.name = geoJsonRegionName(geojsonFeatures[index], index);
      region.element.dataset.regionName = region.name;
      region.element.setAttribute(
        "aria-label",
        `Select ${region.name}, identifier ${region.id}`
      );
    });
    updateEditor(findRegion(selectedRegionId));
    renderRegionList();
    setStatus(
      nameProperty
        ? `Region names now use the “${nameProperty}” property.`
        : "Generated region names are now in use."
    );
  }

  function installSvg(svg) {
    elements.canvas.replaceChildren(svg);
    currentSvg = svg;
    wireRegionInteractions();
    showLoadedWorkspace();
    renderRegionList();
  }

  function detectFileFormat(file, text) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const trimmed = text.trimStart();
    if (
      extension === "svg" ||
      file.type === "image/svg+xml" ||
      /^<svg[\s>]/i.test(trimmed) ||
      /^<\?xml[\s\S]*?<svg[\s>]/i.test(trimmed)
    ) {
      return "SVG";
    }
    if (
      extension === "json" ||
      extension === "geojson" ||
      file.type.includes("json") ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("[")
    ) {
      return "GeoJSON";
    }
    throw new Error("Choose an SVG, JSON, or GeoJSON file.");
  }

  async function handleFile(file) {
    resetWorkspace();
    if (!file) {
      setStatus("No custom map loaded.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("The selected file is larger than 10 MB.", "error");
      return;
    }

    sourceFileName = file.name;
    setStatus(`Reading ${file.name}…`, "loading");
    setPreviewStatus("Reading map file");

    try {
      const text = await file.text();
      sourceFormat = detectFileFormat(file, text);
      let svg;
      if (sourceFormat === "SVG") {
        svg = parseSvgText(text);
        elements.geojsonField.hidden = true;
      } else {
        setStatus("Preparing GeoJSON polygon geometry…", "loading");
        setPreviewStatus("Projecting GeoJSON geometry");
        svg = await parseGeoJsonText(text);
      }
      installSvg(svg);
      setStatus(
        `${regions.length} interactive ${
          regions.length === 1 ? "region" : "regions"
        } identified.`
      );
    } catch (error) {
      resetWorkspace();
      setStatus(error.message || "This map could not be imported.", "error");
    }
  }

  function buildDownloadSvg() {
    const clone = currentSvg.cloneNode(true);
    clone.querySelectorAll(".custom-region").forEach((region) => {
      region.classList.remove("is-selected");
      region.removeAttribute("tabindex");
      region.removeAttribute("role");
    });

    const oldTitle = clone.querySelector(":scope > title");
    const oldDescription = clone.querySelector(":scope > desc");
    if (oldTitle) {
      oldTitle.textContent = `${sourceFileName} identified map`;
    } else {
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${sourceFileName} identified map`;
      clone.prepend(title);
    }
    if (oldDescription) {
      oldDescription.textContent =
        `Custom map with ${regions.length} identified regions.`;
    } else {
      const description = document.createElementNS(SVG_NS, "desc");
      description.textContent =
        `Custom map with ${regions.length} identified regions.`;
      clone.insertBefore(description, clone.children[1] || null);
    }

    const defs =
      clone.querySelector(":scope > defs") ||
      clone.insertBefore(document.createElementNS(SVG_NS, "defs"), clone.firstChild);
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = `
      .custom-region { cursor: pointer; outline: none; }
      .custom-region:is(path,polygon,rect,circle,ellipse),
      .custom-region :is(path,polygon,rect,circle,ellipse) {
        fill: #dce9df;
        stroke: #607b70;
        stroke-width: 1.25;
        stroke-linejoin: round;
      }
      .custom-region:hover:is(path,polygon,rect,circle,ellipse),
      .custom-region:hover :is(path,polygon,rect,circle,ellipse) {
        fill: #e7b95c;
      }
    `;
    defs.append(style);
    clone.setAttribute("xmlns", SVG_NS);
    clone.setAttribute("xmlns:xlink", XLINK_NS);
    return clone;
  }

  function downloadIdentifiedSvg() {
    if (!currentSvg || !regions.length) {
      return;
    }
    const svg = buildDownloadSvg();
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const baseName =
      sourceFileName.replace(/\.(?:svg|geojson|json)$/i, "") || "custom-map";
    anchor.href = url;
    anchor.download = `${slugify(baseName) || "custom-map"}-identified.svg`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("Identified SVG downloaded.");
  }

  elements.file.addEventListener("change", () => {
    void handleFile(elements.file.files?.[0]);
  });
  elements.search.addEventListener("input", renderRegionList);
  elements.clearSelection.addEventListener("click", clearSelection);
  elements.saveName.addEventListener("click", saveSelectedRegionName);
  elements.regionName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveSelectedRegionName();
    }
  });
  elements.geojsonProperty.addEventListener(
    "change",
    applyGeoJsonNameProperty
  );
  elements.download.addEventListener("click", downloadIdentifiedSvg);
})();
