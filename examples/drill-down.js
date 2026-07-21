(function () {
  "use strict";

  const elements = {
    mount: document.querySelector("#drill-map"),
    back: document.querySelector("#drill-back"),
    open: document.querySelector("#drill-open"),
    layer: document.querySelector("#drill-layer"),
    status: document.querySelector("#drill-status"),
    detail: document.querySelector("#drill-detail"),
    selection: document.querySelector("#drill-selection"),
    selectionMeta: document.querySelector("#drill-selection-meta"),
    districtPicker: document.querySelector("#drill-district-picker"),
    districtSelect: document.querySelector("#drill-district-select"),
  };
  const states = new Map(window.INDIA_STATES.map((state) => [state.slug, state]));
  let engine = null;
  let currentState = null;
  let selectedState = null;
  let unsubscribers = [];

  function disposeEngine() {
    unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
    engine?.destroy();
    engine = null;
  }

  function resetSelection(copy) {
    elements.selection.textContent = "Nothing selected";
    elements.selectionMeta.textContent = copy;
    elements.open.disabled = true;
    elements.districtSelect.value = "";
  }

  function setLayerControls(level) {
    const isDistrictLayer = level === "districts";
    elements.open.hidden = isDistrictLayer;
    elements.districtPicker.hidden = !isDistrictLayer;
    elements.mount.classList.toggle("is-national-layer", !isDistrictLayer);
    elements.mount.classList.toggle("is-district-layer", isDistrictLayer);
  }

  function populateDistrictPicker(features) {
    const options = features
      .map((feature) => ({ id: feature.id, name: featureName(feature, "districts") }))
      .sort((left, right) => left.name.localeCompare(right.name));
    elements.districtSelect.replaceChildren(
      new Option("Select a district...", ""),
      ...options.map((option) => new Option(option.name, option.id)),
    );
  }

  function featureName(feature, level) {
    if (!feature) return "Unknown feature";
    return level === "india"
      ? feature.data?.name || feature.attributes.state || feature.id
      : feature.attributes.district || feature.id;
  }

  function wireMap(level) {
    unsubscribers.push(
      engine.on("selectionchange", (event) => {
        const name = featureName(event.detail.feature, level);
        if (!event.detail.id) {
          resetSelection(
            level === "india"
              ? "Choose a state or union territory."
              : "Choose a district to inspect its stable slug.",
          );
          return;
        }
        elements.selection.textContent = name;
        if (level === "india") {
          selectedState = states.get(event.detail.id) || null;
          elements.selectionMeta.textContent = selectedState
            ? `${selectedState.type} · administrative code ${selectedState.code}`
            : "No matching district layer is registered.";
          elements.open.disabled = !selectedState;
        } else {
          elements.selectionMeta.textContent = `District slug: ${event.detail.id}`;
          elements.districtSelect.value = event.detail.id;
        }
        elements.detail.textContent = `${name} selected on the ${level === "india" ? "national" : "district"} layer.`;
      }),
    );
    if (level === "india") {
      unsubscribers.push(
        engine.on("featureactivate", (event) => {
          const state = states.get(event.detail.id);
          if (state) loadState(state);
        }),
      );
    }
  }

  async function loadIndia() {
    disposeEngine();
    currentState = null;
    selectedState = null;
    setLayerControls("india");
    elements.layer.textContent = "India";
    elements.back.hidden = true;
    elements.status.textContent = "Loading national layer…";
    elements.detail.textContent = "Choose a state or union territory to prepare the next layer.";
    resetSelection("Double-click a region or use the button to open its districts.");
    engine = new IndiaMapEngine({
      mount: elements.mount,
      src: "../assets/maps/india-states.svg",
      featureSelector: ".map-region",
      featureKey: "slug",
      dataKey: "slug",
      data: window.INDIA_STATES,
    });
    wireMap("india");
    await engine.load();
    elements.status.textContent = `${engine.getFeatures().length} regions ready`;
  }

  async function loadState(state) {
    disposeEngine();
    currentState = state;
    selectedState = null;
    setLayerControls("districts");
    elements.layer.textContent = `${state.name} / districts`;
    elements.back.hidden = false;
    elements.status.textContent = `Loading ${state.name} districts…`;
    elements.detail.textContent = "Choose a district to complete this two-level drill-down.";
    resetSelection("Choose a district to inspect its stable slug.");
    engine = new IndiaMapEngine({
      mount: elements.mount,
      src: `../${state.svg}`,
      featureSelector: ".district-region",
      featureKey: "slug",
    });
    wireMap("districts");
    await engine.load();
    const districts = engine.getFeatures();
    populateDistrictPicker(districts);
    elements.status.textContent = `${districts.length} districts ready`;
  }

  elements.open.addEventListener("click", () => {
    if (selectedState) loadState(selectedState).catch(showError);
  });
  elements.back.addEventListener("click", () => loadIndia().catch(showError));
  elements.districtSelect.addEventListener("change", () => {
    if (!engine || !elements.districtSelect.value) {
      engine?.clearSelection({ source: "district-picker" });
      return;
    }
    engine.select(elements.districtSelect.value, { source: "district-picker" });
    engine.getFeatureElement(elements.districtSelect.value)?.focus({ preventScroll: true });
  });

  function showError(error) {
    elements.status.textContent = "The requested map layer could not load.";
    elements.detail.textContent = error.message;
    console.error(error);
  }

  loadIndia().catch(showError);
})();
