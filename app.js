(function () {
  "use strict";

  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const statesBySlug = new Map(states.map((state) => [state.slug, state]));
  const mapMount = document.querySelector("#india-map");
  const mapPanel = document.querySelector(".map-panel");
  const mapStatus = document.querySelector("#map-status");
  const stateList = document.querySelector("#state-list");
  const searchInput = document.querySelector("#state-search");
  const resultCount = document.querySelector("#result-count");
  const clearSelectionButton = document.querySelector("#clear-selection");
  const selectionCard = document.querySelector("#selection-card");
  const selectedName = document.querySelector("#selected-name");
  const selectedMeta = document.querySelector("#selected-meta");
  const selectedCode = document.querySelector("#selected-code");
  const openState = document.querySelector("#open-state");
  const rawStateSvg = document.querySelector("#raw-state-svg");
  const tooltip = document.querySelector("#map-tooltip");
  const tooltipName = document.querySelector("#tooltip-name");
  const tooltipType = document.querySelector("#tooltip-type");

  let selectedSlug = null;

  function regionElement(slug) {
    return mapMount.querySelector(`[data-slug="${CSS.escape(slug)}"]`);
  }

  function setRegionHover(slug, active) {
    const region = regionElement(slug);
    const listButton = stateList.querySelector(
      `[data-slug="${CSS.escape(slug)}"]`,
    );
    region?.classList.toggle("is-hovered", active);
    listButton?.classList.toggle("is-hovered", active);
  }

  function showTooltip(state, x, y) {
    tooltipName.textContent = state.name;
    tooltipType.textContent = state.type;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  function selectState(slug) {
    const state = statesBySlug.get(slug);
    if (!state) return;

    if (selectedSlug) {
      regionElement(selectedSlug)?.classList.remove("is-selected");
      stateList
        .querySelector(`[data-slug="${CSS.escape(selectedSlug)}"]`)
        ?.classList.remove("is-active");
    }

    selectedSlug = slug;
    regionElement(slug)?.classList.add("is-selected");
    const button = stateList.querySelector(
      `[data-slug="${CSS.escape(slug)}"]`,
    );
    button?.classList.add("is-active");
    button?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    selectedName.textContent = state.name;
    selectedMeta.textContent = `${state.type} · ${state.identifier}`;
    selectedCode.textContent = state.code;
    openState.href = `state.html?state=${encodeURIComponent(state.slug)}`;
    rawStateSvg.href = state.svg;
    selectionCard.hidden = false;
  }

  function clearSelection() {
    if (selectedSlug) {
      regionElement(selectedSlug)?.classList.remove("is-selected");
      stateList
        .querySelector(`[data-slug="${CSS.escape(selectedSlug)}"]`)
        ?.classList.remove("is-active");
    }
    selectedSlug = null;
    selectionCard.hidden = true;
    hideTooltip();
  }

  function renderStateList(filter = "") {
    const query = filter.trim().toLocaleLowerCase();
    const visibleStates = states.filter((state) =>
      `${state.name} ${state.type}`.toLocaleLowerCase().includes(query),
    );

    stateList.replaceChildren();
    visibleStates.forEach((state) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "state-button";
      button.dataset.slug = state.slug;
      button.innerHTML = `<span></span><small></small>`;
      button.querySelector("span").textContent = state.name;
      button.querySelector("small").textContent =
        state.type === "State" ? "State" : "UT";

      if (state.slug === selectedSlug) {
        button.classList.add("is-active");
      }

      button.addEventListener("pointerenter", () =>
        setRegionHover(state.slug, true),
      );
      button.addEventListener("pointerleave", () =>
        setRegionHover(state.slug, false),
      );
      button.addEventListener("focus", () => setRegionHover(state.slug, true));
      button.addEventListener("blur", () => setRegionHover(state.slug, false));
      button.addEventListener("click", () => selectState(state.slug));
      stateList.append(button);
    });

    resultCount.textContent = `${visibleStates.length} ${
      visibleStates.length === 1 ? "region" : "regions"
    }`;

    if (!visibleStates.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "No matching state or union territory.";
      stateList.append(emptyState);
    }
  }

  function wireMapInteractions() {
    const regions = mapMount.querySelectorAll(".map-region");

    regions.forEach((region) => {
      const state = statesBySlug.get(region.dataset.slug);
      if (!state) return;

      region.addEventListener("pointerenter", (event) => {
        setRegionHover(state.slug, true);
        showTooltip(state, event.clientX, event.clientY);
      });
      region.addEventListener("pointermove", (event) => {
        showTooltip(state, event.clientX, event.clientY);
      });
      region.addEventListener("pointerleave", () => {
        setRegionHover(state.slug, false);
        hideTooltip();
      });
      region.addEventListener("focus", () => {
        setRegionHover(state.slug, true);
        mapStatus.textContent = `${state.name}, ${state.type}`;
      });
      region.addEventListener("blur", () => {
        setRegionHover(state.slug, false);
        mapStatus.textContent = "36 interactive regions ready";
      });
      region.addEventListener("click", () => selectState(state.slug));
      region.addEventListener("dblclick", () => {
        window.location.href = `state.html?state=${encodeURIComponent(state.slug)}`;
      });
      region.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectState(state.slug);
        }
      });
    });
  }

  async function loadMap() {
    try {
      const response = await fetch("assets/maps/india-states.svg");
      if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
      mapMount.innerHTML = await response.text();
      wireMapInteractions();
      mapPanel.classList.add("is-ready");
      mapStatus.textContent = "36 interactive regions ready";
    } catch (error) {
      mapMount.innerHTML =
        '<p class="load-error">The SVG could not load. Run this folder through a local web server instead of opening the HTML file directly.</p>';
      mapStatus.textContent = "Map could not load";
      console.error(error);
    }
  }

  searchInput.addEventListener("input", (event) => {
    renderStateList(event.target.value);
  });
  clearSelectionButton.addEventListener("click", clearSelection);

  renderStateList();
  loadMap();
})();
