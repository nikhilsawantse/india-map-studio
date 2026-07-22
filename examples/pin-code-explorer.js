(function () {
  "use strict";

  const elements = { mount: document.querySelector("#pin-map"), status: document.querySelector("#pin-status"), caption: document.querySelector("#pin-caption"), search: document.querySelector("#pin-search"), results: document.querySelector("#pin-results"), detail: document.querySelector("#pin-detail"), detailTitle: document.querySelector("#pin-detail-title"), detailCopy: document.querySelector("#pin-detail-copy"), detailId: document.querySelector("#pin-detail-id"), source: document.querySelector("#pin-record-source") };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  let records = [];
  let engine = null;
  let selected = null;

  function searchable(record) { return [record.pincode, record.office, record.officeType, record.district, record.state, record.division].join(" ").toLowerCase(); }

  function resultItem(record) {
    const item = document.createElement("li"); const button = document.createElement("button"); const code = document.createElement("strong"); const text = document.createElement("span"); const meta = document.createElement("small");
    button.type = "button"; button.classList.toggle("is-active", selected?.pincode === record.pincode); code.textContent = record.pincode; text.textContent = record.office; meta.textContent = `${record.district} · ${record.officeCount} ${record.officeCount === 1 ? "office" : "offices"} in record`;
    button.setAttribute("aria-label", `Show PIN ${record.pincode}, ${record.office}, ${record.district}`); button.append(code, text, meta); button.addEventListener("click", () => selectRecord(record)); item.append(button); return item;
  }

  function filteredRecords() {
    const query = elements.search.value.trim().toLowerCase(); return records.filter((record) => !query || searchable(record).includes(query));
  }

  function renderResults() {
    const matches = filteredRecords(); elements.results.replaceChildren(...matches.map(resultItem));
    elements.status.textContent = `${matches.length} of ${records.length} official sample PIN records shown`;
    if (!matches.length) { const item = document.createElement("li"); item.className = "example-pin-empty"; item.textContent = "No sample record matches. Download the JSON to replace or extend this adapter."; elements.results.append(item); }
  }

  function showSelectedFeature(record) {
    const feature = engine.getFeatures().find((item) => item.id === record.districtSlug);
    engine.select(feature?.id || null, { source: "directory" });
    engine.getFeatures().forEach((item) => item.element.classList.toggle("is-pin-muted", item !== feature));
    if (!feature) { elements.caption.textContent = `${record.district} is not matched in this SVG boundary vintage.`; return; }
    elements.caption.textContent = `PIN ${record.pincode} is linked to ${record.district} district in this sample adapter.`;
  }

  async function selectRecord(record) {
    selected = record; renderResults(); elements.detail.hidden = false; elements.detailTitle.textContent = `${record.pincode} · ${record.office}`; elements.detailCopy.textContent = `${record.officeType}, ${record.division} division, ${record.district}, ${record.state}. The official record contains ${record.officeCount} ${record.officeCount === 1 ? "office" : "offices"} for this PIN.`; elements.detailId.textContent = `PIN-${record.pincode} · ${record.stateSlug}/${record.districtSlug}`; elements.source.href = record.sourceUrl;
    const state = states.find((item) => item.slug === record.stateSlug); if (!state) return;
    if (!engine || engine.svg?.dataset?.stateSlug !== state.slug) {
      engine?.destroy(); engine = new IndiaMapEngine({ mount: elements.mount, src: `../${state.svg}`, featureSelector: ".district-region", featureKey: "slug", selectedClass: "is-pin-focus", interactive: false }); await engine.load(); engine.svg.dataset.stateSlug = state.slug;
      engine.getFeatures().forEach((feature) => { feature.element.removeAttribute("tabindex"); feature.element.setAttribute("role", "presentation"); feature.element.removeAttribute("aria-label"); });
    }
    showSelectedFeature(record);
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-pin-demo.json"); if (!response.ok) throw new Error(`PIN sample request failed (${response.status})`); const data = await response.json(); records = data.records || []; renderResults(); if (records[0]) await selectRecord(records[0]);
  }

  elements.search.addEventListener("input", renderResults);
  initialize().catch((error) => { elements.status.textContent = "The PIN explorer could not load."; elements.caption.textContent = error.message; console.error(error); });
})();
