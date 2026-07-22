(function () {
  "use strict";

  const HOST = "https://nikhilsawantse.github.io/india-map-studio/";
  const PRESETS = {
    explorer: "Select a boundary and expose its stable identifier.",
    choropleth: "Color boundaries from low to high using joined numeric values.",
    markers: "Place proportional circles at boundary centroids.",
    "drill-down": "Turn each selected boundary into a route to the next map level.",
    ranking: "Keep a sorted ranking, summary values, and map colors in sync.",
    annotations: "Attach removable notes to selected boundaries and save them locally.",
    printable: "Add a clean print action for reports and handouts.",
  };
  const LAYERS = {
    india: {
      label: "India states and union territories",
      src: "assets/maps/india-states.svg",
      selector: ".map-region",
      nameKey: "state",
      unit: "regions",
    },
    district: {
      label: "Pune tehsils",
      src: "assets/maps/districts/maharashtra/pune.svg",
      selector: ".child-region",
      nameKey: "name",
      unit: "tehsils",
    },
  };

  const form = document.querySelector("#generator-form");
  const mapMount = document.querySelector("#generator-map");
  const stateSelect = document.querySelector("#generator-state");
  const stateField = document.querySelector("#state-field");
  const districtField = document.querySelector("#district-field");
  const presetSelect = document.querySelector("#generator-preset");
  const projectTitle = document.querySelector("#generator-project-title");
  const lowInput = document.querySelector("#generator-low");
  const highInput = document.querySelector("#generator-high");
  const selectedInput = document.querySelector("#generator-selected");
  const selectionInput = document.querySelector("#generator-selection");
  const legendInput = document.querySelector("#generator-legend");
  const listInput = document.querySelector("#generator-list");
  const csvInput = document.querySelector("#generator-csv");
  const status = document.querySelector("#generator-data-status");
  const copyStatus = document.querySelector("#generator-copy-status");
  const previewTitle = document.querySelector("#generator-preview-title");
  const featureCount = document.querySelector("#generator-feature-count");
  const legendPreview = document.querySelector("#generator-legend-preview");
  const selectionPreview = document.querySelector("#generator-selection-preview");
  const ranking = document.querySelector("#generator-ranking");
  const codeOutput = document.querySelector("#generator-code");

  let engine = null;
  let currentLayer = null;
  let currentRecords = [];
  let importedRecords = null;
  let loadSequence = 0;

  window.INDIA_STATES.forEach((state) => {
    const option = document.createElement("option");
    option.value = state.slug;
    option.textContent = `${state.name} · ${state.type}`;
    option.selected = state.slug === "maharashtra";
    stateSelect.append(option);
  });

  function selectedLevel() {
    return form.elements["map-level"].value;
  }

  function layerConfiguration() {
    const level = selectedLevel();
    if (level === "india") return { ...LAYERS.india, level };
    if (level === "district") return { ...LAYERS.district, level };
    const state = window.INDIA_STATES.find((item) => item.slug === stateSelect.value);
    return {
      level,
      label: `${state.name} districts`,
      src: state.svg,
      selector: ".district-region",
      nameKey: "district",
      unit: "districts",
      state,
    };
  }

  function featureLabel(feature) {
    return feature.attributes[currentLayer.nameKey] || feature.id.replaceAll("-", " ");
  }

  function sampleValue(index) {
    return 28 + ((index * 19 + 17) % 73);
  }

  function defaultRecords(features) {
    return features.map((feature, index) => ({
      slug: feature.id,
      label: featureLabel(feature),
      value: sampleValue(index),
    }));
  }

  function matchingRecords(features) {
    const defaults = defaultRecords(features);
    if (!importedRecords) return defaults;
    const imported = new Map(importedRecords.map((record) => [record.slug, record]));
    return defaults.map((record) => imported.get(record.slug) || record);
  }

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  }

  function mixColor(low, high, amount) {
    const a = hexToRgb(low);
    const b = hexToRgb(high);
    const values = a.map((value, index) => Math.round(value + (b[index] - value) * amount));
    return `rgb(${values.join(", ")})`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clearOverlay() {
    mapMount.querySelector("[data-generator-overlay]")?.remove();
  }

  function renderMarkers(records) {
    clearOverlay();
    if (presetSelect.value !== "markers" || !engine?.svg) return;
    const namespace = "http://www.w3.org/2000/svg";
    const group = document.createElementNS(namespace, "g");
    group.dataset.generatorOverlay = "markers";
    records.forEach((record) => {
      const feature = engine.getFeatureElement(record.slug);
      if (!feature) return;
      const box = feature.getBBox();
      const circle = document.createElementNS(namespace, "circle");
      circle.setAttribute("class", "generator-marker");
      circle.setAttribute("cx", box.x + box.width / 2);
      circle.setAttribute("cy", box.y + box.height / 2);
      circle.setAttribute("r", Math.max(2.4, Math.min(10, 2 + Number(record.value) / 16)));
      group.append(circle);
    });
    engine.svg.append(group);
  }

  function applyPreview() {
    if (!engine || !currentLayer) return;
    const preset = presetSelect.value;
    const records = currentRecords;
    const values = records.map((record) => Number(record.value)).filter(Number.isFinite);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bySlug = new Map(records.map((record) => [record.slug, record]));
    mapMount.style.setProperty("--generator-low", lowInput.value);
    mapMount.style.setProperty("--generator-high", highInput.value);
    mapMount.style.setProperty("--generator-selected", selectedInput.value);

    engine.getFeatures().forEach((feature) => {
      const record = bySlug.get(feature.id);
      const numeric = Number(record?.value);
      const scaled = max === min ? 0.5 : (numeric - min) / (max - min);
      const dataPreset = preset === "choropleth" || preset === "ranking";
      feature.element.style.setProperty(
        "--generator-fill",
        dataPreset && Number.isFinite(numeric) ? mixColor(lowInput.value, highInput.value, scaled) : lowInput.value,
      );
    });

    renderMarkers(records);
    legendPreview.hidden = !legendInput.checked || !["choropleth", "ranking", "markers"].includes(preset);
    ranking.hidden = !listInput.checked;
    ranking.replaceChildren();
    if (listInput.checked) {
      [...records]
        .sort((a, b) => Number(b.value) - Number(a.value))
        .slice(0, 8)
        .forEach((record, index) => {
          const item = document.createElement("li");
          item.innerHTML = `<b>${index + 1}</b><span>${escapeHtml(record.label)}</span><strong>${escapeHtml(record.value)}</strong>`;
          ranking.append(item);
        });
    }
    selectionPreview.hidden = !selectionInput.checked;
    previewTitle.textContent = projectTitle.value.trim() || "My India map";
    document.querySelector("#preset-description").textContent = PRESETS[preset];
    updateGeneratedCode();
  }

  async function loadLayer() {
    const sequence = ++loadSequence;
    currentLayer = layerConfiguration();
    featureCount.textContent = "Loading map…";
    selectionPreview.innerHTML = "<strong>Choose a region</strong><span>Select a boundary to inspect its stable slug.</span>";
    engine?.destroy();
    engine = new window.IndiaMapEngine({
      mount: mapMount,
      src: currentLayer.src,
      featureSelector: currentLayer.selector,
      featureKey: "slug",
      interactive: selectionInput.checked,
    });
    try {
      await engine.load();
      if (sequence !== loadSequence) return;
      engine.svg.querySelectorAll("a").forEach((anchor) => anchor.removeAttribute("href"));
      const features = engine.getFeatures();
      currentRecords = matchingRecords(features);
      featureCount.textContent = `${features.length} ${currentLayer.unit}`;
      const importedMatches = importedRecords
        ? currentRecords.filter((record) => importedRecords.some((item) => item.slug === record.slug)).length
        : 0;
      status.textContent = importedRecords
        ? `${importedMatches} imported rows matched this layer; unmatched features use sample values.`
        : `${features.length} synthetic sample rows are ready.`;
      engine.on("selectionchange", (event) => {
        const selected = currentRecords.find((record) => record.slug === event.detail.id);
        if (!selected) return;
        selectionPreview.innerHTML = `<strong>${escapeHtml(selected.label)}</strong><span>${escapeHtml(selected.slug)} · value ${escapeHtml(selected.value)}</span>`;
      });
      applyPreview();
    } catch (error) {
      featureCount.textContent = "Map unavailable";
      status.textContent = error.message;
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === "," && !quoted) { row.push(value); value = ""; }
      else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(value); value = "";
        if (row.some((cell) => cell.trim())) rows.push(row);
        row = [];
      } else value += character;
    }
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
    if (rows.length < 2) throw new Error("CSV must include a header and at least one data row.");
    const headers = rows.shift().map((header) => header.trim().toLowerCase());
    const slugIndex = headers.indexOf("slug");
    const labelIndex = headers.indexOf("label");
    const valueIndex = headers.indexOf("value");
    if (slugIndex < 0 || valueIndex < 0) throw new Error("CSV needs slug and value columns.");
    return rows
      .map((cells) => ({
        slug: (cells[slugIndex] || "").trim(),
        label: (cells[labelIndex] || cells[slugIndex] || "").trim(),
        value: Number((cells[valueIndex] || "").trim()),
      }))
      .filter((record) => record.slug && Number.isFinite(record.value));
  }

  function csvEscape(value) {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function recordsAsCsv() {
    return ["slug,label,value", ...currentRecords.map((record) => [record.slug, record.label, record.value].map(csvEscape).join(","))].join("\r\n");
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeJson(value) {
    return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
  }

  function generatedHtml() {
    const preset = presetSelect.value;
    const title = projectTitle.value.trim() || "My India map";
    const layer = currentLayer || layerConfiguration();
    const config = {
      title,
      preset,
      src: `${HOST}${layer.src}`,
      selector: layer.selector,
      nameKey: layer.nameKey,
      level: layer.level,
      low: lowInput.value,
      high: highInput.value,
      selected: selectedInput.value,
      allowSelection: selectionInput.checked,
      showLegend: legendInput.checked,
      showList: listInput.checked,
      drillBase:
        layer.level === "india"
          ? `${HOST}state.html?state=`
          : layer.level === "state"
            ? `${HOST}district.html?state=${layer.state.slug}&district=`
            : `${HOST}tehsil.html?state=maharashtra&district=pune&tehsil=`,
    };
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(PRESETS[preset]);
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style>
    :root { font-family: Inter, system-ui, sans-serif; color: #183129; background: #f4f1e8; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0; }
    header { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    h1 { margin: 0 0 6px; font-family: Georgia, serif; font-size: clamp(2rem, 5vw, 3.8rem); font-weight: 500; }
    p { margin: 0; color: #627168; }
    button { min-height: 42px; padding: 9px 14px; border: 1px solid #1b6656; border-radius: 9px; background: #fff; color: #174d41; font: inherit; font-weight: 750; cursor: pointer; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; border: 1px solid #d8d9d0; border-radius: 18px; background: #fffdf8; overflow: hidden; }
    #map { display: grid; min-height: 600px; place-items: center; padding: 28px; background: #eeece3; }
    #map svg { display: block; width: 100%; max-height: 660px; height: auto; }
    #map ${layer.selector} { fill: var(--fill, ${config.low}); stroke: #fff; stroke-width: 1; cursor: pointer; transition: filter 150ms ease, fill 150ms ease; }
    #map ${layer.selector}:is(:hover, :focus-visible, .is-hovered) { filter: brightness(.92); outline: none; }
    #map ${layer.selector}.is-selected { fill: ${config.selected}; filter: none; }
    .marker { fill: ${config.high}; fill-opacity: .8; stroke: #fff; stroke-width: 1.5; pointer-events: none; }
    aside { display: grid; align-content: start; gap: 16px; padding: 20px; border-left: 1px solid #dedfd6; }
    .legend { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 7px; font-size: .7rem; text-transform: uppercase; }
    .legend i { height: 9px; border-radius: 9px; background: linear-gradient(90deg, ${config.low}, ${config.high}); }
    #detail, .note-box { padding: 12px; border-radius: 10px; background: #edf1eb; overflow-wrap: anywhere; }
    #detail strong, #detail span { display: block; }
    #detail span { margin-top: 4px; color: #617068; font: .75rem ui-monospace, monospace; }
    #list, #notes { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
    #list li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 6px; font-size: .78rem; }
    #list b { color: ${config.high}; }
    .note-box { display: grid; gap: 8px; }
    .note-box input { width: 100%; min-height: 40px; padding: 8px; border: 1px solid #cdd4cc; border-radius: 7px; font: inherit; }
    #notes li { display: flex; justify-content: space-between; gap: 8px; font-size: .75rem; }
    #notes button { min-height: 28px; padding: 2px 7px; }
    @media (max-width: 760px) { header { display: grid; } .layout { grid-template-columns: 1fr; } #map { min-height: 420px; } aside { border: 0; border-top: 1px solid #dedfd6; } }
    @media print { body { background: #fff; } main { width: 100%; padding: 0; } header button, aside { display: none !important; } .layout { border: 0; } #map { min-height: 90vh; background: #fff; } }
  </style>
</head>
<body>
  <main>
    <header><div><h1>${escapedTitle}</h1><p>${escapedDescription}</p></div>${preset === "printable" ? '<button id="print-map" type="button">Print report</button>' : ""}</header>
    <div class="layout">
      <div id="map" aria-label="Interactive India map"></div>
      <aside>
        ${config.showLegend && ["choropleth", "ranking", "markers"].includes(preset) ? '<div class="legend"><span>Low</span><i></i><span>High</span></div>' : ""}
        ${config.allowSelection ? '<div id="detail"><strong>Choose a region</strong><span>Select a boundary to inspect its stable slug.</span></div>' : ""}
        ${preset === "annotations" ? '<div class="note-box"><label for="note">Note for selected region</label><input id="note"><button id="add-note" type="button">Add note</button></div><ul id="notes"></ul>' : ""}
        ${config.showList ? '<ol id="list"></ol>' : ""}
      </aside>
    </div>
  </main>
  <script src="${HOST}map-engine.js"><\/script>
  <script>
    const CONFIG = ${safeJson(config)};
    const DATA = ${safeJson(currentRecords)};
    const mount = document.querySelector("#map");
    const engine = new IndiaMapEngine({ mount, src: CONFIG.src, featureSelector: CONFIG.selector, featureKey: "slug", interactive: CONFIG.allowSelection });
    const bySlug = new Map(DATA.map(function (item) { return [item.slug, item]; }));
    function rgb(hex) { var value = hex.replace("#", ""); return [0, 2, 4].map(function (offset) { return parseInt(value.slice(offset, offset + 2), 16); }); }
    function color(amount) { var a = rgb(CONFIG.low); var b = rgb(CONFIG.high); return "rgb(" + a.map(function (value, index) { return Math.round(value + (b[index] - value) * amount); }).join(",") + ")"; }
    function renderNotes() {
      var list = document.querySelector("#notes"); if (!list) return;
      var notes = JSON.parse(localStorage.getItem("india-map-starter-notes") || "[]"); list.replaceChildren();
      notes.forEach(function (note, index) { var item = document.createElement("li"); var text = document.createElement("span"); text.textContent = note.label + ": " + note.text; var remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.addEventListener("click", function () { notes.splice(index, 1); localStorage.setItem("india-map-starter-notes", JSON.stringify(notes)); renderNotes(); }); item.append(text, remove); list.append(item); });
    }
    engine.load().then(function () {
      engine.svg.querySelectorAll("a").forEach(function (anchor) { anchor.removeAttribute("href"); });
      var values = DATA.map(function (item) { return Number(item.value); }).filter(Number.isFinite); var min = Math.min.apply(null, values); var max = Math.max.apply(null, values);
      engine.getFeatures().forEach(function (feature) { var record = bySlug.get(feature.id); var value = Number(record && record.value); var scale = max === min ? .5 : (value - min) / (max - min); if (CONFIG.preset === "choropleth" || CONFIG.preset === "ranking") feature.element.style.setProperty("--fill", color(scale)); });
      if (CONFIG.preset === "markers") { var group = document.createElementNS("http://www.w3.org/2000/svg", "g"); DATA.forEach(function (record) { var feature = engine.getFeatureElement(record.slug); if (!feature) return; var box = feature.getBBox(); var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("class", "marker"); circle.setAttribute("cx", box.x + box.width / 2); circle.setAttribute("cy", box.y + box.height / 2); circle.setAttribute("r", Math.max(2.4, Math.min(10, 2 + Number(record.value) / 16))); group.append(circle); }); engine.svg.append(group); }
      var list = document.querySelector("#list"); if (list) { DATA.slice().sort(function (a, b) { return Number(b.value) - Number(a.value); }).slice(0, 10).forEach(function (record, index) { var item = document.createElement("li"); item.innerHTML = "<b>" + (index + 1) + "</b><span></span><strong>" + record.value + "</strong>"; item.querySelector("span").textContent = record.label; list.append(item); }); }
    });
    engine.on("selectionchange", function (event) { var record = bySlug.get(event.detail.id); var detail = document.querySelector("#detail"); if (detail && record) { detail.querySelector("strong").textContent = record.label; detail.querySelector("span").textContent = record.slug + " · value " + record.value; } });
    engine.on("featureactivate", function (event) { if (CONFIG.preset === "drill-down") window.location.href = CONFIG.drillBase + encodeURIComponent(event.detail.id); });
    document.querySelector("#print-map")?.addEventListener("click", function () { window.print(); });
    document.querySelector("#add-note")?.addEventListener("click", function () { var selected = engine.getSelectedId(); var input = document.querySelector("#note"); if (!selected || !input.value.trim()) return; var record = bySlug.get(selected); var notes = JSON.parse(localStorage.getItem("india-map-starter-notes") || "[]"); notes.push({ slug: selected, label: record ? record.label : selected, text: input.value.trim() }); localStorage.setItem("india-map-starter-notes", JSON.stringify(notes)); input.value = ""; renderNotes(); });
    renderNotes();
  <\/script>
</body>
</html>`;
  }

  function updateGeneratedCode() {
    codeOutput.textContent = generatedHtml();
    document.querySelector("#generator-output-summary").textContent = `${PRESETS[presetSelect.value]} Includes ${currentRecords.length} data rows.`;
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "map-level") {
      const level = selectedLevel();
      stateField.hidden = level !== "state";
      districtField.hidden = level !== "district";
      importedRecords = null;
      csvInput.value = "";
      loadLayer();
      return;
    }
    if (event.target === stateSelect) {
      importedRecords = null;
      csvInput.value = "";
      loadLayer();
      return;
    }
    if (event.target === selectionInput) {
      loadLayer();
      return;
    }
    applyPreview();
  });
  projectTitle.addEventListener("input", applyPreview);
  [lowInput, highInput, selectedInput].forEach((input) => input.addEventListener("input", applyPreview));

  csvInput.addEventListener("change", async () => {
    const file = csvInput.files[0];
    if (!file) return;
    try {
      importedRecords = parseCsv(await file.text());
      currentRecords = matchingRecords(engine.getFeatures());
      applyPreview();
      const matched = currentRecords.filter((record) => importedRecords.some((item) => item.slug === record.slug)).length;
      status.textContent = `${matched} of ${importedRecords.length} imported rows matched this layer.`;
    } catch (error) {
      importedRecords = null;
      status.textContent = error.message;
    }
  });

  document.querySelector("#reset-generator-data").addEventListener("click", () => {
    importedRecords = null;
    csvInput.value = "";
    currentRecords = defaultRecords(engine.getFeatures());
    status.textContent = `${currentRecords.length} synthetic sample rows are ready.`;
    applyPreview();
  });
  document.querySelector("#download-generator-csv").addEventListener("click", () => download("india-map-sample.csv", recordsAsCsv(), "text/csv;charset=utf-8"));
  document.querySelector("#download-generator-html").addEventListener("click", () => download("india-map-starter.html", generatedHtml(), "text/html;charset=utf-8"));
  document.querySelector("#copy-generator-html").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml());
      copyStatus.textContent = "Complete HTML copied to your clipboard.";
    } catch (_error) {
      document.querySelector(".generator-code-details").open = true;
      copyStatus.textContent = "Clipboard access was unavailable. Select the generated HTML below to copy it.";
    }
  });

  document.querySelector("#preset-description").textContent = PRESETS[presetSelect.value];
  loadLayer();
})();
