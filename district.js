(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SHAPE_SELECTOR = "path,polygon,rect,circle,ellipse";
  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const districtMaps =
    window.INDIA_DISTRICT_MAPS &&
    typeof window.INDIA_DISTRICT_MAPS === "object"
      ? window.INDIA_DISTRICT_MAPS
      : {};
  const params = new URLSearchParams(window.location.search);
  const requestedStateSlug = params.get("state") || "maharashtra";
  const requestedDistrictSlug = params.get("district") || "pune";
  const requestedChildLayer = params.get("layer") || "";
  const requestedChildRegion = params.get("region") || "";
  const state = states.find((item) => item.slug === requestedStateSlug);

  const layerDefinitions = [
    {
      key: "subdivisions",
      groupId: "subdivision-layer",
      label: "Subdivisions",
      singularLabel: "Subdivision",
      layerSuffix: "SUBDIVISIONS",
      featureSuffix: "SUBDIVISION",
    },
    {
      key: "tehsils",
      groupId: "tehsil-layer",
      label: "Tehsils or talukas",
      singularLabel: "Tehsil",
      layerSuffix: "TEHSILS",
      featureSuffix: "TEHSIL",
    },
    {
      key: "blocks",
      groupId: "block-layer",
      label: "Development blocks",
      singularLabel: "Development block",
      layerSuffix: "BLOCKS",
      featureSuffix: "BLOCK",
    },
    {
      key: "wards",
      groupId: "ward-layer",
      label: "Wards",
      singularLabel: "Ward",
      layerSuffix: "WARDS",
      featureSuffix: "WARD",
    },
    {
      key: "other",
      groupId: "other-boundary-layer",
      label: "Other local boundaries",
      singularLabel: "Local area",
      layerSuffix: "LOCAL-AREAS",
      featureSuffix: "LOCAL-AREA",
    },
  ];

  const elements = {
    backToState: document.querySelector("#back-to-state"),
    breadcrumb: document.querySelector("#district-breadcrumb"),
    eyebrow: document.querySelector("#district-page-eyebrow"),
    name: document.querySelector("#district-page-name"),
    facts: document.querySelector("#district-page-facts"),
    state: document.querySelector("#district-page-state"),
    division: document.querySelector("#district-page-division"),
    code: document.querySelector("#district-page-code"),
    lgd: document.querySelector("#district-page-lgd"),
    identifierPanel: document.querySelector("#district-identifier-panel"),
    identifier: document.querySelector("#district-page-identifier"),
    sourcePanel: document.querySelector("#district-boundary-source"),
    sourceLink: document.querySelector("#district-boundary-source-link"),
    sourceYear: document.querySelector("#district-boundary-source-year"),
    readyLayerCount: document.querySelector("#ready-child-layer-count"),
    layerList: document.querySelector("#district-child-layer-list"),
    childSelection: document.querySelector("#child-region-selection"),
    childName: document.querySelector("#child-region-name"),
    childLayer: document.querySelector("#child-region-layer"),
    childIdentifier: document.querySelector("#child-region-identifier"),
    openTehsil: document.querySelector("#open-tehsil-page"),
    clearChild: document.querySelector("#clear-child-region"),
    status: document.querySelector("#district-page-status"),
    mapStatus: document.querySelector("#district-page-map-status"),
    map: document.querySelector("#district-page-map"),
    tooltip: document.querySelector("#district-child-tooltip"),
    tooltipName: document.querySelector("#district-child-tooltip-name"),
    tooltipMeta: document.querySelector("#district-child-tooltip-meta"),
  };

  let district = null;
  let districtSvg = null;
  let childRegions = [];
  let selectedChildId = "";
  let selectedChildRegion = null;

  function statePageUrl(options = {}) {
    const search = new URLSearchParams({ state: state.slug });
    if (options.division) {
      search.set("division", options.division);
    }
    if (options.district) {
      search.set("district", options.district);
    }
    return `state.html?${search.toString()}`;
  }

  function districtMapKey(districtSlug) {
    return `${state.slug}/${districtSlug}`;
  }

  function districtPageUrl(options = {}) {
    const search = new URLSearchParams({
      state: state.slug,
      district: district.slug,
    });
    if (options.layer && options.region) {
      search.set("layer", options.layer);
      search.set("region", options.region);
    }
    return `district.html?${search.toString()}`;
  }

  function tehsilPageUrl(region) {
    const search = new URLSearchParams({
      state: state.slug,
      district: district.slug,
      tehsil: region.slug,
    });
    return `tehsil.html?${search.toString()}`;
  }

  function cleanText(value, fallback = "") {
    const cleaned = String(value || "")
      .replace(/^\s*(select|open|view)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || fallback;
  }

  function humanize(value) {
    return String(value || "")
      .replace(/[-_.:]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function parseSvg(text, errorMessage) {
    const documentNode = new DOMParser().parseFromString(
      text,
      "image/svg+xml",
    );
    const svg = documentNode.documentElement;
    if (
      documentNode.querySelector("parsererror") ||
      svg.localName.toLowerCase() !== "svg"
    ) {
      throw new Error(errorMessage);
    }
    return svg;
  }

  function districtFromRegion(region) {
    return {
      name: region.dataset.district || humanize(requestedDistrictSlug),
      slug: region.dataset.slug || requestedDistrictSlug,
      code: region.dataset.code || "",
      lgdCode: region.dataset.lgdCode || "",
      featureId:
        region.dataset.featureId ||
        `${state.identifier}-DISTRICT-${region.dataset.code || requestedDistrictSlug.toUpperCase()}`,
      divisionName: region.dataset.division || "",
      divisionSlug: region.dataset.divisionSlug || "",
      divisionId: region.dataset.divisionId || "",
      boundaryYear: region.dataset.boundaryYear || "",
      geometryType: region.dataset.geometryType || "",
    };
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([attribute, value]) => {
      element.setAttribute(attribute, value);
    });
    return element;
  }

  function removeSourceInteractions(element) {
    element
      .querySelectorAll("[tabindex],[role],[aria-label]")
      .forEach((node) => {
        node.removeAttribute("tabindex");
        node.removeAttribute("role");
        node.removeAttribute("aria-label");
      });
    element.removeAttribute("tabindex");
    element.removeAttribute("role");
    element.removeAttribute("aria-label");
  }

  function buildFocusedDistrictSvg(sourceSvg, sourceRegion) {
    const svg = createSvgElement("svg", {
      viewBox: sourceSvg.getAttribute("viewBox") || "0 0 1000 1100",
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-labelledby": "district-map-title district-map-description",
      "data-derived-outline": "true",
    });
    const title = createSvgElement("title", { id: "district-map-title" });
    title.textContent = `${district.name} district map`;
    const description = createSvgElement("desc", {
      id: "district-map-description",
    });
    description.textContent =
      `Focused outline of ${district.name} district with reserved child boundary layers.`;

    const outline = document.importNode(sourceRegion, true);
    removeSourceInteractions(outline);
    outline.id = "district-outline";
    outline.classList.remove("district-region");
    outline.classList.add("district-focus-region");
    outline.dataset.featureId = district.featureId;
    svg.append(title, description, outline);
    return svg;
  }

  function childLayerId(definition) {
    return `${district.featureId}-${definition.layerSuffix}`;
  }

  function childFeaturePattern(definition) {
    return `${district.featureId}-${definition.featureSuffix}-{CODE}`;
  }

  function ensureChildLayerGroups(svg) {
    layerDefinitions.forEach((definition) => {
      let layer =
        svg.querySelector(`[data-layer-type="${definition.key}"]`) ||
        svg.querySelector(`#${definition.groupId}`);
      if (!layer) {
        layer = createSvgElement("g", { id: definition.groupId });
        svg.append(layer);
      }
      layer.classList.add("district-child-layer");
      layer.dataset.layerType = definition.key;
      layer.dataset.layerId = layer.dataset.layerId || childLayerId(definition);
      layer.dataset.featurePattern =
        layer.dataset.featurePattern || childFeaturePattern(definition);
      if (!layer.dataset.status) {
        layer.dataset.status = layer.querySelector(SHAPE_SELECTOR)
          ? "ready"
          : "placeholder";
      }
      layer.setAttribute("aria-label", `${definition.label} boundary layer`);
    });
  }

  async function loadDedicatedDistrictSvg(config) {
    const response = await fetch(config.svg);
    if (!response.ok) {
      throw new Error(`District SVG request failed: ${response.status}`);
    }
    const svg = parseSvg(
      await response.text(),
      "The dedicated district SVG could not be parsed.",
    );
    const imported = document.importNode(svg, true);
    imported.dataset.assetSource = config.svg;
    return imported;
  }

  function setDistrictMetadata() {
    elements.eyebrow.textContent = district.divisionName
      ? `${district.divisionName} Division`
      : "District map";
    elements.name.textContent = district.name;
    elements.state.textContent = state.name;
    elements.division.textContent = district.divisionName;
    elements.division.closest("div").hidden = !district.divisionName;
    elements.code.textContent = district.code || "Not available";
    elements.lgd.textContent = district.lgdCode || "Not available";
    elements.identifier.textContent = district.featureId;
    elements.facts.hidden = false;
    elements.identifierPanel.hidden = false;
    elements.backToState.href = statePageUrl({ district: district.slug });
    document.title = `${district.name} district map - India Map Studio`;
  }

  function setBoundarySource(config) {
    if (!config?.sourceLabel || !config?.sourceUrl) {
      elements.sourcePanel.hidden = true;
      return;
    }
    elements.sourceLink.textContent = config.sourceLabel;
    elements.sourceLink.href = config.sourceUrl;
    elements.sourceYear.textContent = config.boundaryYear
      ? `Boundary vintage: ${config.boundaryYear}. For visualization and prototyping.`
      : "For visualization and prototyping.";
    elements.sourcePanel.hidden = false;
  }

  function appendBreadcrumb(label, href, current = false) {
    if (elements.breadcrumb.children.length) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "›";
      elements.breadcrumb.append(separator);
    }
    if (current) {
      const item = document.createElement("span");
      item.className = "breadcrumb-item is-current";
      item.setAttribute("aria-current", "page");
      item.textContent = label;
      elements.breadcrumb.append(item);
      return;
    }
    const link = document.createElement("a");
    link.className = "breadcrumb-item";
    link.href = href;
    link.textContent = label;
    elements.breadcrumb.append(link);
  }

  function renderBreadcrumb() {
    elements.breadcrumb.replaceChildren();
    appendBreadcrumb("India", "index.html");
    appendBreadcrumb(state.name, statePageUrl());
    if (district.divisionSlug) {
      appendBreadcrumb(
        `${district.divisionName} Division`,
        statePageUrl({ division: district.divisionSlug }),
      );
    }
    if (!selectedChildRegion) {
      appendBreadcrumb(`${district.name} District`, "", true);
      return;
    }
    appendBreadcrumb(`${district.name} District`, districtPageUrl());
    appendBreadcrumb(
      `${selectedChildRegion.name} ${selectedChildRegion.definition.singularLabel}`,
      "",
      true,
    );
  }

  function layerRegions(layer, definition) {
    let candidates = Array.from(
      layer.querySelectorAll(
        ".child-region,[data-child-region],[data-feature-id],[data-name]",
      ),
    ).filter((candidate) => candidate.querySelector(SHAPE_SELECTOR) ||
      candidate.matches(SHAPE_SELECTOR));

    if (candidates.length) {
      const candidateSet = new Set(candidates);
      candidates = candidates.filter((candidate) => {
        let parent = candidate.parentElement;
        while (parent && parent !== layer) {
          if (candidateSet.has(parent)) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      });
    }

    if (!candidates.length && layer.dataset.status === "ready") {
      candidates = Array.from(layer.children).filter((candidate) =>
        candidate.matches(SHAPE_SELECTOR),
      );
    }

    return candidates.map((element, index) => {
      const fallbackName = `${definition.label} ${index + 1}`;
      const name = cleanText(
        element.dataset.name ||
          element.dataset.region ||
          element.getAttribute("aria-label") ||
          element.querySelector(":scope > title")?.textContent ||
          humanize(element.id),
        fallbackName,
      );
      const identifier =
        element.dataset.featureId ||
        `${childLayerId(definition)}-FEATURE-${String(index + 1).padStart(3, "0")}`;
      element.classList.add("child-region");
      element.dataset.childRegion = "true";
      element.dataset.childRegionId = identifier;
      element.dataset.childRegionName = name;
      element.dataset.childLayerType = definition.key;
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", `Select ${name}`);
      return {
        element,
        name,
        slug: element.dataset.slug || slugify(name),
        identifier,
        definition,
      };
    });
  }

  function layerHasGeometry(layer) {
    return Boolean(layer.querySelector(SHAPE_SELECTOR));
  }

  function renderLayerRegistry() {
    childRegions = [];
    let readyCount = 0;
    const fragment = document.createDocumentFragment();

    layerDefinitions.forEach((definition) => {
      const layer = districtSvg.querySelector(
        `[data-layer-type="${definition.key}"]`,
      );
      const ready =
        layer.dataset.status === "ready" && layerHasGeometry(layer);
      if (ready) {
        readyCount += 1;
        childRegions.push(...layerRegions(layer, definition));
      }

      const row = document.createElement("label");
      row.className = "district-child-layer-row";
      row.dataset.status = ready ? "ready" : "reserved";

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = true;
      toggle.disabled = !ready;
      toggle.dataset.childLayerToggle = definition.key;
      toggle.addEventListener("change", () => {
        layer.classList.toggle("is-hidden", !toggle.checked);
        const selectedRegion = childRegions.find(
          (region) => region.identifier === selectedChildId,
        );
        if (
          !toggle.checked &&
          selectedRegion &&
          layer.contains(selectedRegion.element)
        ) {
          clearChildSelection();
        }
        elements.mapStatus.textContent = toggle.checked
          ? `${definition.label} layer visible`
          : `${definition.label} layer hidden`;
      });

      const copy = document.createElement("span");
      copy.className = "district-child-layer-row-copy";
      const label = document.createElement("strong");
      label.textContent = definition.label;
      const pattern = document.createElement("small");
      pattern.textContent = `Feature: ${childFeaturePattern(definition)}`;
      const identifier = document.createElement("code");
      identifier.textContent = childLayerId(definition);
      copy.append(label, pattern, identifier);

      const status = document.createElement("span");
      status.className = "district-child-layer-status";
      status.textContent = ready ? "Ready" : "Reserved";
      row.append(toggle, copy, status);
      fragment.append(row);
    });

    elements.layerList.replaceChildren(fragment);
    elements.readyLayerCount.textContent = `${readyCount} ready`;
    return readyCount;
  }

  function positionTooltip(clientX, clientY) {
    const rect = elements.tooltip.getBoundingClientRect();
    const padding = 14;
    let left = clientX + 14;
    let top = clientY + 14;
    if (left + rect.width + padding > window.innerWidth) {
      left = clientX - rect.width - 14;
    }
    if (top + rect.height + padding > window.innerHeight) {
      top = clientY - rect.height - 14;
    }
    elements.tooltip.style.left = `${Math.max(padding, left)}px`;
    elements.tooltip.style.top = `${Math.max(padding, top)}px`;
  }

  function showTooltip(region, clientX, clientY) {
    elements.tooltipName.textContent = region.name;
    elements.tooltipMeta.textContent =
      `${region.definition.label} · ${region.identifier}`;
    elements.tooltip.hidden = false;
    positionTooltip(clientX, clientY);
  }

  function hideTooltip() {
    elements.tooltip.hidden = true;
  }

  function updateChildUrl(region = null) {
    const url = region
      ? districtPageUrl({
          layer: region.definition.key,
          region: region.slug,
        })
      : districtPageUrl();
    window.history.replaceState({}, "", url);
  }

  function selectChildRegion(region, updateUrl = true) {
    selectedChildId = region.identifier;
    selectedChildRegion = region;
    childRegions.forEach((item) => {
      item.element.classList.toggle(
        "is-selected",
        item.identifier === selectedChildId,
      );
    });
    elements.childName.textContent = region.name;
    elements.childLayer.textContent = region.definition.label;
    elements.childIdentifier.textContent = region.identifier;
    const canOpenTehsil = region.definition.key === "tehsils";
    elements.openTehsil.hidden = !canOpenTehsil;
    if (canOpenTehsil) {
      elements.openTehsil.href = tehsilPageUrl(region);
      elements.openTehsil.textContent = `Open ${region.name} tehsil workspace →`;
    }
    elements.childSelection.hidden = false;
    renderBreadcrumb();
    if (updateUrl) {
      updateChildUrl(region);
    }
  }

  function clearChildSelection(updateUrl = true) {
    selectedChildId = "";
    selectedChildRegion = null;
    childRegions.forEach((item) => item.element.classList.remove("is-selected"));
    elements.childSelection.hidden = true;
    elements.openTehsil.hidden = true;
    hideTooltip();
    renderBreadcrumb();
    if (updateUrl && district) {
      updateChildUrl();
    }
  }

  function wireChildRegions() {
    childRegions.forEach((region) => {
      region.element.addEventListener("pointerenter", (event) => {
        showTooltip(region, event.clientX, event.clientY);
      });
      region.element.addEventListener("pointermove", (event) => {
        positionTooltip(event.clientX, event.clientY);
      });
      region.element.addEventListener("pointerleave", hideTooltip);
      region.element.addEventListener("focus", () => {
        const rect = region.element.getBoundingClientRect();
        showTooltip(
          region,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
      });
      region.element.addEventListener("blur", hideTooltip);
      region.element.addEventListener("click", () => selectChildRegion(region));
      region.element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectChildRegion(region);
        }
      });
    });
  }

  function applyRequestedChildSelection() {
    if (!requestedChildLayer || !requestedChildRegion) {
      return;
    }
    const region = childRegions.find(
      (item) =>
        item.definition.key === requestedChildLayer &&
        item.slug === requestedChildRegion,
    );
    if (region) {
      selectChildRegion(region, false);
    }
  }

  function fitDerivedOutline() {
    if (districtSvg.dataset.derivedOutline !== "true") {
      return;
    }
    window.requestAnimationFrame(() => {
      const outline = districtSvg.querySelector("#district-outline");
      if (!outline) {
        return;
      }
      try {
        const box = outline.getBBox();
        if (!box.width || !box.height) {
          return;
        }
        const padding = Math.max(box.width, box.height) * 0.12;
        districtSvg.setAttribute(
          "viewBox",
          [
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2,
          ].join(" "),
        );
      } catch {
        // The source viewBox remains a safe fallback.
      }
    });
  }

  function installDistrictSvg(svg, assetWarning = "", config = null) {
    districtSvg = svg;
    districtSvg.classList.add("district-detail-svg");
    districtSvg.removeAttribute("width");
    districtSvg.removeAttribute("height");
    districtSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    ensureChildLayerGroups(districtSvg);
    elements.map.replaceChildren(districtSvg);
    const readyCount = renderLayerRegistry();
    wireChildRegions();
    applyRequestedChildSelection();
    fitDerivedOutline();
    setBoundarySource(config);

    elements.mapStatus.textContent = readyCount
      ? `${readyCount} child boundary ${readyCount === 1 ? "layer" : "layers"} ready`
      : "District outline ready · child layers reserved";
    elements.status.textContent = assetWarning
      ? `${assetWarning} The state SVG outline is being used instead.`
      : readyCount
        ? "Child-layer geometry is ready for interaction."
        : `Outline ready. ${layerDefinitions.length} child-layer identifiers are reserved for future geometry.`;
  }

  function fail(message) {
    elements.name.textContent = "District unavailable";
    elements.status.textContent = message;
    elements.status.dataset.state = "error";
    elements.mapStatus.textContent = "District map unavailable";
    const error = document.createElement("p");
    error.className = "load-error";
    error.textContent = message;
    elements.map.replaceChildren(error);
  }

  async function initialize() {
    if (!state) {
      fail("Choose a valid state or union territory.");
      return;
    }

    elements.backToState.href = statePageUrl();
    try {
      const stateResponse = await fetch(state.svg);
      if (!stateResponse.ok) {
        throw new Error(`State SVG request failed: ${stateResponse.status}`);
      }
      const sourceSvg = parseSvg(
        await stateResponse.text(),
        "The state SVG could not be parsed.",
      );
      const sourceRegion = Array.from(
        sourceSvg.querySelectorAll(".district-region"),
      ).find((region) => region.dataset.slug === requestedDistrictSlug);
      if (!sourceRegion) {
        throw new Error(
          "This district is not available in the selected state map yet.",
        );
      }

      district = districtFromRegion(sourceRegion);
      setDistrictMetadata();
      renderBreadcrumb();

      const config = districtMaps[districtMapKey(district.slug)];
      let svg = buildFocusedDistrictSvg(sourceSvg, sourceRegion);
      let assetWarning = "";
      let installedConfig = null;
      if (config?.svg) {
        try {
          svg = await loadDedicatedDistrictSvg(config);
          installedConfig = config;
        } catch {
          assetWarning = "The dedicated district asset could not load.";
        }
      }
      installDistrictSvg(svg, assetWarning, installedConfig);
    } catch (error) {
      fail(
        error.message ||
          "The district page could not load. Run the project through a local web server.",
      );
    }
  }

  elements.clearChild.addEventListener("click", clearChildSelection);
  void initialize();
})();
