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
  const tehsilMaps =
    window.INDIA_TEHSIL_MAPS &&
    typeof window.INDIA_TEHSIL_MAPS === "object"
      ? window.INDIA_TEHSIL_MAPS
      : {};
  const params = new URLSearchParams(window.location.search);
  const requestedStateSlug = params.get("state") || "maharashtra";
  const requestedDistrictSlug = params.get("district") || "pune";
  const requestedTehsilSlug = params.get("tehsil") || "junnar";
  const requestedChildLayer = params.get("layer") || "";
  const requestedChildRegion = params.get("region") || "";
  const state = states.find((item) => item.slug === requestedStateSlug);

  const layerDefinitions = [
    {
      key: "blocks",
      groupId: "block-layer",
      label: "Development blocks",
      singularLabel: "Development block",
      layerSuffix: "BLOCKS",
      featureSuffix: "BLOCK",
    },
    {
      key: "villages",
      groupId: "village-layer",
      label: "Villages",
      singularLabel: "Village",
      layerSuffix: "VILLAGES",
      featureSuffix: "VILLAGE",
    },
    {
      key: "gram-panchayats",
      groupId: "gram-panchayat-layer",
      label: "Gram panchayats",
      singularLabel: "Gram panchayat",
      layerSuffix: "GRAM-PANCHAYATS",
      featureSuffix: "GRAM-PANCHAYAT",
    },
    {
      key: "wards",
      groupId: "ward-layer",
      label: "Municipal wards",
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
  const numericColors = [
    "#e8f1ec",
    "#c8ded4",
    "#9fc8b7",
    "#70a891",
    "#3e7765",
  ];
  const categoricalColors = [
    "#56849a",
    "#c47e63",
    "#6f9b7f",
    "#8b7aaa",
    "#b59451",
    "#667ea1",
    "#a16f82",
  ];
  const missingDataColor = "#e8e7df";
  const identifierFieldNames = new Set([
    "source_id",
    "source_code",
    "village_id",
    "village_name",
    "village",
    "name",
    "feature_id",
    "identifier",
    "id",
    "census_code",
    "lgd_code",
    "code",
    "slug",
  ]);
  const villageFieldTypeLabels = {
    auto: "Auto",
    text: "Text",
    number: "Number",
    date: "Date",
    category: "Category",
    percentage: "Percentage",
    currency: "Currency",
  };
  const villageFieldTypes = new Set(Object.keys(villageFieldTypeLabels));

  const elements = {
    skipToMap: document.querySelector("#skip-to-tehsil-map"),
    backToDistrict: document.querySelector("#back-to-district"),
    breadcrumb: document.querySelector("#tehsil-breadcrumb"),
    eyebrow: document.querySelector("#tehsil-page-eyebrow"),
    name: document.querySelector("#tehsil-page-name"),
    facts: document.querySelector("#tehsil-page-facts"),
    state: document.querySelector("#tehsil-page-state"),
    district: document.querySelector("#tehsil-page-district"),
    censusCode: document.querySelector("#tehsil-page-census-code"),
    lgdCode: document.querySelector("#tehsil-page-lgd-code"),
    identifierPanel: document.querySelector("#tehsil-identifier-panel"),
    identifier: document.querySelector("#tehsil-page-identifier"),
    sourcePanel: document.querySelector("#tehsil-boundary-source"),
    sourceLink: document.querySelector("#tehsil-boundary-source-link"),
    sourceYear: document.querySelector("#tehsil-boundary-source-year"),
    regionNavigator: document.querySelector("#tehsil-region-navigator"),
    regionSearch: document.querySelector("#tehsil-region-search"),
    regionResultsSummary: document.querySelector(
      "#tehsil-region-results-summary",
    ),
    regionList: document.querySelector("#tehsil-region-list"),
    regionEmpty: document.querySelector("#tehsil-region-empty"),
    villageActionBuilder: document.querySelector(
      "#tehsil-village-action-builder",
    ),
    villageActionSummary: document.querySelector(
      "#tehsil-village-action-summary",
    ),
    villageActionRegion: document.querySelector(
      "#tehsil-village-action-region",
    ),
    villageActionType: document.querySelector(
      "#tehsil-village-action-type",
    ),
    villageActionUrlField: document.querySelector(
      "#tehsil-village-action-url-field",
    ),
    villageActionUrl: document.querySelector(
      "#tehsil-village-action-url",
    ),
    villageActionTargetField: document.querySelector(
      "#tehsil-village-action-target-field",
    ),
    villageActionTarget: document.querySelector(
      "#tehsil-village-action-target",
    ),
    villageActionMapField: document.querySelector(
      "#tehsil-village-action-map-field",
    ),
    villageActionMap: document.querySelector(
      "#tehsil-village-action-map",
    ),
    saveVillageAction: document.querySelector(
      "#save-tehsil-village-action",
    ),
    resetVillageAction: document.querySelector(
      "#reset-tehsil-village-action",
    ),
    villageActionStatus: document.querySelector(
      "#tehsil-village-action-status",
    ),
    dataImport: document.querySelector("#tehsil-data-import"),
    dataBadge: document.querySelector("#tehsil-data-badge"),
    dataFile: document.querySelector("#tehsil-data-file"),
    clearData: document.querySelector("#clear-tehsil-data"),
    exportDataCsv: document.querySelector("#export-tehsil-data-csv"),
    exportDataJson: document.querySelector("#export-tehsil-data-json"),
    dataStatus: document.querySelector("#tehsil-data-status"),
    dataSummary: document.querySelector("#tehsil-data-summary"),
    dataRowCount: document.querySelector("#tehsil-data-row-count"),
    dataMatchCount: document.querySelector("#tehsil-data-match-count"),
    dataUnmatchedCount: document.querySelector(
      "#tehsil-data-unmatched-count",
    ),
    dataJoinField: document.querySelector("#tehsil-data-join-field"),
    dataValidationCount: document.querySelector(
      "#tehsil-data-validation-count",
    ),
    dataUnmatchedPreview: document.querySelector(
      "#tehsil-data-unmatched-preview",
    ),
    dataValidation: document.querySelector("#tehsil-data-validation"),
    dataValidationSummary: document.querySelector(
      "#tehsil-data-validation-summary",
    ),
    dataValidationOverview: document.querySelector(
      "#tehsil-data-validation-overview",
    ),
    dataValidationIssues: document.querySelector(
      "#tehsil-data-validation-issues",
    ),
    dataEditor: document.querySelector("#tehsil-data-editor"),
    dataEditorSummary: document.querySelector(
      "#tehsil-data-editor-summary",
    ),
    dataEditorField: document.querySelector(
      "#tehsil-data-editor-field",
    ),
    dataEditorSearch: document.querySelector(
      "#tehsil-data-editor-search",
    ),
    dataEditorFieldType: document.querySelector(
      "#tehsil-data-editor-field-type",
    ),
    dataEditorFieldRequired: document.querySelector(
      "#tehsil-data-editor-field-required",
    ),
    dataEditorSaveFieldSettings: document.querySelector(
      "#tehsil-data-editor-save-field-settings",
    ),
    dataEditorNewField: document.querySelector(
      "#tehsil-data-editor-new-field",
    ),
    dataEditorAddField: document.querySelector(
      "#tehsil-data-editor-add-field",
    ),
    dataEditorBulkValue: document.querySelector(
      "#tehsil-data-editor-bulk-value",
    ),
    dataEditorBulkSet: document.querySelector(
      "#tehsil-data-editor-bulk-set",
    ),
    dataEditorBulkClear: document.querySelector(
      "#tehsil-data-editor-bulk-clear",
    ),
    dataEditorAdvancedBulk: document.querySelector(
      "#tehsil-data-editor-advanced-bulk",
    ),
    dataEditorSelectionSummary: document.querySelector(
      "#tehsil-data-editor-selection-summary",
    ),
    dataEditorBulkScope: document.querySelector(
      "#tehsil-data-editor-bulk-scope",
    ),
    dataEditorBulkOperation: document.querySelector(
      "#tehsil-data-editor-bulk-operation",
    ),
    dataEditorBulkPrimaryField: document.querySelector(
      "#tehsil-data-editor-bulk-primary-field",
    ),
    dataEditorBulkPrimaryLabel: document.querySelector(
      "#tehsil-data-editor-bulk-primary-label",
    ),
    dataEditorBulkPrimary: document.querySelector(
      "#tehsil-data-editor-bulk-primary",
    ),
    dataEditorBulkSecondaryField: document.querySelector(
      "#tehsil-data-editor-bulk-secondary-field",
    ),
    dataEditorBulkSecondary: document.querySelector(
      "#tehsil-data-editor-bulk-secondary",
    ),
    dataEditorBulkSourceField: document.querySelector(
      "#tehsil-data-editor-bulk-source-field",
    ),
    dataEditorBulkSource: document.querySelector(
      "#tehsil-data-editor-bulk-source",
    ),
    dataEditorBulkStage: document.querySelector(
      "#tehsil-data-editor-bulk-stage",
    ),
    dataEditorBulkStatus: document.querySelector(
      "#tehsil-data-editor-bulk-status",
    ),
    dataEditorSelectVisible: document.querySelector(
      "#tehsil-data-editor-select-visible",
    ),
    dataEditorRows: document.querySelector("#tehsil-data-editor-rows"),
    dataEditorApply: document.querySelector("#tehsil-data-editor-apply"),
    dataEditorDiscard: document.querySelector(
      "#tehsil-data-editor-discard",
    ),
    dataEditorStatus: document.querySelector(
      "#tehsil-data-editor-status",
    ),
    dataVisualization: document.querySelector(
      "#tehsil-data-visualization",
    ),
    visualizationField: document.querySelector(
      "#tehsil-visualization-field",
    ),
    visualizationTypeBadge: document.querySelector(
      "#tehsil-visualization-type-badge",
    ),
    clearVisualization: document.querySelector(
      "#clear-tehsil-visualization",
    ),
    visualizationStatus: document.querySelector(
      "#tehsil-visualization-status",
    ),
    dataFilter: document.querySelector("#tehsil-data-filter"),
    dataFilterBadge: document.querySelector("#tehsil-data-filter-badge"),
    dataFilterField: document.querySelector("#tehsil-data-filter-field"),
    dataFilterOperator: document.querySelector(
      "#tehsil-data-filter-operator",
    ),
    dataFilterValueLabel: document.querySelector(
      "#tehsil-data-filter-value-label",
    ),
    dataFilterValue: document.querySelector("#tehsil-data-filter-value"),
    dataFilterSecondaryField: document.querySelector(
      "#tehsil-data-filter-secondary-field",
    ),
    dataFilterValueSecondary: document.querySelector(
      "#tehsil-data-filter-value-secondary",
    ),
    dataFilterSuggestions: document.querySelector(
      "#tehsil-data-filter-suggestions",
    ),
    applyDataFilter: document.querySelector("#apply-tehsil-data-filter"),
    clearDataFilter: document.querySelector("#clear-tehsil-data-filter"),
    dataFilterStatus: document.querySelector(
      "#tehsil-data-filter-status",
    ),
    exportWorkspace: document.querySelector("#export-tehsil-workspace"),
    importWorkspace: document.querySelector("#import-tehsil-workspace"),
    workspaceStatus: document.querySelector("#tehsil-workspace-status"),
    exportStandaloneMap: document.querySelector(
      "#export-standalone-tehsil-map",
    ),
    standaloneExportStatus: document.querySelector(
      "#tehsil-standalone-export-status",
    ),
    embedCodeSummary: document.querySelector(
      "#tehsil-embed-code-summary",
    ),
    embedFormatButtons: Array.from(
      document.querySelectorAll("[data-tehsil-embed-format]"),
    ),
    embedMapUrl: document.querySelector("#tehsil-embed-map-url"),
    embedMapHeight: document.querySelector("#tehsil-embed-map-height"),
    embedCodeOutput: document.querySelector("#tehsil-embed-code-output"),
    copyEmbedCode: document.querySelector("#copy-tehsil-embed-code"),
    embedCodeStatus: document.querySelector(
      "#tehsil-embed-code-status",
    ),
    snapshotBadge: document.querySelector("#tehsil-snapshot-badge"),
    saveSnapshot: document.querySelector("#save-tehsil-snapshot"),
    restoreSnapshot: document.querySelector("#restore-tehsil-snapshot"),
    deleteSnapshot: document.querySelector("#delete-tehsil-snapshot"),
    snapshotStatus: document.querySelector("#tehsil-snapshot-status"),
    undoChange: document.querySelector("#undo-tehsil-change"),
    redoChange: document.querySelector("#redo-tehsil-change"),
    historyStatus: document.querySelector("#tehsil-history-status"),
    dataLegend: document.querySelector("#tehsil-data-legend"),
    dataLegendTitle: document.querySelector("#tehsil-data-legend-title"),
    dataLegendType: document.querySelector("#tehsil-data-legend-type"),
    dataLegendItems: document.querySelector("#tehsil-data-legend-items"),
    readyLayerCount: document.querySelector("#ready-tehsil-layer-count"),
    layerList: document.querySelector("#tehsil-child-layer-list"),
    childSelection: document.querySelector("#tehsil-child-selection"),
    childName: document.querySelector("#tehsil-child-name"),
    childLayer: document.querySelector("#tehsil-child-layer"),
    childSourceId: document.querySelector("#tehsil-child-source-id"),
    childGeometry: document.querySelector("#tehsil-child-geometry"),
    childCensusCode: document.querySelector("#tehsil-child-census-code"),
    childLgdCode: document.querySelector("#tehsil-child-lgd-code"),
    childDataValue: document.querySelector("#tehsil-child-data-value"),
    childDataField: document.querySelector("#tehsil-child-data-field"),
    childDataContent: document.querySelector("#tehsil-child-data-content"),
    childIdentifier: document.querySelector("#tehsil-child-identifier"),
    copyChildSource: document.querySelector("#copy-tehsil-child-source"),
    copyChildId: document.querySelector("#copy-tehsil-child-id"),
    copyChildLink: document.querySelector("#copy-tehsil-child-link"),
    childCopyStatus: document.querySelector("#tehsil-child-copy-status"),
    clearChild: document.querySelector("#clear-tehsil-child"),
    status: document.querySelector("#tehsil-page-status"),
    mapStatus: document.querySelector("#tehsil-page-map-status"),
    map: document.querySelector("#tehsil-page-map"),
    labelControls: document.querySelector("#tehsil-label-controls"),
    labelModeButtons: Array.from(
      document.querySelectorAll("[data-tehsil-label-mode]"),
    ),
    tooltip: document.querySelector("#tehsil-child-tooltip"),
    tooltipName: document.querySelector("#tehsil-child-tooltip-name"),
    tooltipMeta: document.querySelector("#tehsil-child-tooltip-meta"),
  };

  let district = null;
  let tehsil = null;
  let tehsilSvg = null;
  let childRegions = [];
  let selectedChildRegion = null;
  let defaultViewBox = "";
  let currentLabelMode = "selected";
  let labelLayer = null;
  let copyStatusTimer = null;
  let importedVillageDataset = null;
  let currentVillageVisualization = null;
  let activeVillageDataFilter = null;
  let configuredVillageDataFilterKind = null;
  const historyLimit = 30;
  const undoHistory = [];
  const redoHistory = [];
  let historyReady = false;
  let historyIsRestoring = false;
  let searchHistorySnapshot = null;
  const villageDataEditorDrafts = new Map();
  const villageDataEditorSelection = new Set();
  const villageActions = new Map();
  let embedFormat = "iframe";
  let embedUrlCustomized = false;

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

  function tehsilPageUrl(options = {}) {
    const search = new URLSearchParams({
      state: state.slug,
      district: district.slug,
      tehsil: tehsil.slug,
    });
    if (options.layer && options.region) {
      search.set("layer", options.layer);
      search.set("region", options.region);
    }
    return `tehsil.html?${search.toString()}`;
  }

  function districtMapKey() {
    return `${state.slug}/${requestedDistrictSlug}`;
  }

  function tehsilMapKey() {
    return `${state.slug}/${district.slug}/${tehsil.slug}`;
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

  async function loadSvg(path, errorMessage) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`${errorMessage} (${response.status})`);
    }
    return parseSvg(await response.text(), errorMessage);
  }

  function districtFromRegion(region) {
    return {
      name: region.dataset.district || requestedDistrictSlug,
      slug: region.dataset.slug || requestedDistrictSlug,
      code: region.dataset.code || "",
      lgdCode: region.dataset.lgdCode || "",
      featureId:
        region.dataset.featureId ||
        `${state.identifier}-DISTRICT-${region.dataset.code || requestedDistrictSlug.toUpperCase()}`,
      divisionName: region.dataset.division || "Not specified",
      divisionSlug: region.dataset.divisionSlug || "",
    };
  }

  function tehsilFromRegion(region) {
    return {
      name: region.dataset.name || requestedTehsilSlug,
      slug: region.dataset.slug || requestedTehsilSlug,
      censusCode: region.dataset.censusCode || "",
      lgdCode: region.dataset.lgdCode || "",
      featureId:
        region.dataset.featureId ||
        `${district.featureId}-TEHSIL-${region.dataset.censusCode || requestedTehsilSlug.toUpperCase()}`,
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

  function buildFocusedTehsilSvg(sourceSvg, sourceRegion) {
    const svg = createSvgElement("svg", {
      viewBox: sourceSvg.getAttribute("viewBox") || "0 0 1000 1100",
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-labelledby": "tehsil-map-title tehsil-map-description",
      "data-derived-outline": "true",
    });
    const title = createSvgElement("title", { id: "tehsil-map-title" });
    title.textContent = `${tehsil.name} tehsil map`;
    const description = createSvgElement("desc", {
      id: "tehsil-map-description",
    });
    description.textContent =
      `Focused outline of ${tehsil.name} tehsil with reserved local boundary layers.`;

    const outline = document.importNode(sourceRegion, true);
    removeSourceInteractions(outline);
    outline.id = "tehsil-outline";
    outline.classList.remove("child-region", "is-selected");
    outline.classList.add("district-focus-region", "tehsil-focus-region");
    outline.dataset.featureId = tehsil.featureId;
    svg.append(title, description, outline);
    return svg;
  }

  function layerId(definition) {
    return `${tehsil.featureId}-${definition.layerSuffix}`;
  }

  function featurePattern(definition) {
    return `${tehsil.featureId}-${definition.featureSuffix}-{CODE}`;
  }

  function ensureLayerGroups(svg) {
    layerDefinitions.forEach((definition) => {
      let layer =
        svg.querySelector(`[data-layer-type="${definition.key}"]`) ||
        svg.querySelector(`#${definition.groupId}`);
      if (!layer) {
        layer = createSvgElement("g", { id: definition.groupId });
        svg.append(layer);
      }
      layer.classList.add("district-child-layer", "tehsil-child-layer");
      layer.dataset.layerType = definition.key;
      layer.dataset.layerId = layer.dataset.layerId || layerId(definition);
      layer.dataset.featurePattern =
        layer.dataset.featurePattern || featurePattern(definition);
      if (!layer.dataset.status) {
        layer.dataset.status = layer.querySelector(SHAPE_SELECTOR)
          ? "ready"
          : "placeholder";
      }
      layer.setAttribute("aria-label", `${definition.label} boundary layer`);
    });
  }

  function setMetadata() {
    elements.eyebrow.textContent = `${district.name} District`;
    elements.name.textContent = tehsil.name;
    elements.state.textContent = state.name;
    elements.district.textContent = district.name;
    elements.censusCode.textContent = tehsil.censusCode || "Not available";
    elements.lgdCode.textContent = tehsil.lgdCode || "Not available";
    elements.identifier.textContent = tehsil.featureId;
    elements.facts.hidden = false;
    elements.identifierPanel.hidden = false;
    elements.backToDistrict.href = districtPageUrl({
      layer: "tehsils",
      region: tehsil.slug,
    });
    document.title = `${tehsil.name} tehsil map - India Map Studio`;
  }

  function setBoundarySource(config) {
    if (!config?.sourceLabel || !config?.sourceUrl) {
      elements.sourcePanel.hidden = true;
      return;
    }
    elements.sourceLink.textContent = config.sourceLabel;
    elements.sourceLink.href = config.sourceUrl;
    const year = config.boundaryYear || tehsil.boundaryYear;
    elements.sourceYear.textContent = config.sourceDate
      ? `Source retrieval: ${config.sourceDate}. For visualization and prototyping.`
      : year
        ? `Boundary vintage: ${year}. For visualization and prototyping.`
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
    appendBreadcrumb(
      `${district.name} District`,
      districtPageUrl({ layer: "tehsils", region: tehsil.slug }),
    );
    if (!selectedChildRegion) {
      appendBreadcrumb(`${tehsil.name} Tehsil`, "", true);
      return;
    }
    appendBreadcrumb(`${tehsil.name} Tehsil`, tehsilPageUrl());
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
    ).filter(
      (candidate) =>
        candidate.querySelector(SHAPE_SELECTOR) ||
        candidate.matches(SHAPE_SELECTOR),
    );

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

    return candidates.map((element, index) => {
      const name =
        element.dataset.name ||
        element.dataset.region ||
        element.getAttribute("aria-label") ||
        `${definition.singularLabel} ${index + 1}`;
      const identifier =
        element.dataset.featureId ||
        `${layerId(definition)}-FEATURE-${String(index + 1).padStart(3, "0")}`;
      const slug =
        element.dataset.slug ||
        String(name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      element.classList.add("child-region");
      element.dataset.childRegion = "true";
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "-1");
      element.setAttribute("aria-pressed", "false");
      element.setAttribute(
        "aria-keyshortcuts",
        "Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Home End Escape",
      );
      element.setAttribute("aria-label", `Select ${name}`);
      return {
        element,
        name,
        slug,
        identifier,
        sourceId: element.dataset.sourceId || "",
        censusCode: element.dataset.censusCode || "",
        lgdCode: element.dataset.lgdCode || "",
        geometryType: element.dataset.geometryType || "",
        boundaryYear: element.dataset.boundaryYear || "",
        definition,
        listButton: null,
        labelElement: null,
        labelBounds: null,
        geometryArea: 0,
      };
    });
  }

  function visibleChildRegions() {
    return childRegions.filter((region) => {
      const layer = region.element.closest(".tehsil-child-layer");
      return layer && !layer.classList.contains("is-hidden");
    });
  }

  function normalizedSearchValue(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function formatGeometryType(value) {
    return String(value || "Unknown").replace(
      /([a-z])([A-Z])/g,
      "$1-$2",
    );
  }

  async function copyText(
    value,
    successMessage,
    statusElement = elements.childCopyStatus,
  ) {
    if (!value) {
      return;
    }
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch (error) {
      console.warn("Clipboard API unavailable; using copy fallback.", error);
    }

    if (!copied) {
      try {
        const input = document.createElement("textarea");
        input.value = value;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        copied = true;
      } catch (error) {
        console.error(error);
      }
    }

    statusElement.textContent = copied
      ? successMessage
      : "Copy failed. Please copy it manually.";
    if (copyStatusTimer) {
      window.clearTimeout(copyStatusTimer);
    }
    copyStatusTimer = window.setTimeout(() => {
      statusElement.textContent = "";
    }, 2400);
  }

  function humanizeFieldName(value) {
    const label = String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
    return label ? label[0].toLocaleUpperCase() + label.slice(1) : "Field";
  }

  function scalarImportedValue(value) {
    return (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      typeof value !== "object"
    );
  }

  function formatImportedValue(value) {
    return scalarImportedValue(value) ? String(value) : "No value";
  }

  function actionableVillageRegions() {
    return childRegions.filter(
      (region) => region.definition.key === "villages",
    );
  }

  function villageTemplateValues(region) {
    const values = {
      village: region.name,
      name: region.name,
      slug: region.slug,
      source_id: region.sourceId || "",
      source_code: region.sourceId || "",
      feature_id: region.identifier,
      identifier: region.identifier,
      census_code: region.censusCode || "",
      lgd_code: region.lgdCode || "",
      state: state.name,
      state_slug: state.slug,
      district: district?.name || "",
      district_slug: district?.slug || "",
      tehsil: tehsil?.name || "",
      tehsil_slug: tehsil?.slug || "",
    };
    Object.entries(region.dataRecord || {}).forEach(([field, value]) => {
      if (scalarImportedValue(value)) {
        values[field.toLocaleLowerCase()] = String(value);
      }
    });
    return values;
  }

  function applyVillageTemplate(template, region) {
    const values = villageTemplateValues(region);
    return String(template || "").replace(/\{([^{}]+)\}/g, (_, key) => {
      const normalizedKey = key.trim().toLocaleLowerCase();
      return Object.prototype.hasOwnProperty.call(values, normalizedKey)
        ? values[normalizedKey]
        : "";
    });
  }

  function safeVillageActionUrl(value) {
    const candidate = String(value || "").trim();
    if (!candidate) {
      return "";
    }
    try {
      const url = new URL(candidate, window.location.href);
      return new Set(["http:", "https:", "mailto:", "tel:"]).has(
        url.protocol,
      )
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function updateVillageActionFields() {
    const type = elements.villageActionType.value;
    elements.villageActionUrlField.hidden = type !== "url";
    elements.villageActionTargetField.hidden = type !== "url";
    elements.villageActionMapField.hidden = type !== "map";
  }

  function villageActionLabel(action) {
    const labels = {
      profile: "Show profile",
      url: "Open URL",
      map: "Navigate to map",
      none: "No action",
    };
    return labels[action?.type || "profile"] || "Show profile";
  }

  function villageActionAriaLabel(region) {
    const action = villageActions.get(region.identifier);
    const prefixes = {
      profile: `Open profile for ${region.name}`,
      url: `Open link for ${region.name}`,
      map: `Open map for ${region.name}`,
      none: `${region.name}, no click action`,
    };
    const prefix =
      region.definition.key === "villages"
        ? prefixes[action?.type || "profile"]
        : `Select ${region.name}`;
    return currentVillageVisualization
      ? `${prefix}, ${currentVillageVisualization.label}: ${
          region.visualValue || "No value"
        }`
      : prefix;
  }

  function refreshVillageActionPresentation() {
    actionableVillageRegions().forEach((region) => {
      region.element.toggleAttribute(
        "data-has-custom-action",
        villageActions.has(region.identifier),
      );
      region.element.setAttribute(
        "aria-label",
        villageActionAriaLabel(region),
      );
    });
    const count = villageActions.size;
    elements.villageActionSummary.textContent = count
      ? `${count} custom action${count === 1 ? "" : "s"}`
      : "Profile on click";
  }

  function loadVillageActionForm(
    identifier = elements.villageActionRegion.value,
  ) {
    const region = actionableVillageRegions().find(
      (item) => item.identifier === identifier,
    );
    if (!region) {
      return;
    }
    elements.villageActionRegion.value = region.identifier;
    const action = villageActions.get(region.identifier) || {
      type: "profile",
      url: "",
      target: "new",
      map: "district",
    };
    elements.villageActionType.value = action.type;
    elements.villageActionUrl.value = action.url || "";
    elements.villageActionTarget.value =
      action.target === "same" ? "same" : "new";
    elements.villageActionMap.value = new Set([
      "india",
      "state",
      "district",
    ]).has(action.map)
      ? action.map
      : "district";
    updateVillageActionFields();
    elements.resetVillageAction.disabled = !villageActions.has(
      region.identifier,
    );
    elements.villageActionStatus.textContent =
      `${region.name}: ${villageActionLabel(action)}.`;
  }

  function initializeVillageActionBuilder() {
    const villages = actionableVillageRegions();
    elements.villageActionBuilder.hidden = villages.length === 0;
    elements.villageActionRegion.replaceChildren();
    villages.forEach((region) => {
      const option = document.createElement("option");
      option.value = region.identifier;
      option.textContent = region.sourceId
        ? `${region.name} · ${region.sourceId}`
        : region.name;
      elements.villageActionRegion.append(option);
    });
    if (villages.length) {
      loadVillageActionForm(
        selectedChildRegion?.definition.key === "villages"
          ? selectedChildRegion.identifier
          : villages[0].identifier,
      );
    }
    refreshVillageActionPresentation();
  }

  function saveVillageAction() {
    const region = actionableVillageRegions().find(
      (item) => item.identifier === elements.villageActionRegion.value,
    );
    if (!region) {
      return false;
    }
    const type = elements.villageActionType.value;
    if (!new Set(["profile", "url", "map", "none"]).has(type)) {
      return false;
    }

    let action = null;
    if (type === "url") {
      const template = elements.villageActionUrl.value.trim();
      const resolvedUrl = safeVillageActionUrl(
        applyVillageTemplate(template, region),
      );
      if (!template || !resolvedUrl) {
        elements.villageActionStatus.textContent =
          "Enter a valid HTTP, HTTPS, mailto, tel, or relative URL.";
        elements.villageActionUrl.focus();
        return false;
      }
      action = {
        type,
        url: template,
        target:
          elements.villageActionTarget.value === "same" ? "same" : "new",
      };
    } else if (type === "map") {
      const destination = elements.villageActionMap.value;
      if (
        !new Set(["india", "state", "district"]).has(
          destination,
        )
      ) {
        elements.villageActionStatus.textContent =
          "Choose a valid map destination.";
        return false;
      }
      action = { type, map: destination };
    } else if (type === "none") {
      action = { type };
    }

    const existing = villageActions.get(region.identifier) || null;
    if (JSON.stringify(existing) === JSON.stringify(action)) {
      elements.villageActionStatus.textContent =
        `${region.name} already uses that click action.`;
      return false;
    }

    return runHistoryAction("configure village click action", () => {
      if (action) {
        villageActions.set(region.identifier, action);
      } else {
        villageActions.delete(region.identifier);
      }
      refreshVillageActionPresentation();
      loadVillageActionForm(region.identifier);
      elements.villageActionStatus.textContent =
        `${region.name} will ${villageActionLabel(action).toLocaleLowerCase()}.`;
      return true;
    });
  }

  function resetVillageAction() {
    const region = actionableVillageRegions().find(
      (item) => item.identifier === elements.villageActionRegion.value,
    );
    if (!region) {
      return false;
    }
    if (!villageActions.has(region.identifier)) {
      elements.villageActionStatus.textContent =
        `${region.name} already opens its profile.`;
      return false;
    }
    return runHistoryAction("reset village click action", () => {
      villageActions.delete(region.identifier);
      refreshVillageActionPresentation();
      loadVillageActionForm(region.identifier);
      elements.villageActionStatus.textContent =
        `${region.name} now opens its village profile.`;
      return true;
    });
  }

  function restoreVillageActions(savedActions) {
    villageActions.clear();
    const villages = actionableVillageRegions();
    const allowedMaps = new Set(["india", "state", "district"]);
    Object.entries(
      savedActions && typeof savedActions === "object"
        ? savedActions
        : {},
    ).forEach(([identifier, action]) => {
      const region = villages.find(
        (item) => item.identifier === identifier,
      );
      if (!region || !action || typeof action !== "object") {
        return;
      }
      if (
        action.type === "url" &&
        typeof action.url === "string" &&
        safeVillageActionUrl(applyVillageTemplate(action.url, region))
      ) {
        villageActions.set(identifier, {
          type: "url",
          url: action.url.slice(0, 500),
          target: action.target === "same" ? "same" : "new",
        });
      } else if (
        action.type === "map" &&
        allowedMaps.has(action.map)
      ) {
        villageActions.set(identifier, {
          type: "map",
          map: action.map,
        });
      } else if (action.type === "none") {
        villageActions.set(identifier, { type: "none" });
      }
    });
    refreshVillageActionPresentation();
    const preferred =
      selectedChildRegion?.definition.key === "villages"
        ? selectedChildRegion.identifier
        : elements.villageActionRegion.value;
    loadVillageActionForm(preferred);
  }

  function villageMapDestinationUrl(destination) {
    if (destination === "india") {
      return "index.html";
    }
    if (destination === "state") {
      return statePageUrl();
    }
    if (destination === "district") {
      return districtPageUrl();
    }
    return districtPageUrl();
  }

  function executeVillageAction(region) {
    if (region.definition.key !== "villages") {
      selectChildRegion(region);
      return;
    }
    const action = villageActions.get(region.identifier);
    if (!action) {
      selectChildRegion(region);
      return;
    }
    if (action.type === "none") {
      elements.mapStatus.textContent =
        `${region.name} has no click action.`;
      return;
    }
    if (action.type === "map") {
      window.location.assign(villageMapDestinationUrl(action.map));
      return;
    }
    if (action.type === "url") {
      const url = safeVillageActionUrl(
        applyVillageTemplate(action.url, region),
      );
      if (url) {
        if (action.target === "same") {
          window.location.assign(url);
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      }
    }
    selectChildRegion(region);
    elements.villageActionRegion.value = region.identifier;
    loadVillageActionForm(region.identifier);
    elements.villageActionStatus.textContent =
      `${region.name}'s custom action is unavailable, so its profile was opened.`;
  }

  function parseNumericValue(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }
    const normalized = value
      .trim()
      .replace(/[,\s]/g, "")
      .replace(/^[₹$€£]/, "")
      .replace(/%$/, "");
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
      return null;
    }
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function parseDateValue(value) {
    if (value instanceof Date) {
      const timestamp = value.getTime();
      return Number.isFinite(timestamp) ? timestamp : null;
    }
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }
    const candidate = value.trim();
    const match =
      candidate.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/) ||
      candidate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (!match) {
      return null;
    }
    const isoOrder = match[1].length === 4;
    const year = Number(isoOrder ? match[1] : match[3]);
    const month = Number(match[2]);
    const day = Number(isoOrder ? match[3] : match[1]);
    const timestamp = Date.UTC(year, month - 1, day);
    const date = new Date(timestamp);
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
      ? timestamp
      : null;
  }

  function formatDateTimestamp(value) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  function normalizeVillageFieldSettings(settings, records, joinField) {
    const fields = new Set(
      records.flatMap((record) => Object.keys(record || {})),
    );
    return Object.fromEntries(
      Object.entries(settings || {}).flatMap(([field, setting]) => {
        if (
          !fields.has(field) ||
          field === joinField ||
          identifierFieldNames.has(field.toLocaleLowerCase()) ||
          !setting ||
          typeof setting !== "object"
        ) {
          return [];
        }
        const type = villageFieldTypes.has(setting.type)
          ? setting.type
          : "auto";
        const required = setting.required === true;
        return type === "auto" && !required
          ? []
          : [[field, { type, required }]];
      }),
    );
  }

  function villageFieldSetting(
    field,
    settings = importedVillageDataset?.fieldSettings,
  ) {
    const setting = settings?.[field];
    return {
      type: villageFieldTypes.has(setting?.type) ? setting.type : "auto",
      required: setting?.required === true,
    };
  }

  function inferVillageFieldType(field, values) {
    const populatedValues = values.filter(
      (value) => !blankImportedValue(value) && typeof value !== "object",
    );
    if (!populatedValues.length) {
      return "text";
    }
    const dateCount = populatedValues.filter(
      (value) => parseDateValue(value) !== null,
    ).length;
    if (
      dateCount > 0 &&
      dateCount / populatedValues.length >= 0.8 &&
      /date|dated|_at$/i.test(field)
    ) {
      return "date";
    }
    const numericCount = populatedValues.filter(
      (value) => parseNumericValue(value) !== null,
    ).length;
    return numericCount > 0 &&
      numericCount / populatedValues.length >= 0.8
      ? "number"
      : "category";
  }

  function effectiveVillageFieldType(
    field,
    values = childRegions.map((region) => region.dataRecord?.[field]),
    settings = importedVillageDataset?.fieldSettings,
  ) {
    const configured = villageFieldSetting(field, settings).type;
    return configured === "auto"
      ? inferVillageFieldType(field, values)
      : configured;
  }

  function villageFieldKind(type) {
    if (type === "date") {
      return "date";
    }
    return ["number", "percentage", "currency"].includes(type)
      ? "numeric"
      : "categorical";
  }

  function parseVillageFieldComparableValue(field, value) {
    const type = effectiveVillageFieldType(field);
    return type === "date" ? parseDateValue(value) : parseNumericValue(value);
  }

  function formatVillageFieldValue(field, value) {
    if (!scalarImportedValue(value)) {
      return "No value";
    }
    const type = effectiveVillageFieldType(field);
    if (type === "date") {
      const timestamp = parseDateValue(value);
      return timestamp === null ? String(value) : formatDateTimestamp(timestamp);
    }
    if (["number", "percentage", "currency"].includes(type)) {
      const numeric = parseNumericValue(value);
      if (numeric === null) {
        return String(value);
      }
      if (type === "percentage") {
        return `${formatLegendNumber(numeric)}%`;
      }
      if (type === "currency") {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(numeric);
      }
      return formatLegendNumber(numeric);
    }
    return String(value).trim();
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(field);
        field = "";
      } else if (
        (character === "\n" || character === "\r") &&
        !quoted
      ) {
        if (character === "\r" && text[index + 1] === "\n") {
          index += 1;
        }
        row.push(field);
        if (row.some((value) => value.trim() !== "")) {
          rows.push(row);
        }
        row = [];
        field = "";
      } else {
        field += character;
      }
    }

    row.push(field);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
    if (rows.length < 2) {
      throw new Error("The CSV must include a header and at least one data row.");
    }

    const headers = rows[0].map((header, index) =>
      (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim(),
    );
    if (headers.some((header) => !header)) {
      throw new Error("Every CSV column must have a header.");
    }
    return rows.slice(1).map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
  }

  function parseJsonRecords(text) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.records)) {
      return parsed.records;
    }
    if (
      parsed.type === "FeatureCollection" &&
      Array.isArray(parsed.features)
    ) {
      return parsed.features.map((feature) => ({
        ...(feature.properties || {}),
        ...(feature.id === undefined ? {} : { id: feature.id }),
      }));
    }
    throw new Error(
      "JSON must be an array, contain a records array, or be a GeoJSON FeatureCollection.",
    );
  }

  function buildChildRegionLookup() {
    const lookup = new Map();
    childRegions.forEach((region) => {
      [
        region.identifier,
        region.sourceId,
        region.censusCode,
        region.lgdCode,
        region.slug,
        region.name,
      ].forEach((value) => {
        const normalized = normalizedSearchValue(value);
        if (!normalized) {
          return;
        }
        if (lookup.has(normalized) && lookup.get(normalized) !== region) {
          lookup.set(normalized, null);
        } else if (!lookup.has(normalized)) {
          lookup.set(normalized, region);
        }
      });
    });
    return lookup;
  }

  function detectJoinField(records, lookup) {
    const columns = Array.from(
      new Set(records.flatMap((record) => Object.keys(record || {}))),
    );
    const priority = [
      "source_id",
      "source_code",
      "feature_id",
      "identifier",
      "village_id",
      "id",
      "census_code",
      "lgd_code",
      "code",
      "village",
      "village_name",
      "name",
      "slug",
    ];
    const scored = columns.map((column) => {
      const score = records.reduce((count, record) => {
        const region = lookup.get(
          normalizedSearchValue(record?.[column]),
        );
        return count + (region ? 1 : 0);
      }, 0);
      const priorityIndex = priority.indexOf(column.toLocaleLowerCase());
      return {
        column,
        score,
        priority: priorityIndex === -1 ? priority.length : priorityIndex,
      };
    });
    scored.sort(
      (first, second) =>
        second.score - first.score || first.priority - second.priority,
    );
    return scored[0]?.score ? scored[0] : null;
  }

  function blankImportedValue(value) {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  }

  function validateVillageDataset(records, joinField, lookup, fieldSettings) {
    const issues = [];
    const identifierGroups = new Map();
    const missingIdentifierRows = [];
    const unmatchedIdentifiers = [];

    records.forEach((record, index) => {
      const sourceValue = record?.[joinField];
      const normalized = normalizedSearchValue(sourceValue);
      if (!normalized) {
        missingIdentifierRows.push(index + 2);
        return;
      }
      if (!identifierGroups.has(normalized)) {
        identifierGroups.set(normalized, {
          value: String(sourceValue).trim(),
          rows: [],
        });
      }
      identifierGroups.get(normalized).rows.push(index + 2);
      if (!lookup.get(normalized)) {
        unmatchedIdentifiers.push(String(sourceValue).trim());
      }
    });

    if (missingIdentifierRows.length) {
      issues.push({
        key: "missing-identifiers",
        severity: "error",
        title: "Missing village identifiers",
        count: missingIdentifierRows.length,
        message:
          `The ${humanizeFieldName(joinField)} value is required to match a row to the map.`,
        examples: missingIdentifierRows
          .slice(0, 5)
          .map((rowNumber) => `row ${rowNumber}`),
      });
    }

    const duplicateGroups = Array.from(identifierGroups.values()).filter(
      (group) => group.rows.length > 1,
    );
    const duplicateCount = duplicateGroups.reduce(
      (count, group) => count + group.rows.length - 1,
      0,
    );
    if (duplicateCount) {
      issues.push({
        key: "duplicate-identifiers",
        severity: "error",
        title: "Duplicate village identifiers",
        count: duplicateCount,
        message:
          "More than one row targets the same village. The last matching row currently supplies its map data.",
        examples: duplicateGroups
          .slice(0, 5)
          .map((group) => `${group.value} (rows ${group.rows.join(", ")})`),
      });
    }

    if (unmatchedIdentifiers.length) {
      issues.push({
        key: "unmatched-identifiers",
        severity: "warning",
        title: "Unmatched village identifiers",
        count: unmatchedIdentifiers.length,
        message:
          "These non-empty identifiers do not match a unique village in the current boundary layer.",
        examples: Array.from(new Set(unmatchedIdentifiers)).slice(0, 5),
      });
    }

    const dataFields = Array.from(
      new Set(records.flatMap((record) => Object.keys(record || {}))),
    ).filter(
      (field) =>
        field !== joinField &&
        !identifierFieldNames.has(field.toLocaleLowerCase()),
    );
    const missingByField = [];
    const requiredMissingByField = [];
    const invalidTypedByField = [];
    const unsupportedByField = [];

    dataFields.forEach((field) => {
      const values = records.map((record) => record?.[field]);
      const populatedValues = values.filter((value) => !blankImportedValue(value));
      const missingCount = values.length - populatedValues.length;
      if (missingCount) {
        if (villageFieldSetting(field, fieldSettings).required) {
          requiredMissingByField.push({ field, count: missingCount });
        } else if (populatedValues.length) {
          missingByField.push({ field, count: missingCount });
        }
      }
      if (!populatedValues.length) {
        return;
      }

      const unsupportedCount = populatedValues.filter(
        (value) => typeof value === "object",
      ).length;
      if (unsupportedCount) {
        unsupportedByField.push({ field, count: unsupportedCount });
      }

      const scalarValues = populatedValues.filter(
        (value) => typeof value !== "object",
      );
      const setting = villageFieldSetting(field, fieldSettings);
      const type = effectiveVillageFieldType(field, values, fieldSettings);
      const parser =
        type === "date"
          ? parseDateValue
          : ["number", "percentage", "currency"].includes(type)
            ? parseNumericValue
            : null;
      const validCount = parser
        ? scalarValues.filter((value) => parser(value) !== null).length
        : scalarValues.length;
      const invalidCount = scalarValues.length - validCount;
      const inferredTypeIsReliable =
        scalarValues.length >= 4 &&
        validCount >= 3 &&
        validCount / scalarValues.length >= 0.75;
      if (
        parser &&
        invalidCount &&
        (setting.type !== "auto" || inferredTypeIsReliable)
      ) {
        const examples = scalarValues
          .filter((value) => parser(value) === null)
          .slice(0, 3)
          .map(String);
        invalidTypedByField.push({
          field,
          type,
          count: invalidCount,
          examples,
        });
      }
    });

    if (requiredMissingByField.length) {
      issues.push({
        key: "required-values",
        severity: "error",
        title: "Missing required values",
        count: requiredMissingByField.reduce(
          (count, item) => count + item.count,
          0,
        ),
        message:
          "Fields marked as required contain blank values that must be completed.",
        examples: requiredMissingByField.slice(0, 5).map(
          (item) => `${humanizeFieldName(item.field)} (${item.count})`,
        ),
      });
    }

    if (invalidTypedByField.length) {
      issues.push({
        key: "invalid-typed-values",
        severity: "warning",
        title: "Values do not match their field type",
        count: invalidTypedByField.reduce(
          (count, item) => count + item.count,
          0,
        ),
        message:
          "Configured or inferred number, percentage, currency, and date fields contain invalid values.",
        examples: invalidTypedByField.slice(0, 5).map(
          (item) =>
            `${humanizeFieldName(item.field)} (${villageFieldTypeLabels[item.type]}): ${item.examples.join(", ")}`,
        ),
      });
    }

    if (unsupportedByField.length) {
      issues.push({
        key: "unsupported-values",
        severity: "warning",
        title: "Unsupported nested values",
        count: unsupportedByField.reduce(
          (count, item) => count + item.count,
          0,
        ),
        message:
          "Objects and arrays cannot be edited, filtered, or displayed as ordinary village values.",
        examples: unsupportedByField
          .slice(0, 5)
          .map(
            (item) =>
              `${humanizeFieldName(item.field)} (${item.count})`,
          ),
      });
    }

    if (missingByField.length) {
      issues.push({
        key: "missing-values",
        severity: "warning",
        title: "Missing data values",
        count: missingByField.reduce((count, item) => count + item.count, 0),
        message:
          "Blank cells were found in otherwise populated fields and will be treated as missing data.",
        examples: missingByField
          .sort((first, second) => second.count - first.count)
          .slice(0, 5)
          .map(
            (item) =>
              `${humanizeFieldName(item.field)} (${item.count})`,
          ),
      });
    }

    return {
      issues,
      issueCount: issues.reduce((count, issue) => count + issue.count, 0),
      errorCount: issues
        .filter((issue) => issue.severity === "error")
        .reduce((count, issue) => count + issue.count, 0),
      warningCount: issues
        .filter((issue) => issue.severity === "warning")
        .reduce((count, issue) => count + issue.count, 0),
    };
  }

  function renderVillageDataValidation(validation) {
    elements.dataValidationIssues.replaceChildren();
    if (!validation) {
      elements.dataValidation.hidden = true;
      elements.dataValidation.open = false;
      elements.dataValidation.dataset.state = "";
      elements.dataValidationCount.textContent = "0";
      elements.dataValidationSummary.textContent = "Not checked";
      elements.dataValidationOverview.textContent = "";
      return;
    }

    const { issues, issueCount, errorCount, warningCount } = validation;
    elements.dataValidation.hidden = false;
    elements.dataValidation.dataset.state = issueCount ? "issues" : "passed";
    elements.dataValidationCount.textContent = issueCount;
    elements.dataValidationSummary.textContent = issueCount
      ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
      : "Passed";
    elements.dataValidationOverview.textContent = issueCount
      ? `${errorCount} blocking error${errorCount === 1 ? "" : "s"} and ` +
        `${warningCount} data warning${warningCount === 1 ? "" : "s"} found.`
      : "No identifier, required-value, or field-type issues were detected.";

    issues.forEach((issue) => {
      const item = document.createElement("li");
      const heading = document.createElement("div");
      const title = document.createElement("strong");
      const count = document.createElement("span");
      const message = document.createElement("p");
      item.className = "data-validation-issue";
      item.dataset.severity = issue.severity;
      heading.className = "data-validation-issue-heading";
      title.textContent = issue.title;
      count.className = "data-validation-issue-count";
      count.textContent = issue.count;
      message.textContent = issue.message;
      heading.append(title, count);
      item.append(heading, message);
      if (issue.examples.length) {
        const examples = document.createElement("code");
        examples.textContent = `Examples: ${issue.examples.join(" · ")}`;
        item.append(examples);
      }
      elements.dataValidationIssues.append(item);
    });
  }

  function refreshVillageDataValidation() {
    if (!importedVillageDataset) {
      renderVillageDataValidation(null);
      return null;
    }
    const validation = validateVillageDataset(
      importedVillageDataset.records,
      importedVillageDataset.joinField,
      buildChildRegionLookup(),
      importedVillageDataset.fieldSettings,
    );
    importedVillageDataset.validation = validation;
    renderVillageDataValidation(validation);
    return validation;
  }

  function importedFieldNames() {
    if (!importedVillageDataset) {
      return [];
    }
    const fields = new Set();
    childRegions.forEach((region) => {
      Object.entries(region.dataRecord || {}).forEach(([field, value]) => {
        if (
          field !== importedVillageDataset.joinField &&
          !identifierFieldNames.has(field.toLocaleLowerCase()) &&
          scalarImportedValue(value)
        ) {
          fields.add(field);
        }
      });
    });
    return Array.from(fields).sort((first, second) =>
      humanizeFieldName(first).localeCompare(humanizeFieldName(second)),
    );
  }

  function editableImportedFieldNames() {
    if (!importedVillageDataset) {
      return [];
    }
    const fields = new Map();
    childRegions.forEach((region) => {
      Object.entries(region.dataRecord || {}).forEach(([field, value]) => {
        const normalized = field.toLocaleLowerCase();
        if (
          field !== importedVillageDataset.joinField &&
          !identifierFieldNames.has(normalized) &&
          typeof value !== "object" &&
          !fields.has(normalized)
        ) {
          fields.set(normalized, field);
        }
      });
    });
    return Array.from(fields.values()).sort((first, second) =>
      humanizeFieldName(first).localeCompare(humanizeFieldName(second)),
    );
  }

  function villageDataEditorDraftCount() {
    return Array.from(villageDataEditorDrafts.values()).reduce(
      (total, fieldDrafts) => total + fieldDrafts.size,
      0,
    );
  }

  function cloneVillageDataEditorDrafts() {
    return new Map(
      Array.from(villageDataEditorDrafts, ([field, fieldDrafts]) => [
        field,
        new Map(fieldDrafts),
      ]),
    );
  }

  function updateVillageDataEditorDraftStatus() {
    const count = villageDataEditorDraftCount();
    elements.dataEditorSummary.textContent = `${count} pending`;
    elements.dataEditorApply.disabled = count === 0;
    elements.dataEditorDiscard.disabled = count === 0;
    [elements.exportDataCsv, elements.exportDataJson].forEach((button) => {
      button.hidden = !importedVillageDataset;
      button.disabled = !importedVillageDataset || count > 0;
      button.title = count
        ? "Apply or discard pending edits before exporting"
        : "";
    });
  }

  function villageDataEditorDraftValue(field, region) {
    const fieldDrafts = villageDataEditorDrafts.get(field);
    if (fieldDrafts?.has(region.identifier)) {
      return fieldDrafts.get(region.identifier);
    }
    const value = region.dataRecord?.[field];
    return value === null || value === undefined ? "" : String(value);
  }

  function setVillageDataEditorDraft(field, region, value) {
    const originalValue = region.dataRecord?.[field];
    const original =
      originalValue === null || originalValue === undefined
        ? ""
        : String(originalValue);
    let fieldDrafts = villageDataEditorDrafts.get(field);
    if (value === original) {
      fieldDrafts?.delete(region.identifier);
      if (fieldDrafts?.size === 0) {
        villageDataEditorDrafts.delete(field);
      }
    } else {
      if (!fieldDrafts) {
        fieldDrafts = new Map();
        villageDataEditorDrafts.set(field, fieldDrafts);
      }
      fieldDrafts.set(region.identifier, value);
    }
    updateVillageDataEditorDraftStatus();
  }

  function visibleVillageDataEditorRegions(
    filter = elements.dataEditorSearch.value,
  ) {
    const query = normalizedSearchValue(filter);
    return childRegions.filter((region) => {
      if (!region.dataRecord) {
        return false;
      }
      return normalizedSearchValue(
        `${region.name} ${region.sourceId} ${region.identifier}`,
      ).includes(query);
    });
  }

  function updateVillageDataEditorBulkControls(visibleCount = 0) {
    const available = Boolean(elements.dataEditorField.value) && visibleCount > 0;
    elements.dataEditorBulkSet.disabled = !available;
    elements.dataEditorBulkClear.disabled = !available;
    elements.dataEditorBulkSet.textContent = available
      ? `Set ${visibleCount} visible`
      : "Set visible";
    elements.dataEditorBulkClear.textContent = available
      ? `Clear ${visibleCount}`
      : "Clear visible";
  }

  function advancedBulkScopeRegions() {
    const scope = elements.dataEditorBulkScope.value;
    if (scope === "selected") {
      return childRegions.filter(
        (region) =>
          region.dataRecord &&
          villageDataEditorSelection.has(region.identifier),
      );
    }
    if (scope === "all") {
      return childRegions.filter((region) => region.dataRecord);
    }
    return visibleVillageDataEditorRegions();
  }

  function updateVillageDataEditorSelectionControls(
    visibleRegions = visibleVillageDataEditorRegions(),
  ) {
    const selectedCount = childRegions.filter(
      (region) =>
        region.dataRecord &&
        villageDataEditorSelection.has(region.identifier),
    ).length;
    const selectedVisibleCount = visibleRegions.filter((region) =>
      villageDataEditorSelection.has(region.identifier),
    ).length;
    elements.dataEditorSelectionSummary.textContent =
      `${selectedCount} selected`;
    elements.dataEditorSelectVisible.disabled = visibleRegions.length === 0;
    elements.dataEditorSelectVisible.checked =
      visibleRegions.length > 0 &&
      selectedVisibleCount === visibleRegions.length;
    elements.dataEditorSelectVisible.indeterminate =
      selectedVisibleCount > 0 && selectedVisibleCount < visibleRegions.length;
  }

  function populateAdvancedBulkSourceFields() {
    const targetField = elements.dataEditorField.value;
    const preferredSource = elements.dataEditorBulkSource.value;
    const sourceFields = editableImportedFieldNames().filter(
      (field) => field !== targetField,
    );
    elements.dataEditorBulkSource.replaceChildren();
    sourceFields.forEach((field) => {
      const option = document.createElement("option");
      option.value = field;
      option.textContent = humanizeFieldName(field);
      elements.dataEditorBulkSource.append(option);
    });
    if (sourceFields.includes(preferredSource)) {
      elements.dataEditorBulkSource.value = preferredSource;
    }
  }

  function configureAdvancedBulkOperation() {
    const operation = elements.dataEditorBulkOperation.value;
    const labels = {
      set: "Value",
      replace: "Find text",
      add: "Amount to add",
      multiply: "Multiplier",
    };
    elements.dataEditorBulkPrimaryField.hidden = ["clear", "copy"].includes(
      operation,
    );
    elements.dataEditorBulkSecondaryField.hidden = operation !== "replace";
    elements.dataEditorBulkSourceField.hidden = operation !== "copy";
    elements.dataEditorBulkPrimaryLabel.textContent =
      labels[operation] || "Value";
    elements.dataEditorBulkPrimary.inputMode = ["add", "multiply"].includes(
      operation,
    )
      ? "decimal"
      : "text";
    elements.dataEditorBulkPrimary.placeholder =
      operation === "replace"
        ? "Case-sensitive text"
        : operation === "add"
          ? "Example: 10"
          : operation === "multiply"
            ? "Example: 1.1"
            : "Enter a value";
    if (operation === "copy") {
      populateAdvancedBulkSourceFields();
    }
    updateAdvancedBulkControls();
  }

  function updateAdvancedBulkControls() {
    const field = elements.dataEditorField.value;
    const regions = field ? advancedBulkScopeRegions() : [];
    const operation = elements.dataEditorBulkOperation.value;
    const copyAvailable =
      operation !== "copy" || elements.dataEditorBulkSource.options.length > 0;
    elements.dataEditorBulkStage.disabled =
      !field || regions.length === 0 || !copyAvailable;
    elements.dataEditorBulkStage.textContent = regions.length
      ? `Stage for ${regions.length}`
      : "Stage operation";
    updateVillageDataEditorSelectionControls();
  }

  function normalizedBulkNumber(value) {
    return String(Number(Number(value).toFixed(10)));
  }

  function stageAdvancedVillageDataOperation() {
    const field = elements.dataEditorField.value;
    const operation = elements.dataEditorBulkOperation.value;
    const regions = advancedBulkScopeRegions();
    if (!field || !regions.length) {
      elements.dataEditorBulkStatus.textContent =
        "This scope does not contain any village rows.";
      return false;
    }

    const primary = elements.dataEditorBulkPrimary.value;
    const secondary = elements.dataEditorBulkSecondary.value;
    const sourceField = elements.dataEditorBulkSource.value;
    let numericOperand = null;
    if (operation === "set" && primary === "") {
      elements.dataEditorBulkStatus.textContent =
        "Enter a value, or choose the clear operation.";
      elements.dataEditorBulkPrimary.focus();
      return false;
    }
    if (operation === "replace" && primary === "") {
      elements.dataEditorBulkStatus.textContent =
        "Enter the text you want to find.";
      elements.dataEditorBulkPrimary.focus();
      return false;
    }
    if (["add", "multiply"].includes(operation)) {
      numericOperand = parseNumericValue(primary);
      if (numericOperand === null) {
        elements.dataEditorBulkStatus.textContent =
          "Enter a valid numeric amount.";
        elements.dataEditorBulkPrimary.focus();
        return false;
      }
    }
    if (operation === "copy" && (!sourceField || sourceField === field)) {
      elements.dataEditorBulkStatus.textContent =
        "Choose a different source field.";
      return false;
    }

    let changedCount = 0;
    let skippedCount = 0;
    regions.forEach((region) => {
      const currentValue = villageDataEditorDraftValue(field, region);
      let nextValue = currentValue;
      if (operation === "set") {
        nextValue = primary;
      } else if (operation === "clear") {
        nextValue = "";
      } else if (operation === "replace") {
        nextValue = currentValue.split(primary).join(secondary);
      } else if (operation === "copy") {
        nextValue = villageDataEditorDraftValue(sourceField, region);
      } else {
        const numericValue = parseNumericValue(currentValue);
        if (numericValue === null) {
          skippedCount += 1;
          return;
        }
        nextValue = normalizedBulkNumber(
          operation === "add"
            ? numericValue + numericOperand
            : numericValue * numericOperand,
        );
      }
      if (nextValue !== currentValue) {
        setVillageDataEditorDraft(field, region, nextValue);
        changedCount += 1;
      }
    });

    renderVillageDataEditorRows();
    elements.dataEditorBulkStatus.textContent =
      `${changedCount} value${changedCount === 1 ? "" : "s"} staged` +
      `${skippedCount ? `; ${skippedCount} non-numeric value${skippedCount === 1 ? "" : "s"} skipped` : ""}. ` +
      "Review the draft, then apply edits.";
    return changedCount > 0;
  }

  function syncVillageFieldSettingsControls() {
    const field = elements.dataEditorField.value;
    const available = Boolean(importedVillageDataset && field);
    const setting = available
      ? villageFieldSetting(field)
      : { type: "auto", required: false };
    elements.dataEditorFieldType.value = setting.type;
    elements.dataEditorFieldRequired.checked = setting.required;
    elements.dataEditorFieldType.disabled = !available;
    elements.dataEditorFieldRequired.disabled = !available;
    elements.dataEditorSaveFieldSettings.disabled = !available;
    const effectiveType = available
      ? effectiveVillageFieldType(field)
      : "text";
    elements.dataEditorBulkValue.inputMode = [
      "number",
      "percentage",
      "currency",
    ].includes(effectiveType)
      ? "decimal"
      : effectiveType === "date"
        ? "numeric"
        : "text";
    elements.dataEditorBulkValue.placeholder =
      effectiveType === "date"
        ? "YYYY-MM-DD"
        : effectiveType === "percentage"
          ? "Example: 72.5"
          : effectiveType === "currency"
            ? "Example: 250000"
            : "Enter a shared value";
  }

  function saveVillageFieldSettings() {
    const field = elements.dataEditorField.value;
    if (!importedVillageDataset || !field) {
      return false;
    }
    const current = villageFieldSetting(field);
    const next = {
      type: villageFieldTypes.has(elements.dataEditorFieldType.value)
        ? elements.dataEditorFieldType.value
        : "auto",
      required: elements.dataEditorFieldRequired.checked,
    };
    if (current.type === next.type && current.required === next.required) {
      elements.dataEditorStatus.textContent =
        "These field settings are already applied.";
      return false;
    }

    const visualizationField = currentVillageVisualization?.field || "";
    const savedFilter = activeVillageDataFilter
      ? { ...activeVillageDataFilter }
      : null;
    return runHistoryAction("update village field settings", () => {
      if (next.type === "auto" && !next.required) {
        delete importedVillageDataset.fieldSettings[field];
      } else {
        importedVillageDataset.fieldSettings[field] = next;
      }
      const nextKind = classifyVisualizationField(field).kind;
      clearVillageDataFilter(false);
      refreshVillageDataValidation();
      populateVisualizationFields(visualizationField);
      if (
        savedFilter &&
        (savedFilter.field !== field || savedFilter.kind === nextKind)
      ) {
        restoreWorkspaceDataFilter(savedFilter);
      }
      renderVillageDataEditorFields(field);
      const effectiveType = effectiveVillageFieldType(field);
      elements.dataEditorStatus.textContent =
        `${humanizeFieldName(field)} uses ${
          next.type === "auto"
            ? `automatic ${villageFieldTypeLabels[effectiveType].toLocaleLowerCase()} detection`
            : villageFieldTypeLabels[next.type].toLocaleLowerCase()
        }${next.required ? " and requires a value" : ""}.` +
        (savedFilter?.field === field && savedFilter.kind !== nextKind
          ? " Its active filter was cleared."
          : "");
      return true;
    });
  }

  function renderVillageDataEditorRows(
    filter = elements.dataEditorSearch.value,
  ) {
    const field = elements.dataEditorField.value;
    const query = normalizedSearchValue(filter);
    elements.dataEditorRows.replaceChildren();
    if (!field) {
      updateVillageDataEditorBulkControls();
      syncVillageFieldSettingsControls();
      updateAdvancedBulkControls();
      return;
    }

    const visibleRegions = visibleVillageDataEditorRegions(filter);

    visibleRegions.forEach((region) => {
      const row = document.createElement("tr");
      const selectCell = document.createElement("td");
      const nameCell = document.createElement("th");
      const sourceCell = document.createElement("td");
      const valueCell = document.createElement("td");
      const select = document.createElement("input");
      const input = document.createElement("input");
      selectCell.className = "data-editor-select-cell";
      select.type = "checkbox";
      select.checked = villageDataEditorSelection.has(region.identifier);
      select.setAttribute("aria-label", `Select ${region.name}`);
      select.addEventListener("change", () => {
        if (select.checked) {
          villageDataEditorSelection.add(region.identifier);
        } else {
          villageDataEditorSelection.delete(region.identifier);
        }
        updateAdvancedBulkControls();
      });
      selectCell.append(select);
      nameCell.scope = "row";
      nameCell.textContent = region.name;
      sourceCell.textContent = region.sourceId || "—";
      input.type = "text";
      input.value = villageDataEditorDraftValue(field, region);
      input.dataset.regionIdentifier = region.identifier;
      const fieldType = effectiveVillageFieldType(field);
      const setting = villageFieldSetting(field);
      if (["number", "percentage", "currency"].includes(fieldType)) {
        input.inputMode = "decimal";
      } else if (fieldType === "date") {
        input.inputMode = "numeric";
        input.placeholder = "YYYY-MM-DD";
      }
      input.setAttribute(
        "aria-required",
        setting.required ? "true" : "false",
      );
      const updateValidity = () => {
        const value = input.value;
        const invalidRequired = setting.required && blankImportedValue(value);
        const invalidType =
          !blankImportedValue(value) &&
          ((fieldType === "date" && parseDateValue(value) === null) ||
            (["number", "percentage", "currency"].includes(fieldType) &&
              parseNumericValue(value) === null));
        input.setAttribute(
          "aria-invalid",
          invalidRequired || invalidType ? "true" : "false",
        );
      };
      updateValidity();
      input.setAttribute(
        "aria-label",
        `${humanizeFieldName(field)} for ${region.name}, ${villageFieldTypeLabels[fieldType]}`,
      );
      input.addEventListener("input", () => {
        setVillageDataEditorDraft(field, region, input.value);
        updateValidity();
      });
      valueCell.append(input);
      row.append(selectCell, nameCell, sourceCell, valueCell);
      elements.dataEditorRows.append(row);
    });

    if (!visibleRegions.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "data-editor-empty";
      cell.textContent = query
        ? "No matching villages."
        : "No matched records are available.";
      row.append(cell);
      elements.dataEditorRows.append(row);
    }
    updateVillageDataEditorBulkControls(visibleRegions.length);
    syncVillageFieldSettingsControls();
    updateAdvancedBulkControls();
  }

  function stageBulkVillageDataValue(clear = false) {
    const field = elements.dataEditorField.value;
    const regions = visibleVillageDataEditorRegions();
    if (!field || !regions.length) {
      elements.dataEditorStatus.textContent =
        "No visible village rows are available for bulk editing.";
      return false;
    }
    const value = clear ? "" : elements.dataEditorBulkValue.value;
    if (!clear && value === "") {
      elements.dataEditorStatus.textContent =
        "Enter a shared value, or use Clear visible.";
      elements.dataEditorBulkValue.focus();
      return false;
    }
    regions.forEach((region) => {
      setVillageDataEditorDraft(field, region, value);
    });
    renderVillageDataEditorRows();
    elements.dataEditorStatus.textContent =
      `${regions.length} visible village ${
        regions.length === 1 ? "row" : "rows"
      } staged ${clear ? "with blank values" : `as “${value}”`}. ` +
      "Review the draft, then apply edits.";
    return true;
  }

  function renderVillageDataEditorFields(
    preferredField = elements.dataEditorField.value,
  ) {
    const fields = editableImportedFieldNames();
    elements.dataEditorField.replaceChildren();
    if (!fields.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Add a field to begin";
      elements.dataEditorField.append(option);
      elements.dataEditorField.disabled = true;
    } else {
      fields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = humanizeFieldName(field);
        elements.dataEditorField.append(option);
      });
      elements.dataEditorField.disabled = false;
      elements.dataEditorField.value = fields.includes(preferredField)
        ? preferredField
        : fields[0];
    }
    configureAdvancedBulkOperation();
    renderVillageDataEditorRows();
    updateVillageDataEditorDraftStatus();
  }

  function resetVillageDataEditorDrafts() {
    villageDataEditorDrafts.clear();
    villageDataEditorSelection.clear();
    elements.dataEditorSearch.value = "";
    elements.dataEditorNewField.value = "";
    elements.dataEditorBulkValue.value = "";
    elements.dataEditorBulkScope.value = "visible";
    elements.dataEditorBulkOperation.value = "set";
    elements.dataEditorBulkPrimary.value = "";
    elements.dataEditorBulkSecondary.value = "";
    elements.dataEditorBulkStatus.textContent =
      "Choose an operation. Changes remain staged until applied.";
    elements.dataEditor.hidden = !importedVillageDataset;
    if (importedVillageDataset) {
      renderVillageDataEditorFields();
      elements.dataEditorStatus.textContent =
        "Choose a field and edit village values.";
    } else {
      elements.dataEditorRows.replaceChildren();
      elements.dataEditorField.replaceChildren();
      updateVillageDataEditorDraftStatus();
      updateVillageDataEditorBulkControls();
      syncVillageFieldSettingsControls();
      configureAdvancedBulkOperation();
      elements.dataEditorStatus.textContent =
        "Import village data to start editing.";
    }
  }

  function restoreVillageDataEditorDrafts(
    savedDrafts,
    preferredField,
    searchValue,
    bulkValue = "",
    savedSelection = [],
    advancedState = {},
  ) {
    villageDataEditorDrafts.clear();
    villageDataEditorSelection.clear();
    const editableFields = new Set(editableImportedFieldNames());
    savedDrafts.forEach((fieldDrafts, field) => {
      if (!editableFields.has(field)) {
        return;
      }
      fieldDrafts.forEach((value, identifier) => {
        const region = childRegions.find(
          (item) => item.identifier === identifier,
        );
        if (region?.dataRecord) {
          setVillageDataEditorDraft(field, region, value);
        }
      });
    });
    savedSelection.forEach((identifier) => {
      if (
        childRegions.some(
          (region) => region.identifier === identifier && region.dataRecord,
        )
      ) {
        villageDataEditorSelection.add(identifier);
      }
    });
    elements.dataEditorSearch.value = searchValue;
    elements.dataEditorBulkValue.value = bulkValue;
    elements.dataEditorBulkScope.value = ["visible", "selected", "all"].includes(
      advancedState.scope,
    )
      ? advancedState.scope
      : "visible";
    elements.dataEditorBulkOperation.value = [
      "set",
      "clear",
      "replace",
      "add",
      "multiply",
      "copy",
    ].includes(advancedState.operation)
      ? advancedState.operation
      : "set";
    elements.dataEditorBulkPrimary.value = advancedState.primary || "";
    elements.dataEditorBulkSecondary.value = advancedState.secondary || "";
    renderVillageDataEditorFields(preferredField);
    if (
      Array.from(elements.dataEditorBulkSource.options).some(
        (option) => option.value === advancedState.source,
      )
    ) {
      elements.dataEditorBulkSource.value = advancedState.source;
    }
    configureAdvancedBulkOperation();
  }

  function normalizedVillageDataEditorFieldName(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
  }

  function addVillageDataEditorField() {
    if (!importedVillageDataset) {
      return false;
    }
    const field = normalizedVillageDataEditorFieldName(
      elements.dataEditorNewField.value,
    );
    if (!field) {
      elements.dataEditorStatus.textContent =
        "Enter a field name using letters or numbers.";
      elements.dataEditorNewField.focus();
      return false;
    }
    const existingFields = new Set(
      importedVillageDataset.records.flatMap((record) =>
        Object.keys(record).map((name) => name.toLocaleLowerCase()),
      ),
    );
    if (
      identifierFieldNames.has(field) ||
      field === importedVillageDataset.joinField.toLocaleLowerCase()
    ) {
      elements.dataEditorStatus.textContent =
        "Choose a field name that is not a village identifier.";
      elements.dataEditorNewField.focus();
      return false;
    }
    if (existingFields.has(field)) {
      elements.dataEditorStatus.textContent = "That field already exists.";
      elements.dataEditorNewField.focus();
      return false;
    }

    return runHistoryAction("add village data field", () => {
      importedVillageDataset.records.forEach((record) => {
        record[field] = "";
      });
      elements.dataEditorNewField.value = "";
      renderVillageDataEditorFields(field);
      elements.dataEditorStatus.textContent =
        `${humanizeFieldName(field)} added. Enter values and apply edits.`;
      return true;
    });
  }

  function refreshAfterVillageDataEditorEdits(
    preferredEditorField,
    visualizationField,
    savedFilter,
  ) {
    refreshVillageDataValidation();
    populateVisualizationFields(visualizationField);
    if (savedFilter) {
      restoreWorkspaceDataFilter(savedFilter);
    }
    renderVillageDataEditorFields(preferredEditorField);
    renderRegionNavigator();
    updateSelectedDataProfile();
  }

  function applyVillageDataEditorEdits() {
    const count = villageDataEditorDraftCount();
    if (!count) {
      elements.dataEditorStatus.textContent =
        "There are no pending edits.";
      return false;
    }
    const preferredEditorField = elements.dataEditorField.value;
    const visualizationField = currentVillageVisualization?.field || "";
    const savedFilter = activeVillageDataFilter
      ? { ...activeVillageDataFilter }
      : null;

    return runHistoryAction("edit village data", () => {
      villageDataEditorDrafts.forEach((fieldDrafts, field) => {
        fieldDrafts.forEach((value, identifier) => {
          const region = childRegions.find(
            (item) => item.identifier === identifier,
          );
          if (region?.dataRecord) {
            region.dataRecord[field] = value;
          }
        });
      });
      villageDataEditorDrafts.clear();
      refreshAfterVillageDataEditorEdits(
        preferredEditorField,
        visualizationField,
        savedFilter,
      );
      elements.dataEditorStatus.textContent =
        `${count} edit${count === 1 ? "" : "s"} applied across the map.`;
      return true;
    });
  }

  function discardVillageDataEditorDrafts() {
    const count = villageDataEditorDraftCount();
    villageDataEditorDrafts.clear();
    renderVillageDataEditorRows();
    updateVillageDataEditorDraftStatus();
    elements.dataEditorStatus.textContent = count
      ? "Pending edits discarded."
      : "There are no pending edits.";
  }

  function villageDatasetFieldNames(records) {
    const fields = new Set();
    records.forEach((record) => {
      Object.keys(record).forEach((field) => fields.add(field));
    });
    return Array.from(fields);
  }

  function csvExportCell(value) {
    let text = "";
    if (value !== null && value !== undefined) {
      text =
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    }
    return /[",\r\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  function downloadVillageDataset(format) {
    if (!importedVillageDataset) {
      elements.dataStatus.textContent =
        "Import village data before exporting.";
      return false;
    }
    const pendingCount = villageDataEditorDraftCount();
    if (pendingCount) {
      elements.dataStatus.textContent =
        "Apply or discard pending edits before exporting.";
      return false;
    }

    const records = importedVillageDataset.records.map((record) => ({
      ...record,
    }));
    const baseName =
      `${state.slug}-${district.slug}-${tehsil.slug}-village-data`;
    let content;
    let type;
    let extension;
    if (format === "json") {
      content = JSON.stringify(records, null, 2);
      type = "application/json;charset=utf-8";
      extension = "json";
    } else {
      const fields = villageDatasetFieldNames(records);
      const rows = [
        fields.map(csvExportCell).join(","),
        ...records.map((record) =>
          fields.map((field) => csvExportCell(record[field])).join(","),
        ),
      ];
      content = `\uFEFF${rows.join("\r\n")}`;
      type = "text/csv;charset=utf-8";
      extension = "csv";
    }

    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseName}.${extension}`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    elements.dataStatus.textContent =
      `Exported ${records.length} village data ${
        records.length === 1 ? "record" : "records"
      } as ${extension.toLocaleUpperCase()}.`;
    return true;
  }

  function classifyVisualizationField(field) {
    const values = childRegions.map((region) => region.dataRecord?.[field]);
    const type = effectiveVillageFieldType(field, values);
    const kind = villageFieldKind(type);
    const numericValues =
      kind === "categorical"
        ? []
        : values
            .filter(scalarImportedValue)
            .map((value) =>
              type === "date"
                ? parseDateValue(value)
                : parseNumericValue(value),
            )
            .filter((value) => value !== null);
    return {
      type,
      kind,
      numericValues,
    };
  }

  function formatLegendNumber(value) {
    const absolute = Math.abs(value);
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: absolute > 0 && absolute < 1 ? 3 : 2,
      notation: absolute >= 100000 ? "compact" : "standard",
    }).format(value);
  }

  function formatVillageLegendValue(field, value) {
    const type = effectiveVillageFieldType(field);
    if (type === "date") {
      return formatDateTimestamp(value);
    }
    if (type === "percentage") {
      return `${formatLegendNumber(value)}%`;
    }
    if (type === "currency") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(value);
    }
    return formatLegendNumber(value);
  }

  function renderDataLegend(field, kind, items) {
    elements.dataLegendTitle.textContent = humanizeFieldName(field);
    const type = effectiveVillageFieldType(field);
    elements.dataLegendType.textContent =
      kind === "categorical"
        ? villageFieldTypeLabels[type]
        : `${villageFieldTypeLabels[type]} · equal intervals`;
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const row = document.createElement("div");
      const swatch = document.createElement("span");
      const label = document.createElement("span");
      const count = document.createElement("small");
      swatch.className = "map-data-legend-swatch";
      swatch.style.setProperty("--legend-color", item.color);
      label.textContent = item.label;
      count.textContent = item.count;
      row.append(swatch, label, count);
      fragment.append(row);
    });
    elements.dataLegendItems.replaceChildren(fragment);
    elements.dataLegend.hidden = false;
  }

  function updateSelectedDataProfile() {
    if (!selectedChildRegion || !currentVillageVisualization) {
      elements.childDataValue.hidden = true;
      return;
    }
    elements.childDataField.textContent =
      currentVillageVisualization.label;
    elements.childDataContent.textContent =
      selectedChildRegion.visualValue || "No value";
    elements.childDataValue.hidden = false;
  }

  function resetVillageVisualization() {
    currentVillageVisualization = null;
    childRegions.forEach((region) => {
      region.element.style.removeProperty("--tehsil-data-fill");
      region.element.classList.remove("has-data-visualization");
      delete region.visualValue;
      region.element.setAttribute(
        "aria-label",
        villageActionAriaLabel(region),
      );
    });
    elements.dataLegend.hidden = true;
    elements.dataLegendItems.replaceChildren();
    elements.visualizationTypeBadge.textContent = "Auto";
    elements.visualizationTypeBadge.classList.remove("is-active");
    updateSelectedDataProfile();
  }

  function applyNumericVisualization(field, stats) {
    if (!stats.numericValues.length) {
      childRegions.forEach((region) => {
        region.visualValue = scalarImportedValue(region.dataRecord?.[field])
          ? "Invalid value"
          : "No value";
        region.element.style.setProperty(
          "--tehsil-data-fill",
          missingDataColor,
        );
        region.element.classList.add("has-data-visualization");
      });
      return [
        {
          color: missingDataColor,
          label: "No valid value",
          count: childRegions.length,
        },
      ];
    }
    const uniqueValues = Array.from(new Set(stats.numericValues)).sort(
      (first, second) => first - second,
    );
    const minimum = uniqueValues[0];
    const maximum = uniqueValues[uniqueValues.length - 1];
    const bandCount = Math.max(
      1,
      Math.min(numericColors.length, uniqueValues.length),
    );
    const colors =
      bandCount === 1
        ? [numericColors[Math.floor(numericColors.length / 2)]]
        : Array.from(
            { length: bandCount },
            (_, index) =>
              numericColors[
                Math.round(
                  (index * (numericColors.length - 1)) / (bandCount - 1),
                )
              ],
          );
    const range = maximum - minimum;
    const counts = Array(bandCount).fill(0);
    let missingCount = 0;

    childRegions.forEach((region) => {
      const rawValue = region.dataRecord?.[field];
      const numericValue = parseVillageFieldComparableValue(field, rawValue);
      let color = missingDataColor;
      if (numericValue === null) {
        missingCount += 1;
        region.visualValue = "No value";
      } else {
        const index =
          range === 0
            ? bandCount - 1
            : Math.min(
                bandCount - 1,
                Math.floor(((numericValue - minimum) / range) * bandCount),
              );
        color = colors[index];
        counts[index] += 1;
        region.visualValue = formatVillageFieldValue(field, rawValue);
      }
      region.element.style.setProperty("--tehsil-data-fill", color);
      region.element.classList.add("has-data-visualization");
    });

    const items = colors.map((color, index) => {
      if (range === 0) {
        return {
          color,
          label: formatVillageLegendValue(field, minimum),
          count: counts[index],
        };
      }
      const lower = minimum + (range * index) / bandCount;
      const upper = minimum + (range * (index + 1)) / bandCount;
      return {
        color,
        label: `${formatVillageLegendValue(field, lower)} – ${formatVillageLegendValue(field, upper)}`,
        count: counts[index],
      };
    });
    if (missingCount) {
      items.push({
        color: missingDataColor,
        label: "No value",
        count: missingCount,
      });
    }
    return items;
  }

  function applyCategoricalVisualization(field) {
    const categoryCounts = new Map();
    childRegions.forEach((region) => {
      const value = region.dataRecord?.[field];
      if (!scalarImportedValue(value)) {
        return;
      }
      const category = String(value).trim();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    const rankedCategories = Array.from(categoryCounts.entries()).sort(
      (first, second) =>
        second[1] - first[1] || first[0].localeCompare(second[0]),
    );
    const visibleCategories = rankedCategories.slice(
      0,
      categoricalColors.length,
    );
    const colorByCategory = new Map(
      visibleCategories.map(([category], index) => [
        category,
        categoricalColors[index],
      ]),
    );
    const otherColor = "#777f79";
    let otherCount = 0;
    let missingCount = 0;

    childRegions.forEach((region) => {
      const rawValue = region.dataRecord?.[field];
      let color = missingDataColor;
      if (!scalarImportedValue(rawValue)) {
        missingCount += 1;
        region.visualValue = "No value";
      } else {
        const category = String(rawValue).trim();
        color = colorByCategory.get(category) || otherColor;
        if (!colorByCategory.has(category)) {
          otherCount += 1;
        }
        region.visualValue = formatVillageFieldValue(field, rawValue);
      }
      region.element.style.setProperty("--tehsil-data-fill", color);
      region.element.classList.add("has-data-visualization");
    });

    const items = visibleCategories.map(([category, count], index) => ({
      color: categoricalColors[index],
      label: category,
      count,
    }));
    if (otherCount) {
      items.push({ color: otherColor, label: "Other", count: otherCount });
    }
    if (missingCount) {
      items.push({
        color: missingDataColor,
        label: "No value",
        count: missingCount,
      });
    }
    return items;
  }

  function applyVillageVisualization(field) {
    resetVillageVisualization();
    elements.visualizationField.value = field || "";
    if (!field || !importedVillageDataset) {
      elements.visualizationStatus.textContent = importedVillageDataset
        ? "Imported data remains attached; village colors are cleared."
        : "";
      return;
    }

    const stats = classifyVisualizationField(field);
    const kind = stats.kind;
    const type = stats.type;
    const label = humanizeFieldName(field);
    currentVillageVisualization = { field, kind, type, label };
    const legendItems =
      kind === "numeric" || kind === "date"
        ? applyNumericVisualization(field, stats)
        : applyCategoricalVisualization(field);

    childRegions.forEach((region) => {
      region.element.setAttribute(
        "aria-label",
        villageActionAriaLabel(region),
      );
    });
    renderDataLegend(field, kind, legendItems);
    elements.visualizationTypeBadge.textContent =
      `${villageFieldTypeLabels[type]} ${
        kind === "categorical" ? "colors" : "scale"
      }`;
    elements.visualizationTypeBadge.classList.add("is-active");
    elements.visualizationStatus.textContent =
      `${label} is coloring the local boundary map.`;
    updateSelectedDataProfile();
    hideTooltip();
  }

  function populateVisualizationFields(preferredField = "") {
    const fields = importedFieldNames();
    elements.visualizationField.replaceChildren();
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No map coloring";
    elements.visualizationField.append(emptyOption);
    fields.forEach((field) => {
      const option = document.createElement("option");
      const stats = classifyVisualizationField(field);
      option.value = field;
      option.textContent =
        `${humanizeFieldName(field)} · ${villageFieldTypeLabels[stats.type]}`;
      elements.visualizationField.append(option);
    });
    elements.dataVisualization.hidden = fields.length === 0;
    populateVillageDataFilterFields(fields);
    if (!fields.length) {
      resetVillageVisualization();
      elements.dataStatus.textContent =
        `Loaded ${importedVillageDataset.fileName}, but no visualizable fields were found.`;
      return;
    }
    const nextField = fields.includes(preferredField)
      ? preferredField
      : fields.find(
          (field) => field.toLocaleLowerCase() === "population",
        ) ||
        fields.find(
          (field) => classifyVisualizationField(field).kind === "numeric",
        ) ||
        fields[0];
    applyVillageVisualization(nextField);
  }

  function replaceSelectOptions(select, options) {
    select.replaceChildren();
    options.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
  }

  function updateVillageDataFilterOperatorUI() {
    const isBetween =
      ["numeric", "date"].includes(configuredVillageDataFilterKind) &&
      elements.dataFilterOperator.value === "between";
    elements.dataFilterSecondaryField.hidden = !isBetween;
    elements.dataFilterValueLabel.textContent = isBetween
      ? "Minimum"
      : configuredVillageDataFilterKind === "numeric"
        ? "Value"
        : configuredVillageDataFilterKind === "date"
          ? "Date"
        : "Text or category";
  }

  function configureVillageDataFilterField(resetValues = true) {
    const field = elements.dataFilterField.value;
    if (!field) {
      return;
    }
    const kind = classifyVisualizationField(field).kind;
    configuredVillageDataFilterKind = kind;
    if (kind === "numeric" || kind === "date") {
      replaceSelectOptions(elements.dataFilterOperator, [
        {
          value: "gte",
          label: kind === "date" ? "On or after" : "At least (>=)",
        },
        {
          value: "gt",
          label: kind === "date" ? "After" : "Greater than (>)",
        },
        {
          value: "lte",
          label: kind === "date" ? "On or before" : "At most (<=)",
        },
        {
          value: "lt",
          label: kind === "date" ? "Before" : "Less than (<)",
        },
        {
          value: "eq",
          label: kind === "date" ? "On" : "Equal to (=)",
        },
        { value: "between", label: "Between" },
      ]);
      elements.dataFilterValue.type = kind === "date" ? "date" : "text";
      elements.dataFilterValueSecondary.type =
        kind === "date" ? "date" : "text";
      elements.dataFilterValue.setAttribute(
        "inputmode",
        kind === "date" ? "numeric" : "decimal",
      );
      elements.dataFilterValue.removeAttribute("list");
      elements.dataFilterValue.placeholder =
        kind === "date" ? "Choose a date" : "Enter a number";
      elements.dataFilterValueSecondary.placeholder =
        kind === "date" ? "Choose a date" : "Enter a number";
      elements.dataFilterSuggestions.replaceChildren();
    } else {
      replaceSelectOptions(elements.dataFilterOperator, [
        { value: "eq", label: "Is" },
        { value: "neq", label: "Is not" },
        { value: "contains", label: "Contains" },
      ]);
      elements.dataFilterValue.type = "text";
      elements.dataFilterValueSecondary.type = "text";
      elements.dataFilterValue.setAttribute("inputmode", "text");
      elements.dataFilterValue.setAttribute(
        "list",
        "tehsil-data-filter-suggestions",
      );
      elements.dataFilterValue.placeholder = "Enter or choose a category";
      const suggestions = Array.from(
        new Set(
          childRegions
            .map((region) => region.dataRecord?.[field])
            .filter(scalarImportedValue)
            .map((value) => String(value).trim()),
        ),
      ).sort((first, second) => first.localeCompare(second));
      const fragment = document.createDocumentFragment();
      suggestions.slice(0, 60).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        fragment.append(option);
      });
      elements.dataFilterSuggestions.replaceChildren(fragment);
    }

    if (resetValues) {
      elements.dataFilterValue.value = "";
      elements.dataFilterValueSecondary.value = "";
    }
    updateVillageDataFilterOperatorUI();
  }

  function buildVillageDataFilterFromControls() {
    const field = elements.dataFilterField.value;
    const operator = elements.dataFilterOperator.value;
    const kind = configuredVillageDataFilterKind;
    if (!field || !operator || !kind) {
      return null;
    }

    if (kind === "numeric" || kind === "date") {
      const parser = kind === "date" ? parseDateValue : parseNumericValue;
      const value = parser(elements.dataFilterValue.value);
      if (value === null) {
        elements.dataFilterStatus.textContent =
          `Enter a valid ${kind === "date" ? "date" : "numeric value"}.`;
        elements.dataFilterValue.focus();
        return null;
      }
      let secondary = null;
      if (operator === "between") {
        secondary = parser(elements.dataFilterValueSecondary.value);
        if (secondary === null) {
          elements.dataFilterStatus.textContent =
            `Enter a valid maximum ${kind === "date" ? "date" : "value"}.`;
          elements.dataFilterValueSecondary.focus();
          return null;
        }
      }
      return {
        field,
        kind,
        operator,
        value: operator === "between" ? Math.min(value, secondary) : value,
        valueSecondary:
          operator === "between" ? Math.max(value, secondary) : null,
      };
    }

    const value = elements.dataFilterValue.value.trim();
    if (!value) {
      elements.dataFilterStatus.textContent =
        "Enter or choose a category value.";
      elements.dataFilterValue.focus();
      return null;
    }
    return { field, kind, operator, value };
  }

  function regionMatchesDataFilter(
    region,
    filter = activeVillageDataFilter,
  ) {
    if (!filter) {
      return true;
    }
    const rawValue = region.dataRecord?.[filter.field];
    if (!scalarImportedValue(rawValue)) {
      return false;
    }
    if (filter.kind === "numeric" || filter.kind === "date") {
      const value =
        filter.kind === "date"
          ? parseDateValue(rawValue)
          : parseNumericValue(rawValue);
      if (value === null) {
        return false;
      }
      if (filter.operator === "gte") return value >= filter.value;
      if (filter.operator === "gt") return value > filter.value;
      if (filter.operator === "lte") return value <= filter.value;
      if (filter.operator === "lt") return value < filter.value;
      if (filter.operator === "eq") return value === filter.value;
      if (filter.operator === "between") {
        return value >= filter.value && value <= filter.valueSecondary;
      }
      return true;
    }
    const value = String(rawValue).trim().toLocaleLowerCase();
    const expected = String(filter.value).trim().toLocaleLowerCase();
    if (filter.operator === "eq") return value === expected;
    if (filter.operator === "neq") return value !== expected;
    if (filter.operator === "contains") return value.includes(expected);
    return true;
  }

  function dataFilteredRegions(regions) {
    return activeVillageDataFilter
      ? regions.filter((region) => regionMatchesDataFilter(region))
      : regions;
  }

  function describeVillageDataFilter(filter) {
    const field = humanizeFieldName(filter.field);
    if (filter.operator === "between") {
      const format =
        filter.kind === "date" ? formatDateTimestamp : formatLegendNumber;
      return `${field} between ${format(filter.value)} and ${format(filter.valueSecondary)}`;
    }
    const operators = {
      gte: ">=",
      gt: ">",
      lte: "<=",
      lt: "<",
      eq: ["numeric", "date"].includes(filter.kind) ? "=" : "is",
      neq: "is not",
      contains: "contains",
    };
    const value =
      filter.kind === "numeric"
        ? formatLegendNumber(filter.value)
        : filter.kind === "date"
          ? formatDateTimestamp(filter.value)
        : `"${filter.value}"`;
    return `${field} ${operators[filter.operator]} ${value}`;
  }

  function syncVillageDataFilterPresentation() {
    const hasFilter = Boolean(activeVillageDataFilter);
    childRegions.forEach((region) => {
      region.element.classList.toggle(
        "is-data-filter-muted",
        hasFilter && !regionMatchesDataFilter(region),
      );
    });
    renderRegionNavigator();
    hideTooltip();
    if (!activeVillageDataFilter) {
      return;
    }
    const matchCount = childRegions.filter((region) =>
      regionMatchesDataFilter(region),
    ).length;
    elements.dataFilterBadge.textContent = `${matchCount} match`;
    elements.dataFilterBadge.classList.add("is-active");
    elements.dataFilterStatus.textContent =
      `${matchCount} of ${childRegions.length} local boundaries match · ` +
      describeVillageDataFilter(activeVillageDataFilter);
  }

  function applyVillageDataFilter() {
    const filter = buildVillageDataFilterFromControls();
    if (!filter) {
      return false;
    }
    if (
      activeVillageDataFilter &&
      JSON.stringify(activeVillageDataFilter) === JSON.stringify(filter)
    ) {
      elements.dataFilterStatus.textContent =
        "This data rule is already active.";
      return false;
    }
    storeHistoryCheckpoint("apply data filter");
    activeVillageDataFilter = filter;
    elements.clearDataFilter.hidden = false;
    syncVillageDataFilterPresentation();
    return true;
  }

  function clearVillageDataFilter(announce = true) {
    if (announce && activeVillageDataFilter) {
      storeHistoryCheckpoint("clear data filter");
    }
    activeVillageDataFilter = null;
    childRegions.forEach((region) => {
      region.element.classList.remove("is-data-filter-muted");
    });
    elements.dataFilterBadge.textContent = "No filter";
    elements.dataFilterBadge.classList.remove("is-active");
    elements.clearDataFilter.hidden = true;
    elements.dataFilterStatus.textContent = announce
      ? "Filter cleared. All local boundaries are available."
      : "Choose a field and condition.";
    renderRegionNavigator();
    return true;
  }

  function populateVillageDataFilterFields(fields) {
    elements.dataFilterField.replaceChildren();
    fields.forEach((field) => {
      const option = document.createElement("option");
      const stats = classifyVisualizationField(field);
      option.value = field;
      option.textContent =
        `${humanizeFieldName(field)} · ${villageFieldTypeLabels[stats.type]}`;
      elements.dataFilterField.append(option);
    });
    elements.dataFilter.hidden = fields.length === 0;
    if (!fields.length) {
      configuredVillageDataFilterKind = null;
      return;
    }
    const preferredField =
      fields.includes(elements.visualizationField.value) &&
      elements.visualizationField.value
        ? elements.visualizationField.value
        : fields[0];
    elements.dataFilterField.value = preferredField;
    configureVillageDataFilterField();
  }

  function applyImportedVillageRecords(records, fileName, fieldSettings = {}) {
    const lookup = buildChildRegionLookup();
    const join = detectJoinField(records, lookup);
    if (!join) {
      throw new Error(
        "No source code, feature identifier, village name, or slug could be matched.",
      );
    }

    storeHistoryCheckpoint("import village data");
    clearVillageDataFilter(false);
    childRegions.forEach((region) => {
      delete region.dataRecord;
      delete region.dataRecordIndex;
    });
    const storedRecords = records.map((record) => ({ ...record }));
    let matched = 0;
    const unmatched = [];
    storedRecords.forEach((record, index) => {
      const sourceValue = record?.[join.column];
      const region = lookup.get(normalizedSearchValue(sourceValue));
      if (region) {
        region.dataRecord = record;
        region.dataRecordIndex = index;
        matched += 1;
      } else {
        unmatched.push(sourceValue);
      }
    });

    importedVillageDataset = {
      fileName,
      joinField: join.column,
      recordCount: records.length,
      matched,
      unmatched,
      records: storedRecords,
      fieldSettings: normalizeVillageFieldSettings(
        fieldSettings,
        storedRecords,
        join.column,
      ),
    };
    const validation = refreshVillageDataValidation();
    elements.dataBadge.textContent = `${matched} matched`;
    elements.dataBadge.classList.add("has-data");
    elements.dataStatus.textContent = validation.issueCount
      ? `Loaded ${fileName} with ${validation.issueCount} data-quality issue${
          validation.issueCount === 1 ? "" : "s"
        }. Review them before using the data.`
      : `Loaded ${fileName}. Validation passed; choose a field to color the village map.`;
    elements.dataSummary.hidden = false;
    elements.clearData.hidden = false;
    elements.dataRowCount.textContent = records.length;
    elements.dataMatchCount.textContent = matched;
    elements.dataUnmatchedCount.textContent = unmatched.length;
    elements.dataJoinField.textContent = join.column;
    elements.dataUnmatchedPreview.textContent = unmatched.length
      ? `Unmatched examples: ${unmatched
          .slice(0, 5)
          .map((value) => value || "(blank)")
          .join(", ")}`
      : "All records matched.";
    resetVillageDataEditorDrafts();
    populateVisualizationFields();
  }

  async function importVillageData(file) {
    if (!file) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      elements.dataStatus.textContent =
        "Please choose a CSV or JSON file smaller than 2 MB.";
      elements.dataFile.value = "";
      return;
    }

    elements.dataStatus.textContent = `Reading ${file.name}…`;
    try {
      const text = await file.text();
      const isJson =
        file.name.toLocaleLowerCase().endsWith(".json") ||
        file.type.includes("json");
      const records = isJson ? parseJsonRecords(text) : parseCsv(text);
      if (!records.length) {
        throw new Error("The file does not contain records.");
      }
      if (records.some((record) => typeof record !== "object" || !record)) {
        throw new Error("Every imported record must be an object or CSV row.");
      }
      applyImportedVillageRecords(records, file.name);
    } catch (error) {
      elements.dataStatus.textContent = `Import failed: ${error.message}`;
      elements.dataFile.value = "";
      console.error(error);
    }
  }

  function clearImportedVillageData() {
    if (importedVillageDataset) {
      storeHistoryCheckpoint("clear imported village data");
    }
    clearVillageDataFilter(false);
    resetVillageVisualization();
    childRegions.forEach((region) => {
      delete region.dataRecord;
      delete region.dataRecordIndex;
    });
    importedVillageDataset = null;
    resetVillageDataEditorDrafts();
    elements.dataFile.value = "";
    elements.dataBadge.textContent = "No data";
    elements.dataBadge.classList.remove("has-data");
    elements.dataStatus.textContent = "Import is ready.";
    elements.dataSummary.hidden = true;
    elements.clearData.hidden = true;
    elements.dataVisualization.hidden = true;
    elements.dataFilter.hidden = true;
    elements.visualizationField.replaceChildren();
    elements.dataFilterField.replaceChildren();
    elements.dataFilterOperator.replaceChildren();
    elements.dataFilterValue.value = "";
    elements.dataFilterValueSecondary.value = "";
    elements.dataFilterSuggestions.replaceChildren();
    elements.visualizationStatus.textContent = "";
    elements.dataUnmatchedPreview.textContent = "";
    renderVillageDataValidation(null);
  }

  function currentLayerVisibility() {
    const layers = {};
    document
      .querySelectorAll("[data-child-layer-toggle]")
      .forEach((toggle) => {
        layers[toggle.dataset.childLayerToggle] = toggle.checked;
      });
    return layers;
  }

  function validWorkspaceViewBox(value) {
    if (typeof value !== "string") {
      return null;
    }
    const numbers = value
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (
      numbers.length !== 4 ||
      numbers.some((number) => !Number.isFinite(number)) ||
      numbers[2] <= 0 ||
      numbers[3] <= 0
    ) {
      return null;
    }
    return numbers.join(" ");
  }

  function buildTehsilWorkspaceSnapshot() {
    return {
      schema: "india-map-studio.tehsil-workspace",
      version: 1,
      exportedAt: new Date().toISOString(),
      context: {
        state: state.slug,
        district: district.slug,
        tehsil: tehsil.slug,
      },
      data: importedVillageDataset
        ? {
            fileName: importedVillageDataset.fileName,
            records:
              importedVillageDataset.records?.map((record) => ({
                ...record,
              })) ||
              childRegions
                .map((region) => region.dataRecord)
                .filter(Boolean)
                .map((record) => ({ ...record })),
            fieldSettings: Object.fromEntries(
              Object.entries(importedVillageDataset.fieldSettings || {}).map(
                ([field, setting]) => [field, { ...setting }],
              ),
            ),
            visualizationField: currentVillageVisualization?.field || "",
            filter: activeVillageDataFilter
              ? { ...activeVillageDataFilter }
              : null,
          }
        : null,
      interface: {
        labelMode: currentLabelMode,
        search: elements.regionSearch.value,
        layers: currentLayerVisibility(),
        actions: Object.fromEntries(
          Array.from(villageActions, ([identifier, action]) => [
            identifier,
            { ...action },
          ]),
        ),
        selected: selectedChildRegion
          ? {
              layer: selectedChildRegion.definition.key,
              region: selectedChildRegion.slug,
            }
          : null,
        viewBox: tehsilSvg?.getAttribute("viewBox") || defaultViewBox,
      },
    };
  }

  function standaloneTehsilViewBox() {
    const value = validWorkspaceViewBox(
      tehsilSvg?.getAttribute("viewBox") || defaultViewBox,
    );
    if (!value) {
      return null;
    }
    const [x, y, width, height] = value.split(/\s+/).map(Number);
    return { x, y, width, height };
  }

  function standaloneTehsilLegend() {
    if (!currentVillageVisualization || elements.dataLegend.hidden) {
      return null;
    }
    const items = Array.from(elements.dataLegendItems.children)
      .map((row) => ({
        color:
          row.querySelector(".map-data-legend-swatch")?.style.getPropertyValue(
            "--legend-color",
          ) || "",
        label: row.children[1]?.textContent || "",
        count: row.children[2]?.textContent || "",
      }))
      .filter((item) => item.color && item.label);
    return items.length
      ? {
          title: elements.dataLegendTitle.textContent,
          type: elements.dataLegendType.textContent,
          items,
        }
      : null;
  }

  function standaloneVillageData(region) {
    return Object.fromEntries(
      Object.entries(region.dataRecord || {}).filter(([, value]) =>
        scalarImportedValue(value),
      ),
    );
  }

  function standaloneVillageAction(region) {
    const action = villageActions.get(region.identifier);
    if (!action) {
      return null;
    }
    if (action.type === "map") {
      return {
        type: "url",
        url: villageMapDestinationUrl(action.map),
        target: "same",
      };
    }
    return { ...action };
  }

  function buildStandaloneTehsilConfig() {
    const villageLayerVisible =
      currentLayerVisibility().villages !== false;
    const importedFields = importedFieldNames();
    return {
      version: 1,
      projectName: `${tehsil.name} interactive village map`,
      exportedAt: new Date().toISOString(),
      state: {
        name: tehsil.name,
        slug: tehsil.slug,
        code: tehsil.censusCode,
        featureId: tehsil.featureId,
      },
      context: {
        state: state.name,
        stateSlug: state.slug,
        district: district.name,
        districtSlug: district.slug,
        tehsil: tehsil.name,
        tehsilSlug: tehsil.slug,
      },
      terminology: {
        entitySingular: "village",
        entityPlural: "villages",
        entityTitle: "Villages",
        entityTemplateKey: "village",
        groupLabel: "Tehsil",
        groupPlural: "tehsils",
        groupSuffix: " Tehsil",
        parentName: `${district.name} District · ${state.name}`,
        entityIdLabel: "Village ID",
        groupIdLabel: "Tehsil ID",
        mapKind: "Interactive village map",
      },
      map: {
        activeDivisionSlug: "",
        selectedDistrictSlug:
          selectedChildRegion?.definition.key === "villages"
            ? selectedChildRegion.slug
            : "",
        labelMode: currentLabelMode === "off" ? "off" : "districts",
        groupFilter: false,
        viewBox: standaloneTehsilViewBox(),
        layers: {
          stateOutline: true,
          districts: villageLayerVisible,
          labels: currentLabelMode !== "off",
          divisionFocus: false,
          dataColors: Boolean(currentVillageVisualization),
          comparisonMarks: false,
        },
        styles: {},
        visualization: currentVillageVisualization
          ? { ...currentVillageVisualization }
          : null,
      },
      content: {
        fieldSettings: Object.fromEntries(
          Object.entries(importedVillageDataset?.fieldSettings || {}).map(
            ([field, setting]) => [field, { ...setting }],
          ),
        ),
        tooltipFields: currentVillageVisualization
          ? ["activeData", "identifiers"]
          : ["identifiers"],
        popupFields: [
          "division",
          "census",
          "lgd",
          "geometry",
          "identifiers",
          ...importedFields.map((field) => `imported:${field}`),
        ],
        customText: "",
        linkLabel: "",
        linkUrl: "",
        imageUrl: "",
        imageAlt: "",
      },
      districts: actionableVillageRegions().map((region) => ({
        name: region.name,
        slug: region.slug,
        sourceId: region.sourceId,
        code: region.censusCode,
        featureId: region.identifier,
        divisionName: tehsil.name,
        divisionSlug: tehsil.slug,
        divisionId: tehsil.featureId,
        lgdCode: region.lgdCode,
        boundaryYear: region.boundaryYear,
        geometryType: region.geometryType,
        data: standaloneVillageData(region),
        dataColor:
          region.element.style
            .getPropertyValue("--tehsil-data-fill")
            .trim() || "",
        divisionColor: "#d7653b",
        matchesFilter: regionMatchesDataFilter(region),
        compared: false,
        action: standaloneVillageAction(region),
      })),
      legend: standaloneTehsilLegend(),
    };
  }

  function buildStandaloneTehsilSvgMarkup(config) {
    const clone = tehsilSvg.cloneNode(true);
    clone.id = "portable-district-svg";
    clone.removeAttribute("style");
    clone
      .querySelectorAll(".tehsil-child-layer")
      .forEach((layer) => {
        if (layer.dataset.layerType !== "villages") {
          layer.remove();
        }
      });
    const villageLayer = clone.querySelector(
      '[data-layer-type="villages"]',
    );
    if (villageLayer) {
      villageLayer.id = "district-layer";
      villageLayer.classList.remove("is-hidden");
    }
    const outline = clone.querySelector("#tehsil-outline");
    if (outline) {
      outline.id = "state-outline";
    }

    const exportedVillages = new Map(
      config.districts.map((village) => [village.slug, village]),
    );
    clone.querySelectorAll(".child-region").forEach((element) => {
      const village = exportedVillages.get(element.dataset.slug);
      if (!village) {
        element.remove();
        return;
      }
      element.classList.add("district-region");
      element.classList.remove(
        "is-map-hovered",
        "is-list-hovered",
        "is-selected",
        "is-search-muted",
        "is-search-match",
        "is-data-filter-muted",
      );
      element.removeAttribute("style");
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", village.matchesFilter ? "0" : "-1");
      if (village.dataColor) {
        element.style.setProperty("--data-fill", village.dataColor);
        element.dataset.visualized = "true";
      } else {
        element.removeAttribute("data-visualized");
      }
    });

    const exportedLabelMode = config.map.labelMode;
    const exportedLabelLayer = clone.querySelector(
      "#tehsil-region-label-layer",
    );
    if (!exportedLabelLayer || exportedLabelMode === "off") {
      exportedLabelLayer?.remove();
    } else {
      exportedLabelLayer.id = "map-label-layer";
      exportedLabelLayer
        .querySelectorAll(".tehsil-region-label")
        .forEach((label) => {
          if (!label.classList.contains("is-visible")) {
            label.remove();
            return;
          }
          label.classList.add("map-label", "district-label");
          label.classList.remove(
            "tehsil-region-label",
            "is-visible",
            "is-selected-label",
          );
          label.dataset.districtSlug = label.dataset.regionSlug || "";
          label.removeAttribute("style");
        });
    }
    return new XMLSerializer().serializeToString(clone);
  }

  function standaloneTehsilMapFileName() {
    return `${state.slug}-${district.slug}-${tehsil.slug}-interactive-map.html`;
  }

  function defaultTehsilEmbedMapUrl() {
    return `./${standaloneTehsilMapFileName()}`;
  }

  function normalizedTehsilEmbedHeight() {
    return Math.min(
      1200,
      Math.max(
        320,
        Math.round(Number(elements.embedMapHeight.value) || 720),
      ),
    );
  }

  function refreshTehsilEmbedCode() {
    elements.embedFormatButtons.forEach((button) => {
      const active = button.dataset.tehsilEmbedFormat === embedFormat;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.embedCodeSummary.textContent =
      embedFormat === "javascript" ? "JavaScript" : "Iframe";
    const exporter = window.ImageMapStandaloneExporter;
    try {
      if (!exporter?.buildEmbedCode) {
        throw new Error("The embed generator could not be loaded.");
      }
      elements.embedCodeOutput.value = exporter.buildEmbedCode({
        format: embedFormat,
        source: elements.embedMapUrl.value,
        title: `Interactive village map of ${tehsil.name} Tehsil`,
        height: normalizedTehsilEmbedHeight(),
      });
      elements.copyEmbedCode.disabled = false;
      elements.embedCodeStatus.dataset.state = "ready";
      elements.embedCodeStatus.textContent =
        embedFormat === "javascript"
          ? "JavaScript loader code is ready to copy."
          : "Iframe code is ready to copy.";
    } catch (error) {
      elements.embedCodeOutput.value = "";
      elements.copyEmbedCode.disabled = true;
      elements.embedCodeStatus.dataset.state = "error";
      elements.embedCodeStatus.textContent =
        error instanceof Error
          ? error.message
          : "Enter a valid map URL or relative path.";
    }
  }

  function initializeTehsilEmbedCodeBuilder() {
    if (!embedUrlCustomized) {
      elements.embedMapUrl.value = defaultTehsilEmbedMapUrl();
    }
    refreshTehsilEmbedCode();
  }

  function copyTehsilEmbedCode() {
    if (!elements.embedCodeOutput.value) {
      elements.embedCodeStatus.dataset.state = "error";
      elements.embedCodeStatus.textContent =
        "Generate valid embed code before copying.";
      return;
    }
    elements.embedCodeStatus.dataset.state = "ready";
    void copyText(
      elements.embedCodeOutput.value,
      "Embed code copied.",
      elements.embedCodeStatus,
    );
  }

  function exportStandaloneTehsilMap() {
    if (!tehsilSvg || !actionableVillageRegions().length) {
      elements.standaloneExportStatus.textContent =
        "The village map is not ready to export yet.";
      return;
    }
    if (villageDataEditorDraftCount()) {
      elements.standaloneExportStatus.textContent =
        "Apply or discard pending village-data edits before exporting.";
      return;
    }
    const exporter = window.ImageMapStandaloneExporter;
    if (!exporter?.buildHtml) {
      elements.standaloneExportStatus.textContent =
        "The standalone exporter could not be loaded.";
      return;
    }
    try {
      const config = buildStandaloneTehsilConfig();
      const html = exporter.buildHtml({
        config,
        svgMarkup: buildStandaloneTehsilSvgMarkup(config),
      });
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = standaloneTehsilMapFileName();
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      elements.standaloneExportStatus.textContent =
        `Exported ${config.districts.length} interactive villages in one HTML file.`;
    } catch (error) {
      elements.standaloneExportStatus.textContent =
        "The standalone tehsil map could not be generated.";
      console.error(error);
    }
  }

  function exportTehsilWorkspace() {
    if (!tehsilSvg || !tehsil) {
      return;
    }
    const workspace = buildTehsilWorkspaceSnapshot();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(workspace, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.slug}-${district.slug}-${tehsil.slug}-workspace.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    elements.workspaceStatus.textContent =
      "Workspace exported with the current data and map state.";
  }

  function validateTehsilWorkspace(workspace) {
    if (!workspace || typeof workspace !== "object") {
      throw new Error("The workspace file must contain a JSON object.");
    }
    if (
      workspace.schema !== "india-map-studio.tehsil-workspace" ||
      workspace.version !== 1
    ) {
      throw new Error("This is not a supported tehsil workspace file.");
    }
    if (
      workspace.context?.state !== state.slug ||
      workspace.context?.district !== district.slug ||
      workspace.context?.tehsil !== tehsil.slug
    ) {
      throw new Error(
        `This workspace belongs to a different state, district, or tehsil.`,
      );
    }
    if (
      workspace.data &&
      (!Array.isArray(workspace.data.records) ||
        workspace.data.records.length > 5000)
    ) {
      throw new Error("The workspace data records are missing or too large.");
    }
    return workspace;
  }

  function restoreWorkspaceLayerVisibility(layers) {
    if (!layers || typeof layers !== "object") {
      return;
    }
    document
      .querySelectorAll("[data-child-layer-toggle]")
      .forEach((toggle) => {
        const visible = layers[toggle.dataset.childLayerToggle];
        if (typeof visible !== "boolean" || toggle.disabled) {
          return;
        }
        toggle.checked = visible;
        const layer = tehsilSvg.querySelector(
          `[data-layer-type="${toggle.dataset.childLayerToggle}"]`,
        );
        layer?.classList.toggle("is-hidden", !visible);
      });
  }

  function restoreWorkspaceDataFilter(savedFilter) {
    clearVillageDataFilter(false);
    if (
      !savedFilter ||
      !importedVillageDataset ||
      !importedFieldNames().includes(savedFilter.field)
    ) {
      return;
    }
    elements.dataFilterField.value = savedFilter.field;
    configureVillageDataFilterField(false);
    if (
      Array.from(elements.dataFilterOperator.options).some(
        (option) => option.value === savedFilter.operator,
      )
    ) {
      elements.dataFilterOperator.value = savedFilter.operator;
    }
    elements.dataFilterValue.value =
      savedFilter.value === undefined ? "" : String(savedFilter.value);
    elements.dataFilterValueSecondary.value =
      savedFilter.valueSecondary === undefined ||
      savedFilter.valueSecondary === null
        ? ""
        : String(savedFilter.valueSecondary);
    updateVillageDataFilterOperatorUI();
    const restoredFilter = buildVillageDataFilterFromControls();
    if (!restoredFilter) {
      return;
    }
    activeVillageDataFilter = restoredFilter;
    elements.clearDataFilter.hidden = false;
    syncVillageDataFilterPresentation();
  }

  function restoreTehsilWorkspace(workspace) {
    clearChildSelection(false);
    if (workspace.data) {
      applyImportedVillageRecords(
        workspace.data.records,
        workspace.data.fileName || "Imported workspace data",
        workspace.data.fieldSettings,
      );
      const visualizationField = importedFieldNames().includes(
        workspace.data.visualizationField,
      )
        ? workspace.data.visualizationField
        : "";
      applyVillageVisualization(visualizationField);
    } else {
      clearImportedVillageData();
    }

    restoreWorkspaceLayerVisibility(workspace.interface?.layers);
    restoreVillageActions(workspace.interface?.actions);
    elements.regionSearch.value =
      typeof workspace.interface?.search === "string"
        ? workspace.interface.search
        : "";
    setRegionLabelMode(workspace.interface?.labelMode);
    restoreWorkspaceDataFilter(workspace.data?.filter);
    renderRegionNavigator();

    const selection = workspace.interface?.selected;
    const selectedRegion = selection
      ? childRegions.find(
          (region) =>
            region.definition.key === selection.layer &&
            region.slug === selection.region,
        )
      : null;
    const selectedLayer = selectedRegion?.element.closest(
      ".tehsil-child-layer",
    );
    if (
      selectedRegion &&
      selectedLayer &&
      !selectedLayer.classList.contains("is-hidden")
    ) {
      selectChildRegion(selectedRegion);
    } else {
      clearChildSelection();
    }

    const savedViewBox = validWorkspaceViewBox(
      workspace.interface?.viewBox,
    );
    if (savedViewBox) {
      window.requestAnimationFrame(() => {
        tehsilSvg.setAttribute("viewBox", savedViewBox);
        updateLabelCounterScale();
      });
    }
    const recordCount = workspace.data?.records.length || 0;
    elements.workspaceStatus.textContent =
      `Workspace restored${recordCount ? ` with ${recordCount} data records` : ""}.`;
  }

  async function importTehsilWorkspace(file) {
    if (!file) {
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      elements.workspaceStatus.textContent =
        "Choose a workspace file smaller than 4 MB.";
      elements.importWorkspace.value = "";
      return;
    }
    elements.workspaceStatus.textContent = `Reading ${file.name}…`;
    try {
      const workspace = validateTehsilWorkspace(
        JSON.parse(await file.text()),
      );
      restoreWorkspaceAsHistoryAction(
        workspace,
        "import tehsil workspace",
      );
    } catch (error) {
      elements.workspaceStatus.textContent =
        `Import failed: ${error.message}`;
      console.error(error);
    } finally {
      elements.importWorkspace.value = "";
    }
  }

  function tehsilSnapshotStorageKey() {
    return (
      `india-map-studio:tehsil-workspace:v1:` +
      `${state.slug}:${district.slug}:${tehsil.slug}`
    );
  }

  function readTehsilSnapshot() {
    try {
      const stored = window.localStorage.getItem(
        tehsilSnapshotStorageKey(),
      );
      if (!stored) {
        return null;
      }
      return validateTehsilWorkspace(JSON.parse(stored));
    } catch {
      return null;
    }
  }

  function formatSnapshotSavedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Saved";
    }
    return `Saved ${new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)}`;
  }

  function refreshTehsilSnapshotUI(snapshot = readTehsilSnapshot()) {
    const hasSnapshot = Boolean(snapshot);
    elements.snapshotBadge.textContent = hasSnapshot
      ? formatSnapshotSavedAt(snapshot.savedAt || snapshot.exportedAt)
      : "Not saved";
    elements.snapshotBadge.classList.toggle("has-data", hasSnapshot);
    elements.restoreSnapshot.disabled = !hasSnapshot;
    elements.deleteSnapshot.disabled = !hasSnapshot;
  }

  function saveTehsilSnapshot() {
    const snapshot = buildTehsilWorkspaceSnapshot();
    snapshot.savedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(
        tehsilSnapshotStorageKey(),
        JSON.stringify(snapshot),
      );
      refreshTehsilSnapshotUI(snapshot);
      elements.snapshotStatus.textContent =
        "Complete workspace saved in this browser.";
    } catch {
      elements.snapshotStatus.textContent =
        "Browser storage is unavailable or the workspace is too large.";
    }
  }

  function restoreTehsilSnapshot() {
    const snapshot = readTehsilSnapshot();
    if (!snapshot) {
      refreshTehsilSnapshotUI(null);
      elements.snapshotStatus.textContent =
        "No valid saved snapshot is available.";
      return;
    }
    try {
      restoreWorkspaceAsHistoryAction(
        snapshot,
        "restore browser snapshot",
      );
      refreshTehsilSnapshotUI(snapshot);
      elements.snapshotStatus.textContent =
        "Saved browser snapshot restored.";
    } catch (error) {
      elements.snapshotStatus.textContent =
        "The saved snapshot could not be restored.";
      console.error(error);
    }
  }

  function deleteTehsilSnapshot() {
    try {
      window.localStorage.removeItem(tehsilSnapshotStorageKey());
      refreshTehsilSnapshotUI(null);
      elements.snapshotStatus.textContent =
        "Saved snapshot deleted. The current workspace is unchanged.";
    } catch {
      elements.snapshotStatus.textContent =
        "The saved snapshot could not be deleted.";
    }
  }

  function updateHistoryControls(message = "") {
    const undoEntry = undoHistory[undoHistory.length - 1];
    const redoEntry = redoHistory[redoHistory.length - 1];
    elements.undoChange.disabled = !undoEntry;
    elements.redoChange.disabled = !redoEntry;
    elements.undoChange.title = undoEntry
      ? `Undo ${undoEntry.label} (Ctrl+Z)`
      : "Nothing to undo";
    elements.redoChange.title = redoEntry
      ? `Redo ${redoEntry.label} (Ctrl+Shift+Z)`
      : "Nothing to redo";
    elements.historyStatus.textContent =
      message ||
      (undoHistory.length
        ? `${undoHistory.length} recent ${
            undoHistory.length === 1 ? "change" : "changes"
          } available`
        : "No workspace changes yet");
  }

  function storeHistoryCheckpoint(label, snapshot = null) {
    if (!historyReady || historyIsRestoring) {
      return;
    }
    undoHistory.push({
      label,
      snapshot: snapshot || buildTehsilWorkspaceSnapshot(),
    });
    if (undoHistory.length > historyLimit) {
      undoHistory.shift();
    }
    redoHistory.length = 0;
    updateHistoryControls();
  }

  function runHistoryAction(label, action) {
    if (!historyReady || historyIsRestoring) {
      return action();
    }
    const snapshot = buildTehsilWorkspaceSnapshot();
    const result = action();
    if (result !== false) {
      storeHistoryCheckpoint(label, snapshot);
    }
    return result;
  }

  function restoreHistorySnapshot(snapshot) {
    const editorDrafts = cloneVillageDataEditorDrafts();
    const editorField = elements.dataEditorField.value;
    const editorSearch = elements.dataEditorSearch.value;
    const editorBulkValue = elements.dataEditorBulkValue.value;
    const editorSelection = Array.from(villageDataEditorSelection);
    const editorAdvancedState = {
      scope: elements.dataEditorBulkScope.value,
      operation: elements.dataEditorBulkOperation.value,
      primary: elements.dataEditorBulkPrimary.value,
      secondary: elements.dataEditorBulkSecondary.value,
      source: elements.dataEditorBulkSource.value,
    };
    historyIsRestoring = true;
    try {
      restoreTehsilWorkspace(snapshot);
      if (importedVillageDataset) {
        restoreVillageDataEditorDrafts(
          editorDrafts,
          editorField,
          editorSearch,
          editorBulkValue,
          editorSelection,
          editorAdvancedState,
        );
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      historyIsRestoring = false;
    }
  }

  function restoreWorkspaceAsHistoryAction(workspace, label) {
    if (!historyReady || historyIsRestoring) {
      restoreTehsilWorkspace(workspace);
      return;
    }
    const previous = buildTehsilWorkspaceSnapshot();
    historyIsRestoring = true;
    try {
      restoreTehsilWorkspace(workspace);
    } finally {
      historyIsRestoring = false;
    }
    storeHistoryCheckpoint(label, previous);
  }

  function undoTehsilChange() {
    const entry = undoHistory.pop();
    if (!entry) {
      return;
    }
    const current = {
      label: entry.label,
      snapshot: buildTehsilWorkspaceSnapshot(),
    };
    if (restoreHistorySnapshot(entry.snapshot)) {
      redoHistory.push(current);
      updateHistoryControls(`Undid ${entry.label}`);
    } else {
      undoHistory.push(entry);
      updateHistoryControls("Undo could not be completed");
    }
  }

  function redoTehsilChange() {
    const entry = redoHistory.pop();
    if (!entry) {
      return;
    }
    const current = {
      label: entry.label,
      snapshot: buildTehsilWorkspaceSnapshot(),
    };
    if (restoreHistorySnapshot(entry.snapshot)) {
      undoHistory.push(current);
      if (undoHistory.length > historyLimit) {
        undoHistory.shift();
      }
      updateHistoryControls(`Redid ${entry.label}`);
    } else {
      redoHistory.push(entry);
      updateHistoryControls("Redo could not be completed");
    }
  }

  function commitSearchHistory() {
    if (
      searchHistorySnapshot &&
      searchHistorySnapshot.interface.search !== elements.regionSearch.value
    ) {
      storeHistoryCheckpoint(
        "change village search",
        searchHistorySnapshot,
      );
    }
    searchHistorySnapshot = null;
  }

  function matchingRegions() {
    const visibleRegions = dataFilteredRegions(visibleChildRegions());
    const query = normalizedSearchValue(elements.regionSearch.value);
    if (!query) {
      return visibleRegions;
    }
    return visibleRegions.filter((region) =>
      [region.name, region.sourceId, region.identifier, region.definition.label]
        .filter(Boolean)
        .some((value) => normalizedSearchValue(value).includes(query)),
    );
  }

  function syncMapRegionTabStops(preferredRegion = selectedChildRegion) {
    const candidates = matchingRegions();
    const focusedRegion = candidates.find(
      (region) => region.element === document.activeElement,
    );
    const tabStop =
      focusedRegion ||
      (preferredRegion && candidates.includes(preferredRegion)
        ? preferredRegion
        : candidates[0]);
    childRegions.forEach((region) => {
      region.element.setAttribute(
        "tabindex",
        region === tabStop ? "0" : "-1",
      );
    });
    return candidates;
  }

  function moveMapRegionFocus(region, direction) {
    const candidates = syncMapRegionTabStops(region);
    if (!candidates.length) {
      elements.regionSearch.focus();
      return;
    }
    const currentIndex = Math.max(0, candidates.indexOf(region));
    let nextIndex = currentIndex;
    if (direction === "first") {
      nextIndex = 0;
    } else if (direction === "last") {
      nextIndex = candidates.length - 1;
    } else {
      nextIndex =
        (currentIndex + direction + candidates.length) % candidates.length;
    }
    const nextRegion = candidates[nextIndex];
    childRegions.forEach((item) => {
      item.element.setAttribute(
        "tabindex",
        item === nextRegion ? "0" : "-1",
      );
    });
    nextRegion.element.focus();
    nextRegion.listButton?.scrollIntoView({ block: "nearest" });
  }

  function moveNavigatorButtonFocus(button, direction) {
    const buttons = Array.from(
      elements.regionList.querySelectorAll(".tehsil-region-list-item"),
    );
    if (!buttons.length) {
      elements.regionSearch.focus();
      return;
    }
    const currentIndex = Math.max(0, buttons.indexOf(button));
    let nextIndex = currentIndex;
    if (direction === "first") {
      nextIndex = 0;
    } else if (direction === "last") {
      nextIndex = buttons.length - 1;
    } else {
      nextIndex =
        (currentIndex + direction + buttons.length) % buttons.length;
    }
    buttons[nextIndex].focus();
    buttons[nextIndex].scrollIntoView({ block: "nearest" });
  }

  function setListHover(region, active, className) {
    region.element.classList.toggle(className, active);
    region.listButton?.classList.toggle(className, active);
  }

  function navigatorLabel(regions) {
    const layerKeys = new Set(regions.map((region) => region.definition.key));
    if (layerKeys.size === 1 && regions.length) {
      return regions[0].definition.label.toLocaleLowerCase();
    }
    return "local boundaries";
  }

  function splitLabelLines(label, maximumLength = 15) {
    if (label.length <= maximumLength || !label.includes(" ")) {
      return [label];
    }
    const words = label.split(/\s+/);
    const lines = [""];
    words.forEach((word) => {
      const current = lines[lines.length - 1];
      if (!current || `${current} ${word}`.length <= maximumLength) {
        lines[lines.length - 1] = current ? `${current} ${word}` : word;
      } else if (lines.length < 2) {
        lines.push(word);
      } else {
        lines[1] = `${lines[1]} ${word}`;
      }
    });
    return lines;
  }

  function appendRegionLabelText(parent, region, x, y) {
    const text = createSvgElement("text", {
      x,
      y,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    const lines = splitLabelLines(region.name);
    lines.forEach((line, index) => {
      const tspan = createSvgElement("tspan", {
        x,
        dy: index === 0 ? `${-(lines.length - 1) * 0.52}em` : "1.08em",
      });
      tspan.textContent = line;
      text.append(tspan);
    });
    parent.append(text);
  }

  function boxesOverlap(first, second, padding = 5) {
    return !(
      first.x + first.width + padding < second.x ||
      second.x + second.width + padding < first.x ||
      first.y + first.height + padding < second.y ||
      second.y + second.height + padding < first.y
    );
  }

  function setLabelVisible(region, visible, selected = false) {
    if (!region.labelElement) {
      return;
    }
    region.labelElement.classList.toggle("is-visible", visible);
    region.labelElement.classList.toggle(
      "is-selected-label",
      visible && selected,
    );
  }

  function updateRegionLabels() {
    if (!labelLayer) {
      return;
    }

    childRegions.forEach((region) => setLabelVisible(region, false));
    if (currentLabelMode === "off") {
      return;
    }

    const visibleRegions = visibleChildRegions();
    const visibleSet = new Set(visibleRegions);
    const hasQuery = Boolean(
      normalizedSearchValue(elements.regionSearch.value),
    );
    const hasFilter = Boolean(activeVillageDataFilter);
    const searchMatches = new Set(matchingRegions());
    const occupied = [];

    if (
      selectedChildRegion &&
      visibleSet.has(selectedChildRegion) &&
      selectedChildRegion.labelBounds
    ) {
      setLabelVisible(selectedChildRegion, true, true);
      occupied.push(selectedChildRegion.labelBounds);
    }

    if (currentLabelMode !== "all") {
      return;
    }

    visibleRegions
      .filter(
        (region) =>
          region !== selectedChildRegion &&
          region.labelBounds &&
          ((!hasQuery && !hasFilter) || searchMatches.has(region)),
      )
      .sort((first, second) => second.geometryArea - first.geometryArea)
      .forEach((region) => {
        if (
          occupied.some((bounds) =>
            boxesOverlap(bounds, region.labelBounds),
          )
        ) {
          return;
        }
        setLabelVisible(region, true);
        occupied.push(region.labelBounds);
      });
  }

  function createRegionLabels() {
    tehsilSvg.querySelector("#tehsil-region-label-layer")?.remove();
    labelLayer = createSvgElement("g", {
      id: "tehsil-region-label-layer",
      "aria-hidden": "true",
    });

    childRegions.forEach((region) => {
      try {
        const box = region.element.getBBox();
        if (!box.width || !box.height) {
          return;
        }
        const label = createSvgElement("g", {
          class: "tehsil-region-label is-measuring",
          "data-region-slug": region.slug,
        });
        appendRegionLabelText(
          label,
          region,
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        labelLayer.append(label);
        region.labelElement = label;
        region.geometryArea = box.width * box.height;
      } catch {
        // Regions without measurable geometry simply omit their label.
      }
    });

    tehsilSvg.append(labelLayer);
    childRegions.forEach((region) => {
      if (!region.labelElement) {
        return;
      }
      try {
        const box = region.labelElement.getBBox();
        if (box.width && box.height) {
          region.labelBounds = {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          };
        }
      } catch {
        region.labelBounds = null;
      }
      region.labelElement.classList.remove("is-measuring");
    });

    elements.labelControls.hidden = !childRegions.some(
      (region) => region.labelBounds,
    );
    updateRegionLabels();
  }

  function setRegionLabelMode(mode) {
    const allowedModes = new Set(["selected", "all", "off"]);
    const nextMode = allowedModes.has(mode) ? mode : "selected";
    if (nextMode !== currentLabelMode) {
      storeHistoryCheckpoint("change village labels");
    }
    currentLabelMode = nextMode;
    elements.labelModeButtons.forEach((button) => {
      const active = button.dataset.tehsilLabelMode === currentLabelMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateRegionLabels();
    elements.mapStatus.textContent =
      currentLabelMode === "off"
        ? "Boundary labels hidden"
        : currentLabelMode === "all"
          ? "Collision-aware boundary labels visible"
          : "Selected boundary label mode active";
  }

  function updateLabelCounterScale() {
    if (!tehsilSvg || !defaultViewBox) {
      return;
    }
    const defaultWidth = Number(defaultViewBox.split(/\s+/)[2]);
    const currentWidth = Number(
      (tehsilSvg.getAttribute("viewBox") || defaultViewBox).split(/\s+/)[2],
    );
    if (!defaultWidth || !currentWidth) {
      return;
    }
    const scale = Math.min(1, Math.max(0.045, currentWidth / defaultWidth));
    tehsilSvg.style.setProperty(
      "--tehsil-label-counter-scale",
      String(scale),
    );
  }

  function renderRegionNavigator() {
    const visibleRegions = visibleChildRegions();
    const dataMatches = dataFilteredRegions(visibleRegions);
    const dataMatchSet = new Set(dataMatches);
    const matches = matchingRegions();
    const matchSet = new Set(matches);
    const hasQuery = Boolean(
      normalizedSearchValue(elements.regionSearch.value),
    );

    childRegions.forEach((region) => {
      const isVisible = visibleRegions.includes(region);
      region.element.classList.toggle(
        "is-search-muted",
        hasQuery &&
          isVisible &&
          dataMatchSet.has(region) &&
          !matchSet.has(region),
      );
      region.element.classList.toggle(
        "is-search-match",
        hasQuery && isVisible && matchSet.has(region),
      );
      region.listButton = null;
    });

    elements.regionNavigator.hidden = childRegions.length === 0;
    if (!childRegions.length) {
      elements.regionList.replaceChildren();
      return matches;
    }

    const label = navigatorLabel(
      visibleRegions.length ? visibleRegions : childRegions,
    );
    elements.regionSearch.placeholder =
      `Search ${dataMatches.length} ${label}`;
    elements.regionResultsSummary.textContent = activeVillageDataFilter
      ? hasQuery
        ? `${matches.length} of ${dataMatches.length} search matches`
        : `${dataMatches.length} of ${visibleRegions.length} match rule`
      : hasQuery
        ? `${matches.length} of ${visibleRegions.length} matches`
        : `${visibleRegions.length} ${label}`;

    const fragment = document.createDocumentFragment();
    matches.forEach((region) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tehsil-region-list-item";
      button.dataset.regionIdentifier = region.identifier;
      button.setAttribute(
        "aria-keyshortcuts",
        "Enter ArrowUp ArrowDown ArrowLeft ArrowRight Home End Escape",
      );
      button.setAttribute(
        "aria-pressed",
        String(selectedChildRegion?.identifier === region.identifier),
      );

      const name = document.createElement("strong");
      name.textContent = region.name;
      const meta = document.createElement("small");
      const singularLabel = region.definition.singularLabel;
      const nameIncludesLayer = region.name
        .toLocaleLowerCase()
        .endsWith(singularLabel.toLocaleLowerCase());
      meta.textContent = region.sourceId
        ? [nameIncludesLayer ? "" : singularLabel, `source ${region.sourceId}`]
            .filter(Boolean)
            .join(" · ")
        : nameIncludesLayer
          ? ""
          : singularLabel;
      button.append(name, meta);

      button.addEventListener("pointerenter", () => {
        setListHover(region, true, "is-list-hovered");
      });
      button.addEventListener("pointerleave", () => {
        setListHover(region, false, "is-list-hovered");
      });
      button.addEventListener("focus", () => {
        setListHover(region, true, "is-list-hovered");
      });
      button.addEventListener("blur", () => {
        setListHover(region, false, "is-list-hovered");
      });
      button.addEventListener("click", () => {
        setListHover(region, false, "is-list-hovered");
        executeVillageAction(region);
        window.requestAnimationFrame(() => {
          region.listButton?.focus({ preventScroll: true });
        });
      });
      button.addEventListener("keydown", (event) => {
        const directions = {
          ArrowDown: 1,
          ArrowRight: 1,
          ArrowUp: -1,
          ArrowLeft: -1,
          Home: "first",
          End: "last",
        };
        if (Object.prototype.hasOwnProperty.call(directions, event.key)) {
          event.preventDefault();
          moveNavigatorButtonFocus(button, directions[event.key]);
        } else if (event.key === "Escape") {
          event.preventDefault();
          elements.regionSearch.focus();
        }
      });

      region.listButton = button;
      fragment.append(button);
    });

    elements.regionList.replaceChildren(fragment);
    elements.regionEmpty.hidden = matches.length > 0;
    syncMapRegionTabStops();
    updateRegionLabels();
    return matches;
  }

  function renderLayerRegistry() {
    childRegions = [];
    let readyCount = 0;
    const fragment = document.createDocumentFragment();

    layerDefinitions.forEach((definition) => {
      const layer = tehsilSvg.querySelector(
        `[data-layer-type="${definition.key}"]`,
      );
      const ready =
        layer.dataset.status === "ready" &&
        Boolean(layer.querySelector(SHAPE_SELECTOR));
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
        const previous = buildTehsilWorkspaceSnapshot();
        previous.interface.layers[definition.key] = !toggle.checked;
        storeHistoryCheckpoint(
          `toggle ${definition.label.toLocaleLowerCase()}`,
          previous,
        );
        layer.classList.toggle("is-hidden", !toggle.checked);
        if (
          !toggle.checked &&
          selectedChildRegion &&
          layer.contains(selectedChildRegion.element)
        ) {
          clearChildSelection(true, false);
        }
        elements.mapStatus.textContent = toggle.checked
          ? `${definition.label} layer visible`
          : `${definition.label} layer hidden`;
        renderRegionNavigator();
      });

      const copy = document.createElement("span");
      copy.className = "district-child-layer-row-copy";
      const label = document.createElement("strong");
      label.textContent = definition.label;
      const pattern = document.createElement("small");
      pattern.textContent = `Feature: ${featurePattern(definition)}`;
      const identifier = document.createElement("code");
      identifier.textContent = layerId(definition);
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
    const activeValue = currentVillageVisualization
      ? ` · ${currentVillageVisualization.label}: ${
          region.visualValue || "No value"
        }`
      : "";
    elements.tooltipMeta.textContent =
      `${region.definition.label} · ${region.identifier}${activeValue}`;
    elements.tooltip.hidden = false;
    positionTooltip(clientX, clientY);
  }

  function hideTooltip() {
    elements.tooltip.hidden = true;
  }

  function focusRegion(region) {
    if (!tehsilSvg) {
      return;
    }
    window.requestAnimationFrame(() => {
      try {
        const box = region.element.getBBox();
        if (!box.width || !box.height) {
          return;
        }
        const padding = Math.max(box.width, box.height) * 0.38;
        tehsilSvg.setAttribute(
          "viewBox",
          [
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2,
          ].join(" "),
        );
        updateLabelCounterScale();
        const singularLabel =
          region.definition.singularLabel.toLocaleLowerCase();
        const nameIncludesLayer = region.name
          .toLocaleLowerCase()
          .endsWith(singularLabel);
        elements.mapStatus.textContent =
          `${region.name}${nameIncludesLayer ? "" : ` ${singularLabel}`} in focus`;
      } catch {
        // The current tehsil view remains a safe fallback.
      }
    });
  }

  function resetTehsilView() {
    if (tehsilSvg && defaultViewBox) {
      tehsilSvg.setAttribute("viewBox", defaultViewBox);
      updateLabelCounterScale();
    }
  }

  function selectChildRegion(region, updateUrl = true) {
    if (selectedChildRegion?.identifier !== region.identifier) {
      storeHistoryCheckpoint(`select ${region.name}`);
    }
    selectedChildRegion = region;
    if (region.definition.key === "villages") {
      loadVillageActionForm(region.identifier);
    }
    childRegions.forEach((item) => {
      const selected = item.identifier === region.identifier;
      item.element.classList.toggle("is-selected", selected);
      item.element.setAttribute("aria-pressed", String(selected));
    });
    elements.childName.textContent = region.name;
    elements.childLayer.textContent = region.definition.label;
    elements.childSourceId.textContent = region.sourceId || "Not provided";
    elements.childGeometry.textContent = formatGeometryType(
      region.geometryType,
    );
    elements.childCensusCode.textContent =
      region.censusCode || "Not registered";
    elements.childLgdCode.textContent = region.lgdCode || "Not registered";
    elements.childIdentifier.textContent = region.identifier;
    updateSelectedDataProfile();
    elements.copyChildSource.disabled = !region.sourceId;
    elements.copyChildSource.setAttribute(
      "aria-label",
      region.sourceId
        ? `Copy source code for ${region.name}`
        : `No source code is registered for ${region.name}`,
    );
    elements.copyChildId.setAttribute(
      "aria-label",
      `Copy feature identifier for ${region.name}`,
    );
    elements.copyChildLink.setAttribute(
      "aria-label",
      `Copy direct link to ${region.name}`,
    );
    elements.childCopyStatus.textContent = "";
    elements.childSelection.hidden = false;
    elements.mapStatus.textContent =
      `${region.name} selected. Profile details are available beside the map.`;
    renderBreadcrumb();
    renderRegionNavigator();
    window.requestAnimationFrame(() => {
      region.listButton?.scrollIntoView({ block: "nearest" });
    });
    focusRegion(region);
    if (updateUrl) {
      window.history.replaceState(
        {},
        "",
        tehsilPageUrl({
          layer: region.definition.key,
          region: region.slug,
        }),
      );
    }
  }

  function clearChildSelection(updateUrl = true, recordHistory = true) {
    if (recordHistory && selectedChildRegion) {
      storeHistoryCheckpoint("clear village selection");
    }
    selectedChildRegion = null;
    childRegions.forEach((item) => {
      item.element.classList.remove("is-selected");
      item.element.setAttribute("aria-pressed", "false");
    });
    elements.childSelection.hidden = true;
    elements.childDataValue.hidden = true;
    elements.childCopyStatus.textContent = "";
    if (copyStatusTimer) {
      window.clearTimeout(copyStatusTimer);
      copyStatusTimer = null;
    }
    hideTooltip();
    resetTehsilView();
    renderBreadcrumb();
    renderRegionNavigator();
    elements.mapStatus.textContent = "Tehsil overview restored";
    if (updateUrl && tehsil) {
      window.history.replaceState({}, "", tehsilPageUrl());
    }
  }

  function wireChildRegions() {
    childRegions.forEach((region) => {
      region.element.addEventListener("pointerenter", (event) => {
        setListHover(region, true, "is-map-hovered");
        showTooltip(region, event.clientX, event.clientY);
      });
      region.element.addEventListener("pointermove", (event) => {
        positionTooltip(event.clientX, event.clientY);
      });
      region.element.addEventListener("pointerleave", () => {
        setListHover(region, false, "is-map-hovered");
        hideTooltip();
      });
      region.element.addEventListener("focus", () => {
        setListHover(region, true, "is-map-hovered");
        const rect = region.element.getBoundingClientRect();
        showTooltip(
          region,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
      });
      region.element.addEventListener("blur", () => {
        setListHover(region, false, "is-map-hovered");
        hideTooltip();
      });
      region.element.addEventListener("click", () =>
        executeVillageAction(region),
      );
      region.element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          executeVillageAction(region);
          return;
        }
        const directions = {
          ArrowDown: 1,
          ArrowRight: 1,
          ArrowUp: -1,
          ArrowLeft: -1,
          Home: "first",
          End: "last",
        };
        if (Object.prototype.hasOwnProperty.call(directions, event.key)) {
          event.preventDefault();
          moveMapRegionFocus(region, directions[event.key]);
        } else if (event.key === "Escape") {
          event.preventDefault();
          hideTooltip();
          elements.regionSearch.focus();
        }
      });
    });
  }

  function applyRequestedChildSelection() {
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
    if (tehsilSvg.dataset.derivedOutline !== "true") {
      return;
    }
    window.requestAnimationFrame(() => {
      const outline = tehsilSvg.querySelector("#tehsil-outline");
      if (!outline) {
        return;
      }
      try {
        const box = outline.getBBox();
        if (!box.width || !box.height) {
          return;
        }
        const padding = Math.max(box.width, box.height) * 0.12;
        tehsilSvg.setAttribute(
          "viewBox",
          [
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2,
          ].join(" "),
        );
        updateLabelCounterScale();
      } catch {
        // The source viewBox remains a safe fallback.
      }
    });
  }

  function installTehsilSvg(svg, sourceConfig, assetWarning = "") {
    tehsilSvg = svg;
    tehsilSvg.classList.add("district-detail-svg", "tehsil-detail-svg");
    tehsilSvg.removeAttribute("width");
    tehsilSvg.removeAttribute("height");
    tehsilSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    ensureLayerGroups(tehsilSvg);
    elements.map.replaceChildren(tehsilSvg);
    defaultViewBox = tehsilSvg.getAttribute("viewBox") || "0 0 1000 1100";
    const readyCount = renderLayerRegistry();
    initializeVillageActionBuilder();
    elements.dataImport.hidden = childRegions.length === 0;
    renderRegionNavigator();
    wireChildRegions();
    if (tehsilSvg.querySelector('[tabindex], [role="link"], [role="button"]')) {
      tehsilSvg.setAttribute("role", "group");
    }
    createRegionLabels();
    setRegionLabelMode(currentLabelMode);
    fitDerivedOutline();
    setBoundarySource(sourceConfig);

    elements.mapStatus.textContent = readyCount
      ? `${readyCount} local boundary ${readyCount === 1 ? "layer" : "layers"} ready`
      : "Tehsil outline ready · local layers reserved";
    applyRequestedChildSelection();
    elements.status.textContent = assetWarning
      ? `${assetWarning} The district tehsil outline is being used instead.`
      : readyCount
        ? "Local-layer geometry is ready for interaction."
        : `Outline ready. ${layerDefinitions.length} local-layer identifiers are reserved for future geometry.`;
    refreshTehsilSnapshotUI();
    initializeTehsilEmbedCodeBuilder();
    historyReady = true;
    updateHistoryControls();
  }

  function fail(message) {
    elements.name.textContent = "Tehsil unavailable";
    elements.status.textContent = message;
    elements.status.dataset.state = "error";
    elements.mapStatus.textContent = "Tehsil map unavailable";
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

    try {
      const stateSvg = await loadSvg(
        state.svg,
        "The state SVG could not be loaded.",
      );
      const districtRegion = Array.from(
        stateSvg.querySelectorAll(".district-region"),
      ).find((region) => region.dataset.slug === requestedDistrictSlug);
      if (!districtRegion) {
        throw new Error(
          "This district is not available in the selected state map.",
        );
      }
      district = districtFromRegion(districtRegion);

      const districtConfig = districtMaps[districtMapKey()];
      if (!districtConfig?.svg) {
        throw new Error(
          "This district does not have a registered tehsil boundary asset yet.",
        );
      }
      const districtSvg = await loadSvg(
        districtConfig.svg,
        "The district tehsil SVG could not be loaded.",
      );
      const tehsilRegion = Array.from(
        districtSvg.querySelectorAll(
          '[data-layer-type="tehsils"] .child-region',
        ),
      ).find((region) => region.dataset.slug === requestedTehsilSlug);
      if (!tehsilRegion) {
        throw new Error(
          "This tehsil is not available in the selected district map.",
        );
      }

      tehsil = tehsilFromRegion(tehsilRegion);
      setMetadata();
      renderBreadcrumb();

      const tehsilConfig = tehsilMaps[tehsilMapKey()];
      let svg = buildFocusedTehsilSvg(districtSvg, tehsilRegion);
      let sourceConfig = districtConfig;
      let assetWarning = "";
      if (tehsilConfig?.svg) {
        try {
          svg = await loadSvg(
            tehsilConfig.svg,
            "The dedicated tehsil SVG could not be loaded.",
          );
          sourceConfig = tehsilConfig;
        } catch {
          assetWarning = "The dedicated tehsil asset could not load.";
        }
      }
      installTehsilSvg(svg, sourceConfig, assetWarning);
    } catch (error) {
      fail(
        error.message ||
          "The tehsil page could not load. Run the project through a local web server.",
      );
    }
  }

  elements.clearChild.addEventListener("click", () => {
    clearChildSelection();
  });
  elements.villageActionRegion.addEventListener("change", () => {
    loadVillageActionForm(elements.villageActionRegion.value);
  });
  elements.villageActionType.addEventListener(
    "change",
    updateVillageActionFields,
  );
  elements.saveVillageAction.addEventListener(
    "click",
    saveVillageAction,
  );
  elements.resetVillageAction.addEventListener(
    "click",
    resetVillageAction,
  );
  elements.skipToMap.addEventListener("click", () => {
    window.requestAnimationFrame(() => {
      syncMapRegionTabStops()[0]?.element.focus();
    });
  });
  elements.dataFile.addEventListener("change", () => {
    importVillageData(elements.dataFile.files?.[0]);
  });
  elements.clearData.addEventListener("click", clearImportedVillageData);
  elements.exportDataCsv.addEventListener("click", () => {
    downloadVillageDataset("csv");
  });
  elements.exportDataJson.addEventListener("click", () => {
    downloadVillageDataset("json");
  });
  elements.dataEditorField.addEventListener("change", () => {
    configureAdvancedBulkOperation();
    renderVillageDataEditorRows();
    const field = elements.dataEditorField.value;
    elements.dataEditorStatus.textContent =
      `Editing ${humanizeFieldName(field)} as ${
        villageFieldTypeLabels[effectiveVillageFieldType(field)]
      }.`;
  });
  elements.dataEditorSaveFieldSettings.addEventListener(
    "click",
    saveVillageFieldSettings,
  );
  elements.dataEditorSearch.addEventListener("input", () => {
    renderVillageDataEditorRows();
  });
  elements.dataEditorAddField.addEventListener(
    "click",
    addVillageDataEditorField,
  );
  elements.dataEditorNewField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addVillageDataEditorField();
    }
  });
  elements.dataEditorBulkSet.addEventListener("click", () => {
    stageBulkVillageDataValue();
  });
  elements.dataEditorBulkClear.addEventListener("click", () => {
    stageBulkVillageDataValue(true);
  });
  elements.dataEditorBulkValue.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      stageBulkVillageDataValue();
    }
  });
  elements.dataEditorSelectVisible.addEventListener("change", () => {
    visibleVillageDataEditorRegions().forEach((region) => {
      if (elements.dataEditorSelectVisible.checked) {
        villageDataEditorSelection.add(region.identifier);
      } else {
        villageDataEditorSelection.delete(region.identifier);
      }
    });
    renderVillageDataEditorRows();
  });
  elements.dataEditorBulkScope.addEventListener(
    "change",
    updateAdvancedBulkControls,
  );
  elements.dataEditorBulkOperation.addEventListener(
    "change",
    configureAdvancedBulkOperation,
  );
  elements.dataEditorBulkSource.addEventListener(
    "change",
    updateAdvancedBulkControls,
  );
  elements.dataEditorBulkStage.addEventListener(
    "click",
    stageAdvancedVillageDataOperation,
  );
  [elements.dataEditorBulkPrimary, elements.dataEditorBulkSecondary].forEach(
    (input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          stageAdvancedVillageDataOperation();
        }
      });
    },
  );
  elements.dataEditorApply.addEventListener(
    "click",
    applyVillageDataEditorEdits,
  );
  elements.dataEditorDiscard.addEventListener(
    "click",
    discardVillageDataEditorDrafts,
  );
  elements.visualizationField.addEventListener("change", () => {
    runHistoryAction("change village colors", () => {
      const nextField = elements.visualizationField.value;
      if ((currentVillageVisualization?.field || "") === nextField) {
        return false;
      }
      applyVillageVisualization(nextField);
      return true;
    });
  });
  elements.clearVisualization.addEventListener("click", () => {
    runHistoryAction("clear village colors", () => {
      if (!currentVillageVisualization) {
        return false;
      }
      applyVillageVisualization("");
      return true;
    });
  });
  elements.exportWorkspace.addEventListener(
    "click",
    exportTehsilWorkspace,
  );
  elements.exportStandaloneMap.addEventListener(
    "click",
    exportStandaloneTehsilMap,
  );
  elements.embedFormatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      embedFormat = button.dataset.tehsilEmbedFormat;
      refreshTehsilEmbedCode();
    });
  });
  elements.embedMapUrl.addEventListener("input", () => {
    embedUrlCustomized = true;
    refreshTehsilEmbedCode();
  });
  elements.embedMapHeight.addEventListener(
    "input",
    refreshTehsilEmbedCode,
  );
  elements.embedMapHeight.addEventListener("change", () => {
    elements.embedMapHeight.value = normalizedTehsilEmbedHeight();
    refreshTehsilEmbedCode();
  });
  elements.copyEmbedCode.addEventListener(
    "click",
    copyTehsilEmbedCode,
  );
  elements.importWorkspace.addEventListener("change", () => {
    importTehsilWorkspace(elements.importWorkspace.files?.[0]);
  });
  elements.saveSnapshot.addEventListener("click", saveTehsilSnapshot);
  elements.restoreSnapshot.addEventListener(
    "click",
    restoreTehsilSnapshot,
  );
  elements.deleteSnapshot.addEventListener(
    "click",
    deleteTehsilSnapshot,
  );
  elements.undoChange.addEventListener("click", undoTehsilChange);
  elements.redoChange.addEventListener("click", redoTehsilChange);
  elements.dataFilterField.addEventListener("change", () => {
    configureVillageDataFilterField();
    elements.dataFilterStatus.textContent = activeVillageDataFilter
      ? "Rule changed. Apply to update the active filter."
      : "Choose a condition and value, then apply the filter.";
  });
  elements.dataFilterOperator.addEventListener(
    "change",
    updateVillageDataFilterOperatorUI,
  );
  elements.applyDataFilter.addEventListener(
    "click",
    applyVillageDataFilter,
  );
  elements.clearDataFilter.addEventListener("click", () => {
    clearVillageDataFilter();
  });
  [elements.dataFilterValue, elements.dataFilterValueSecondary].forEach(
    (input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          applyVillageDataFilter();
        }
      });
    },
  );
  elements.copyChildSource.addEventListener("click", () => {
    copyText(
      selectedChildRegion?.sourceId,
      "Source boundary code copied.",
    );
  });
  elements.copyChildId.addEventListener("click", () => {
    copyText(
      selectedChildRegion?.identifier,
      "Local boundary feature identifier copied.",
    );
  });
  elements.copyChildLink.addEventListener("click", () => {
    if (!selectedChildRegion) {
      return;
    }
    copyText(window.location.href, "Direct boundary link copied.");
  });
  elements.regionSearch.addEventListener("focus", () => {
    if (historyReady && !historyIsRestoring) {
      searchHistorySnapshot = buildTehsilWorkspaceSnapshot();
    }
  });
  elements.regionSearch.addEventListener("input", renderRegionNavigator);
  elements.regionSearch.addEventListener("change", commitSearchHistory);
  elements.regionSearch.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const buttons = Array.from(
        elements.regionList.querySelectorAll(".tehsil-region-list-item"),
      );
      if (buttons.length) {
        event.preventDefault();
        const button =
          event.key === "ArrowDown" ? buttons[0] : buttons[buttons.length - 1];
        button.focus();
        button.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (event.key === "Escape" && elements.regionSearch.value) {
      event.preventDefault();
      elements.regionSearch.value = "";
      renderRegionNavigator();
      commitSearchHistory();
      elements.mapStatus.textContent = "Boundary search cleared.";
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    const matches = matchingRegions();
    if (matches.length === 1) {
      event.preventDefault();
      commitSearchHistory();
      executeVillageAction(matches[0]);
    }
  });
  elements.labelModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setRegionLabelMode(button.dataset.tehsilLabelMode);
    });
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      (target.matches("input, textarea, select") || target.isContentEditable)
    ) {
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }
    const key = event.key.toLocaleLowerCase();
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redoTehsilChange();
      } else {
        undoTehsilChange();
      }
    } else if (key === "y") {
      event.preventDefault();
      redoTehsilChange();
    }
  });
  void initialize();
})();
