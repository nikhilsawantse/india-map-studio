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
          elements.open.disabled = true;
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
    elements.status.textContent = `${engine.getFeatures().length} districts ready`;
  }

  elements.open.addEventListener("click", () => {
    if (selectedState) loadState(selectedState).catch(showError);
  });
  elements.back.addEventListener("click", () => loadIndia().catch(showError));

  function showError(error) {
    elements.status.textContent = "The requested map layer could not load.";
    elements.detail.textContent = error.message;
    console.error(error);
  }

  loadIndia().catch(showError);
})();
