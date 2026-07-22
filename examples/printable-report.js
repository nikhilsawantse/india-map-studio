(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const elements = {
    mount: document.querySelector("#print-map"), state: document.querySelector("#print-state"), title: document.querySelector("#print-title"), legend: document.querySelector("#print-legend"), notes: document.querySelector("#print-notes"), previewTitle: document.querySelector("#print-preview-title"), previewSubtitle: document.querySelector("#print-preview-subtitle"), previewLegend: document.querySelector("#print-legend-title"), previewNotes: document.querySelector("#print-preview-notes"), selectedNames: document.querySelector("#print-selected-names"), districtList: document.querySelector("#print-district-list"), selectAll: document.querySelector("#print-all"), clear: document.querySelector("#print-clear"), print: document.querySelector("#print-browser"), svg: document.querySelector("#print-svg"), png: document.querySelector("#print-png"), status: document.querySelector("#print-status"),
  };
  let currentState = null;
  let engine = null;
  let features = [];
  let selected = new Set();
  let loadSequence = 0;

  function districtName(feature) { return feature.attributes.district || feature.attributes.name || feature.id; }

  function setSelectedVisual(feature, value) {
    feature.element.classList.toggle("is-print-selected", value);
    feature.element.setAttribute("aria-checked", String(value));
  }

  function render() {
    const chosen = features.filter((feature) => selected.has(feature.id));
    features.forEach((feature) => setSelectedVisual(feature, selected.has(feature.id)));
    elements.previewTitle.textContent = elements.title.value.trim() || "Untitled map report";
    elements.previewLegend.textContent = elements.legend.value.trim() || "Selected districts";
    elements.previewNotes.textContent = elements.notes.value.trim() || "No notes supplied.";
    elements.previewSubtitle.textContent = `${currentState?.name || "District map"} · ${chosen.length} of ${features.length} districts selected`;
    elements.selectedNames.textContent = chosen.length ? chosen.map(districtName).sort().join(", ") : "No districts selected.";
    elements.clear.disabled = chosen.length === 0;
    elements.status.textContent = `${chosen.length} selected from ${features.length} districts. Print and exports use the same selection.`;
    elements.districtList.querySelectorAll("input").forEach((input) => { input.checked = selected.has(input.value); });
  }

  function toggle(feature) {
    if (selected.has(feature.id)) selected.delete(feature.id); else selected.add(feature.id);
    render();
  }

  function wireFeature(feature) {
    feature.element.setAttribute("tabindex", "0");
    feature.element.setAttribute("role", "checkbox");
    feature.element.setAttribute("aria-label", `Include ${districtName(feature)} district in report`);
    feature.element.addEventListener("click", (event) => { event.stopPropagation(); toggle(feature); });
    feature.element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(feature); } });
  }

  function districtChoice(feature) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const span = document.createElement("span");
    input.type = "checkbox"; input.value = feature.id; span.textContent = districtName(feature);
    input.addEventListener("change", () => { if (input.checked) selected.add(feature.id); else selected.delete(feature.id); render(); });
    label.append(input, span); return label;
  }

  async function loadState(state) {
    const sequence = ++loadSequence;
    engine?.destroy(); currentState = state; selected = new Set(); features = [];
    elements.status.textContent = `Loading ${state.name} districts…`;
    engine = new IndiaMapEngine({ mount: elements.mount, src: `../${state.svg}`, featureSelector: ".district-region", featureKey: "slug", interactive: false });
    await engine.load(); if (sequence !== loadSequence) return;
    features = engine.getFeatures(); features.forEach(wireFeature);
    elements.districtList.replaceChildren(...features.slice().sort((a, b) => districtName(a).localeCompare(districtName(b))).map(districtChoice));
    render();
  }

  function textLines(value, length = 72) {
    const words = String(value).trim().split(/\s+/); const lines = []; let line = "";
    words.forEach((word) => { const next = `${line} ${word}`.trim(); if (next.length > length && line) { lines.push(line); line = word; } else line = next; });
    if (line) lines.push(line); return lines.slice(0, 5);
  }

  function createExportSvg() {
    const output = document.createElementNS(SVG_NAMESPACE, "svg");
    output.setAttribute("xmlns", SVG_NAMESPACE); output.setAttribute("viewBox", "0 0 1200 1500"); output.setAttribute("width", "1200"); output.setAttribute("height", "1500");
    const background = document.createElementNS(SVG_NAMESPACE, "rect"); background.setAttribute("width", "1200"); background.setAttribute("height", "1500"); background.setAttribute("fill", "#fffdf7"); output.append(background);
    const title = document.createElementNS(SVG_NAMESPACE, "text"); title.setAttribute("x", "90"); title.setAttribute("y", "105"); title.setAttribute("font-family", "Georgia, serif"); title.setAttribute("font-size", "52"); title.setAttribute("fill", "#10231f"); title.textContent = elements.previewTitle.textContent; output.append(title);
    const subtitle = document.createElementNS(SVG_NAMESPACE, "text"); subtitle.setAttribute("x", "92"); subtitle.setAttribute("y", "150"); subtitle.setAttribute("font-family", "Arial, sans-serif"); subtitle.setAttribute("font-size", "22"); subtitle.setAttribute("fill", "#536660"); subtitle.textContent = elements.previewSubtitle.textContent; output.append(subtitle);
    const nested = engine.svg.cloneNode(true); nested.setAttribute("x", "90"); nested.setAttribute("y", "195"); nested.setAttribute("width", "1020"); nested.setAttribute("height", "970"); nested.querySelectorAll("[tabindex]").forEach((node) => node.removeAttribute("tabindex"));
    nested.querySelectorAll(".district-region").forEach((region) => {
      const isSelected = selected.has(region.dataset.slug);
      region.classList.toggle("is-print-selected", isSelected);
      region.querySelectorAll("path, polygon, polyline").forEach((shape) => {
        shape.setAttribute("fill", isSelected ? "#bf6540" : "#e4ece6");
        shape.setAttribute("stroke", isSelected ? "#164f45" : "#61736d");
        shape.setAttribute("stroke-width", isSelected ? "2.2" : "1.2");
        shape.setAttribute("vector-effect", "non-scaling-stroke");
      });
    });
    nested.querySelectorAll("#state-outline path, #state-outline polygon, #state-outline polyline").forEach((shape) => {
      shape.setAttribute("fill", "none");
      shape.setAttribute("stroke", "#61736d");
      shape.setAttribute("stroke-width", "1.4");
      shape.setAttribute("vector-effect", "non-scaling-stroke");
    });
    output.append(nested);
    const swatch = document.createElementNS(SVG_NAMESPACE, "rect"); swatch.setAttribute("x", "92"); swatch.setAttribute("y", "1210"); swatch.setAttribute("width", "28"); swatch.setAttribute("height", "28"); swatch.setAttribute("rx", "5"); swatch.setAttribute("fill", "#bf6540"); output.append(swatch);
    const legend = document.createElementNS(SVG_NAMESPACE, "text"); legend.setAttribute("x", "138"); legend.setAttribute("y", "1233"); legend.setAttribute("font-family", "Arial, sans-serif"); legend.setAttribute("font-size", "23"); legend.setAttribute("fill", "#10231f"); legend.textContent = elements.previewLegend.textContent; output.append(legend);
    textLines(elements.previewNotes.textContent).forEach((line, index) => { const text = document.createElementNS(SVG_NAMESPACE, "text"); text.setAttribute("x", "92"); text.setAttribute("y", String(1300 + index * 32)); text.setAttribute("font-family", "Arial, sans-serif"); text.setAttribute("font-size", "21"); text.setAttribute("fill", "#536660"); text.textContent = line; output.append(text); });
    return output;
  }

  function download(filename, blob) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
  function exportSvg() { const source = new XMLSerializer().serializeToString(createExportSvg()); download(`${currentState.slug}-map-report.svg`, new Blob([source], { type: "image/svg+xml;charset=utf-8" })); }
  function exportPng() {
    const source = new XMLSerializer().serializeToString(createExportSvg()); const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" })); const image = new Image();
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1500; const context = canvas.getContext("2d"); context.drawImage(image, 0, 0); URL.revokeObjectURL(url); canvas.toBlob((blob) => { if (blob) download(`${currentState.slug}-map-report.png`, blob); }, "image/png"); };
    image.onerror = () => { URL.revokeObjectURL(url); elements.status.textContent = "PNG export failed. SVG export is still available."; }; image.src = url;
  }

  function showError(error) { elements.status.textContent = "The printable district layer could not load."; console.error(error); }
  elements.state.replaceChildren(...states.slice().sort((a, b) => a.name.localeCompare(b.name)).map((state) => new Option(state.name, state.slug))); elements.state.value = "maharashtra";
  elements.state.addEventListener("change", () => { const state = states.find((item) => item.slug === elements.state.value); if (state) loadState(state).catch(showError); });
  [elements.title, elements.legend, elements.notes].forEach((control) => control.addEventListener("input", render));
  elements.selectAll.addEventListener("click", () => { selected = new Set(features.map((feature) => feature.id)); render(); });
  elements.clear.addEventListener("click", () => { selected.clear(); render(); }); elements.print.addEventListener("click", () => window.print()); elements.svg.addEventListener("click", exportSvg); elements.png.addEventListener("click", exportPng);
  loadState(states.find((state) => state.slug === "maharashtra") || states[0]).catch(showError);
})();
