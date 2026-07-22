(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const DEFAULT_STATE_SLUG = "maharashtra";
  const MAX_VISIBLE_SELECTIONS = 10;
  const elements = {
    mount: document.querySelector("#draw-map"),
    status: document.querySelector("#draw-status"),
    caption: document.querySelector("#draw-caption"),
    state: document.querySelector("#draw-state"),
    modeButtons: [...document.querySelectorAll("[data-draw-mode]")],
    summary: document.querySelector("#draw-summary"),
    clear: document.querySelector("#draw-clear"),
    exportCsv: document.querySelector("#draw-export-csv"),
    exportJson: document.querySelector("#draw-export-json"),
    selectionTitle: document.querySelector("#draw-selection-title"),
    selectionList: document.querySelector("#draw-selection-list"),
    selectionMore: document.querySelector("#draw-selection-more"),
  };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  let currentState = null;
  let engine = null;
  let features = [];
  let featureCentres = new Map();
  let selected = new Map();
  let mode = "click";
  let drawing = null;
  let drawingLayer = null;
  let drawingShape = null;
  let loadSequence = 0;

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function districtRecord(feature) {
    const attributes = feature.attributes;
    return {
      state: currentState.name,
      state_slug: currentState.slug,
      district: attributes.district || attributes.name || feature.id,
      district_slug: feature.id,
      administrative_code: attributes.code || "",
      lgd_code: attributes.lgdCode || "",
      feature_id: attributes.featureId || "",
      division: attributes.division || "",
    };
  }

  function setFeatureSelected(feature, isSelected) {
    feature.element.classList.toggle("is-draw-selected", isSelected);
    feature.element.setAttribute("aria-checked", String(isSelected));
  }

  function removeSelection(slug) {
    selected.delete(slug);
    const feature = features.find((item) => item.id === slug);
    if (feature) setFeatureSelected(feature, false);
    renderSelection();
  }

  function createSelectionItem(record) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const name = document.createElement("strong");
    const identifier = document.createElement("small");
    const remove = document.createElement("button");
    name.textContent = record.district;
    identifier.textContent = record.feature_id || record.district_slug;
    text.append(name, identifier);
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${record.district} from selection`);
    remove.addEventListener("click", () => removeSelection(record.district_slug));
    item.append(text, remove);
    return item;
  }

  function renderSelection() {
    const records = [...selected.values()].sort((left, right) => left.district.localeCompare(right.district));
    features.forEach((feature) => setFeatureSelected(feature, selected.has(feature.id)));
    elements.summary.textContent = records.length
      ? `${records.length} of ${features.length} districts selected in ${currentState.name}.`
      : `0 of ${features.length} districts selected in ${currentState.name}.`;
    elements.selectionTitle.textContent = records.length
      ? `${records.length} selected ${records.length === 1 ? "district" : "districts"}`
      : "Nothing selected";
    elements.selectionList.replaceChildren(
      ...records.slice(0, MAX_VISIBLE_SELECTIONS).map(createSelectionItem),
    );
    const hiddenCount = Math.max(0, records.length - MAX_VISIBLE_SELECTIONS);
    elements.selectionMore.hidden = hiddenCount === 0;
    elements.selectionMore.textContent = hiddenCount
      ? `${hiddenCount} more selected districts are included in exports.`
      : "";
    elements.clear.disabled = records.length === 0;
    elements.exportCsv.disabled = records.length === 0;
    elements.exportJson.disabled = records.length === 0;
    elements.status.textContent = `${records.length} selected from ${features.length} districts`;
  }

  function toggleFeature(feature) {
    if (selected.has(feature.id)) selected.delete(feature.id);
    else selected.set(feature.id, districtRecord(feature));
    renderSelection();
    elements.caption.textContent = `${districtRecord(feature).district} ${selected.has(feature.id) ? "added to" : "removed from"} the selection.`;
  }

  function wireFeature(feature) {
    const name = districtRecord(feature).district;
    feature.element.setAttribute("tabindex", "0");
    feature.element.setAttribute("role", "checkbox");
    feature.element.setAttribute("aria-checked", "false");
    feature.element.setAttribute("aria-label", `Select ${name} district`);
    feature.element.addEventListener("click", (event) => {
      if (mode !== "click") return;
      event.stopPropagation();
      toggleFeature(feature);
    });
    feature.element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFeature(feature);
      }
    });
    feature.element.addEventListener("pointerenter", () => {
      if (!drawing) elements.caption.textContent = `${name} district. ${selected.has(feature.id) ? "Selected." : "Not selected."}`;
    });
  }

  function visualCentre(feature) {
    const box = feature.element.getBBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  function svgPoint(event) {
    const point = engine.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(engine.svg.getScreenCTM().inverse());
  }

  function rectangleBounds(start, end) {
    return {
      left: Math.min(start.x, end.x),
      right: Math.max(start.x, end.x),
      top: Math.min(start.y, end.y),
      bottom: Math.max(start.y, end.y),
    };
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
      const currentPoint = polygon[current];
      const previousPoint = polygon[previous];
      const crosses =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y) +
            currentPoint.x;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function updateDrawingShape() {
    if (mode === "box") {
      const bounds = rectangleBounds(drawing.points[0], drawing.points[drawing.points.length - 1]);
      drawingShape.setAttribute("x", bounds.left);
      drawingShape.setAttribute("y", bounds.top);
      drawingShape.setAttribute("width", bounds.right - bounds.left);
      drawingShape.setAttribute("height", bounds.bottom - bounds.top);
      return;
    }
    const path = drawing.points
      .map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
    drawingShape.setAttribute("d", `${path}${drawing.points.length > 2 ? " Z" : ""}`);
  }

  function beginDrawing(event) {
    if (mode === "click" || event.button !== 0) return;
    event.preventDefault();
    const point = svgPoint(event);
    drawing = { pointerId: event.pointerId, points: [point] };
    drawingShape?.remove();
    drawingShape = svgElement(mode === "box" ? "rect" : "path", {
      class: `example-draw-shape is-${mode}`,
    });
    drawingLayer.append(drawingShape);
    updateDrawingShape();
    engine.svg.setPointerCapture?.(event.pointerId);
    elements.caption.textContent = mode === "box"
      ? "Drag a rectangle around district centres."
      : "Draw a freehand loop around district centres.";
  }

  function continueDrawing(event) {
    if (!drawing || drawing.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = svgPoint(event);
    if (mode === "box") drawing.points[1] = point;
    else {
      const previous = drawing.points[drawing.points.length - 1];
      if (Math.hypot(point.x - previous.x, point.y - previous.y) >= 5) drawing.points.push(point);
    }
    updateDrawingShape();
  }

  function finishDrawing(event) {
    if (!drawing || drawing.pointerId !== event.pointerId) return;
    event.preventDefault();
    const finished = drawing;
    drawing = null;
    drawingShape.classList.add("is-complete");
    let contains;
    if (mode === "box") {
      const bounds = rectangleBounds(finished.points[0], finished.points[finished.points.length - 1]);
      if (bounds.right - bounds.left < 6 || bounds.bottom - bounds.top < 6) {
        elements.caption.textContent = "Draw a larger rectangle to select districts.";
        return;
      }
      contains = (point) =>
        point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    } else {
      if (finished.points.length < 3) {
        elements.caption.textContent = "Draw a larger loop to select districts.";
        return;
      }
      contains = (point) => pointInPolygon(point, finished.points);
    }
    const matches = features.filter((feature) => contains(featureCentres.get(feature.id)));
    matches.forEach((feature) => selected.set(feature.id, districtRecord(feature)));
    renderSelection();
    elements.caption.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "district" : "districts"} added by ${mode === "box" ? "rectangle" : "lasso"}.`
      : "No district centres fell inside the drawn area.";
  }

  function cancelDrawing(event) {
    if (!drawing || drawing.pointerId !== event.pointerId) return;
    drawing = null;
    drawingShape?.remove();
    drawingShape = null;
    elements.caption.textContent = "Drawing cancelled. Try again or choose another selection method.";
  }

  function setMode(nextMode) {
    mode = nextMode;
    elements.modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.drawMode === mode));
    });
    elements.mount.classList.toggle("is-drawing-mode", mode !== "click");
    drawing = null;
    drawingShape?.remove();
    drawingShape = null;
    elements.caption.textContent = mode === "click"
      ? "Click a district to add or remove it from the selection."
      : mode === "box"
        ? "Drag a rectangle; districts with centres inside it will be added."
        : "Draw a freehand loop; districts with centres inside it will be added.";
  }

  function clearSelection() {
    selected.clear();
    renderSelection();
    drawingShape?.remove();
    drawingShape = null;
    elements.caption.textContent = "Selection cleared.";
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const fields = [
      "state",
      "state_slug",
      "district",
      "district_slug",
      "administrative_code",
      "lgd_code",
      "feature_id",
      "division",
    ];
    const records = [...selected.values()];
    const csv = [fields.join(","), ...records.map((record) => fields.map((field) => csvCell(record[field])).join(","))].join("\n");
    downloadFile(`${currentState.slug}-selected-districts.csv`, `${csv}\n`, "text/csv;charset=utf-8");
  }

  function exportJson() {
    downloadFile(
      `${currentState.slug}-selected-districts.json`,
      `${JSON.stringify({ state: currentState, selectedDistricts: [...selected.values()] }, null, 2)}\n`,
      "application/json",
    );
  }

  async function loadState(state) {
    const sequence = ++loadSequence;
    engine?.destroy();
    currentState = state;
    features = [];
    featureCentres = new Map();
    selected.clear();
    drawing = null;
    drawingLayer = null;
    drawingShape = null;
    elements.status.textContent = `Loading ${state.name} districts…`;
    elements.caption.textContent = "Preparing district interaction.";
    engine = new IndiaMapEngine({
      mount: elements.mount,
      src: `../${state.svg}`,
      featureSelector: ".district-region",
      featureKey: "slug",
      interactive: false,
    });
    await engine.load();
    if (sequence !== loadSequence) return;
    features = engine.getFeatures();
    features.forEach((feature) => {
      featureCentres.set(feature.id, visualCentre(feature));
      wireFeature(feature);
    });
    drawingLayer = svgElement("g", { class: "example-draw-layer", "aria-hidden": "true" });
    engine.svg.append(drawingLayer);
    engine.svg.addEventListener("pointerdown", beginDrawing);
    engine.svg.addEventListener("pointermove", continueDrawing);
    engine.svg.addEventListener("pointerup", finishDrawing);
    engine.svg.addEventListener("pointercancel", cancelDrawing);
    renderSelection();
    setMode(mode);
  }

  function initialize() {
    elements.state.replaceChildren(
      ...states
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((state) => new Option(state.name, state.slug)),
    );
    elements.state.value = DEFAULT_STATE_SLUG;
    const initialState = states.find((state) => state.slug === DEFAULT_STATE_SLUG) || states[0];
    loadState(initialState).catch(showError);
  }

  function showError(error) {
    elements.status.textContent = "The district layer could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  }

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.drawMode));
  });
  elements.state.addEventListener("change", () => {
    const state = states.find((item) => item.slug === elements.state.value);
    if (state) loadState(state).catch(showError);
  });
  elements.clear.addEventListener("click", clearSelection);
  elements.exportCsv.addEventListener("click", exportCsv);
  elements.exportJson.addEventListener("click", exportJson);

  initialize();
})();
