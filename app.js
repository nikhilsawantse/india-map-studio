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
  const githubStars = document.querySelector("#github-stars");
  const githubForks = document.querySelector("#github-forks");

  let selectedSlug = null;
  const map = new window.IndiaMapEngine({
    mount: mapMount,
    src: "assets/maps/india-states.svg",
    data: states,
    featureSelector: ".map-region",
    featureKey: "slug",
  });

  function listButton(slug) {
    return stateList.querySelector(`[data-slug="${CSS.escape(slug)}"]`);
  }

  function setListHover(slug, active) {
    listButton(slug)?.classList.toggle("is-hovered", active);
  }

  function showTooltip(state, x, y) {
    if (!state) return;
    tooltipName.textContent = state.name;
    tooltipType.textContent = state.type;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  async function loadGitHubRepositoryStats() {
    if (!githubStars || !githubForks) return;
    if (window.location.hostname !== "nikhilsawantse.github.io") return;

    try {
      const response = await fetch(
        "https://api.github.com/repos/nikhilsawantse/india-map-studio",
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

      const repository = await response.json();
      const numberFormat = new Intl.NumberFormat(undefined, { notation: "compact" });
      githubStars.textContent = numberFormat.format(repository.stargazers_count || 0);
      githubForks.textContent = numberFormat.format(repository.forks_count || 0);
      githubStars.title = `${repository.stargazers_count || 0} GitHub stars`;
      githubForks.title = `${repository.forks_count || 0} GitHub forks`;
    } catch (error) {
      githubStars.textContent = "View";
      githubForks.textContent = "View";
      console.info("Live GitHub statistics are unavailable.", error);
    }
  }

  function updateSelection(slug) {
    if (selectedSlug) listButton(selectedSlug)?.classList.remove("is-active");
    selectedSlug = slug;
    if (!slug) {
      selectionCard.hidden = true;
      hideTooltip();
      return;
    }

    const state = statesBySlug.get(slug);
    if (!state) return;
    const button = listButton(slug);
    button?.classList.add("is-active");
    button?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    selectedName.textContent = state.name;
    selectedMeta.textContent = `${state.type} · ${state.identifier}`;
    selectedCode.textContent = state.code;
    openState.href = `state.html?state=${encodeURIComponent(state.slug)}`;
    rawStateSvg.href = state.svg;
    selectionCard.hidden = false;
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
      button.innerHTML = "<span></span><small></small>";
      button.querySelector("span").textContent = state.name;
      button.querySelector("small").textContent = state.type === "State" ? "State" : "UT";
      button.classList.toggle("is-active", state.slug === selectedSlug);
      button.addEventListener("pointerenter", () =>
        map.hover(state.slug, true, { source: "list" }),
      );
      button.addEventListener("pointerleave", () =>
        map.hover(state.slug, false, { source: "list" }),
      );
      button.addEventListener("focus", () => map.hover(state.slug, true, { source: "list" }));
      button.addEventListener("blur", () => map.hover(state.slug, false, { source: "list" }));
      button.addEventListener("click", () => map.select(state.slug, { source: "list" }));
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

  map.on("mapload", (event) => {
    mapPanel.classList.add("is-ready");
    mapStatus.textContent = `${event.detail.featureCount} interactive regions ready`;
  });
  map.on("maperror", (event) => {
    mapMount.innerHTML =
      '<p class="load-error">The SVG could not load. Run this folder through a local web server instead of opening the HTML file directly.</p>';
    mapStatus.textContent = "Map could not load";
    console.error(event.detail.error);
  });
  map.on("featureenter", (event) => {
    const { id, source, clientX, clientY } = event.detail;
    setListHover(id, true);
    if (source === "map") showTooltip(statesBySlug.get(id), clientX, clientY);
  });
  map.on("featuremove", (event) => {
    showTooltip(statesBySlug.get(event.detail.id), event.detail.clientX, event.detail.clientY);
  });
  map.on("featureleave", (event) => {
    setListHover(event.detail.id, false);
    if (event.detail.source === "map") hideTooltip();
  });
  map.on("featurefocus", (event) => {
    const state = statesBySlug.get(event.detail.id);
    setListHover(event.detail.id, true);
    if (state) mapStatus.textContent = `${state.name}, ${state.type}`;
  });
  map.on("featureblur", (event) => {
    setListHover(event.detail.id, false);
    mapStatus.textContent = `${map.getFeatures().length} interactive regions ready`;
  });
  map.on("selectionchange", (event) => updateSelection(event.detail.id));
  map.on("featureactivate", (event) => {
    window.location.href = `state.html?state=${encodeURIComponent(event.detail.id)}`;
  });

  searchInput.addEventListener("input", (event) => renderStateList(event.target.value));
  clearSelectionButton.addEventListener("click", () =>
    map.clearSelection({ source: "clear-button" }),
  );

  renderStateList();
  loadGitHubRepositoryStats();
  map.load().catch(() => {});
})();
