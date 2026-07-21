(function () {
  "use strict";

  const elements = {
    mount: document.querySelector("#finder-map"),
    back: document.querySelector("#finder-back"),
    breadcrumb: document.querySelector("#finder-breadcrumb"),
    mapStatus: document.querySelector("#finder-map-status"),
    caption: document.querySelector("#finder-caption"),
    search: document.querySelector("#finder-search"),
    level: document.querySelector("#finder-level"),
    summary: document.querySelector("#finder-result-summary"),
    results: document.querySelector("#finder-results"),
    empty: document.querySelector("#finder-empty"),
    selection: document.querySelector("#finder-selection"),
    selectionName: document.querySelector("#finder-selection-name"),
    selectionPath: document.querySelector("#finder-selection-path"),
    selectionLevel: document.querySelector("#finder-selection-level"),
    selectionCode: document.querySelector("#finder-selection-code"),
    selectionLgd: document.querySelector("#finder-selection-lgd"),
    selectionId: document.querySelector("#finder-selection-id"),
    openPage: document.querySelector("#finder-open-page"),
  };

  const levelLabels = {
    state: "State / UT",
    district: "District",
    tehsil: "Tehsil",
  };
  let locations = [];
  let locationById = new Map();
  let engine = null;
  let currentLayer = { level: "india" };
  let mapUnsubscribers = [];
  let loadSequence = 0;

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function searchableText(location) {
    return normalize(
      [
        location.name,
        location.slug,
        location.type,
        location.code,
        location.lgdCode,
        location.identifier,
        location.stateName,
        location.districtName,
        ...(location.aliases || []),
      ].join(" "),
    );
  }

  function editDistance(left, right) {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    const current = new Array(right.length + 1);
    for (let row = 1; row <= left.length; row += 1) {
      current[0] = row;
      for (let column = 1; column <= right.length; column += 1) {
        const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + substitution,
        );
      }
      for (let column = 0; column <= right.length; column += 1) {
        previous[column] = current[column];
      }
    }
    return previous[right.length];
  }

  function matchScore(location, query) {
    const name = normalize(location.name);
    const slug = normalize(location.slug);
    const aliases = (location.aliases || []).map(normalize);
    const exactValues = [name, slug, normalize(location.code), normalize(location.lgdCode), normalize(location.identifier), ...aliases];
    if (exactValues.includes(query)) return 0;
    if ([name, slug, ...aliases].some((value) => value.startsWith(query))) return 1;
    const text = location._searchText;
    if (text.split(" ").some((word) => word.startsWith(query))) return 2;
    if (text.includes(query)) return 3;

    if (query.length < 3) return Number.POSITIVE_INFINITY;
    const candidates = [name, slug, ...aliases, ...name.split(" ")];
    const distance = Math.min(...candidates.map((candidate) => editDistance(query, candidate)));
    const allowance = Math.max(1, Math.floor(query.length * 0.34));
    return distance <= allowance ? 4 + distance / Math.max(query.length, 1) : Number.POSITIVE_INFINITY;
  }

  function locationPath(location) {
    if (location.level === "state") return `India / ${location.name}`;
    if (location.level === "district") return `India / ${location.stateName} / ${location.name}`;
    return `India / ${location.stateName} / ${location.districtName} / ${location.name}`;
  }

  function explorerUrl(location) {
    const parameters = new URLSearchParams({ state: location.stateSlug });
    if (location.level === "state") return `../state.html?${parameters}`;
    parameters.set("district", location.districtSlug || location.slug);
    if (location.level === "district") return `../district.html?${parameters}`;
    parameters.set("tehsil", location.slug);
    return `../tehsil.html?${parameters}`;
  }

  function showSelection(location) {
    elements.selection.hidden = false;
    elements.selectionName.textContent = location.name;
    elements.selectionPath.textContent = locationPath(location);
    elements.selectionLevel.textContent = location.type || levelLabels[location.level];
    elements.selectionCode.textContent = location.code || "Not declared";
    elements.selectionLgd.textContent = location.lgdCode || "Not declared";
    elements.selectionId.textContent = location.identifier;
    elements.openPage.href = explorerUrl(location);
    elements.caption.textContent = `${location.name} is highlighted on the ${levelLabels[location.level].toLowerCase()} layer.`;
  }

  function disposeMap() {
    mapUnsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
    engine?.destroy();
    engine = null;
  }

  function featureLocation(featureId) {
    if (!featureId) return null;
    if (currentLayer.level === "india") return locationById.get(`state:${featureId}`) || null;
    if (currentLayer.level === "district") {
      return locationById.get(`district:${currentLayer.stateSlug}:${featureId}`) || null;
    }
    return locationById.get(`tehsil:maharashtra:pune:${featureId}`) || null;
  }

  function wireMap() {
    mapUnsubscribers.push(
      engine.on("selectionchange", (event) => {
        const location = featureLocation(event.detail.id);
        if (location) showSelection(location);
      }),
    );
    if (currentLayer.level === "india") {
      mapUnsubscribers.push(
        engine.on("featureactivate", (event) => {
          const location = featureLocation(event.detail.id);
          if (location) loadLocation(location).catch(showError);
        }),
      );
    }
  }

  function layerConfiguration(location) {
    if (!location || location.level === "state") {
      return {
        level: "india",
        src: "../assets/maps/india-states.svg",
        featureSelector: ".map-region",
        featureKey: "slug",
        selectedSlug: location?.slug || "",
        breadcrumb: ["India"],
      };
    }
    if (location.level === "district") {
      return {
        level: "district",
        stateSlug: location.stateSlug,
        src: `../${location.mapSrc}`,
        featureSelector: ".district-region",
        featureKey: "slug",
        selectedSlug: location.slug,
        breadcrumb: ["India", location.stateName],
      };
    }
    return {
      level: "tehsil",
      stateSlug: location.stateSlug,
      districtSlug: location.districtSlug,
      src: `../${location.mapSrc}`,
      featureSelector: ".child-region",
      featureKey: "slug",
      selectedSlug: location.slug,
      breadcrumb: ["India", location.stateName, location.districtName],
    };
  }

  async function loadLocation(location) {
    const sequence = ++loadSequence;
    const configuration = layerConfiguration(location);
    disposeMap();
    if (!location) {
      elements.selection.hidden = true;
      elements.caption.textContent = "Search for a location or select a state directly on the map.";
    }
    currentLayer = configuration;
    elements.back.hidden = configuration.level === "india";
    elements.breadcrumb.replaceChildren(
      ...configuration.breadcrumb.map((part, index) => {
        const span = document.createElement(index === configuration.breadcrumb.length - 1 ? "strong" : "span");
        span.textContent = index ? ` / ${part}` : part;
        return span;
      }),
    );
    elements.mount.classList.toggle("is-national-layer", configuration.level === "india");
    elements.mount.classList.toggle("is-district-layer", configuration.level === "district");
    elements.mount.classList.toggle("is-tehsil-layer", configuration.level === "tehsil");
    elements.mapStatus.textContent = "Loading boundary layer…";
    engine = new IndiaMapEngine({
      mount: elements.mount,
      src: configuration.src,
      featureSelector: configuration.featureSelector,
      featureKey: configuration.featureKey,
    });
    wireMap();
    await engine.load();
    if (sequence !== loadSequence) return;
    if (configuration.selectedSlug) {
      engine.select(configuration.selectedSlug, { source: "location-finder" });
      engine.getFeatureElement(configuration.selectedSlug)?.focus({ preventScroll: true });
    }
    elements.mapStatus.textContent = `${engine.getFeatures().length} boundaries ready`;
    if (location) showSelection(location);
  }

  function createResult(location) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const main = document.createElement("span");
    const name = document.createElement("strong");
    const path = document.createElement("small");
    const level = document.createElement("span");
    button.type = "button";
    button.dataset.locationId = location.id;
    name.textContent = location.name;
    path.textContent = locationPath(location);
    level.textContent = levelLabels[location.level];
    level.className = "example-finder-level";
    main.append(name, path);
    button.append(main, level);
    button.addEventListener("click", () => loadLocation(location).catch(showError));
    item.append(button);
    return item;
  }

  function searchLocations() {
    const query = normalize(elements.search.value);
    const requestedLevel = elements.level.value;
    const candidates = locations.filter(
      (location) => requestedLevel === "all" || location.level === requestedLevel,
    );
    let matches;
    if (!query) {
      matches = candidates.filter((location) => location.level === "state").slice(0, 8);
    } else {
      matches = candidates
        .map((location) => ({ location, score: matchScore(location, query) }))
        .filter((match) => Number.isFinite(match.score))
        .sort((left, right) => left.score - right.score || left.location.name.localeCompare(right.location.name))
        .slice(0, 8)
        .map((match) => match.location);
    }
    elements.results.replaceChildren(...matches.map(createResult));
    elements.empty.hidden = matches.length > 0;
    if (!query) {
      elements.summary.textContent = "Showing a few states. Type to search all 800 published boundaries.";
    } else {
      elements.summary.textContent = `${matches.length} best ${matches.length === 1 ? "match" : "matches"} for “${elements.search.value.trim()}”`;
    }
  }

  function showError(error) {
    elements.mapStatus.textContent = "The requested boundary could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  }

  async function initialize() {
    const response = await fetch("../data/location-index.json");
    if (!response.ok) throw new Error(`Location index request failed (${response.status})`);
    const index = await response.json();
    locations = index.locations.map((location) => ({
      ...location,
      _searchText: searchableText(location),
    }));
    locationById = new Map(locations.map((location) => [location.id, location]));
    elements.summary.textContent = `${index.counts.total} published boundaries ready to search.`;
    searchLocations();
    await loadLocation(null);
  }

  elements.search.addEventListener("input", searchLocations);
  elements.level.addEventListener("change", searchLocations);
  elements.search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      const firstResult = elements.results.querySelector("button");
      if (firstResult) {
        event.preventDefault();
        firstResult.focus();
      }
    }
    if (event.key === "Escape") {
      elements.search.value = "";
      searchLocations();
    }
  });
  elements.results.addEventListener("keydown", (event) => {
    const buttons = [...elements.results.querySelectorAll("button")];
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    if (event.key === "ArrowDown" && buttons[currentIndex + 1]) {
      event.preventDefault();
      buttons[currentIndex + 1].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex === 0) elements.search.focus();
      else buttons[currentIndex - 1].focus();
    }
  });
  elements.back.addEventListener("click", () => loadLocation(null).catch(showError));

  initialize().catch(showError);
})();
