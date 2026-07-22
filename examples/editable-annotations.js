(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const STORAGE_KEY = "india-map-studio:annotations:v1";
  const CATEGORIES = { note: "General note", project: "Project", risk: "Risk", visit: "Field visit" };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const elements = {
    mount: document.querySelector("#annotation-map"), status: document.querySelector("#annotation-status"), caption: document.querySelector("#annotation-caption"), state: document.querySelector("#annotation-state"), district: document.querySelector("#annotation-district"),
    category: document.querySelector("#annotation-category"), note: document.querySelector("#annotation-note"), placeDistrict: document.querySelector("#annotation-place-district"), mapMode: document.querySelector("#annotation-map-mode"), update: document.querySelector("#annotation-update"), remove: document.querySelector("#annotation-remove"), clear: document.querySelector("#annotation-clear"), export: document.querySelector("#annotation-export"), import: document.querySelector("#annotation-import"), list: document.querySelector("#annotation-list"), detail: document.querySelector("#annotation-detail"), detailTitle: document.querySelector("#annotation-detail-title"), detailCopy: document.querySelector("#annotation-detail-copy"), detailId: document.querySelector("#annotation-detail-id"),
  };
  let currentState = states.find((state) => state.slug === "maharashtra") || states[0];
  let engine = null;
  let features = [];
  let featureBySlug = new Map();
  let annotations = readStoredAnnotations();
  let layer = null;
  let selectedId = null;
  let mapPlacement = false;
  let loadSequence = 0;

  function readStoredAnnotations() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.filter(validAnnotation) : [];
    } catch { return []; }
  }

  function validAnnotation(item) {
    return item && typeof item.id === "string" && states.some((state) => state.slug === item.stateSlug) && Number.isFinite(item.x) && Number.isFinite(item.y) && Object.hasOwn(CATEGORIES, item.category) && typeof item.note === "string";
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function districtName(feature) {
    return feature.attributes.district || feature.attributes.name || feature.id;
  }

  function districtCentre(feature) {
    const box = feature.element.getBBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  function stateAnnotations() {
    return annotations.filter((annotation) => annotation.stateSlug === currentState.slug);
  }

  function annotationById(id) {
    return annotations.find((annotation) => annotation.id === id) || null;
  }

  function createId() {
    return `ANN-${currentState.code}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function addAnnotation(point, districtSlug = "") {
    const note = elements.note.value.trim() || `${CATEGORIES[elements.category.value]} annotation`;
    const annotation = { id: createId(), stateSlug: currentState.slug, districtSlug, x: Number(point.x.toFixed(2)), y: Number(point.y.toFixed(2)), category: elements.category.value, note };
    annotations.push(annotation);
    selectedId = annotation.id;
    save();
    render();
    showDetail(annotation);
    elements.caption.textContent = `Annotation added${districtSlug ? ` in ${districtName(featureBySlug.get(districtSlug))}` : " at the selected map position"}.`;
  }

  function svgPoint(event) {
    const point = engine.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(engine.svg.getScreenCTM().inverse());
  }

  function selectAnnotation(id) {
    const annotation = annotationById(id);
    if (!annotation) return;
    selectedId = id;
    elements.category.value = annotation.category;
    elements.note.value = annotation.note;
    showDetail(annotation);
    renderSelection();
  }

  function showDetail(annotation) {
    const district = annotation.districtSlug ? featureBySlug.get(annotation.districtSlug) : null;
    elements.detail.hidden = false;
    elements.detailTitle.textContent = CATEGORIES[annotation.category];
    elements.detailCopy.textContent = `${annotation.note}${district ? ` · ${districtName(district)} district` : " · Custom map position"}`;
    elements.detailId.textContent = annotation.id;
    elements.update.disabled = false;
    elements.remove.disabled = false;
  }

  function renderSelection() {
    layer?.querySelectorAll(".example-annotation-marker").forEach((marker) => {
      const active = marker.dataset.annotationId === selectedId;
      marker.classList.toggle("is-selected", active);
      marker.setAttribute("aria-pressed", String(active));
    });
    elements.list.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.annotationId === selectedId));
  }

  function moveAnnotation(annotation, x, y) {
    const viewBox = engine.svg.viewBox.baseVal;
    annotation.x = Number(Math.max(viewBox.x, Math.min(viewBox.x + viewBox.width, x)).toFixed(2));
    annotation.y = Number(Math.max(viewBox.y, Math.min(viewBox.y + viewBox.height, y)).toFixed(2));
    annotation.districtSlug = "";
    save();
    render();
    selectAnnotation(annotation.id);
  }

  function createMarker(annotation) {
    const group = svgElement("g", { class: `example-annotation-marker is-${annotation.category}`, transform: `translate(${annotation.x} ${annotation.y})`, role: "button", tabindex: "0", "aria-pressed": "false", "aria-label": `${CATEGORIES[annotation.category]}: ${annotation.note}. Drag or use arrow keys to move.` });
    group.dataset.annotationId = annotation.id;
    const hit = svgElement("circle", { class: "example-annotation-hit", r: "18" });
    const pin = svgElement("path", { class: "example-annotation-pin", d: "M0 15C-3 9-11 1-11-7a11 11 0 1 1 22 0C11 1 3 9 0 15Z" });
    const dot = svgElement("circle", { class: "example-annotation-dot", cy: "-7", r: "3.5" });
    group.append(hit, pin, dot);
    group.addEventListener("click", (event) => { event.stopPropagation(); selectAnnotation(annotation.id); });
    group.addEventListener("keydown", (event) => {
      const moves = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] };
      if (moves[event.key]) { event.preventDefault(); const [dx, dy] = moves[event.key]; moveAnnotation(annotation, annotation.x + dx, annotation.y + dy); }
      else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeSelected(); }
      else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectAnnotation(annotation.id); }
    });
    group.addEventListener("pointerdown", (event) => {
      event.preventDefault(); event.stopPropagation(); selectAnnotation(annotation.id); group.setPointerCapture(event.pointerId);
      const move = (moveEvent) => { const point = svgPoint(moveEvent); group.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`); };
      const finish = (upEvent) => { group.removeEventListener("pointermove", move); group.removeEventListener("pointerup", finish); const point = svgPoint(upEvent); moveAnnotation(annotation, point.x, point.y); };
      group.addEventListener("pointermove", move); group.addEventListener("pointerup", finish);
    });
    return group;
  }

  function createListItem(annotation) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const symbol = document.createElement("i");
    const text = document.createElement("span");
    const name = document.createElement("strong");
    const meta = document.createElement("small");
    const district = annotation.districtSlug ? featureBySlug.get(annotation.districtSlug) : null;
    button.type = "button"; button.dataset.annotationId = annotation.id;
    symbol.className = `is-${annotation.category}`;
    name.textContent = annotation.note;
    meta.textContent = district ? districtName(district) : "Custom position";
    text.append(name, meta); button.append(symbol, text); button.addEventListener("click", () => selectAnnotation(annotation.id)); item.append(button); return item;
  }

  function render() {
    const current = stateAnnotations();
    layer.replaceChildren(...current.map(createMarker));
    if (current.length) elements.list.replaceChildren(...current.map(createListItem));
    else { const empty = document.createElement("li"); empty.className = "example-annotation-empty"; empty.textContent = "No annotations saved for this state."; elements.list.replaceChildren(empty); }
    elements.status.textContent = `${current.length} saved ${current.length === 1 ? "annotation" : "annotations"} · ${currentState.name}`;
    elements.export.disabled = annotations.length === 0;
    elements.clear.disabled = current.length === 0;
    if (selectedId && current.some((annotation) => annotation.id === selectedId)) renderSelection();
  }

  function updateSelected() {
    const annotation = annotationById(selectedId);
    if (!annotation) return;
    annotation.category = elements.category.value;
    annotation.note = elements.note.value.trim() || `${CATEGORIES[annotation.category]} annotation`;
    save(); render(); selectAnnotation(annotation.id); elements.caption.textContent = `${annotation.id} updated and saved locally.`;
  }

  function removeSelected() {
    if (!selectedId) return;
    annotations = annotations.filter((annotation) => annotation.id !== selectedId);
    selectedId = null; save(); render(); elements.detail.hidden = true; elements.update.disabled = true; elements.remove.disabled = true; elements.caption.textContent = "Selected annotation removed.";
  }

  function setMapPlacement(active) {
    mapPlacement = active;
    elements.mapMode.setAttribute("aria-pressed", String(active));
    elements.mapMode.textContent = active ? "Click the map…" : "Place on map";
    elements.mount.classList.toggle("is-placing", active);
  }

  function downloadJson() {
    const payload = JSON.stringify({ format: "india-map-studio-annotations", version: 1, exportedAt: new Date().toISOString(), annotations }, null, 2);
    const url = URL.createObjectURL(new Blob([`${payload}\n`], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "india-map-annotations.json"; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  async function importJson(file) {
    const payload = JSON.parse(await file.text());
    if (payload?.format !== "india-map-studio-annotations" || payload.version !== 1 || !Array.isArray(payload.annotations) || !payload.annotations.every(validAnnotation)) throw new Error("Choose a valid India Map Studio annotation JSON file.");
    annotations = payload.annotations; selectedId = null; save(); render(); elements.detail.hidden = true; elements.caption.textContent = `${annotations.length} annotations imported and saved locally.`;
  }

  async function loadState(state) {
    const sequence = ++loadSequence; engine?.destroy(); currentState = state; selectedId = null; elements.detail.hidden = true; elements.update.disabled = true; elements.remove.disabled = true; elements.status.textContent = `Loading ${state.name} districts…`;
    engine = new IndiaMapEngine({ mount: elements.mount, src: `../${state.svg}`, featureSelector: ".district-region", featureKey: "slug", interactive: false });
    await engine.load(); if (sequence !== loadSequence) return;
    features = engine.getFeatures(); featureBySlug = new Map(features.map((feature) => [feature.id, feature]));
    features.forEach((feature) => { feature.element.removeAttribute("tabindex"); feature.element.setAttribute("role", "presentation"); feature.element.removeAttribute("aria-label"); });
    elements.district.replaceChildren(...features.slice().sort((left, right) => districtName(left).localeCompare(districtName(right))).map((feature) => new Option(districtName(feature), feature.id)));
    layer = svgElement("g", { class: "example-annotation-layer" }); engine.svg.append(layer);
    engine.svg.addEventListener("click", (event) => { if (!mapPlacement || event.target.closest(".example-annotation-marker")) return; const point = svgPoint(event); addAnnotation(point); setMapPlacement(false); });
    render(); elements.caption.textContent = `${state.name} annotations loaded from local browser storage.`;
  }

  function initialize() {
    elements.state.replaceChildren(...states.slice().sort((left, right) => left.name.localeCompare(right.name)).map((state) => new Option(state.name, state.slug))); elements.state.value = currentState.slug; loadState(currentState).catch(showError);
  }

  function showError(error) { elements.status.textContent = "The annotation workspace could not load."; elements.caption.textContent = error.message; console.error(error); }

  elements.state.addEventListener("change", () => { const state = states.find((item) => item.slug === elements.state.value); if (state) loadState(state).catch(showError); });
  elements.placeDistrict.addEventListener("click", () => { const feature = featureBySlug.get(elements.district.value); if (feature) addAnnotation(districtCentre(feature), feature.id); });
  elements.mapMode.addEventListener("click", () => setMapPlacement(!mapPlacement));
  elements.update.addEventListener("click", updateSelected); elements.remove.addEventListener("click", removeSelected);
  elements.clear.addEventListener("click", () => { annotations = annotations.filter((annotation) => annotation.stateSlug !== currentState.slug); selectedId = null; save(); render(); elements.detail.hidden = true; elements.update.disabled = true; elements.remove.disabled = true; elements.caption.textContent = `${currentState.name} annotations cleared.`; });
  elements.export.addEventListener("click", downloadJson);
  elements.import.addEventListener("change", () => { const file = elements.import.files?.[0]; if (file) importJson(file).catch((error) => { elements.caption.textContent = error.message; }); elements.import.value = ""; });
  initialize();
})();
