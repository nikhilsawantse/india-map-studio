(function () {
  "use strict";

  const INDICATORS = {
    population: { label: "Population estimate", minimum: 0.2, maximum: 6.8, decimals: 1, suffix: "M" },
    literacy: { label: "Literacy rate", minimum: 56, maximum: 96, decimals: 1, suffix: "%" },
    progress: { label: "Project progress", minimum: 24, maximum: 100, decimals: 0, suffix: "%" },
  };
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const elements = {
    mount: document.querySelector("#ranking-map"), status: document.querySelector("#ranking-status"), caption: document.querySelector("#ranking-caption"),
    level: document.querySelector("#ranking-level"), indicator: document.querySelector("#ranking-indicator"), state: document.querySelector("#ranking-state"), filter: document.querySelector("#ranking-filter"),
    average: document.querySelector("#ranking-average"), median: document.querySelector("#ranking-median"), range: document.querySelector("#ranking-range"), list: document.querySelector("#ranking-list"),
    detail: document.querySelector("#ranking-detail"), detailTitle: document.querySelector("#ranking-detail-title"), detailCopy: document.querySelector("#ranking-detail-copy"), detailId: document.querySelector("#ranking-detail-id"),
  };
  let engine = null;
  let records = [];
  let selectedSlug = null;
  let currentState = states.find((state) => state.slug === "maharashtra") || states[0];
  let loadSequence = 0;

  function hash(value) {
    return Math.abs([...value].reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0));
  }

  function valueFor(slug, indicator) {
    const definition = INDICATORS[indicator];
    const ratio = (hash(`${slug}:${indicator}`) % 1000) / 999;
    return definition.minimum + (definition.maximum - definition.minimum) * ratio;
  }

  function formatValue(value, indicator = elements.indicator.value) {
    const definition = INDICATORS[indicator];
    return `${value.toFixed(definition.decimals)}${definition.suffix}`;
  }

  function featureName(feature) {
    return feature.attributes.state || feature.attributes.district || feature.attributes.name || feature.id;
  }

  function colorFor(ratio) {
    const low = [222, 234, 227];
    const high = [34, 112, 91];
    const amount = Math.max(0, Math.min(1, ratio));
    return `rgb(${low.map((channel, index) => Math.round(channel + (high[index] - channel) * amount)).join(", ")})`;
  }

  function rankedRecords() {
    return records
      .map((record) => ({ ...record, value: valueFor(record.slug, elements.indicator.value) }))
      .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
      .map((record, index, collection) => ({ ...record, rank: index + 1, ratio: collection.length === 1 ? 1 : 1 - index / (collection.length - 1) }));
  }

  function filteredRecords(ranked) {
    const [direction, amountText] = elements.filter.value.split("-");
    if (elements.filter.value === "all") return ranked;
    const amount = Number(amountText);
    return direction === "top" ? ranked.slice(0, amount) : ranked.slice(-amount).reverse();
  }

  function showDetail(record) {
    selectedSlug = record.slug;
    elements.detail.hidden = false;
    elements.detailTitle.textContent = record.name;
    elements.detailCopy.textContent = `${INDICATORS[elements.indicator.value].label}: ${formatValue(record.value)} · Rank ${record.rank} of ${records.length}.`;
    elements.detailId.textContent = record.featureId || record.slug;
    records.forEach((item) => item.feature.element.classList.toggle("is-selected", item.slug === record.slug));
    elements.list.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.slug === record.slug));
    elements.caption.textContent = `${record.name} is ranked ${record.rank} of ${records.length} for ${INDICATORS[elements.indicator.value].label.toLowerCase()}.`;
  }

  function createRankingItem(record) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const rank = document.createElement("strong");
    const copy = document.createElement("span");
    const name = document.createElement("b");
    const bar = document.createElement("i");
    const value = document.createElement("em");
    button.type = "button";
    button.dataset.slug = record.slug;
    rank.textContent = String(record.rank);
    name.textContent = record.name;
    bar.style.setProperty("--ranking-width", `${Math.max(4, record.ratio * 100)}%`);
    value.textContent = formatValue(record.value);
    copy.append(name, bar);
    button.append(rank, copy, value);
    button.addEventListener("click", () => showDetail(record));
    item.append(button);
    return item;
  }

  function render() {
    if (!records.length) return;
    const ranked = rankedRecords();
    const filtered = filteredRecords(ranked);
    const visible = new Set(filtered.map((record) => record.slug));
    ranked.forEach((record) => {
      record.feature.element.style.setProperty("--ranking-fill", colorFor(record.ratio));
      record.feature.element.classList.toggle("is-filtered-out", !visible.has(record.slug));
      record.feature.element.setAttribute("aria-label", `${record.name}. ${INDICATORS[elements.indicator.value].label} ${formatValue(record.value)}. Rank ${record.rank} of ${ranked.length}.`);
    });
    elements.list.replaceChildren(...filtered.map(createRankingItem));
    const values = ranked.map((record) => record.value).sort((left, right) => left - right);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    elements.average.textContent = formatValue(average);
    elements.median.textContent = formatValue(median);
    elements.range.textContent = `${formatValue(values[0])}–${formatValue(values.at(-1))}`;
    const geography = elements.level.value === "states" ? "states and union territories" : `${currentState.name} districts`;
    elements.status.textContent = `${filtered.length}/${ranked.length} ${geography} · ${INDICATORS[elements.indicator.value].label}`;
    if (selectedSlug) {
      const selected = ranked.find((record) => record.slug === selectedSlug);
      if (selected) showDetail(selected);
    }
  }

  function wireRecord(record) {
    const inspect = () => {
      const ranked = rankedRecords();
      const selected = ranked.find((item) => item.slug === record.slug);
      if (selected) showDetail(selected);
    };
    record.feature.element.setAttribute("role", "button");
    record.feature.element.setAttribute("tabindex", "0");
    record.feature.element.addEventListener("click", inspect);
    record.feature.element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inspect(); }
    });
  }

  async function loadMap() {
    const sequence = ++loadSequence;
    engine?.destroy();
    selectedSlug = null;
    elements.detail.hidden = true;
    records = [];
    const stateMode = elements.level.value === "states";
    elements.state.disabled = stateMode;
    elements.status.textContent = stateMode ? "Loading national ranking…" : `Loading ${currentState.name} districts…`;
    engine = new IndiaMapEngine({ mount: elements.mount, src: stateMode ? "../assets/maps/india-states.svg" : `../${currentState.svg}`, featureSelector: stateMode ? ".map-region" : ".district-region", featureKey: "slug", interactive: false });
    await engine.load();
    if (sequence !== loadSequence) return;
    records = engine.getFeatures().map((feature) => ({ slug: feature.id, name: featureName(feature), featureId: feature.attributes.regionId || feature.attributes.featureId || "", feature }));
    records.forEach(wireRecord);
    render();
    elements.caption.textContent = stateMode ? "Nationwide state and union-territory ranking loaded." : `${currentState.name} district ranking loaded.`;
  }

  function initialize() {
    elements.state.replaceChildren(...states.slice().sort((left, right) => left.name.localeCompare(right.name)).map((state) => new Option(state.name, state.slug)));
    elements.state.value = currentState.slug;
    loadMap().catch(showError);
  }

  function showError(error) {
    elements.status.textContent = "The ranking dashboard could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  }

  elements.level.addEventListener("change", () => loadMap().catch(showError));
  elements.state.addEventListener("change", () => { currentState = states.find((state) => state.slug === elements.state.value) || currentState; loadMap().catch(showError); });
  elements.indicator.addEventListener("change", render);
  elements.filter.addEventListener("change", render);
  initialize();
})();
