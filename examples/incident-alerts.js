(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const DEFAULT_STATE_SLUG = "maharashtra";
  const SEVERITIES = {
    critical: { label: "Critical", rank: 4, short: "C" },
    high: { label: "High", rank: 3, short: "H" },
    moderate: { label: "Moderate", rank: 2, short: "M" },
    advisory: { label: "Advisory", rank: 1, short: "A" },
  };
  const INCIDENT_TYPES = {
    flood: { label: "Flood", title: "Flood warning" },
    wildfire: { label: "Wildfire", title: "Vegetation fire" },
    weather: { label: "Severe weather", title: "Severe weather cell" },
    rail: { label: "Rail disruption", title: "Rail service disruption" },
    power: { label: "Power outage", title: "Power supply interruption" },
    health: { label: "Health advisory", title: "Public health advisory" },
  };
  const TYPE_SEQUENCE = ["flood", "weather", "rail", "power", "wildfire", "health"];
  const SEVERITY_SEQUENCE = ["critical", "high", "moderate", "advisory", "high", "moderate"];
  const AGE_SEQUENCE = [1, 3, 6, 11, 18, 29, 45, 67, 86, 4, 22, 54, 9, 34];
  const STATUS_SEQUENCE = ["active", "active", "monitoring", "active", "resolved", "monitoring"];
  const elements = {
    mount: document.querySelector("#incident-map"),
    status: document.querySelector("#incident-status"),
    caption: document.querySelector("#incident-caption"),
    state: document.querySelector("#incident-state"),
    window: document.querySelector("#incident-window"),
    type: document.querySelector("#incident-type"),
    severity: [...document.querySelectorAll(".example-incident-severity input")],
    includeResolved: document.querySelector("#incident-include-resolved"),
    summary: document.querySelector("#incident-summary"),
    visibleCount: document.querySelector("#incident-visible-count"),
    criticalCount: document.querySelector("#incident-critical-count"),
    districtCount: document.querySelector("#incident-district-count"),
    reset: document.querySelector("#incident-reset"),
    export: document.querySelector("#incident-export"),
    list: document.querySelector("#incident-list"),
    detail: document.querySelector("#incident-detail"),
    detailTitle: document.querySelector("#incident-detail-title"),
    detailMeta: document.querySelector("#incident-detail-meta"),
    detailCopy: document.querySelector("#incident-detail-copy"),
    detailId: document.querySelector("#incident-detail-id"),
    acknowledge: document.querySelector("#incident-acknowledge"),
    resolve: document.querySelector("#incident-resolve"),
  };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  let currentState = null;
  let engine = null;
  let features = [];
  let featureBySlug = new Map();
  let incidents = [];
  let visibleIncidents = [];
  let markerLayer = null;
  let selectedIncidentId = null;
  let loadSequence = 0;

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function districtName(feature) {
    return feature.attributes.district || feature.attributes.name || feature.id;
  }

  function hashString(value) {
    return [...value].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
  }

  function districtRecord(feature) {
    const box = feature.element.getBBox();
    return {
      slug: feature.id,
      name: districtName(feature),
      point: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      featureId: feature.attributes.featureId || "",
      code: feature.attributes.code || "",
    };
  }

  function generateIncidents() {
    const base = Math.abs(hashString(currentState.slug));
    const count = Math.min(14, Math.max(6, Math.ceil(features.length / 3)));
    return Array.from({ length: count }, (_, index) => {
      const featureIndex = (base + index * 7 + index * index * 3) % features.length;
      const feature = features[featureIndex];
      const type = TYPE_SEQUENCE[(base + index) % TYPE_SEQUENCE.length];
      const severity = SEVERITY_SEQUENCE[index % SEVERITY_SEQUENCE.length];
      const ageHours = AGE_SEQUENCE[index % AGE_SEQUENCE.length];
      return {
        id: `DEMO-${currentState.code}-${String(index + 1).padStart(3, "0")}`,
        districtSlug: feature.id,
        type,
        severity,
        status: STATUS_SEQUENCE[index % STATUS_SEQUENCE.length],
        ageHours,
        title: INCIDENT_TYPES[type].title,
        note: `Synthetic ${INCIDENT_TYPES[type].label.toLowerCase()} report for interaction testing in ${districtName(feature)} district.`,
      };
    });
  }

  function selectedSeverities() {
    return new Set(elements.severity.filter((input) => input.checked).map((input) => input.value));
  }

  function filteredIncidents() {
    const severities = selectedSeverities();
    const hourLimit = elements.window.value === "all" ? Infinity : Number(elements.window.value);
    return incidents
      .filter((incident) => severities.has(incident.severity))
      .filter((incident) => elements.type.value === "all" || incident.type === elements.type.value)
      .filter((incident) => incident.ageHours <= hourLimit)
      .filter((incident) => elements.includeResolved.checked || incident.status !== "resolved")
      .sort((left, right) => {
        const severityDifference = SEVERITIES[right.severity].rank - SEVERITIES[left.severity].rank;
        return severityDifference || left.ageHours - right.ageHours || left.id.localeCompare(right.id);
      });
  }

  function relativeAge(hours) {
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ${hours % 24}h ago`;
  }

  function incidentsByDistrict() {
    const grouped = new Map();
    visibleIncidents.forEach((incident) => {
      const group = grouped.get(incident.districtSlug) || [];
      group.push(incident);
      grouped.set(incident.districtSlug, group);
    });
    return grouped;
  }

  function selectIncident(incidentId) {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return;
    selectedIncidentId = incident.id;
    const feature = featureBySlug.get(incident.districtSlug);
    elements.detail.hidden = false;
    elements.detailTitle.textContent = incident.title;
    elements.detailMeta.textContent = `${SEVERITIES[incident.severity].label} · ${INCIDENT_TYPES[incident.type].label} · ${incident.status} · ${relativeAge(incident.ageHours)}`;
    elements.detailCopy.textContent = incident.note;
    elements.detailId.textContent = `${incident.id} · ${feature.data.featureId || feature.id}`;
    elements.acknowledge.disabled = incident.status !== "active";
    elements.resolve.disabled = incident.status === "resolved";
    features.forEach((item) => item.element.classList.toggle("is-inspected", item.id === incident.districtSlug));
    elements.caption.textContent = `${incident.id}: ${incident.title} in ${feature.data.name}.`;
    renderSelectionState();
  }

  function renderSelectionState() {
    markerLayer?.querySelectorAll(".example-incident-marker").forEach((marker) => {
      marker.classList.toggle("is-selected", marker.dataset.incidentId === selectedIncidentId);
      marker.setAttribute("aria-pressed", String(marker.dataset.incidentId === selectedIncidentId));
    });
    elements.list.querySelectorAll("button[data-incident-id]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.incidentId === selectedIncidentId);
      button.setAttribute("aria-pressed", String(button.dataset.incidentId === selectedIncidentId));
    });
  }

  function markerShape(severity) {
    if (severity === "critical") return svgElement("polygon", { points: "0,-13 13,0 0,13 -13,0" });
    if (severity === "high") return svgElement("rect", { x: "-11", y: "-11", width: "22", height: "22", rx: "4" });
    if (severity === "advisory") return svgElement("polygon", { points: "0,-13 12,10 -12,10" });
    return svgElement("circle", { r: "11" });
  }

  function createIncidentMarker(incident, index, districtGroups) {
    const feature = featureBySlug.get(incident.districtSlug);
    const siblings = districtGroups.get(incident.districtSlug);
    const siblingIndex = siblings.findIndex((item) => item.id === incident.id);
    const angle = siblingIndex * (Math.PI * 2 / Math.max(1, siblings.length)) - Math.PI / 2;
    const offset = siblings.length > 1 ? 12 : 0;
    const x = feature.data.point.x + Math.cos(angle) * offset;
    const y = feature.data.point.y + Math.sin(angle) * offset;
    const group = svgElement("g", {
      class: `example-incident-marker is-${incident.severity}`,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      role: "button",
      tabindex: "0",
      "aria-pressed": "false",
      "aria-label": `${SEVERITIES[incident.severity].label} ${incident.title} in ${feature.data.name}, ${relativeAge(incident.ageHours)}, status ${incident.status}`,
    });
    group.dataset.incidentId = incident.id;
    const hit = svgElement("circle", { class: "example-incident-hit", r: "18" });
    const shape = markerShape(incident.severity);
    shape.classList.add("example-incident-symbol");
    const label = svgElement("text", { x: "0", y: "1" });
    label.textContent = SEVERITIES[incident.severity].short;
    group.append(hit, shape, label);
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      selectIncident(incident.id);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        selectIncident(incident.id);
      }
    });
    return group;
  }

  function createIncidentListItem(incident) {
    const feature = featureBySlug.get(incident.districtSlug);
    const item = document.createElement("li");
    const button = document.createElement("button");
    const symbol = document.createElement("i");
    const text = document.createElement("span");
    const name = document.createElement("strong");
    const meta = document.createElement("small");
    button.type = "button";
    button.dataset.incidentId = incident.id;
    button.setAttribute("aria-pressed", "false");
    symbol.className = `is-${incident.severity}`;
    symbol.textContent = SEVERITIES[incident.severity].short;
    name.textContent = incident.title;
    meta.textContent = `${feature.data.name} · ${relativeAge(incident.ageHours)} · ${incident.status}`;
    text.append(name, meta);
    button.append(symbol, text);
    button.addEventListener("click", () => selectIncident(incident.id));
    item.append(button);
    return item;
  }

  function render() {
    if (!features.length) return;
    visibleIncidents = filteredIncidents();
    const grouped = incidentsByDistrict();
    features.forEach((feature) => {
      const districtIncidents = grouped.get(feature.id) || [];
      const highest = districtIncidents[0] || null;
      Object.keys(SEVERITIES).forEach((severity) => feature.element.classList.toggle(`has-${severity}`, highest?.severity === severity));
      feature.element.classList.toggle("has-incidents", districtIncidents.length > 0);
      feature.element.setAttribute(
        "aria-label",
        districtIncidents.length
          ? `${feature.data.name} district. ${districtIncidents.length} visible ${districtIncidents.length === 1 ? "incident" : "incidents"}; highest severity ${SEVERITIES[highest.severity].label}. Activate to inspect.`
          : `${feature.data.name} district. No incidents match the current filters.`,
      );
    });
    markerLayer.replaceChildren(...visibleIncidents.map((incident, index) => createIncidentMarker(incident, index, grouped)));
    if (visibleIncidents.length) {
      elements.list.replaceChildren(...visibleIncidents.map(createIncidentListItem));
    } else {
      const empty = document.createElement("li");
      empty.className = "example-incident-empty";
      empty.textContent = "No incidents match these filters.";
      elements.list.replaceChildren(empty);
    }
    const criticalCount = visibleIncidents.filter((incident) => incident.severity === "critical").length;
    const activeCount = visibleIncidents.filter((incident) => incident.status === "active").length;
    elements.visibleCount.textContent = visibleIncidents.length;
    elements.criticalCount.textContent = criticalCount;
    elements.districtCount.textContent = grouped.size;
    elements.summary.textContent = `${activeCount} active, ${visibleIncidents.length - activeCount} monitoring or resolved, across ${grouped.size} districts.`;
    elements.status.textContent = `${visibleIncidents.length} visible alerts · ${grouped.size}/${features.length} districts affected`;
    elements.export.disabled = visibleIncidents.length === 0;
    if (selectedIncidentId && visibleIncidents.some((incident) => incident.id === selectedIncidentId)) {
      selectIncident(selectedIncidentId);
    } else {
      selectedIncidentId = null;
      elements.detail.hidden = true;
      features.forEach((feature) => feature.element.classList.remove("is-inspected"));
      renderSelectionState();
    }
  }

  function wireFeature(feature) {
    feature.element.setAttribute("tabindex", "0");
    feature.element.setAttribute("role", "button");
    const inspectDistrict = () => {
      const districtIncidents = visibleIncidents.filter((incident) => incident.districtSlug === feature.id);
      if (districtIncidents.length) {
        selectIncident(districtIncidents[0].id);
      } else {
        elements.caption.textContent = `${feature.data.name} has no incidents matching the current filters.`;
      }
    };
    feature.element.addEventListener("click", inspectDistrict);
    feature.element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inspectDistrict();
      }
    });
  }

  function updateIncidentStatus(status) {
    const incident = incidents.find((item) => item.id === selectedIncidentId);
    if (!incident) return;
    incident.status = status;
    const message = status === "monitoring" ? `${incident.id} acknowledged and moved to monitoring.` : `${incident.id} marked resolved.`;
    render();
    elements.caption.textContent = message;
  }

  function resetDemo() {
    elements.window.value = "72";
    elements.type.value = "all";
    elements.includeResolved.checked = false;
    elements.severity.forEach((input) => { input.checked = true; });
    incidents = generateIncidents();
    selectedIncidentId = null;
    render();
    elements.caption.textContent = `Synthetic incident feed reset for ${currentState.name}.`;
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportVisibleIncidents() {
    const fields = ["incident_id", "state", "district", "district_slug", "feature_id", "type", "severity", "status", "age_hours", "summary"];
    const rows = visibleIncidents.map((incident) => {
      const feature = featureBySlug.get(incident.districtSlug);
      return {
        incident_id: incident.id,
        state: currentState.name,
        district: feature.data.name,
        district_slug: feature.id,
        feature_id: feature.data.featureId,
        type: INCIDENT_TYPES[incident.type].label,
        severity: SEVERITIES[incident.severity].label,
        status: incident.status,
        age_hours: incident.ageHours,
        summary: incident.title,
      };
    });
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentState.slug}-incident-alerts.csv`;
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
    incidents = [];
    visibleIncidents = [];
    selectedIncidentId = null;
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
    features.forEach(wireFeature);
    markerLayer = svgElement("g", { class: "example-incident-marker-layer" });
    engine.svg.append(markerLayer);
    resetDemo();
  }

  function showError(error) {
    elements.status.textContent = "The incident workspace could not load.";
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
  [elements.window, elements.type, elements.includeResolved, ...elements.severity].forEach((control) => control.addEventListener("change", render));
  elements.reset.addEventListener("click", resetDemo);
  elements.export.addEventListener("click", exportVisibleIncidents);
  elements.acknowledge.addEventListener("click", () => updateIncidentStatus("monitoring"));
  elements.resolve.addEventListener("click", () => updateIncidentStatus("resolved"));

  initialize();
})();
