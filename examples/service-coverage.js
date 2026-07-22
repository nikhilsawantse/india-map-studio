(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const DEFAULT_STATE_SLUG = "maharashtra";
  const MAX_CENTRES = 5;
  const CENTRE_COLORS = ["#b8d9cc", "#c4d5e8", "#dfc8dc", "#e3d6a5", "#c8d8bb"];
  const CENTRE_STROKES = ["#176650", "#2a6877", "#76506f", "#806b20", "#4e6b3e"];
  const TYPE_LABELS = {
    office: "Service office",
    warehouse: "Warehouse",
    "field-team": "Field team",
  };
  const elements = {
    mount: document.querySelector("#coverage-map"),
    status: document.querySelector("#coverage-status"),
    caption: document.querySelector("#coverage-caption"),
    state: document.querySelector("#coverage-state"),
    centreType: document.querySelector("#coverage-centre-type"),
    reach: document.querySelector("#coverage-reach"),
    reachValue: document.querySelector("#coverage-reach-value"),
    summary: document.querySelector("#coverage-summary"),
    covered: document.querySelector("#coverage-covered"),
    overlap: document.querySelector("#coverage-overlap"),
    uncovered: document.querySelector("#coverage-uncovered"),
    reset: document.querySelector("#coverage-reset"),
    export: document.querySelector("#coverage-export"),
    centreTitle: document.querySelector("#coverage-centres-title"),
    centreList: document.querySelector("#coverage-centre-list"),
    detail: document.querySelector("#coverage-detail"),
    detailTitle: document.querySelector("#coverage-detail-title"),
    detailCopy: document.querySelector("#coverage-detail-copy"),
    detailId: document.querySelector("#coverage-detail-id"),
  };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  let currentState = null;
  let engine = null;
  let features = [];
  let featureBySlug = new Map();
  let centres = [];
  let assignments = new Map();
  let markerLayer = null;
  let mapSpan = 1;
  let nextColorIndex = 0;
  let selectedDistrictSlug = null;
  let loadSequence = 0;

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

  function districtRecord(feature) {
    return {
      slug: feature.id,
      name: districtName(feature),
      featureId: feature.attributes.featureId || "",
      administrativeCode: feature.attributes.code || "",
      lgdCode: feature.attributes.lgdCode || "",
      point: districtCentre(feature),
    };
  }

  function centreBySlug(slug) {
    return centres.find((centre) => centre.slug === slug) || null;
  }

  function distance(left, right) {
    return Math.hypot(left.x - right.x, left.y - right.y);
  }

  function coverageRadius() {
    return (Number(elements.reach.value) / 100) * mapSpan;
  }

  function calculateMapSpan() {
    const points = features.map((feature) => feature.data.point);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }

  function seedCandidates() {
    if (currentState.slug === "maharashtra") {
      const configured = [
        { slug: "pune", type: "warehouse" },
        { slug: "nagpur", type: "office" },
        { slug: "chhatrapati-sambhajinagar", type: "field-team" },
      ];
      const ready = configured.filter((item) => featureBySlug.has(item.slug));
      if (ready.length === configured.length) return ready;
    }
    if (!features.length) return [];
    const points = features.map((feature) => feature.data.point);
    const centrePoint = {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
    const first = features.reduce((best, feature) =>
      distance(feature.data.point, centrePoint) < distance(best.data.point, centrePoint) ? feature : best,
    );
    const chosen = [first];
    while (chosen.length < Math.min(3, features.length)) {
      const remaining = features.filter((feature) => !chosen.includes(feature));
      const next = remaining.reduce((best, feature) => {
        const nearest = Math.min(...chosen.map((item) => distance(feature.data.point, item.data.point)));
        const bestNearest = Math.min(...chosen.map((item) => distance(best.data.point, item.data.point)));
        return nearest > bestNearest ? feature : best;
      });
      chosen.push(next);
    }
    const types = ["office", "warehouse", "field-team"];
    return chosen.map((feature, index) => ({ slug: feature.id, type: types[index] }));
  }

  function resetCentres() {
    nextColorIndex = 0;
    centres = seedCandidates().map((item) => ({
      slug: item.slug,
      type: item.type,
      colorIndex: nextColorIndex++,
    }));
    selectedDistrictSlug = null;
    elements.detail.hidden = true;
    renderCoverage();
    elements.caption.textContent = `Demo centres reset for ${currentState.name}.`;
  }

  function toggleCentre(feature) {
    const existing = centreBySlug(feature.id);
    if (existing) {
      centres = centres.filter((centre) => centre.slug !== feature.id);
      elements.caption.textContent = `${districtName(feature)} service centre removed.`;
    } else if (centres.length >= MAX_CENTRES) {
      elements.caption.textContent = `Remove a centre before adding another; this example supports ${MAX_CENTRES}.`;
      return;
    } else {
      centres.push({
        slug: feature.id,
        type: elements.centreType.value,
        colorIndex: nextColorIndex % CENTRE_COLORS.length,
      });
      nextColorIndex += 1;
      elements.caption.textContent = `${TYPE_LABELS[elements.centreType.value]} added in ${districtName(feature)}.`;
    }
    renderCoverage();
  }

  function assignmentFor(feature) {
    const radius = coverageRadius();
    return centres.filter((centre) => {
      const centreFeature = featureBySlug.get(centre.slug);
      return centreFeature && distance(feature.data.point, centreFeature.data.point) <= radius;
    });
  }

  function coverageDescription(feature) {
    const coverage = assignments.get(feature.id) || [];
    if (!coverage.length) return "Uncovered by the current illustrative reach.";
    const names = coverage.map((centre) => districtName(featureBySlug.get(centre.slug)));
    if (coverage.length === 1) return `Covered by ${names[0]}.`;
    return `Overlap between ${names.join(", ")}.`;
  }

  function showDistrictDetail(feature) {
    selectedDistrictSlug = feature.id;
    features.forEach((item) => item.element.classList.toggle("is-inspected", item.id === feature.id));
    elements.detail.hidden = false;
    elements.detailTitle.textContent = districtName(feature);
    elements.detailCopy.textContent = coverageDescription(feature);
    elements.detailId.textContent = feature.attributes.featureId || feature.id;
    elements.caption.textContent = `${districtName(feature)}: ${coverageDescription(feature)}`;
  }

  function createMarker(centre, index) {
    const feature = featureBySlug.get(centre.slug);
    const group = svgElement("g", {
      class: "example-coverage-marker",
      transform: `translate(${feature.data.point.x.toFixed(2)} ${feature.data.point.y.toFixed(2)})`,
      role: "img",
      "aria-label": `${TYPE_LABELS[centre.type]} in ${districtName(feature)}`,
    });
    group.style.setProperty("--centre-fill", CENTRE_COLORS[centre.colorIndex]);
    group.style.setProperty("--centre-stroke", CENTRE_STROKES[centre.colorIndex]);
    group.append(svgElement("circle", { r: "17" }));
    const label = svgElement("text", { x: "0", y: "1" });
    label.textContent = String(index + 1);
    group.append(label);
    return group;
  }

  function removeCentre(slug) {
    const feature = featureBySlug.get(slug);
    centres = centres.filter((centre) => centre.slug !== slug);
    renderCoverage();
    elements.caption.textContent = `${districtName(feature)} service centre removed.`;
  }

  function createCentreListItem(centre, index) {
    const feature = featureBySlug.get(centre.slug);
    const item = document.createElement("li");
    const swatch = document.createElement("i");
    const text = document.createElement("span");
    const name = document.createElement("strong");
    const meta = document.createElement("small");
    const remove = document.createElement("button");
    const reached = [...assignments.values()].filter((coverage) => coverage.includes(centre)).length;
    swatch.style.setProperty("--centre-fill", CENTRE_COLORS[centre.colorIndex]);
    swatch.style.setProperty("--centre-stroke", CENTRE_STROKES[centre.colorIndex]);
    swatch.textContent = String(index + 1);
    name.textContent = districtName(feature);
    meta.textContent = `${TYPE_LABELS[centre.type]} · ${reached} districts reached`;
    text.append(name, meta);
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${districtName(feature)} service centre`);
    remove.addEventListener("click", () => removeCentre(centre.slug));
    item.append(swatch, text, remove);
    return item;
  }

  function renderCoverage() {
    if (!features.length) return;
    assignments = new Map(features.map((feature) => [feature.id, assignmentFor(feature)]));
    let singleCoveredCount = 0;
    let overlapCount = 0;
    features.forEach((feature) => {
      const coverage = assignments.get(feature.id);
      const centre = coverage.length === 1 ? coverage[0] : null;
      feature.element.classList.toggle("is-covered", coverage.length === 1);
      feature.element.classList.toggle("is-overlap", coverage.length > 1);
      feature.element.classList.toggle("is-uncovered", coverage.length === 0);
      feature.element.classList.toggle("is-centre", Boolean(centreBySlug(feature.id)));
      feature.element.style.removeProperty("--coverage-fill");
      if (centre) feature.element.style.setProperty("--coverage-fill", CENTRE_COLORS[centre.colorIndex]);
      feature.element.setAttribute("aria-pressed", String(Boolean(centreBySlug(feature.id))));
      feature.element.setAttribute(
        "aria-label",
        `${districtName(feature)} district. ${coverageDescription(feature)} ${centreBySlug(feature.id) ? "Service centre active." : "Activate as a service centre."}`,
      );
      if (coverage.length === 1) singleCoveredCount += 1;
      if (coverage.length > 1) overlapCount += 1;
    });
    const totalCoveredCount = singleCoveredCount + overlapCount;
    markerLayer.replaceChildren(...centres.map(createMarker));
    elements.centreList.replaceChildren(...centres.map(createCentreListItem));
    elements.centreTitle.textContent = `${centres.length} active ${centres.length === 1 ? "centre" : "centres"}`;
    elements.reachValue.textContent = `${elements.reach.value}%`;
    elements.covered.textContent = singleCoveredCount;
    elements.overlap.textContent = overlapCount;
    elements.uncovered.textContent = features.length - totalCoveredCount;
    elements.summary.textContent = `${singleCoveredCount} covered once, ${overlapCount} overlapping, and ${features.length - totalCoveredCount} uncovered districts.`;
    elements.status.textContent = `${centres.length} centres · ${totalCoveredCount}/${features.length} districts covered`;
    elements.export.disabled = centres.length === 0;
    if (selectedDistrictSlug && featureBySlug.has(selectedDistrictSlug)) {
      showDistrictDetail(featureBySlug.get(selectedDistrictSlug));
    }
  }

  function wireFeature(feature) {
    feature.element.setAttribute("tabindex", "0");
    feature.element.setAttribute("role", "button");
    feature.element.addEventListener("click", () => toggleCentre(feature));
    feature.element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCentre(feature);
      }
    });
    feature.element.addEventListener("pointerenter", () => showDistrictDetail(feature));
    feature.element.addEventListener("focus", () => showDistrictDetail(feature));
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportAssignments() {
    const fields = [
      "state",
      "district",
      "district_slug",
      "feature_id",
      "coverage_status",
      "centre_districts",
      "centre_types",
    ];
    const rows = features.map((feature) => {
      const coverage = assignments.get(feature.id) || [];
      return {
        state: currentState.name,
        district: districtName(feature),
        district_slug: feature.id,
        feature_id: feature.attributes.featureId || "",
        coverage_status: coverage.length > 1 ? "overlap" : coverage.length === 1 ? "covered" : "uncovered",
        centre_districts: coverage.map((centre) => districtName(featureBySlug.get(centre.slug))).join(" | "),
        centre_types: coverage.map((centre) => TYPE_LABELS[centre.type]).join(" | "),
      };
    });
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentState.slug}-service-coverage.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function loadState(state) {
    const sequence = ++loadSequence;
    engine?.destroy();
    currentState = state;
    features = [];
    featureBySlug = new Map();
    centres = [];
    assignments = new Map();
    selectedDistrictSlug = null;
    elements.detail.hidden = true;
    elements.status.textContent = `Loading ${state.name} districts…`;
    engine = new IndiaMapEngine({
      mount: elements.mount,
      src: `../${state.svg}`,
      featureSelector: ".district-region",
      featureKey: "slug",
      interactive: false,
    });
    await engine.load();
    if (sequence !== loadSequence) return;
    features = engine.getFeatures().map((feature) => ({ ...feature, data: districtRecord(feature) }));
    featureBySlug = new Map(features.map((feature) => [feature.id, feature]));
    mapSpan = calculateMapSpan();
    features.forEach(wireFeature);
    markerLayer = svgElement("g", { class: "example-coverage-marker-layer", "aria-hidden": "true" });
    engine.svg.append(markerLayer);
    resetCentres();
  }

  function showError(error) {
    elements.status.textContent = "The coverage workspace could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
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

  elements.state.addEventListener("change", () => {
    const state = states.find((item) => item.slug === elements.state.value);
    if (state) loadState(state).catch(showError);
  });
  elements.reach.addEventListener("input", renderCoverage);
  elements.reset.addEventListener("click", resetCentres);
  elements.export.addEventListener("click", exportAssignments);

  initialize();
})();
