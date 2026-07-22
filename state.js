(function () {
  "use strict";

  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get("state");
  const state = states.find((item) => item.slug === requestedSlug) || states[0];
  const stateMap = document.querySelector("#state-map");
  const stateName = document.querySelector("#state-name");
  const stateType = document.querySelector("#state-type");
  const stateFile = document.querySelector("#state-file");
  const stateIdentifier = document.querySelector("#state-identifier");
  const stateCode = document.querySelector("#state-code");
  const divisionLayerId = document.querySelector("#division-layer-id");
  const divisionLayerStatus = document.querySelector(
    "#division-layer-status",
  );
  const districtLayerId = document.querySelector("#district-layer-id");
  const rawSvgLink = document.querySelector("#open-raw-svg");
  const districtLayerStatus = document.querySelector("#district-layer-status");
  const districtMapStatus = document.querySelector("#district-map-status");
  const districtControls = document.querySelector("#district-controls");
  const districtUnavailable = document.querySelector("#district-unavailable");
  const districtSearch = document.querySelector("#district-search");
  const divisionFilters = document.querySelector("#division-filters");
  const divisionFilterBlock = document.querySelector(
    "#division-filter-block",
  );
  const divisionFilterSummary = document.querySelector(
    "#division-filter-summary",
  );
  const districtList = document.querySelector("#district-list");
  const districtCount = document.querySelector("#district-count");
  const comparisonModeToggle = document.querySelector(
    "#comparison-mode-toggle",
  );
  const districtComparison = document.querySelector("#district-comparison");
  const comparisonHeading = document.querySelector("#comparison-heading");
  const comparisonGuidance = document.querySelector("#comparison-guidance");
  const comparisonList = document.querySelector("#comparison-list");
  const comparisonStatus = document.querySelector("#comparison-status");
  const clearComparisonButton = document.querySelector("#clear-comparison");
  const undoChangeButton = document.querySelector("#undo-change");
  const redoChangeButton = document.querySelector("#redo-change");
  const historyStatus = document.querySelector("#history-status");
  const projectStoragePanel = document.querySelector(
    "#project-storage-panel",
  );
  const projectStorageSummary = document.querySelector(
    "#project-storage-summary",
  );
  const projectNameInput = document.querySelector("#project-name");
  const saveProjectButton = document.querySelector("#save-project");
  const restoreProjectButton = document.querySelector("#restore-project");
  const deleteProjectButton = document.querySelector("#delete-project");
  const exportProjectButton = document.querySelector("#export-project");
  const exportStandaloneMapButton = document.querySelector(
    "#export-standalone-map",
  );
  const embedCodeSummary = document.querySelector("#embed-code-summary");
  const embedFormatButtons = Array.from(
    document.querySelectorAll("[data-embed-format]"),
  );
  const embedMapUrl = document.querySelector("#embed-map-url");
  const embedMapHeight = document.querySelector("#embed-map-height");
  const embedCodeOutput = document.querySelector("#embed-code-output");
  const copyEmbedCodeButton = document.querySelector("#copy-embed-code");
  const embedCodeStatus = document.querySelector("#embed-code-status");
  const visualExportScope = document.querySelector("#visual-export-scope");
  const visualExportBackground = document.querySelector(
    "#visual-export-background",
  );
  const visualExportScale = document.querySelector("#visual-export-scale");
  const exportMapSvgButton = document.querySelector("#export-map-svg");
  const exportMapPngButton = document.querySelector("#export-map-png");
  const visualExportStatus = document.querySelector(
    "#visual-export-status",
  );
  const importProjectFileInput = document.querySelector(
    "#import-project-file",
  );
  const projectStorageStatus = document.querySelector(
    "#project-storage-status",
  );
  const contentBuilder = document.querySelector("#content-builder");
  const contentBuilderSummary = document.querySelector(
    "#content-builder-summary",
  );
  const contentFieldList = document.querySelector("#content-field-list");
  const popupCustomTextInput = document.querySelector("#popup-custom-text");
  const popupLinkLabelInput = document.querySelector("#popup-link-label");
  const popupLinkUrlInput = document.querySelector("#popup-link-url");
  const popupImageUrlInput = document.querySelector("#popup-image-url");
  const popupImageAltInput = document.querySelector("#popup-image-alt");
  const applyContentSettingsButton = document.querySelector(
    "#apply-content-settings",
  );
  const resetContentSettingsButton = document.querySelector(
    "#reset-content-settings",
  );
  const contentBuilderStatus = document.querySelector(
    "#content-builder-status",
  );
  const districtActionSummary = document.querySelector(
    "#district-action-summary",
  );
  const districtActionDistrict = document.querySelector(
    "#district-action-district",
  );
  const districtActionType = document.querySelector("#district-action-type");
  const districtActionUrlField = document.querySelector(
    "#district-action-url-field",
  );
  const districtActionUrl = document.querySelector("#district-action-url");
  const districtActionTargetField = document.querySelector(
    "#district-action-target-field",
  );
  const districtActionTarget = document.querySelector(
    "#district-action-target",
  );
  const districtActionStateField = document.querySelector(
    "#district-action-state-field",
  );
  const districtActionState = document.querySelector(
    "#district-action-state",
  );
  const saveDistrictActionButton = document.querySelector(
    "#save-district-action",
  );
  const resetDistrictActionButton = document.querySelector(
    "#reset-district-action",
  );
  const districtActionStatus = document.querySelector(
    "#district-action-status",
  );
  const districtSelection = document.querySelector("#district-selection");
  const profileChipRow = districtSelection.querySelector(".profile-chip-row");
  const districtProfileGrid = districtSelection.querySelector(
    ".district-profile-grid",
  );
  const selectedDistrictName = document.querySelector(
    "#selected-district-name",
  );
  const selectedDistrictMeta = document.querySelector(
    "#selected-district-meta",
  );
  const selectedDistrictId = document.querySelector("#selected-district-id");
  const selectedDistrictDivisionId = document.querySelector(
    "#selected-district-division-id",
  );
  const selectedDistrictDivisionIdentifierRow = document.querySelector(
    "#selected-district-division-identifier-row",
  );
  const selectedDistrictCode = document.querySelector(
    "#selected-district-code",
  );
  const selectedDivisionChip = document.querySelector(
    "#selected-division-chip",
  );
  const selectedBoundaryChip = document.querySelector(
    "#selected-boundary-chip",
  );
  const selectedDivisionName = document.querySelector(
    "#selected-division-name",
  );
  const selectedCensusCode = document.querySelector("#selected-census-code");
  const selectedLgdCode = document.querySelector("#selected-lgd-code");
  const selectedGeometryType = document.querySelector(
    "#selected-geometry-type",
  );
  const clearDistrictButton = document.querySelector("#clear-district");
  const copyDistrictIdButton = document.querySelector("#copy-district-id");
  const copyDistrictLinkButton = document.querySelector(
    "#copy-district-link",
  );
  const openDistrictMapLink = document.querySelector("#open-district-map");
  const profileCopyStatus = document.querySelector("#profile-copy-status");
  const dataImportPanel = document.querySelector("#data-import-panel");
  const dataImportBadge = document.querySelector("#data-import-badge");
  const districtDataFile = document.querySelector("#district-data-file");
  const downloadSampleDataButton = document.querySelector(
    "#download-sample-data",
  );
  const clearImportedDataButton = document.querySelector(
    "#clear-imported-data",
  );
  const dataImportStatus = document.querySelector("#data-import-status");
  const dataImportSummary = document.querySelector("#data-import-summary");
  const importRowCount = document.querySelector("#import-row-count");
  const importMatchCount = document.querySelector("#import-match-count");
  const importUnmatchedCount = document.querySelector(
    "#import-unmatched-count",
  );
  const importJoinField = document.querySelector("#import-join-field");
  const importUnmatchedPreview = document.querySelector(
    "#import-unmatched-preview",
  );
  const dataEditor = document.querySelector("#data-editor");
  const dataEditorSummary = document.querySelector("#data-editor-summary");
  const dataEditorField = document.querySelector("#data-editor-field");
  const dataEditorSearch = document.querySelector("#data-editor-search");
  const dataEditorNewField = document.querySelector(
    "#data-editor-new-field",
  );
  const dataEditorAddFieldButton = document.querySelector(
    "#data-editor-add-field",
  );
  const dataEditorRows = document.querySelector("#data-editor-rows");
  const dataEditorTable = document.querySelector(
    "#district-data-editor-table",
  );
  const dataEditorApplyButton = document.querySelector("#data-editor-apply");
  const dataEditorDiscardButton = document.querySelector(
    "#data-editor-discard",
  );
  const dataEditorStatus = document.querySelector("#data-editor-status");
  const importedProfileData = document.querySelector(
    "#imported-profile-data",
  );
  const importedProfileFields = document.querySelector(
    "#imported-profile-fields",
  );
  const importedFieldCount = document.querySelector("#imported-field-count");
  const customPopupContent = document.querySelector("#custom-popup-content");
  const customPopupImage = document.querySelector("#custom-popup-image");
  const customPopupText = document.querySelector("#custom-popup-text");
  const customPopupLink = document.querySelector("#custom-popup-link");
  const dataVisualizationControls = document.querySelector(
    "#data-visualization-controls",
  );
  const visualizationField = document.querySelector("#visualization-field");
  const visualizationTypeBadge = document.querySelector(
    "#visualization-type-badge",
  );
  const visualizationStatus = document.querySelector("#visualization-status");
  const clearDataVisualizationButton = document.querySelector(
    "#clear-data-visualization",
  );
  const dataFilterControls = document.querySelector("#data-filter-controls");
  const dataFilterBadge = document.querySelector("#data-filter-badge");
  const dataFilterField = document.querySelector("#data-filter-field");
  const dataFilterOperator = document.querySelector("#data-filter-operator");
  const dataFilterValueLabel = document.querySelector(
    "#data-filter-value-label",
  );
  const dataFilterValue = document.querySelector("#data-filter-value");
  const dataFilterSecondaryField = document.querySelector(
    "#data-filter-secondary-field",
  );
  const dataFilterValueSecondary = document.querySelector(
    "#data-filter-value-secondary",
  );
  const dataFilterSuggestions = document.querySelector(
    "#data-filter-suggestions",
  );
  const applyDataFilterButton = document.querySelector("#apply-data-filter");
  const clearDataFilterButton = document.querySelector("#clear-data-filter");
  const dataFilterStatus = document.querySelector("#data-filter-status");
  const mapDataLegend = document.querySelector("#map-data-legend");
  const mapDataLegendTitle = document.querySelector("#map-data-legend-title");
  const mapDataLegendType = document.querySelector("#map-data-legend-type");
  const mapDataLegendItems = document.querySelector("#map-data-legend-items");
  const tooltip = document.querySelector("#district-tooltip");
  const tooltipName = document.querySelector("#district-tooltip-name");
  const tooltipMeta = document.querySelector("#district-tooltip-meta");
  const mapBreadcrumb = document.querySelector("#map-breadcrumb");
  const mapLayerManager = document.querySelector("#map-layer-manager");
  const layerVisibilitySummary = document.querySelector(
    "#layer-visibility-summary",
  );
  const layerToggleInputs = Array.from(
    document.querySelectorAll("[data-layer-toggle]"),
  );
  const resetLayerVisibilityButton = document.querySelector(
    "#reset-layer-visibility",
  );
  const mapStyleEditor = document.querySelector("#map-style-editor");
  const mapStyleSummary = document.querySelector("#map-style-summary");
  const mapStyleStatus = document.querySelector("#map-style-status");
  const styleColorInputs = Array.from(
    document.querySelectorAll("[data-style-property]"),
  );
  const resetMapStylesButton = document.querySelector("#reset-map-styles");
  const zoomInButton = document.querySelector("#map-zoom-in");
  const zoomOutButton = document.querySelector("#map-zoom-out");
  const resetViewButton = document.querySelector("#map-reset-view");
  const mapLabelControls = document.querySelector("#map-label-controls");
  const labelModeButtons = Array.from(
    document.querySelectorAll("[data-label-mode]"),
  );
  let districts = [];
  let supportsDivisions = false;
  let selectedDistrictSlug = null;
  let activeDivisionSlug = null;
  let svgRoot = null;
  let initialViewBox = null;
  let currentViewBox = null;
  let viewAnimationFrame = null;
  let panCandidate = null;
  let isPanning = false;
  let didPan = false;
  let currentLabelMode = "divisions";
  let copyStatusTimer = null;
  let importedDataset = null;
  let currentVisualization = null;
  let activeDataFilter = null;
  let configuredDataFilterKind = null;
  let comparisonMode = false;
  const comparedDistrictSlugs = new Set();
  const comparisonLimit = 4;
  const divisionPalette = [
    "#227c9d",
    "#e06b46",
    "#4c956c",
    "#7b61a8",
    "#d49b32",
    "#3e6fa8",
  ];
  let comparisonStatusTimer = null;
  const layerVisibility = {
    districts: true,
    stateOutline: true,
    divisionFocus: true,
    labels: true,
    dataColors: true,
    comparisonMarks: true,
  };
  let customizedStyleCount = 0;
  let mapStyleStatusTimer = null;
  const projectStorageKey = `image-map-project:v1:${state.slug}`;
  const undoHistory = [];
  const redoHistory = [];
  const historyLimit = 30;
  let historyReady = false;
  let historyIsRestoring = false;
  let pendingStyleHistory = null;
  const dataEditorDrafts = new Map();
  const districtActions = new Map();
  let embedFormat = "iframe";
  let embedUrlCustomized = false;
  const defaultTooltipFields = new Set(["division", "activeData"]);
  const defaultPopupFields = new Set([
    "division",
    "census",
    "lgd",
    "boundary",
    "geometry",
    "identifiers",
  ]);
  const contentSettings = {
    tooltipFields: new Set(defaultTooltipFields),
    popupFields: new Set(defaultPopupFields),
    customText: "",
    linkLabel: "",
    linkUrl: "",
    imageUrl: "",
    imageAlt: "",
  };

  if (!state) {
    stateMap.innerHTML = '<p class="load-error">No state data is available.</p>';
    return;
  }

  stateName.textContent = state.name;
  stateType.textContent = state.type;
  stateFile.textContent = state.svg;
  stateIdentifier.textContent = state.identifier;
  stateCode.textContent = state.code;
  divisionLayerId.textContent = state.divisionLayerId;
  districtLayerId.textContent = state.districtLayerId;
  rawSvgLink.href = state.svg;
  document.title = `${state.name} SVG · India Map Studio`;

  function statePageUrl(options = {}) {
    const search = new URLSearchParams({ state: state.slug });
    if (options.division) search.set("division", options.division);
    if (options.district) search.set("district", options.district);
    return `state.html?${search.toString()}`;
  }

  function districtPageUrl(district) {
    const search = new URLSearchParams({
      state: state.slug,
      district: district.slug,
    });
    return `district.html?${search.toString()}`;
  }

  function districtGroupLabel(district, withSuffix = true) {
    if (!supportsDivisions || !district?.divisionName) return "";
    return withSuffix
      ? `${district.divisionName} Division`
      : district.divisionName;
  }

  function districtSearchText(district) {
    return [district.name, district.divisionName].filter(Boolean).join(" ");
  }

  function interactiveDistrictCountLabel(count) {
    return `${count} interactive district${count === 1 ? "" : "s"}`;
  }

  function configureDivisionSupport() {
    supportsDivisions =
      districts.length > 0 &&
      districts.every(
        (district) =>
          district.divisionName &&
          district.divisionSlug &&
          district.divisionId,
      );

    stateMap.classList.toggle("has-division-groups", supportsDivisions);
    divisionFilterBlock.hidden = !supportsDivisions;
    selectedDistrictDivisionIdentifierRow.hidden = !supportsDivisions;
    dataEditorTable.classList.toggle(
      "without-administrative-groups",
      !supportsDivisions,
    );

    const divisionLabelButton = labelModeButtons.find(
      (button) => button.dataset.labelMode === "divisions",
    );
    if (divisionLabelButton) divisionLabelButton.hidden = !supportsDivisions;

    const divisionFocusToggle = layerToggleInputs.find(
      (input) => input.dataset.layerToggle === "divisionFocus",
    );
    if (divisionFocusToggle) {
      divisionFocusToggle.disabled = !supportsDivisions;
      divisionFocusToggle.closest("label").hidden = !supportsDivisions;
    }

    if (supportsDivisions) return;

    activeDivisionSlug = null;
    if (currentLabelMode === "divisions") currentLabelMode = "districts";
    defaultTooltipFields.delete("division");
    defaultPopupFields.delete("division");
    contentSettings.tooltipFields.delete("division");
    contentSettings.popupFields.delete("division");
    const fallbackColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--focus")
        .trim() || "#115d4d";
    districts.forEach((district) => {
      district.divisionColor = fallbackColor;
      districtElement(district.slug)?.style.setProperty(
        "--division-color",
        fallbackColor,
      );
    });
  }

  function appendBreadcrumbItem(label, options = {}) {
    if (mapBreadcrumb.children.length) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "›";
      mapBreadcrumb.append(separator);
    }

    if (options.current) {
      const current = document.createElement("span");
      current.className = "breadcrumb-item is-current";
      current.setAttribute("aria-current", "page");
      current.textContent = label;
      mapBreadcrumb.append(current);
      return;
    }

    const link = document.createElement("a");
    link.className = "breadcrumb-item";
    link.href = options.href;
    link.textContent = label;
    if (options.onClick) link.addEventListener("click", options.onClick);
    mapBreadcrumb.append(link);
  }

  function renderBreadcrumb() {
    mapBreadcrumb.replaceChildren();
    appendBreadcrumbItem("India", { href: "index.html" });

    const selectedDistrict = districts.find(
      (item) => item.slug === selectedDistrictSlug,
    );
    const breadcrumbDivisionSlug =
      activeDivisionSlug || selectedDistrict?.divisionSlug || null;
    const hasDivision = Boolean(breadcrumbDivisionSlug);
    const hasDistrict = Boolean(selectedDistrict);
    appendBreadcrumbItem(state.name, {
      current: !hasDivision && !hasDistrict,
      href: statePageUrl(),
      onClick: (event) => {
        event.preventDefault();
        clearDistrict(false);
        setActiveDivision(null);
      },
    });

    if (hasDivision) {
      const division = districts.find(
        (district) => district.divisionSlug === breadcrumbDivisionSlug,
      );
      if (division) {
        appendBreadcrumbItem(`${division.divisionName} Division`, {
          current: !hasDistrict,
          href: statePageUrl({ division: division.divisionSlug }),
          onClick: (event) => {
            event.preventDefault();
            clearDistrict(false);
            setActiveDivision(division.divisionSlug);
          },
        });
      }
    }

    if (hasDistrict) {
      appendBreadcrumbItem(`${selectedDistrict.name} District`, {
        current: true,
      });
    }
  }

  renderBreadcrumb();

  function districtElement(slug) {
    return stateMap.querySelector(
      `.district-region[data-slug="${CSS.escape(slug)}"]`,
    );
  }

  function listButton(slug) {
    return districtList.querySelector(
      `[data-slug="${CSS.escape(slug)}"]`,
    );
  }

  function setDistrictHover(slug, active) {
    districtElement(slug)?.classList.toggle("is-hovered", active);
    listButton(slug)?.classList.toggle("is-hovered", active);
  }

  function showTooltip(district, x, y) {
    tooltipName.textContent = district.name;
    const parts = tooltipContentParts(district);
    tooltipMeta.textContent = parts.length ? parts.join(" · ") : "District";
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  function formatBoundaryVintage(value) {
    const match = String(value || "").match(/\d{4}/);
    return match ? `Census ${match[0]}` : value || "";
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
    statusElement = profileCopyStatus,
  ) {
    if (!value) return;
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

    if (copied) {
      statusElement.textContent = successMessage;
    } else {
      statusElement.textContent = "Copy failed. Please copy it manually.";
    }

    if (copyStatusTimer) window.clearTimeout(copyStatusTimer);
    copyStatusTimer = window.setTimeout(() => {
      statusElement.textContent = "";
    }, 2400);
  }

  function slugifyValue(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeJoinValue(value) {
    return String(value ?? "").trim().toLocaleLowerCase();
  }

  function buildDistrictLookup() {
    const lookup = new Map();
    districts.forEach((district) => {
      [
        district.featureId,
        district.code,
        district.lgdCode,
        district.slug,
        district.name,
        slugifyValue(district.name),
      ].forEach((value) => {
        const normalized = normalizeJoinValue(value);
        if (normalized) lookup.set(normalized, district);
      });
    });
    return lookup;
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
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field);
        if (row.some((value) => value.trim() !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }

    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
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
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.records)) return parsed.records;
    if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
      return parsed.features.map((feature) => ({
        ...(feature.properties || {}),
        ...(feature.id === undefined ? {} : { id: feature.id }),
      }));
    }
    throw new Error(
      "JSON must be an array, contain a records array, or be a GeoJSON FeatureCollection.",
    );
  }

  function detectJoinField(records, lookup) {
    const columns = Array.from(
      new Set(records.flatMap((record) => Object.keys(record || {}))),
    );
    const priority = [
      "district_id",
      "feature_id",
      "identifier",
      "id",
      "district_code",
      "census_code",
      "lgd_code",
      "code",
      "district",
      "district_name",
      "name",
      "slug",
    ];

    const scored = columns.map((column) => {
      const score = records.reduce((count, record) => {
        const normalized = normalizeJoinValue(record?.[column]);
        return count + (normalized && lookup.has(normalized) ? 1 : 0);
      }, 0);
      const priorityIndex = priority.indexOf(column.toLocaleLowerCase());
      return {
        column,
        score,
        priority: priorityIndex === -1 ? priority.length : priorityIndex,
      };
    });
    scored.sort((a, b) => b.score - a.score || a.priority - b.priority);
    return scored[0]?.score ? scored[0] : null;
  }

  function humanizeFieldName(value) {
    const label = String(value)
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
    return label ? label[0].toLocaleUpperCase() + label.slice(1) : "Field";
  }

  function formatImportedValue(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function builtInContentFields() {
    const fields = [
      { key: "division", label: "Division", tooltip: true, popup: true },
      { key: "census", label: "District code", tooltip: true, popup: true },
      { key: "lgd", label: "LGD code", tooltip: true, popup: true },
      { key: "boundary", label: "Boundary vintage", tooltip: true, popup: true },
      { key: "geometry", label: "Geometry type", tooltip: true, popup: true },
      {
        key: "identifiers",
        label: "Feature identifiers",
        tooltip: true,
        popup: true,
      },
      {
        key: "activeData",
        label: "Active map value",
        tooltip: true,
        popup: false,
      },
    ];
    return supportsDivisions
      ? fields
      : fields.filter((field) => field.key !== "division");
  }

  function importedContentFieldKeys() {
    return importedFieldNames().map((field) => `imported:${field}`);
  }

  function contentFieldDefinitions() {
    return [
      ...builtInContentFields(),
      ...importedFieldNames().map((field) => ({
        key: `imported:${field}`,
        label: humanizeFieldName(field),
        tooltip: true,
        popup: true,
        imported: true,
      })),
    ];
  }

  function fieldContentValue(district, key) {
    if (!district) return "";
    if (key.startsWith("imported:")) {
      const field = key.slice("imported:".length);
      const value = district.dataRecord?.[field];
      return scalarImportedValue(value)
        ? `${humanizeFieldName(field)}: ${formatImportedValue(value)}`
        : "";
    }

    switch (key) {
      case "division":
        return districtGroupLabel(district);
      case "census":
        return district.code ? `Code ${district.code}` : "";
      case "lgd":
        return district.lgdCode ? `LGD ${district.lgdCode}` : "";
      case "boundary":
        return formatBoundaryVintage(district.boundaryYear);
      case "geometry":
        return formatGeometryType(district.geometryType);
      case "identifiers":
        return district.featureId ? `ID ${district.featureId}` : "";
      case "activeData":
        return currentVisualization
          ? `${currentVisualization.label}: ${district.visualValue || "No value"}`
          : "";
      default:
        return "";
    }
  }

  function tooltipContentParts(district) {
    return Array.from(contentSettings.tooltipFields)
      .map((key) => fieldContentValue(district, key))
      .filter(Boolean);
  }

  function sameFieldSet(left, right) {
    return (
      left.size === right.size &&
      Array.from(left).every((field) => right.has(field))
    );
  }

  function defaultPopupContentFields() {
    return new Set([...defaultPopupFields, ...importedContentFieldKeys()]);
  }

  function contentSettingsAreCustomized() {
    return (
      !sameFieldSet(contentSettings.tooltipFields, defaultTooltipFields) ||
      !sameFieldSet(
        contentSettings.popupFields,
        defaultPopupContentFields(),
      ) ||
      Boolean(
        contentSettings.customText ||
          contentSettings.linkLabel ||
          contentSettings.linkUrl ||
          contentSettings.imageUrl ||
          contentSettings.imageAlt,
      )
    );
  }

  function renderContentFieldOptions() {
    contentFieldList.replaceChildren();
    contentFieldDefinitions().forEach((field) => {
      const row = document.createElement("div");
      const name = document.createElement("span");
      const tooltipLabel = document.createElement("label");
      const tooltipInput = document.createElement("input");
      const popupLabel = document.createElement("label");
      const popupInput = document.createElement("input");

      row.className = "content-field-row";
      if (field.imported) row.dataset.imported = "true";
      name.className = "content-field-name";
      name.textContent = field.label;

      tooltipLabel.className = "content-field-toggle";
      tooltipInput.type = "checkbox";
      tooltipInput.dataset.contentTarget = "tooltip";
      tooltipInput.dataset.contentField = field.key;
      tooltipInput.checked = contentSettings.tooltipFields.has(field.key);
      tooltipInput.disabled = !field.tooltip;
      tooltipInput.setAttribute(
        "aria-label",
        `Show ${field.label} in the hover tooltip`,
      );
      tooltipLabel.append(tooltipInput);

      popupLabel.className = "content-field-toggle";
      popupInput.type = "checkbox";
      popupInput.dataset.contentTarget = "popup";
      popupInput.dataset.contentField = field.key;
      popupInput.checked = contentSettings.popupFields.has(field.key);
      popupInput.disabled = !field.popup;
      popupInput.setAttribute(
        "aria-label",
        `Show ${field.label} in the district popup`,
      );
      popupLabel.append(popupInput);

      row.append(name, tooltipLabel, popupLabel);
      contentFieldList.append(row);
    });

    contentBuilderSummary.textContent = contentSettingsAreCustomized()
      ? "Customized"
      : "Default";
  }

  function syncImportedContentDefaults() {
    [...contentSettings.tooltipFields, ...contentSettings.popupFields]
      .filter((key) => key.startsWith("imported:"))
      .forEach((key) => {
        contentSettings.tooltipFields.delete(key);
        contentSettings.popupFields.delete(key);
      });
    importedContentFieldKeys().forEach((key) =>
      contentSettings.popupFields.add(key),
    );
    renderContentFieldOptions();
  }

  function templateValuesForDistrict(district) {
    const values = {
      district: district.name,
      division: district.divisionName || "",
      slug: district.slug,
      code: district.code || "",
      census_code: district.code || "",
      lgd_code: district.lgdCode || "",
      district_id: district.featureId || "",
      division_id: district.divisionId || "",
    };
    Object.entries(district.dataRecord || {}).forEach(([field, value]) => {
      if (scalarImportedValue(value)) {
        values[field.toLocaleLowerCase()] = String(value);
      }
    });
    return values;
  }

  function applyDistrictTemplate(template, district) {
    const values = templateValuesForDistrict(district);
    return String(template || "").replace(/\{([^{}]+)\}/g, (_, key) => {
      const normalizedKey = key.trim().toLocaleLowerCase();
      return Object.prototype.hasOwnProperty.call(values, normalizedKey)
        ? values[normalizedKey]
        : "";
    });
  }

  function safePopupUrl(value, image = false) {
    const candidate = String(value || "").trim();
    if (!candidate) return "";
    if (
      image &&
      /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(
        candidate,
      )
    ) {
      return candidate;
    }
    try {
      const url = new URL(candidate, window.location.href);
      const protocols = image
        ? new Set(["http:", "https:"])
        : new Set(["http:", "https:", "mailto:", "tel:"]);
      return protocols.has(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function renderCustomPopupContent(district) {
    const text = applyDistrictTemplate(contentSettings.customText, district)
      .trim();
    const linkLabel = applyDistrictTemplate(
      contentSettings.linkLabel,
      district,
    ).trim();
    const linkUrl = safePopupUrl(
      applyDistrictTemplate(contentSettings.linkUrl, district),
    );
    const imageUrl = safePopupUrl(
      applyDistrictTemplate(contentSettings.imageUrl, district),
      true,
    );
    const imageAlt = applyDistrictTemplate(
      contentSettings.imageAlt,
      district,
    ).trim();

    customPopupText.textContent = text;
    customPopupText.hidden = !text;

    customPopupLink.textContent = linkLabel || "Open link";
    customPopupLink.href = linkUrl || "#";
    customPopupLink.hidden = !linkUrl;
    const opensNewWindow = /^https?:/i.test(linkUrl);
    customPopupLink.target = opensNewWindow ? "_blank" : "_self";
    customPopupLink.rel = opensNewWindow ? "noopener noreferrer" : "";

    customPopupImage.onerror = () => {
      customPopupImage.hidden = true;
      customPopupContent.hidden =
        customPopupText.hidden && customPopupLink.hidden;
    };
    if (imageUrl) {
      customPopupImage.src = imageUrl;
    } else {
      customPopupImage.removeAttribute("src");
    }
    customPopupImage.alt = imageAlt || `${district.name} district`;
    customPopupImage.hidden = !imageUrl;
    customPopupContent.hidden = !text && !linkUrl && !imageUrl;
  }

  function applyContentSettingsToProfile(district) {
    districtSelection
      .querySelectorAll("[data-popup-field]")
      .forEach((element) => {
        const field = element.dataset.popupField;
        const missingBoundary =
          field === "boundary" && !district.boundaryYear;
        element.hidden =
          !contentSettings.popupFields.has(field) || missingBoundary;
      });

    const showsDivision =
      supportsDivisions && contentSettings.popupFields.has("division");
    selectedDistrictMeta.textContent = showsDivision
      ? `${districtGroupLabel(district)} · ${state.name}`
      : state.name;
    profileChipRow.hidden = Array.from(profileChipRow.children).every(
      (element) => element.hidden,
    );
    districtProfileGrid.hidden = Array.from(
      districtProfileGrid.children,
    ).every((element) => element.hidden);
    renderImportedProfile(district);
    renderCustomPopupContent(district);
  }

  function applyContentBuilderSettings() {
    const tooltipFields = new Set();
    const popupFields = new Set();
    contentFieldList
      .querySelectorAll("input[data-content-field]:checked")
      .forEach((input) => {
        const target =
          input.dataset.contentTarget === "tooltip"
            ? tooltipFields
            : popupFields;
        target.add(input.dataset.contentField);
      });

    contentSettings.tooltipFields = tooltipFields;
    contentSettings.popupFields = popupFields;
    contentSettings.customText = popupCustomTextInput.value.trim();
    contentSettings.linkLabel = popupLinkLabelInput.value.trim();
    contentSettings.linkUrl = popupLinkUrlInput.value.trim();
    contentSettings.imageUrl = popupImageUrlInput.value.trim();
    contentSettings.imageAlt = popupImageAltInput.value.trim();

    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (selectedDistrict) applyContentSettingsToProfile(selectedDistrict);
    contentBuilderSummary.textContent = contentSettingsAreCustomized()
      ? "Customized"
      : "Default";
    contentBuilderStatus.textContent =
      "Tooltip and popup content updated for this browser tab.";
  }

  function resetContentBuilderSettings() {
    contentSettings.tooltipFields = new Set(defaultTooltipFields);
    contentSettings.popupFields = defaultPopupContentFields();
    contentSettings.customText = "";
    contentSettings.linkLabel = "";
    contentSettings.linkUrl = "";
    contentSettings.imageUrl = "";
    contentSettings.imageAlt = "";
    popupCustomTextInput.value = "";
    popupLinkLabelInput.value = "";
    popupLinkUrlInput.value = "";
    popupImageUrlInput.value = "";
    popupImageAltInput.value = "";
    renderContentFieldOptions();

    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (selectedDistrict) applyContentSettingsToProfile(selectedDistrict);
    contentBuilderStatus.textContent = "Default tooltip and popup restored.";
  }

  function updateDistrictActionFields() {
    const type = districtActionType.value;
    districtActionUrlField.hidden = type !== "url";
    districtActionTargetField.hidden = type !== "url";
    districtActionStateField.hidden = type !== "map";
  }

  function districtActionLabel(action) {
    const labels = {
      profile: "Show profile",
      "district-page": "Open district page",
      url: "Open URL",
      map: "Navigate to map",
      none: "No action",
    };
    return labels[action?.type || "profile"] || "Show profile";
  }

  function refreshDistrictActionPresentation() {
    districts.forEach((district) => {
      const action = districtActions.get(district.slug);
      const element = districtElement(district.slug);
      if (element) {
        element.toggleAttribute("data-has-custom-action", Boolean(action));
      }
    });
    const count = districtActions.size;
    districtActionSummary.textContent = count
      ? `${count} custom action${count === 1 ? "" : "s"}`
      : "Profile on click";
  }

  function loadDistrictActionForm(slug = districtActionDistrict.value) {
    const district = districts.find((item) => item.slug === slug);
    if (!district) return;
    districtActionDistrict.value = district.slug;
    const action = districtActions.get(district.slug) || {
      type: "profile",
      url: "",
      target: "new",
      stateSlug: state.slug,
    };
    districtActionType.value = action.type;
    districtActionUrl.value = action.url || "";
    districtActionTarget.value =
      action.target === "same" ? "same" : "new";
    districtActionState.value = states.some(
      (item) => item.slug === action.stateSlug,
    )
      ? action.stateSlug
      : state.slug;
    updateDistrictActionFields();
    resetDistrictActionButton.disabled = !districtActions.has(district.slug);
    districtActionStatus.textContent =
      `${district.name}: ${districtActionLabel(action)}.`;
  }

  function initializeDistrictActionBuilder() {
    districtActionDistrict.replaceChildren();
    districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district.slug;
      option.textContent = districtGroupLabel(district, false)
        ? `${district.name} · ${districtGroupLabel(district, false)}`
        : district.name;
      districtActionDistrict.append(option);
    });

    districtActionState.replaceChildren();
    [...states]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((region) => {
        const option = document.createElement("option");
        option.value = region.slug;
        option.textContent = region.name;
        districtActionState.append(option);
      });
    loadDistrictActionForm(districts[0]?.slug);
    refreshDistrictActionPresentation();
  }

  function saveDistrictAction() {
    const district = districts.find(
      (item) => item.slug === districtActionDistrict.value,
    );
    if (!district) return false;
    const type = districtActionType.value;
    const allowedTypes = new Set([
      "profile",
      "district-page",
      "url",
      "map",
      "none",
    ]);
    if (!allowedTypes.has(type)) return false;

    let action = null;
    if (type === "url") {
      const template = districtActionUrl.value.trim();
      const resolvedUrl = safePopupUrl(
        applyDistrictTemplate(template, district),
      );
      if (!template || !resolvedUrl) {
        districtActionStatus.textContent =
          "Enter a valid HTTP, HTTPS, mailto, tel, or relative URL.";
        districtActionUrl.focus();
        return false;
      }
      action = {
        type,
        url: template,
        target: districtActionTarget.value === "same" ? "same" : "new",
      };
    } else if (type === "map") {
      const destination = states.find(
        (item) => item.slug === districtActionState.value,
      );
      if (!destination) {
        districtActionStatus.textContent =
          "Choose a valid destination state.";
        return false;
      }
      action = { type, stateSlug: destination.slug };
    } else if (type === "district-page" || type === "none") {
      action = { type };
    }

    return runHistoryAction("configure district click action", () => {
      if (action) {
        districtActions.set(district.slug, action);
      } else {
        districtActions.delete(district.slug);
      }
      refreshDistrictActionPresentation();
      loadDistrictActionForm(district.slug);
      districtActionStatus.textContent =
        `${district.name} will ${districtActionLabel(action).toLocaleLowerCase()}.`;
      return true;
    });
  }

  function resetDistrictAction() {
    const district = districts.find(
      (item) => item.slug === districtActionDistrict.value,
    );
    if (!district) return false;
    if (!districtActions.has(district.slug)) {
      districtActionStatus.textContent =
        `${district.name} already uses the default profile action.`;
      return false;
    }
    return runHistoryAction("reset district click action", () => {
      districtActions.delete(district.slug);
      refreshDistrictActionPresentation();
      loadDistrictActionForm(district.slug);
      districtActionStatus.textContent =
        `${district.name} now opens its district profile.`;
      return true;
    });
  }

  function restoreDistrictActions(savedActions) {
    districtActions.clear();
    const allowedTypes = new Set(["district-page", "url", "map", "none"]);
    Object.entries(
      savedActions && typeof savedActions === "object"
        ? savedActions
        : {},
    ).forEach(([slug, action]) => {
      if (
        !districts.some((district) => district.slug === slug) ||
        !action ||
        !allowedTypes.has(action.type)
      ) {
        return;
      }
      if (action.type === "url" && typeof action.url === "string") {
        districtActions.set(slug, {
          type: "url",
          url: action.url.slice(0, 500),
          target: action.target === "same" ? "same" : "new",
        });
      } else if (
        action.type === "map" &&
        states.some((region) => region.slug === action.stateSlug)
      ) {
        districtActions.set(slug, {
          type: "map",
          stateSlug: action.stateSlug,
        });
      } else if (
        action.type === "district-page" ||
        action.type === "none"
      ) {
        districtActions.set(slug, { type: action.type });
      }
    });
    refreshDistrictActionPresentation();
    loadDistrictActionForm(
      selectedDistrictSlug || districtActionDistrict.value,
    );
  }

  function executeDistrictAction(slug) {
    const district = districts.find((item) => item.slug === slug);
    if (!district) return;
    const action = districtActions.get(slug);
    if (!action) {
      selectDistrict(slug);
      return;
    }
    if (action.type === "none") return;
    if (action.type === "district-page") {
      window.location.assign(districtPageUrl(district));
      return;
    }
    if (action.type === "map") {
      const destination = states.find(
        (item) => item.slug === action.stateSlug,
      );
      if (destination) {
        window.location.assign(
          `state.html?state=${encodeURIComponent(destination.slug)}`,
        );
        return;
      }
    }
    if (action.type === "url") {
      const url = safePopupUrl(applyDistrictTemplate(action.url, district));
      if (url) {
        if (action.target === "same") {
          window.location.assign(url);
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      }
    }
    selectDistrict(slug);
    districtActionDistrict.value = slug;
    loadDistrictActionForm(slug);
    districtActionStatus.textContent =
      `${district.name}'s custom action is unavailable, so its profile was opened.`;
  }

  function readSavedProject() {
    try {
      const stored = window.localStorage.getItem(projectStorageKey);
      if (!stored) return null;
      const project = JSON.parse(stored);
      return project?.version === 1 && project.stateSlug === state.slug
        ? project
        : null;
    } catch {
      return null;
    }
  }

  function formatProjectSavedAt(savedAt) {
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) return "Saved";
    return `Saved ${new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(date)}`;
  }

  function refreshProjectStorageUI(project = readSavedProject()) {
    const hasProject = Boolean(project);
    projectStorageSummary.textContent = hasProject
      ? formatProjectSavedAt(project.savedAt)
      : "Not saved";
    restoreProjectButton.disabled = !hasProject;
    deleteProjectButton.disabled = !hasProject;
    if (hasProject && !projectNameInput.value.trim()) {
      projectNameInput.value = project.name || `${state.name} district map`;
    }
  }

  function buildProjectSnapshot() {
    const importedRecords = districts
      .map((district) => district.dataRecord)
      .filter(Boolean);
    return {
      version: 1,
      stateSlug: state.slug,
      stateName: state.name,
      name:
        projectNameInput.value.trim() || `${state.name} district map`,
      savedAt: new Date().toISOString(),
      map: {
        groupFilter: supportsDivisions,
        activeDivisionSlug,
        selectedDistrictSlug,
        labelMode: currentLabelMode,
        viewBox: currentViewBox ? copyViewBox(currentViewBox) : null,
        layers: { ...layerVisibility },
        styles: Object.fromEntries(
          styleColorInputs.map((input) => [
            input.dataset.styleProperty,
            {
              value: input.value,
              customized: input.dataset.customized === "true",
            },
          ]),
        ),
      },
      data: {
        fileName: importedDataset?.fileName || "",
        records: importedRecords,
        visualizationField: currentVisualization?.field || "",
        filter: activeDataFilter ? { ...activeDataFilter } : null,
      },
      comparison: {
        active: comparisonMode,
        districtSlugs: Array.from(comparedDistrictSlugs),
      },
      content: {
        tooltipFields: Array.from(contentSettings.tooltipFields),
        popupFields: Array.from(contentSettings.popupFields),
        customText: contentSettings.customText,
        linkLabel: contentSettings.linkLabel,
        linkUrl: contentSettings.linkUrl,
        imageUrl: contentSettings.imageUrl,
        imageAlt: contentSettings.imageAlt,
      },
      actions: Object.fromEntries(
        Array.from(districtActions, ([slug, action]) => [
          slug,
          { ...action },
        ]),
      ),
    };
  }

  function saveProjectSnapshot() {
    const project = buildProjectSnapshot();
    try {
      window.localStorage.setItem(
        projectStorageKey,
        JSON.stringify(project),
      );
      projectNameInput.value = project.name;
      refreshProjectStorageUI(project);
      projectStorageStatus.textContent =
        `"${project.name}" saved in this browser.`;
    } catch {
      projectStorageStatus.textContent =
        "This project is too large for browser storage. Clear imported data and try again.";
    }
  }

  function restoreProjectContent(savedContent) {
    const availableFields = new Set(
      contentFieldDefinitions().map((field) => field.key),
    );
    const selectAvailableFields = (fields, fallback) =>
      new Set(
        (Array.isArray(fields) ? fields : Array.from(fallback)).filter(
          (field) => availableFields.has(field),
        ),
      );
    contentSettings.tooltipFields = selectAvailableFields(
      savedContent?.tooltipFields,
      defaultTooltipFields,
    );
    contentSettings.popupFields = selectAvailableFields(
      savedContent?.popupFields,
      defaultPopupContentFields(),
    );
    contentSettings.customText = String(savedContent?.customText || "").slice(
      0,
      400,
    );
    contentSettings.linkLabel = String(savedContent?.linkLabel || "").slice(
      0,
      60,
    );
    contentSettings.linkUrl = String(savedContent?.linkUrl || "").slice(
      0,
      500,
    );
    contentSettings.imageUrl = String(savedContent?.imageUrl || "").slice(
      0,
      500,
    );
    contentSettings.imageAlt = String(savedContent?.imageAlt || "").slice(
      0,
      120,
    );
    popupCustomTextInput.value = contentSettings.customText;
    popupLinkLabelInput.value = contentSettings.linkLabel;
    popupLinkUrlInput.value = contentSettings.linkUrl;
    popupImageUrlInput.value = contentSettings.imageUrl;
    popupImageAltInput.value = contentSettings.imageAlt;
    renderContentFieldOptions();
  }

  function restoreProjectStyles(savedStyles) {
    styleColorInputs.forEach((input) => {
      const saved = savedStyles?.[input.dataset.styleProperty];
      const isCustomized = Boolean(
        saved?.customized && /^#[0-9a-f]{6}$/i.test(saved.value),
      );
      const value = isCustomized ? saved.value : input.defaultValue;
      input.value = value;
      if (isCustomized) {
        document.documentElement.style.setProperty(
          input.dataset.styleProperty,
          value,
        );
        input.dataset.customized = "true";
      } else {
        document.documentElement.style.removeProperty(
          input.dataset.styleProperty,
        );
        delete input.dataset.customized;
      }
      const output = input
        .closest(".style-color-row")
        ?.querySelector("output");
      if (output) {
        output.textContent =
          input.dataset.styleOptional === "true" && !isCustomized
            ? "Automatic"
            : value.toLocaleUpperCase();
      }
    });
    updateMapStyleSummary();
  }

  function restoreProjectFilter(savedFilter) {
    clearDataFilter(false);
    if (
      !savedFilter ||
      !importedFieldNames().includes(savedFilter.field)
    ) {
      return;
    }
    dataFilterField.value = savedFilter.field;
    configureDataFilterField(false);
    const supportedOperator = Array.from(dataFilterOperator.options).some(
      (option) => option.value === savedFilter.operator,
    );
    if (!supportedOperator) return;
    dataFilterOperator.value = savedFilter.operator;
    dataFilterValue.value = String(savedFilter.value ?? "");
    dataFilterValueSecondary.value = String(
      savedFilter.valueSecondary ?? "",
    );
    updateDataFilterOperatorUI();
    const restoredFilter = buildDataFilterFromControls();
    if (!restoredFilter) return;
    activeDataFilter = restoredFilter;
    clearDataFilterButton.hidden = false;
    syncDataFilterPresentation();
  }

  function validSavedViewBox(viewBox) {
    return (
      viewBox &&
      ["x", "y", "width", "height"].every((key) =>
        Number.isFinite(Number(viewBox[key])),
      ) &&
      Number(viewBox.width) > 0 &&
      Number(viewBox.height) > 0
    );
  }

  function restoreProjectSnapshot(projectOverride = null, options = {}) {
    const project = projectOverride || readSavedProject();
    if (!project) {
      refreshProjectStorageUI(null);
      projectStorageStatus.textContent = "No saved project was found.";
      return false;
    }

    try {
    const records = Array.isArray(project.data?.records)
      ? project.data.records.filter(
          (record) => record && typeof record === "object",
        )
      : [];
    if (records.length) {
      applyImportedRecords(
        records,
        project.data.fileName || "saved-project-data.json",
      );
    } else {
      clearImportedData();
    }

    restoreProjectContent(project.content);
    restoreProjectStyles(project.map?.styles);
    restoreDistrictActions(project.actions);
    Object.keys(layerVisibility).forEach((layer) => {
      layerVisibility[layer] =
        typeof project.map?.layers?.[layer] === "boolean"
          ? project.map.layers[layer]
          : true;
    });
    setLabelMode(project.map?.labelMode);

    const visualizationFieldName = project.data?.visualizationField;
    applyDataVisualization(
      importedFieldNames().includes(visualizationFieldName)
        ? visualizationFieldName
        : "",
    );
    restoreProjectFilter(project.data?.filter);

    setActiveDivision(project.map?.activeDivisionSlug, false);
    setComparisonMode(false, false);
    comparedDistrictSlugs.clear();
    const savedComparisonDistricts = Array.isArray(
      project.comparison?.districtSlugs,
    )
      ? project.comparison.districtSlugs
      : [];
    if (project.comparison?.active) {
      setComparisonMode(true, false);
      savedComparisonDistricts
        .filter((slug) =>
          districts.some((district) => district.slug === slug),
        )
        .slice(0, comparisonLimit)
        .forEach((slug) => comparedDistrictSlugs.add(slug));
      refreshComparisonPresentation(false);
    } else {
      const savedDistrict = districts.find(
        (district) => district.slug === project.map?.selectedDistrictSlug,
      );
      if (savedDistrict && districtMatchesDataFilter(savedDistrict)) {
        selectDistrict(savedDistrict.slug, false, false);
      } else {
        clearDistrict(false);
      }
    }

    applyLayerVisibility();
    if (validSavedViewBox(project.map?.viewBox)) {
      setMapView(
        {
          x: Number(project.map.viewBox.x),
          y: Number(project.map.viewBox.y),
          width: Number(project.map.viewBox.width),
          height: Number(project.map.viewBox.height),
        },
        false,
      );
    }
    projectNameInput.value =
      project.name || `${state.name} district map`;
    syncDefaultEmbedMapUrl();
    if (!options.skipStorageUi) refreshProjectStorageUI(project);
    if (!options.silent) {
      projectStorageStatus.textContent =
        `"${projectNameInput.value}" restored.`;
    }
    return true;
    } catch (error) {
      projectStorageStatus.textContent =
        "The saved project could not be restored. Save a new snapshot and try again.";
      console.error(error);
      return false;
    }
  }

  function deleteProjectSnapshot() {
    try {
      window.localStorage.removeItem(projectStorageKey);
      refreshProjectStorageUI(null);
      projectStorageStatus.textContent =
        "Saved snapshot deleted. The current map is unchanged.";
    } catch {
      projectStorageStatus.textContent =
        "The saved snapshot could not be deleted.";
    }
  }

  function portableProjectFileName(projectName) {
    const safeName = String(projectName || "")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return `${safeName || state.slug}-image-map-project.json`;
  }

  function exportProjectFile() {
    const project = buildProjectSnapshot();
    const json = JSON.stringify(project, null, 2);
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = portableProjectFileName(project.name);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    projectStorageStatus.textContent =
      `"${project.name}" exported as a portable project file.`;
  }

  function standaloneMapFileName(projectName) {
    return portableProjectFileName(projectName).replace(
      /-image-map-project\.json$/,
      "-interactive-map.html",
    );
  }

  function defaultEmbedMapUrl() {
    const projectName =
      projectNameInput.value.trim() || `${state.name} district map`;
    return `./${standaloneMapFileName(projectName)}`;
  }

  function normalizedEmbedHeight() {
    return Math.min(
      1200,
      Math.max(320, Math.round(Number(embedMapHeight.value) || 720)),
    );
  }

  function refreshEmbedCode() {
    embedFormatButtons.forEach((button) => {
      const isActive = button.dataset.embedFormat === embedFormat;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    embedCodeSummary.textContent =
      embedFormat === "javascript" ? "JavaScript" : "Iframe";

    const exporter = window.ImageMapStandaloneExporter;
    try {
      if (!exporter?.buildEmbedCode) {
        throw new Error("The embed generator could not be loaded.");
      }
      embedCodeOutput.value = exporter.buildEmbedCode({
        format: embedFormat,
        source: embedMapUrl.value,
        title: `Interactive district map of ${state.name}`,
        height: normalizedEmbedHeight(),
      });
      copyEmbedCodeButton.disabled = false;
      embedCodeStatus.dataset.state = "ready";
      embedCodeStatus.textContent =
        embedFormat === "javascript"
          ? "JavaScript loader code is ready to copy."
          : "Iframe code is ready to copy.";
    } catch (error) {
      embedCodeOutput.value = "";
      copyEmbedCodeButton.disabled = true;
      embedCodeStatus.dataset.state = "error";
      embedCodeStatus.textContent =
        error instanceof Error
          ? error.message
          : "Enter a valid map URL or relative path.";
    }
  }

  function syncDefaultEmbedMapUrl() {
    if (embedUrlCustomized) return;
    embedMapUrl.value = defaultEmbedMapUrl();
    refreshEmbedCode();
  }

  function initializeEmbedCodeBuilder() {
    syncDefaultEmbedMapUrl();
  }

  function copyEmbedCode() {
    if (!embedCodeOutput.value) {
      embedCodeStatus.dataset.state = "error";
      embedCodeStatus.textContent =
        "Generate valid embed code before copying.";
      return;
    }
    delete embedCodeStatus.dataset.state;
    copyText(
      embedCodeOutput.value,
      "Embed code copied.",
      embedCodeStatus,
    );
  }

  const visualExportStyleProperties = [
    "display",
    "visibility",
    "opacity",
    "fill",
    "fill-opacity",
    "fill-rule",
    "stroke",
    "stroke-opacity",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "paint-order",
    "filter",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "text-anchor",
    "dominant-baseline",
    "transform",
    "transform-box",
    "transform-origin",
  ];

  function setVisualExportStatus(message, isError = false) {
    visualExportStatus.textContent = message;
    if (isError) {
      visualExportStatus.dataset.state = "error";
    } else {
      delete visualExportStatus.dataset.state;
    }
  }

  function visualExportViewBox() {
    const useFullMap = visualExportScope.value === "full";
    const source =
      (useFullMap ? initialViewBox : currentViewBox) ||
      initialViewBox ||
      currentViewBox;
    if (!source) {
      throw new Error("The map view is not ready to export.");
    }
    return copyViewBox(source);
  }

  function visualExportFileName(extension) {
    const projectName =
      projectNameInput.value.trim() || `${state.name} district map`;
    const stem = standaloneMapFileName(projectName).replace(
      /-interactive-map\.html$/,
      "",
    );
    const scope =
      visualExportScope.value === "full" ? "full-map" : "current-view";
    return `${stem}-${scope}.${extension}`;
  }

  function bakeSvgPresentation(clone) {
    const sourceElements = [svgRoot, ...svgRoot.querySelectorAll("*")];
    const clonedElements = [clone, ...clone.querySelectorAll("*")];
    const fullMap = visualExportScope.value === "full";

    sourceElements.forEach((source, index) => {
      const target = clonedElements[index];
      if (!target) return;
      const computed = getComputedStyle(source);
      target.removeAttribute("style");
      visualExportStyleProperties.forEach((property) => {
        if (
          fullMap &&
          source.classList?.contains("map-label") &&
          property.startsWith("transform")
        ) {
          return;
        }
        const value = computed.getPropertyValue(property).trim();
        if (value) target.style.setProperty(property, value);
      });
    });

    clone.querySelectorAll("[tabindex]").forEach((element) => {
      element.removeAttribute("tabindex");
    });
    clone.querySelectorAll(".district-region").forEach((element) => {
      element.removeAttribute("role");
      element.removeAttribute("aria-label");
    });
  }

  function buildVisualExportSvg() {
    if (!svgRoot || !districts.length) {
      throw new Error("The district map is not ready to export.");
    }
    const viewBox = visualExportViewBox();
    const clone = svgRoot.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute(
      "viewBox",
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    );
    clone.setAttribute("width", viewBox.width);
    clone.setAttribute("height", viewBox.height);
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
    bakeSvgPresentation(clone);

    if (visualExportBackground.value === "light") {
      const background = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      const panelColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--panel")
          .trim() || "#fffdf7";
      background.setAttribute("x", viewBox.x);
      background.setAttribute("y", viewBox.y);
      background.setAttribute("width", viewBox.width);
      background.setAttribute("height", viewBox.height);
      background.setAttribute("fill", panelColor);
      background.setAttribute("aria-hidden", "true");
      const firstVisualElement = Array.from(clone.children).find(
        (element) =>
          !["title", "desc", "defs"].includes(
            element.tagName.toLocaleLowerCase(),
          ),
      );
      clone.insertBefore(background, firstVisualElement || null);
    }

    return {
      markup:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        new XMLSerializer().serializeToString(clone),
      viewBox,
    };
  }

  function downloadVisualBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportMapSvg() {
    try {
      const exported = buildVisualExportSvg();
      downloadVisualBlob(
        new Blob([exported.markup], {
          type: "image/svg+xml;charset=utf-8",
        }),
        visualExportFileName("svg"),
      );
      setVisualExportStatus(
        `${
          visualExportScope.value === "full" ? "Full map" : "Current view"
        } exported as SVG.`,
      );
    } catch (error) {
      setVisualExportStatus(
        error instanceof Error
          ? error.message
          : "The SVG could not be generated.",
        true,
      );
    }
  }

  function loadExportImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("The styled SVG could not be rendered as PNG."));
      image.src = url;
    });
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The PNG encoder did not return an image."));
        }
      }, "image/png");
    });
  }

  async function exportMapPng() {
    exportMapSvgButton.disabled = true;
    exportMapPngButton.disabled = true;
    setVisualExportStatus("Rendering the PNG image…");
    let svgUrl = "";
    try {
      const exported = buildVisualExportSvg();
      svgUrl = URL.createObjectURL(
        new Blob([exported.markup], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const image = await loadExportImage(svgUrl);
      const scale = Math.min(
        3,
        Math.max(1, Number(visualExportScale.value) || 2),
      );
      const longestSide = 1600 * scale;
      const aspectRatio = exported.viewBox.width / exported.viewBox.height;
      const canvas = document.createElement("canvas");
      if (aspectRatio >= 1) {
        canvas.width = longestSide;
        canvas.height = Math.max(1, Math.round(longestSide / aspectRatio));
      } else {
        canvas.height = longestSide;
        canvas.width = Math.max(1, Math.round(longestSide * aspectRatio));
      }
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("This browser cannot create the PNG canvas.");
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pngBlob = await canvasToPngBlob(canvas);
      downloadVisualBlob(pngBlob, visualExportFileName("png"));
      setVisualExportStatus(
        `PNG exported at ${canvas.width} × ${canvas.height} pixels.`,
      );
    } catch (error) {
      setVisualExportStatus(
        error instanceof Error
          ? error.message
          : "The PNG could not be generated.",
        true,
      );
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      exportMapSvgButton.disabled = false;
      exportMapPngButton.disabled = false;
    }
  }

  function standaloneMapStyles() {
    return Object.fromEntries(
      styleColorInputs.map((input) => {
        const isOptional = input.dataset.styleOptional === "true";
        const isCustomized = input.dataset.customized === "true";
        return [
          input.dataset.styleProperty,
          isOptional && !isCustomized ? "" : input.value,
        ];
      }),
    );
  }

  function standaloneLegend() {
    if (
      !currentVisualization ||
      !layerVisibility.dataColors ||
      mapDataLegend.hidden
    ) {
      return null;
    }
    const items = Array.from(mapDataLegendItems.children)
      .map((row) => {
        const swatch = row.querySelector(".map-data-legend-swatch");
        return {
          color: swatch?.style.getPropertyValue("--legend-color") || "",
          label: row.children[1]?.textContent || "",
          count: row.children[2]?.textContent || "",
        };
      })
      .filter((item) => item.color && item.label);
    return items.length
      ? {
          title: mapDataLegendTitle.textContent,
          type: mapDataLegendType.textContent,
          items,
        }
      : null;
  }

  function standaloneDistrictData(district) {
    return Object.fromEntries(
      Object.entries(district.dataRecord || {}).filter(([, value]) =>
        scalarImportedValue(value),
      ),
    );
  }

  function buildStandaloneExportConfig() {
    const project = buildProjectSnapshot();
    return {
      version: 1,
      projectName: project.name,
      exportedAt: new Date().toISOString(),
      state: {
        name: state.name,
        slug: state.slug,
        code: state.code,
        featureId: state.featureId,
      },
      map: {
        groupFilter: supportsDivisions,
        activeDivisionSlug,
        selectedDistrictSlug,
        labelMode: currentLabelMode,
        viewBox: currentViewBox ? copyViewBox(currentViewBox) : null,
        layers: { ...layerVisibility },
        styles: standaloneMapStyles(),
        visualization: currentVisualization
          ? { ...currentVisualization }
          : null,
      },
      content: {
        tooltipFields: Array.from(contentSettings.tooltipFields),
        popupFields: Array.from(contentSettings.popupFields),
        customText: contentSettings.customText,
        linkLabel: contentSettings.linkLabel,
        linkUrl: contentSettings.linkUrl,
        imageUrl: contentSettings.imageUrl,
        imageAlt: contentSettings.imageAlt,
      },
      districts: districts.map((district) => {
        const element = districtElement(district.slug);
        return {
          name: district.name,
          slug: district.slug,
          code: district.code,
          featureId: district.featureId,
          divisionName: district.divisionName,
          divisionSlug: district.divisionSlug,
          divisionId: district.divisionId,
          lgdCode: district.lgdCode,
          boundaryYear: district.boundaryYear,
          geometryType: district.geometryType,
          data: standaloneDistrictData(district),
          dataColor:
            element?.style.getPropertyValue("--data-fill").trim() || "",
          divisionColor:
            (element &&
              getComputedStyle(element)
                .getPropertyValue("--division-color")
                .trim()) ||
            "#d7653b",
          matchesFilter: districtMatchesDataFilter(district),
          compared: comparedDistrictSlugs.has(district.slug),
          action: districtActions.has(district.slug)
            ? { ...districtActions.get(district.slug) }
            : null,
        };
      }),
      legend: standaloneLegend(),
    };
  }

  function buildStandaloneSvgMarkup(config) {
    const clone = svgRoot.cloneNode(true);
    clone.id = "portable-district-svg";
    clone.removeAttribute("style");
    if (initialViewBox) {
      clone.setAttribute(
        "viewBox",
        `${initialViewBox.x} ${initialViewBox.y} ${initialViewBox.width} ${initialViewBox.height}`,
      );
    }
    const exportedDistricts = new Map(
      config.districts.map((district) => [district.slug, district]),
    );
    clone.querySelectorAll(".district-region").forEach((element) => {
      const district = exportedDistricts.get(element.dataset.slug);
      element.classList.remove(
        "is-hovered",
        "is-selected",
        "is-division-active",
        "is-division-muted",
        "is-data-filter-muted",
        "is-compared",
      );
      element.removeAttribute("style");
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", district?.matchesFilter ? "0" : "-1");
      if (!district) return;
      element.style.setProperty("--division-color", district.divisionColor);
      if (district.dataColor) {
        element.style.setProperty("--data-fill", district.dataColor);
        element.dataset.visualized = "true";
      } else {
        element.removeAttribute("data-visualized");
      }
    });
    clone.querySelectorAll(".map-label").forEach((label) => {
      label.classList.remove("is-label-muted", "is-data-filter-muted");
      label.removeAttribute("style");
      const district = config.districts.find(
        (item) => item.divisionSlug === label.dataset.divisionSlug,
      );
      if (district) {
        label.style.setProperty("--division-color", district.divisionColor);
      }
    });
    return new XMLSerializer().serializeToString(clone);
  }

  function exportStandaloneMap() {
    if (!svgRoot || !districts.length) {
      projectStorageStatus.textContent =
        "The district map is not ready to export yet.";
      return;
    }
    const exporter = window.ImageMapStandaloneExporter;
    if (!exporter?.buildHtml) {
      projectStorageStatus.textContent =
        "The standalone exporter could not be loaded.";
      return;
    }

    try {
      const config = buildStandaloneExportConfig();
      const html = exporter.buildHtml({
        config,
        svgMarkup: buildStandaloneSvgMarkup(config),
      });
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = standaloneMapFileName(config.projectName);
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      projectStorageStatus.textContent =
        `"${config.projectName}" exported as a standalone interactive HTML map.`;
    } catch (error) {
      projectStorageStatus.textContent =
        "The standalone map could not be generated.";
      console.error(error);
    }
  }

  function validateImportedProject(project) {
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      throw new Error("This file does not contain a map project.");
    }
    if (project.version !== 1) {
      throw new Error("This project version is not supported.");
    }
    if (project.stateSlug !== state.slug) {
      throw new Error(
        `This project belongs to ${project.stateName || project.stateSlug}, not ${state.name}.`,
      );
    }
    if (
      project.data?.records !== undefined &&
      !Array.isArray(project.data.records)
    ) {
      throw new Error("The imported district records are invalid.");
    }
    if ((project.data?.records?.length || 0) > 5000) {
      throw new Error("This project contains too many district records.");
    }
    return {
      ...project,
      name: String(project.name || `${state.name} district map`).slice(
        0,
        60,
      ),
      savedAt: new Date().toISOString(),
    };
  }

  async function importProjectFile(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      projectStorageStatus.textContent =
        "Choose a project file smaller than 4 MB.";
      importProjectFileInput.value = "";
      return;
    }

    projectStorageStatus.textContent = `Reading ${file.name}…`;
    try {
      const project = validateImportedProject(
        JSON.parse(await file.text()),
      );
      window.localStorage.setItem(
        projectStorageKey,
        JSON.stringify(project),
      );
      const historySnapshot = buildProjectSnapshot();
      historyIsRestoring = true;
      let restored = false;
      try {
        restored = restoreProjectSnapshot(project);
      } finally {
        historyIsRestoring = false;
      }
      if (restored) {
        storeHistoryCheckpoint("import project file", historySnapshot);
        projectStorageStatus.textContent =
          `"${project.name}" imported, saved, and restored.`;
      }
    } catch (error) {
      projectStorageStatus.textContent =
        `Import failed: ${error.message}`;
      console.error(error);
    } finally {
      importProjectFileInput.value = "";
    }
  }

  function updateHistoryControls(message = "") {
    const undoEntry = undoHistory[undoHistory.length - 1];
    const redoEntry = redoHistory[redoHistory.length - 1];
    undoChangeButton.disabled = !undoEntry;
    redoChangeButton.disabled = !redoEntry;
    undoChangeButton.title = undoEntry
      ? `Undo ${undoEntry.label} (Ctrl+Z)`
      : "Nothing to undo";
    redoChangeButton.title = redoEntry
      ? `Redo ${redoEntry.label} (Ctrl+Shift+Z)`
      : "Nothing to redo";
    historyStatus.textContent =
      message ||
      (undoHistory.length
        ? `${undoHistory.length} change${undoHistory.length === 1 ? "" : "s"} available`
        : "No editor changes yet");
  }

  function storeHistoryCheckpoint(label, snapshot = buildProjectSnapshot()) {
    if (!historyReady || historyIsRestoring) return;
    undoHistory.push({ label, snapshot });
    if (undoHistory.length > historyLimit) undoHistory.shift();
    redoHistory.length = 0;
    updateHistoryControls();
  }

  function runHistoryAction(label, action) {
    if (!historyReady || historyIsRestoring) return action();
    const snapshot = buildProjectSnapshot();
    const result = action();
    if (result !== false) storeHistoryCheckpoint(label, snapshot);
    return result;
  }

  function restoreHistorySnapshot(snapshot) {
    const preservedViewBox = currentViewBox
      ? copyViewBox(currentViewBox)
      : null;
    const preservedDistrict = selectedDistrictSlug;
    const preservedEditorField = dataEditorField.value;
    const preservedEditorSearch = dataEditorSearch.value;
    const preservedEditorDrafts = cloneDataEditorDrafts();
    const project = {
      ...snapshot,
      map: {
        ...snapshot.map,
        viewBox: preservedViewBox,
        selectedDistrictSlug: preservedDistrict,
      },
    };

    historyIsRestoring = true;
    try {
      const restored = restoreProjectSnapshot(project, {
        silent: true,
        skipStorageUi: true,
      });
      if (restored && importedDataset) {
        restoreDataEditorDrafts(
          preservedEditorDrafts,
          preservedEditorField,
          preservedEditorSearch,
        );
      }
      return restored;
    } finally {
      historyIsRestoring = false;
    }
  }

  function undoEditorChange() {
    const entry = undoHistory.pop();
    if (!entry) return;
    const current = {
      label: entry.label,
      snapshot: buildProjectSnapshot(),
    };
    if (restoreHistorySnapshot(entry.snapshot)) {
      redoHistory.push(current);
      updateHistoryControls(`Undid ${entry.label}`);
    } else {
      undoHistory.push(entry);
      updateHistoryControls("Undo could not be completed");
    }
  }

  function redoEditorChange() {
    const entry = redoHistory.pop();
    if (!entry) return;
    const current = {
      label: entry.label,
      snapshot: buildProjectSnapshot(),
    };
    if (restoreHistorySnapshot(entry.snapshot)) {
      undoHistory.push(current);
      if (undoHistory.length > historyLimit) undoHistory.shift();
      updateHistoryControls(`Redid ${entry.label}`);
    } else {
      redoHistory.push(entry);
      updateHistoryControls("Redo could not be completed");
    }
  }

  function beginStyleHistory(input) {
    if (!historyReady || historyIsRestoring) return;
    pendingStyleHistory = {
      property: input.dataset.styleProperty,
      label: `change ${input.dataset.styleName.toLocaleLowerCase()}`,
      snapshot: buildProjectSnapshot(),
    };
  }

  function commitStyleHistory(input) {
    if (
      !pendingStyleHistory ||
      pendingStyleHistory.property !== input.dataset.styleProperty
    ) {
      return;
    }
    storeHistoryCheckpoint(
      pendingStyleHistory.label,
      pendingStyleHistory.snapshot,
    );
    pendingStyleHistory = null;
  }

  function restoreSavedProjectWithHistory() {
    const project = readSavedProject();
    if (!project) {
      restoreProjectSnapshot();
      return;
    }
    const snapshot = buildProjectSnapshot();
    historyIsRestoring = true;
    let restored = false;
    try {
      restored = restoreProjectSnapshot(project);
    } finally {
      historyIsRestoring = false;
    }
    if (restored) {
      storeHistoryCheckpoint("restore saved project", snapshot);
    }
  }

  const numericColors = [
    "#eff6f3",
    "#d1e6de",
    "#a8d0c1",
    "#72ad98",
    "#3e806b",
  ];
  const categoricalColors = [
    "#4d8296",
    "#d77b58",
    "#5c9875",
    "#806fa5",
    "#c49a45",
    "#5578a4",
    "#a8677c",
  ];
  const missingDataColor = "#e7e8e3";
  const identifierFieldNames = new Set([
    "district_id",
    "district_name",
    "district",
    "name",
    "feature_id",
    "identifier",
    "id",
    "district_code",
    "census_code",
    "lgd_code",
    "code",
    "slug",
  ]);

  function scalarImportedValue(value) {
    return (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      typeof value !== "object"
    );
  }

  function parseNumericValue(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value.trim()) return null;
    const normalized = value
      .trim()
      .replace(/[,\s]/g, "")
      .replace(/^[₹$€£]/, "")
      .replace(/%$/, "");
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function importedFieldNames() {
    if (!importedDataset) return [];
    const fields = new Set();
    districts.forEach((district) => {
      Object.entries(district.dataRecord || {}).forEach(([field, value]) => {
        if (
          field !== importedDataset.joinField &&
          !identifierFieldNames.has(field.toLocaleLowerCase()) &&
          scalarImportedValue(value)
        ) {
          fields.add(field);
        }
      });
    });
    return Array.from(fields).sort((a, b) =>
      humanizeFieldName(a).localeCompare(humanizeFieldName(b)),
    );
  }

  function editableImportedFieldNames() {
    if (!importedDataset) return [];
    const fields = new Map();
    districts.forEach((district) => {
      Object.entries(district.dataRecord || {}).forEach(([field, value]) => {
        const normalized = field.toLocaleLowerCase();
        if (
          field !== importedDataset.joinField &&
          !identifierFieldNames.has(normalized) &&
          typeof value !== "object"
        ) {
          if (!fields.has(normalized)) fields.set(normalized, field);
        }
      });
    });
    return Array.from(fields.values()).sort((a, b) =>
      humanizeFieldName(a).localeCompare(humanizeFieldName(b)),
    );
  }

  function dataEditorDraftCount() {
    return Array.from(dataEditorDrafts.values()).reduce(
      (total, fieldDrafts) => total + fieldDrafts.size,
      0,
    );
  }

  function cloneDataEditorDrafts() {
    return new Map(
      Array.from(dataEditorDrafts, ([field, fieldDrafts]) => [
        field,
        new Map(fieldDrafts),
      ]),
    );
  }

  function restoreDataEditorDrafts(
    savedDrafts,
    preferredField,
    searchValue,
  ) {
    dataEditorDrafts.clear();
    const editableFields = new Set(editableImportedFieldNames());
    savedDrafts.forEach((fieldDrafts, field) => {
      if (!editableFields.has(field)) return;
      fieldDrafts.forEach((value, slug) => {
        const district = districts.find((item) => item.slug === slug);
        if (!district?.dataRecord) return;
        setDataEditorDraft(field, district, value);
      });
    });
    dataEditorSearch.value = searchValue;
    renderDataEditorFields(preferredField);
  }

  function updateDataEditorDraftStatus() {
    const count = dataEditorDraftCount();
    dataEditorSummary.textContent = `${count} pending`;
    dataEditorApplyButton.disabled = count === 0;
    dataEditorDiscardButton.disabled = count === 0;
  }

  function dataEditorDraftValue(field, district) {
    const fieldDrafts = dataEditorDrafts.get(field);
    if (fieldDrafts?.has(district.slug)) {
      return fieldDrafts.get(district.slug);
    }
    const value = district.dataRecord?.[field];
    return value === null || value === undefined ? "" : String(value);
  }

  function setDataEditorDraft(field, district, value) {
    const originalValue = district.dataRecord?.[field];
    const original =
      originalValue === null || originalValue === undefined
        ? ""
        : String(originalValue);
    let fieldDrafts = dataEditorDrafts.get(field);
    if (value === original) {
      fieldDrafts?.delete(district.slug);
      if (fieldDrafts?.size === 0) dataEditorDrafts.delete(field);
    } else {
      if (!fieldDrafts) {
        fieldDrafts = new Map();
        dataEditorDrafts.set(field, fieldDrafts);
      }
      fieldDrafts.set(district.slug, value);
    }
    updateDataEditorDraftStatus();
  }

  function renderDataEditorRows(filter = dataEditorSearch.value) {
    const field = dataEditorField.value;
    const query = filter.trim().toLocaleLowerCase();
    dataEditorRows.replaceChildren();
    if (!field) return;

    const visibleDistricts = districts.filter((district) => {
      if (!district.dataRecord) return false;
      return districtSearchText(district)
        .toLocaleLowerCase()
        .includes(query);
    });

    visibleDistricts.forEach((district) => {
      const row = document.createElement("tr");
      const districtCell = document.createElement("th");
      const divisionCell = document.createElement("td");
      const valueCell = document.createElement("td");
      const input = document.createElement("input");
      districtCell.scope = "row";
      districtCell.textContent = district.name;
      divisionCell.textContent = district.divisionName || "—";
      input.type = "text";
      input.value = dataEditorDraftValue(field, district);
      input.dataset.districtSlug = district.slug;
      input.setAttribute(
        "aria-label",
        `${humanizeFieldName(field)} for ${district.name}`,
      );
      input.addEventListener("input", () =>
        setDataEditorDraft(field, district, input.value),
      );
      valueCell.append(input);
      row.append(districtCell, divisionCell, valueCell);
      dataEditorRows.append(row);
    });

    if (!visibleDistricts.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = supportsDivisions ? 3 : 2;
      cell.className = "data-editor-empty";
      cell.textContent = query
        ? "No matching districts."
        : "No matched records are available.";
      row.append(cell);
      dataEditorRows.append(row);
    }
  }

  function renderDataEditorFields(preferredField = dataEditorField.value) {
    const fields = editableImportedFieldNames();
    dataEditorField.replaceChildren();
    if (!fields.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Add a field to begin";
      dataEditorField.append(option);
      dataEditorField.disabled = true;
    } else {
      fields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = humanizeFieldName(field);
        dataEditorField.append(option);
      });
      dataEditorField.disabled = false;
      dataEditorField.value = fields.includes(preferredField)
        ? preferredField
        : fields[0];
    }
    renderDataEditorRows();
    updateDataEditorDraftStatus();
  }

  function resetDataEditorDrafts() {
    dataEditorDrafts.clear();
    dataEditorSearch.value = "";
    dataEditor.hidden = !importedDataset;
    if (importedDataset) {
      renderDataEditorFields();
      dataEditorStatus.textContent =
        "Choose a field and edit district values.";
    } else {
      dataEditorRows.replaceChildren();
      dataEditorField.replaceChildren();
      updateDataEditorDraftStatus();
      dataEditorStatus.textContent =
        "Import district data to start editing.";
    }
  }

  function normalizedDataEditorFieldName(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
  }

  function addDataEditorField() {
    const field = normalizedDataEditorFieldName(dataEditorNewField.value);
    if (!field) {
      dataEditorStatus.textContent =
        "Enter a field name using letters or numbers.";
      dataEditorNewField.focus();
      return false;
    }
    const existingFields = new Set(
      districts.flatMap((district) =>
        Object.keys(district.dataRecord || {}).map((name) =>
          name.toLocaleLowerCase(),
        ),
      ),
    );
    if (
      identifierFieldNames.has(field) ||
      field === importedDataset?.joinField?.toLocaleLowerCase()
    ) {
      dataEditorStatus.textContent =
        "Choose a field name that is not a district identifier.";
      dataEditorNewField.focus();
      return false;
    }
    if (existingFields.has(field)) {
      dataEditorStatus.textContent = "That field already exists.";
      dataEditorNewField.focus();
      return false;
    }

    return runHistoryAction("add district data field", () => {
      districts.forEach((district) => {
        if (!district.dataRecord) return;
        district.dataRecord = { ...district.dataRecord, [field]: "" };
      });
      dataEditorNewField.value = "";
      renderDataEditorFields(field);
      dataEditorStatus.textContent =
        `${humanizeFieldName(field)} added. Enter values and apply edits.`;
      return true;
    });
  }

  function refreshAfterDataEditorEdits(
    preferredEditorField,
    visualizationFieldName,
    savedFilter,
    fieldsBefore,
  ) {
    const fieldsAfter = importedFieldNames();
    fieldsAfter
      .filter((field) => !fieldsBefore.has(field))
      .forEach((field) =>
        contentSettings.popupFields.add(`imported:${field}`),
      );
    renderContentFieldOptions();
    populateVisualizationFields(visualizationFieldName || "");
    if (savedFilter) restoreProjectFilter(savedFilter);
    renderDataEditorFields(preferredEditorField);
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (selectedDistrict) applyContentSettingsToProfile(selectedDistrict);
  }

  function applyDataEditorEdits() {
    const count = dataEditorDraftCount();
    if (!count) {
      dataEditorStatus.textContent = "There are no pending edits.";
      return false;
    }
    const preferredEditorField = dataEditorField.value;
    const visualizationFieldName = currentVisualization?.field || "";
    const savedFilter = activeDataFilter ? { ...activeDataFilter } : null;
    const fieldsBefore = new Set(importedFieldNames());

    return runHistoryAction("edit district data", () => {
      dataEditorDrafts.forEach((fieldDrafts, field) => {
        fieldDrafts.forEach((value, slug) => {
          const district = districts.find((item) => item.slug === slug);
          if (!district?.dataRecord) return;
          district.dataRecord = {
            ...district.dataRecord,
            [field]: value,
          };
        });
      });
      dataEditorDrafts.clear();
      refreshAfterDataEditorEdits(
        preferredEditorField,
        visualizationFieldName,
        savedFilter,
        fieldsBefore,
      );
      dataEditorStatus.textContent =
        `${count} edit${count === 1 ? "" : "s"} applied across the map.`;
      return true;
    });
  }

  function discardDataEditorDrafts() {
    const count = dataEditorDraftCount();
    dataEditorDrafts.clear();
    renderDataEditorRows();
    updateDataEditorDraftStatus();
    dataEditorStatus.textContent = count
      ? "Pending edits discarded."
      : "There are no pending edits.";
  }

  function classifyVisualizationField(field) {
    const values = districts
      .map((district) => district.dataRecord?.[field])
      .filter(scalarImportedValue);
    const numericValues = values
      .map(parseNumericValue)
      .filter((value) => value !== null);
    return {
      kind:
        numericValues.length > 0 &&
        numericValues.length / values.length >= 0.8
          ? "numeric"
          : "categorical",
      values,
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

  function renderDataLegend(field, kind, items) {
    mapDataLegendTitle.textContent = humanizeFieldName(field);
    mapDataLegendType.textContent =
      kind === "numeric" ? "Numeric · equal intervals" : "Categories";
    mapDataLegendItems.replaceChildren();

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
      mapDataLegendItems.append(row);
    });
    mapDataLegend.hidden = false;
  }

  function resetDataVisualization() {
    currentVisualization = null;
    stateMap.classList.remove("has-data-visualization");
    delete stateMap.dataset.visualizationKind;
    districts.forEach((district) => {
      const element = districtElement(district.slug);
      element?.style.removeProperty("--data-fill");
      if (element) delete element.dataset.visualized;
      delete district.visualValue;
      if (element && district.ariaLabel) {
        element.setAttribute("aria-label", district.ariaLabel);
      }
    });
    mapDataLegend.hidden = true;
    mapDataLegendItems.replaceChildren();
    visualizationTypeBadge.textContent = "Auto";
    visualizationTypeBadge.classList.remove("is-active");
  }

  function applyNumericVisualization(field, stats) {
    const uniqueValues = Array.from(new Set(stats.numericValues)).sort(
      (a, b) => a - b,
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

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      const rawValue = district.dataRecord?.[field];
      const numericValue = parseNumericValue(rawValue);
      let color = missingDataColor;
      if (numericValue === null) {
        missingCount += 1;
        district.visualValue = "No value";
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
        district.visualValue = formatImportedValue(rawValue);
      }
      element?.style.setProperty("--data-fill", color);
      if (element) element.dataset.visualized = "true";
    });

    const items = colors.map((color, index) => {
      if (range === 0) {
        return {
          color,
          label: formatLegendNumber(minimum),
          count: counts[index],
        };
      }
      const lower = minimum + (range * index) / bandCount;
      const upper = minimum + (range * (index + 1)) / bandCount;
      return {
        color,
        label: `${formatLegendNumber(lower)} – ${formatLegendNumber(upper)}`,
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
    districts.forEach((district) => {
      const value = district.dataRecord?.[field];
      if (!scalarImportedValue(value)) return;
      const category = String(value).trim();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    const rankedCategories = Array.from(categoryCounts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
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

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      const rawValue = district.dataRecord?.[field];
      let color = missingDataColor;
      if (!scalarImportedValue(rawValue)) {
        missingCount += 1;
        district.visualValue = "No value";
      } else {
        const category = String(rawValue).trim();
        color = colorByCategory.get(category) || otherColor;
        if (!colorByCategory.has(category)) otherCount += 1;
        district.visualValue = category;
      }
      element?.style.setProperty("--data-fill", color);
      if (element) element.dataset.visualized = "true";
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

  function applyDataVisualization(field) {
    resetDataVisualization();
    visualizationField.value = field || "";
    if (!field || !importedDataset) {
      visualizationStatus.textContent = importedDataset
        ? supportsDivisions
          ? "Imported data remains attached; the map is using division colors."
          : "Imported data remains attached; the map is using its base colors."
        : "";
      renderDistrictList(districtSearch.value);
      renderComparisonPanel();
      return;
    }

    const stats = classifyVisualizationField(field);
    const kind = stats.kind;
    const label = humanizeFieldName(field);
    currentVisualization = { field, kind, label };
    stateMap.classList.add("has-data-visualization");
    stateMap.dataset.visualizationKind = kind;
    const legendItems =
      kind === "numeric"
        ? applyNumericVisualization(field, stats)
        : applyCategoricalVisualization(field);

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      if (element) {
        element.setAttribute(
          "aria-label",
          `${district.name} district, ${label}: ${district.visualValue}`,
        );
      }
    });
    renderDataLegend(field, kind, legendItems);
    applyLayerVisibility();
    visualizationTypeBadge.textContent =
      kind === "numeric" ? "Numeric scale" : "Category colors";
    visualizationTypeBadge.classList.add("is-active");
    visualizationStatus.textContent =
      `${label} is now coloring the district map. ` +
      `${
        kind === "numeric"
          ? "Values use equal color intervals."
          : "Each category has a stable color."
      }`;
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    hideTooltip();
  }

  function populateVisualizationFields(preferredFieldOverride) {
    const fields = importedFieldNames();
    visualizationField.replaceChildren();
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No map coloring";
    visualizationField.append(emptyOption);

    fields.forEach((field) => {
      const option = document.createElement("option");
      option.value = field;
      const kind = classifyVisualizationField(field).kind;
      option.textContent =
        `${humanizeFieldName(field)} · ${
          kind === "numeric" ? "numeric" : "category"
        }`;
      visualizationField.append(option);
    });

    dataVisualizationControls.hidden = fields.length === 0;
    if (!fields.length) {
      resetDataVisualization();
      populateDataFilterFields([]);
      dataImportStatus.textContent =
        `Loaded ${importedDataset.fileName}. Add values to a non-identifier ` +
        "field to enable map coloring.";
      return;
    }
    const hasPreferredOverride = arguments.length > 0;
    const preferredField = hasPreferredOverride
      ? fields.includes(preferredFieldOverride)
        ? preferredFieldOverride
        : ""
      : fields.find((field) => field.toLocaleLowerCase() === "value") ||
        fields.find(
          (field) => classifyVisualizationField(field).kind === "numeric",
        ) ||
        fields[0];
    applyDataVisualization(preferredField);
    populateDataFilterFields(fields);
  }

  function clearDataVisualization() {
    applyDataVisualization("");
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

  function updateDataFilterOperatorUI() {
    const isBetween =
      configuredDataFilterKind === "numeric" &&
      dataFilterOperator.value === "between";
    dataFilterSecondaryField.hidden = !isBetween;
    dataFilterValueLabel.textContent = isBetween
      ? "Minimum"
      : configuredDataFilterKind === "numeric"
        ? "Value"
        : "Text or category";
  }

  function configureDataFilterField(resetValues = true) {
    const field = dataFilterField.value;
    if (!field) return;
    const stats = classifyVisualizationField(field);
    configuredDataFilterKind = stats.kind;

    if (stats.kind === "numeric") {
      replaceSelectOptions(dataFilterOperator, [
        { value: "gte", label: "At least (≥)" },
        { value: "gt", label: "Greater than (>)" },
        { value: "lte", label: "At most (≤)" },
        { value: "lt", label: "Less than (<)" },
        { value: "eq", label: "Equal to (=)" },
        { value: "between", label: "Between" },
      ]);
      dataFilterValue.setAttribute("inputmode", "decimal");
      dataFilterValue.removeAttribute("list");
      dataFilterValue.placeholder = "Enter a number";
      dataFilterValueSecondary.placeholder = "Enter a number";
      dataFilterSuggestions.replaceChildren();
    } else {
      replaceSelectOptions(dataFilterOperator, [
        { value: "eq", label: "Is" },
        { value: "neq", label: "Is not" },
        { value: "contains", label: "Contains" },
      ]);
      dataFilterValue.setAttribute("inputmode", "text");
      dataFilterValue.setAttribute("list", "data-filter-suggestions");
      dataFilterValue.placeholder = "Enter or choose a category";
      const suggestions = Array.from(
        new Set(
          districts
            .map((district) => district.dataRecord?.[field])
            .filter(scalarImportedValue)
            .map((value) => String(value).trim()),
        ),
      ).sort((a, b) => a.localeCompare(b));
      dataFilterSuggestions.replaceChildren();
      suggestions.slice(0, 60).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        dataFilterSuggestions.append(option);
      });
    }

    if (resetValues) {
      dataFilterValue.value = "";
      dataFilterValueSecondary.value = "";
    }
    updateDataFilterOperatorUI();
  }

  function dataFilterOperatorLabel(filter) {
    const labels = {
      gte: "≥",
      gt: ">",
      lte: "≤",
      lt: "<",
      eq: filter.kind === "numeric" ? "=" : "is",
      neq: "is not",
      contains: "contains",
      between: "between",
    };
    return labels[filter.operator] || filter.operator;
  }

  function describeDataFilter(filter) {
    const label = humanizeFieldName(filter.field);
    if (filter.operator === "between") {
      return `${label} between ${formatLegendNumber(filter.value)} and ${formatLegendNumber(filter.valueSecondary)}`;
    }
    const value =
      filter.kind === "numeric"
        ? formatLegendNumber(filter.value)
        : `"${filter.value}"`;
    return `${label} ${dataFilterOperatorLabel(filter)} ${value}`;
  }

  function buildDataFilterFromControls() {
    const field = dataFilterField.value;
    const operator = dataFilterOperator.value;
    const kind = configuredDataFilterKind;
    if (!field || !operator || !kind) return null;

    if (kind === "numeric") {
      const value = parseNumericValue(dataFilterValue.value);
      if (value === null) {
        dataFilterStatus.textContent = "Enter a valid numeric value.";
        dataFilterValue.focus();
        return null;
      }
      let valueSecondary = null;
      if (operator === "between") {
        valueSecondary = parseNumericValue(dataFilterValueSecondary.value);
        if (valueSecondary === null) {
          dataFilterStatus.textContent =
            "Enter a valid maximum value for the range.";
          dataFilterValueSecondary.focus();
          return null;
        }
      }
      return {
        field,
        kind,
        operator,
        value:
          operator === "between" ? Math.min(value, valueSecondary) : value,
        valueSecondary:
          operator === "between" ? Math.max(value, valueSecondary) : null,
      };
    }

    const value = dataFilterValue.value.trim();
    if (!value) {
      dataFilterStatus.textContent = "Enter or choose a category value.";
      dataFilterValue.focus();
      return null;
    }
    return { field, kind, operator, value };
  }

  function districtMatchesDataFilter(district, filter = activeDataFilter) {
    if (!filter) return true;
    const rawValue = district.dataRecord?.[filter.field];
    if (!scalarImportedValue(rawValue)) return false;

    if (filter.kind === "numeric") {
      const value = parseNumericValue(rawValue);
      if (value === null) return false;
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

  function syncDataFilterPresentation() {
    const hasFilter = Boolean(activeDataFilter);
    stateMap.classList.toggle("has-data-filter", hasFilter);
    districts.forEach((district) => {
      districtElement(district.slug)?.classList.toggle(
        "is-data-filter-muted",
        hasFilter && !districtMatchesDataFilter(district),
      );
    });

    stateMap.querySelectorAll(".map-label[data-division-slug]").forEach(
      (label) => {
        const district = label.dataset.districtSlug
          ? districts.find(
              (item) => item.slug === label.dataset.districtSlug,
            )
          : null;
        const hasDivisionMatch = districts.some(
          (item) =>
            item.divisionSlug === label.dataset.divisionSlug &&
            districtMatchesDataFilter(item),
        );
        const isMatch = district
          ? districtMatchesDataFilter(district)
          : hasDivisionMatch;
        label.classList.toggle(
          "is-data-filter-muted",
          hasFilter && !isMatch,
        );
      },
    );

    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (
      activeDataFilter &&
      selectedDistrict &&
      !districtMatchesDataFilter(selectedDistrict)
    ) {
      clearDistrict(false);
    }

    applyLayerVisibility();
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    hideTooltip();

    if (activeDataFilter) {
      const matchCount = districts.filter((district) =>
        districtMatchesDataFilter(district),
      ).length;
      dataFilterBadge.textContent = `${matchCount} match`;
      dataFilterBadge.classList.add("is-active");
      dataFilterStatus.textContent =
        `${matchCount} of ${districts.length} districts match · ` +
        describeDataFilter(activeDataFilter);
    }
  }

  function applyDataFilter() {
    const filter = buildDataFilterFromControls();
    if (!filter) return false;
    activeDataFilter = filter;
    clearDataFilterButton.hidden = false;
    syncDataFilterPresentation();
    return true;
  }

  function clearDataFilter(announce = true) {
    activeDataFilter = null;
    stateMap.classList.remove("has-data-filter");
    districts.forEach((district) => {
      districtElement(district.slug)?.classList.remove(
        "is-data-filter-muted",
      );
    });
    stateMap
      .querySelectorAll(".map-label.is-data-filter-muted")
      .forEach((label) => label.classList.remove("is-data-filter-muted"));
    dataFilterBadge.textContent = "No filter";
    dataFilterBadge.classList.remove("is-active");
    clearDataFilterButton.hidden = true;
    dataFilterStatus.textContent = announce
      ? "Filter cleared. All districts are available."
      : "Choose a field and condition.";
    applyLayerVisibility();
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
  }

  function populateDataFilterFields(fields) {
    dataFilterField.replaceChildren();
    fields.forEach((field) => {
      const option = document.createElement("option");
      const kind = classifyVisualizationField(field).kind;
      option.value = field;
      option.textContent =
        `${humanizeFieldName(field)} · ${
          kind === "numeric" ? "numeric" : "category"
        }`;
      dataFilterField.append(option);
    });
    dataFilterControls.hidden = fields.length === 0;
    if (!fields.length) {
      configuredDataFilterKind = null;
      return;
    }
    const preferredField =
      fields.includes(visualizationField.value) && visualizationField.value
        ? visualizationField.value
        : fields[0];
    dataFilterField.value = preferredField;
    configureDataFilterField();
  }

  function renderImportedProfile(district) {
    const record = district?.dataRecord;
    if (!record || !importedDataset) {
      importedProfileData.hidden = true;
      importedProfileFields.replaceChildren();
      return;
    }

    const entries = Object.entries(record)
      .filter(
        ([field, value]) =>
          field !== importedDataset.joinField &&
          contentSettings.popupFields.has(`imported:${field}`) &&
          scalarImportedValue(value),
      )
      .slice(0, 12);
    importedProfileFields.replaceChildren();

    if (!entries.length) {
      importedProfileData.hidden = true;
      return;
    }

    entries.forEach(([field, value]) => {
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = humanizeFieldName(field);
      description.textContent = formatImportedValue(value);
      item.append(term, description);
      importedProfileFields.append(item);
    });

    importedFieldCount.textContent = `${entries.length} ${
      entries.length === 1 ? "field" : "fields"
    }`;
    importedProfileData.hidden = false;
  }

  function applyImportedRecords(records, fileName) {
    const lookup = buildDistrictLookup();
    const join = detectJoinField(records, lookup);
    if (!join) {
      throw new Error(
        "No district identifier, code, slug or name could be matched.",
      );
    }

    storeHistoryCheckpoint("import district data");
    clearDataFilter(false);
    districts.forEach((district) => {
      delete district.dataRecord;
      delete districtElement(district.slug)?.dataset.hasImportedData;
    });

    let matched = 0;
    const unmatched = [];
    records.forEach((record) => {
      const sourceValue = record?.[join.column];
      const district = lookup.get(normalizeJoinValue(sourceValue));
      if (district) {
        district.dataRecord = record;
        districtElement(district.slug).dataset.hasImportedData = "true";
        matched += 1;
      } else {
        unmatched.push(sourceValue);
      }
    });

    importedDataset = {
      fileName,
      joinField: join.column,
      recordCount: records.length,
      matched,
      unmatched,
    };
    stateMap.classList.toggle("has-imported-data", matched > 0);
    dataImportBadge.textContent = `${matched} matched`;
    dataImportBadge.classList.add("has-data");
    dataImportStatus.textContent =
      `Loaded ${fileName}. Imported values are ready for profiles and map colors.`;
    dataImportSummary.hidden = false;
    clearImportedDataButton.hidden = false;
    importRowCount.textContent = records.length;
    importMatchCount.textContent = matched;
    importUnmatchedCount.textContent = unmatched.length;
    importJoinField.textContent = join.column;
    importUnmatchedPreview.textContent = unmatched.length
      ? `Unmatched examples: ${unmatched
          .slice(0, 5)
          .map((value) => value || "(blank)")
          .join(", ")}`
      : "All records matched.";

    resetDataEditorDrafts();
    populateVisualizationFields();
    syncImportedContentDefaults();
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (selectedDistrict) applyContentSettingsToProfile(selectedDistrict);
  }

  function clearImportedData() {
    clearDataFilter(false);
    resetDataVisualization();
    districts.forEach((district) => {
      delete district.dataRecord;
      delete districtElement(district.slug)?.dataset.hasImportedData;
    });
    importedDataset = null;
    resetDataEditorDrafts();
    stateMap.classList.remove("has-imported-data");
    districtDataFile.value = "";
    dataImportBadge.textContent = "No data";
    dataImportBadge.classList.remove("has-data");
    dataImportStatus.textContent =
      "Import is ready. Data remains in this browser tab only.";
    dataImportSummary.hidden = true;
    clearImportedDataButton.hidden = true;
    dataVisualizationControls.hidden = true;
    dataFilterControls.hidden = true;
    visualizationField.replaceChildren();
    dataFilterField.replaceChildren();
    dataFilterOperator.replaceChildren();
    visualizationStatus.textContent = "";
    importUnmatchedPreview.textContent = "";
    syncImportedContentDefaults();
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    const selectedDistrict = districts.find(
      (district) => district.slug === selectedDistrictSlug,
    );
    if (selectedDistrict) {
      applyContentSettingsToProfile(selectedDistrict);
    } else {
      renderImportedProfile(null);
    }
  }

  async function importDistrictData(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      dataImportStatus.textContent = "Please choose a file smaller than 2 MB.";
      districtDataFile.value = "";
      return;
    }

    dataImportStatus.textContent = `Reading ${file.name}…`;
    try {
      const text = await file.text();
      const isJson =
        file.name.toLocaleLowerCase().endsWith(".json") ||
        file.type.includes("json");
      const records = isJson ? parseJsonRecords(text) : parseCsv(text);
      if (!records.length) throw new Error("The file does not contain records.");
      if (records.some((record) => typeof record !== "object" || !record)) {
        throw new Error("Every imported record must be an object or CSV row.");
      }
      applyImportedRecords(records, file.name);
    } catch (error) {
      dataImportStatus.textContent = `Import failed: ${error.message}`;
      districtDataFile.value = "";
      console.error(error);
    }
  }

  function escapeCsvValue(value) {
    const stringValue = String(value ?? "");
    return /[",\n\r]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  }

  function downloadSampleData() {
    const rows = [
      ["district_id", "district_name", "value", "category"],
      ...districts.map((district) => [
        district.featureId,
        district.name,
        "",
        "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.slug}-district-data-template.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function splitLabelLines(label, maximumLength = 16) {
    if (label.length <= maximumLength || !label.includes(" ")) return [label];
    const words = label.split(/\s+/);
    const lines = ["", ""];
    words.forEach((word) => {
      const target = lines[0].length <= lines[1].length ? 0 : 1;
      lines[target] = `${lines[target]} ${word}`.trim();
    });
    return lines.filter(Boolean);
  }

  function appendSvgText(parent, label, x, y, maximumLength) {
    const text = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");

    const lines = splitLabelLines(label, maximumLength);
    lines.forEach((line, index) => {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan",
      );
      tspan.setAttribute("x", x);
      tspan.setAttribute(
        "dy",
        index === 0 ? `${-(lines.length - 1) * 0.52}em` : "1.08em",
      );
      tspan.textContent = line;
      text.append(tspan);
    });
    parent.append(text);
  }

  function createMapLabels() {
    if (!svgRoot || !districts.length) return;
    svgRoot.querySelector("#map-label-layer")?.remove();

    const labelLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    labelLayer.id = "map-label-layer";
    labelLayer.setAttribute("aria-hidden", "true");

    const divisionBounds = new Map();
    districts.forEach((district) => {
      const element = districtElement(district.slug);
      if (!element) return;
      const box = element.getBBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      const districtLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      districtLabel.classList.add("map-label", "district-label");
      if (district.divisionSlug) {
        districtLabel.dataset.divisionSlug = district.divisionSlug;
      }
      districtLabel.dataset.districtSlug = district.slug;
      appendSvgText(districtLabel, district.name, centerX, centerY, 15);
      labelLayer.append(districtLabel);

      const codeLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      codeLabel.classList.add("map-label", "code-label");
      if (district.divisionSlug) {
        codeLabel.dataset.divisionSlug = district.divisionSlug;
      }
      codeLabel.dataset.districtSlug = district.slug;
      const badge = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      badge.setAttribute("cx", centerX);
      badge.setAttribute("cy", centerY);
      badge.setAttribute("r", "13");
      codeLabel.append(badge);
      appendSvgText(codeLabel, district.code || "—", centerX, centerY, 8);
      labelLayer.append(codeLabel);

      if (!supportsDivisions) return;

      const existing = divisionBounds.get(district.divisionSlug);
      if (!existing) {
        divisionBounds.set(district.divisionSlug, {
          name: district.divisionName,
          x: box.x,
          y: box.y,
          right: box.x + box.width,
          bottom: box.y + box.height,
        });
      } else {
        existing.x = Math.min(existing.x, box.x);
        existing.y = Math.min(existing.y, box.y);
        existing.right = Math.max(existing.right, box.x + box.width);
        existing.bottom = Math.max(existing.bottom, box.y + box.height);
      }
    });

    divisionBounds.forEach((bounds, slug) => {
      const divisionLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      divisionLabel.classList.add("map-label", "division-label");
      divisionLabel.dataset.divisionSlug = slug;
      appendSvgText(
        divisionLabel,
        bounds.name,
        bounds.x + (bounds.right - bounds.x) / 2,
        bounds.y + (bounds.bottom - bounds.y) / 2,
        18,
      );
      labelLayer.append(divisionLabel);
    });

    svgRoot.append(labelLayer);
    stateMap.dataset.labelMode = currentLabelMode;
    mapLabelControls.hidden = false;
  }

  function setLabelMode(mode) {
    const allowedModes = new Set(["districts", "codes", "off"]);
    if (supportsDivisions) allowedModes.add("divisions");
    const defaultMode = supportsDivisions ? "divisions" : "districts";
    currentLabelMode = allowedModes.has(mode) ? mode : defaultMode;
    stateMap.dataset.labelMode = currentLabelMode;
    labelModeButtons.forEach((button) => {
      const isActive = button.dataset.labelMode === currentLabelMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function applyLayerVisibility() {
    stateMap.classList.toggle(
      "hide-district-layer",
      !layerVisibility.districts,
    );
    stateMap.classList.toggle(
      "hide-state-outline",
      !layerVisibility.stateOutline,
    );
    stateMap.classList.toggle(
      "hide-division-focus",
      !layerVisibility.divisionFocus,
    );
    stateMap.classList.toggle("hide-map-labels", !layerVisibility.labels);

    const showDataColors = Boolean(
      currentVisualization && layerVisibility.dataColors,
    );
    stateMap.classList.toggle("has-data-visualization", showDataColors);
    mapDataLegend.hidden = !showDataColors;

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      if (!element) return;
      const isDivisionVisible =
        !activeDivisionSlug || district.divisionSlug === activeDivisionSlug;
      const isDataFilterVisible = districtMatchesDataFilter(district);
      element.setAttribute(
        "tabindex",
        layerVisibility.districts &&
          isDivisionVisible &&
          isDataFilterVisible
          ? "0"
          : "-1",
      );
      element.classList.toggle(
        "is-compared",
        comparisonMode &&
          layerVisibility.comparisonMarks &&
          comparedDistrictSlugs.has(district.slug),
      );
    });

    layerToggleInputs.forEach((input) => {
      input.checked = layerVisibility[input.dataset.layerToggle];
    });
    const availableLayers = layerToggleInputs
      .filter((input) => !input.disabled)
      .map((input) => input.dataset.layerToggle);
    const visibleCount = availableLayers.filter(
      (layer) => layerVisibility[layer],
    ).length;
    layerVisibilitySummary.textContent =
      `${visibleCount} of ${availableLayers.length} on`;
  }

  function setLayerVisibility(layer, visible) {
    if (!(layer in layerVisibility)) return;
    layerVisibility[layer] = Boolean(visible);
    applyLayerVisibility();
  }

  function resetLayerVisibility() {
    Object.keys(layerVisibility).forEach((layer) => {
      layerVisibility[layer] = true;
    });
    applyLayerVisibility();
  }

  function updateMapStyleSummary() {
    customizedStyleCount = styleColorInputs.filter(
      (input) => input.dataset.customized === "true",
    ).length;
    mapStyleSummary.textContent = customizedStyleCount
      ? `${customizedStyleCount} custom`
      : "Default";
  }

  function setMapStyleStatus(message) {
    mapStyleStatus.textContent = message;
    if (mapStyleStatusTimer) window.clearTimeout(mapStyleStatusTimer);
    if (!message) return;
    mapStyleStatusTimer = window.setTimeout(() => {
      mapStyleStatus.textContent = "";
    }, 2200);
  }

  function applyMapStyle(input) {
    const property = input.dataset.styleProperty;
    const value = input.value.toLocaleLowerCase();
    const defaultValue = input.defaultValue.toLocaleLowerCase();
    const isOptional = input.dataset.styleOptional === "true";
    const usesDefault = !isOptional && value === defaultValue;
    const output = input.closest(".style-color-row")?.querySelector("output");

    if (usesDefault) {
      document.documentElement.style.removeProperty(property);
      delete input.dataset.customized;
    } else {
      document.documentElement.style.setProperty(property, value);
      input.dataset.customized = "true";
    }
    if (output) output.textContent = value.toLocaleUpperCase();
    updateMapStyleSummary();
    setMapStyleStatus(`${input.dataset.styleName} updated.`);
  }

  function resetMapStyles() {
    styleColorInputs.forEach((input) => {
      document.documentElement.style.removeProperty(
        input.dataset.styleProperty,
      );
      input.value = input.defaultValue;
      delete input.dataset.customized;
      const output = input
        .closest(".style-color-row")
        ?.querySelector("output");
      if (output) {
        output.textContent =
          input.dataset.styleOptional === "true"
            ? "Automatic"
            : input.defaultValue.toLocaleUpperCase();
      }
    });
    updateMapStyleSummary();
    setMapStyleStatus("Default map styles restored.");
  }

  function copyViewBox(viewBox) {
    return {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    };
  }

  function clampViewBox(viewBox) {
    if (!initialViewBox) return viewBox;

    const minimumWidth = initialViewBox.width / 10;
    const minimumHeight = initialViewBox.height / 10;
    const width = Math.min(
      initialViewBox.width,
      Math.max(minimumWidth, viewBox.width),
    );
    const height = Math.min(
      initialViewBox.height,
      Math.max(minimumHeight, viewBox.height),
    );
    const maximumX = initialViewBox.x + initialViewBox.width - width;
    const maximumY = initialViewBox.y + initialViewBox.height - height;

    return {
      x: Math.min(maximumX, Math.max(initialViewBox.x, viewBox.x)),
      y: Math.min(maximumY, Math.max(initialViewBox.y, viewBox.y)),
      width,
      height,
    };
  }

  function applyViewBox(viewBox) {
    if (!svgRoot) return;
    currentViewBox = clampViewBox(viewBox);
    svgRoot.setAttribute(
      "viewBox",
      `${currentViewBox.x} ${currentViewBox.y} ` +
        `${currentViewBox.width} ${currentViewBox.height}`,
    );
    if (initialViewBox) {
      const zoomLevel = initialViewBox.width / currentViewBox.width;
      svgRoot.style.setProperty(
        "--label-counter-scale",
        String(1 / zoomLevel),
      );
    }
  }

  function setMapView(viewBox, animate = true) {
    if (!svgRoot || !currentViewBox) return;
    if (viewAnimationFrame) cancelAnimationFrame(viewAnimationFrame);

    const target = clampViewBox(viewBox);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!animate || reduceMotion) {
      applyViewBox(target);
      return;
    }

    const start = copyViewBox(currentViewBox);
    const startedAt = performance.now();
    const duration = 280;

    function animateView(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyViewBox({
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        width: start.width + (target.width - start.width) * eased,
        height: start.height + (target.height - start.height) * eased,
      });
      if (progress < 1) {
        viewAnimationFrame = requestAnimationFrame(animateView);
      } else {
        viewAnimationFrame = null;
      }
    }

    viewAnimationFrame = requestAnimationFrame(animateView);
  }

  function resetMapView(animate = true) {
    if (!initialViewBox) return;
    setMapView(copyViewBox(initialViewBox), animate);
  }

  function clientToMapPoint(clientX, clientY) {
    const bounds = svgRoot.getBoundingClientRect();
    return {
      x:
        currentViewBox.x +
        ((clientX - bounds.left) / bounds.width) * currentViewBox.width,
      y:
        currentViewBox.y +
        ((clientY - bounds.top) / bounds.height) * currentViewBox.height,
    };
  }

  function zoomMap(multiplier, anchor = null, animate = true) {
    if (!currentViewBox) return;
    const center = anchor || {
      x: currentViewBox.x + currentViewBox.width / 2,
      y: currentViewBox.y + currentViewBox.height / 2,
    };
    const width = currentViewBox.width * multiplier;
    const height = currentViewBox.height * multiplier;
    const widthRatio = width / currentViewBox.width;
    const heightRatio = height / currentViewBox.height;

    setMapView(
      {
        x: center.x - (center.x - currentViewBox.x) * widthRatio,
        y: center.y - (center.y - currentViewBox.y) * heightRatio,
        width,
        height,
      },
      animate,
    );
  }

  function zoomToElements(elements, paddingRatio = 0.2) {
    if (!svgRoot || !elements.length || !initialViewBox) return;

    let bounds = null;
    elements.forEach((element) => {
      const box = element.getBBox();
      if (!bounds) {
        bounds = {
          x: box.x,
          y: box.y,
          right: box.x + box.width,
          bottom: box.y + box.height,
        };
      } else {
        bounds.x = Math.min(bounds.x, box.x);
        bounds.y = Math.min(bounds.y, box.y);
        bounds.right = Math.max(bounds.right, box.x + box.width);
        bounds.bottom = Math.max(bounds.bottom, box.y + box.height);
      }
    });

    if (!bounds) return;
    const boxWidth = Math.max(1, bounds.right - bounds.x);
    const boxHeight = Math.max(1, bounds.bottom - bounds.y);
    let width = boxWidth * (1 + paddingRatio * 2);
    let height = boxHeight * (1 + paddingRatio * 2);
    const aspectRatio = initialViewBox.width / initialViewBox.height;

    if (width / height > aspectRatio) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }

    setMapView({
      x: bounds.x + boxWidth / 2 - width / 2,
      y: bounds.y + boxHeight / 2 - height / 2,
      width,
      height,
    });
  }

  function focusCurrentContext() {
    if (!layerVisibility.districts) {
      resetMapView();
      return;
    }
    if (selectedDistrictSlug) {
      const selected = districtElement(selectedDistrictSlug);
      if (selected) zoomToElements([selected], 0.34);
      return;
    }
    if (activeDivisionSlug) {
      const divisionElements = districts
        .filter(
          (district) => district.divisionSlug === activeDivisionSlug,
        )
        .map((district) => districtElement(district.slug))
        .filter(Boolean);
      zoomToElements(divisionElements, 0.16);
      return;
    }
    resetMapView();
  }

  function endPan(event) {
    if (!panCandidate || !svgRoot) return;
    const completedPan = isPanning;
    if (svgRoot.hasPointerCapture(event.pointerId)) {
      svgRoot.releasePointerCapture(event.pointerId);
    }
    panCandidate = null;
    isPanning = false;
    stateMap.classList.remove("is-panning");
    didPan = completedPan;
    if (completedPan) {
      window.setTimeout(() => {
        didPan = false;
      }, 0);
    }
  }

  function initializeMapNavigation() {
    svgRoot = stateMap.querySelector("svg");
    if (!svgRoot) return;

    const sourceViewBox = svgRoot.viewBox.baseVal;
    initialViewBox = {
      x: sourceViewBox.x,
      y: sourceViewBox.y,
      width: sourceViewBox.width,
      height: sourceViewBox.height,
    };
    currentViewBox = copyViewBox(initialViewBox);

    svgRoot.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const anchor = clientToMapPoint(event.clientX, event.clientY);
        zoomMap(event.deltaY < 0 ? 0.84 : 1.18, anchor, false);
      },
      { passive: false },
    );

    svgRoot.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (viewAnimationFrame) cancelAnimationFrame(viewAnimationFrame);
      panCandidate = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        viewBox: copyViewBox(currentViewBox),
      };
      svgRoot.setPointerCapture(event.pointerId);
    });

    svgRoot.addEventListener("pointermove", (event) => {
      if (!panCandidate || panCandidate.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - panCandidate.clientX;
      const deltaY = event.clientY - panCandidate.clientY;
      if (!isPanning && Math.hypot(deltaX, deltaY) < 4) return;

      isPanning = true;
      stateMap.classList.add("is-panning");
      const bounds = svgRoot.getBoundingClientRect();
      applyViewBox({
        x:
          panCandidate.viewBox.x -
          (deltaX / bounds.width) * panCandidate.viewBox.width,
        y:
          panCandidate.viewBox.y -
          (deltaY / bounds.height) * panCandidate.viewBox.height,
        width: panCandidate.viewBox.width,
        height: panCandidate.viewBox.height,
      });
    });

    svgRoot.addEventListener("pointerup", endPan);
    svgRoot.addEventListener("pointercancel", endPan);
  }

  function updateDistrictUrl(slug) {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("district", slug);
    } else {
      url.searchParams.delete("district");
    }
    window.history.replaceState({}, "", url);
  }

  function updateDivisionUrl(slug) {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("division", slug);
    } else {
      url.searchParams.delete("division");
    }
    window.history.replaceState({}, "", url);
  }

  function updateComparisonUrl() {
    const url = new URL(window.location.href);
    const slugs = Array.from(comparedDistrictSlugs);
    if (comparisonMode && slugs.length) {
      url.searchParams.set("compare", slugs.join(","));
      url.searchParams.delete("district");
    } else {
      url.searchParams.delete("compare");
    }
    window.history.replaceState({}, "", url);
  }

  function setComparisonStatus(message) {
    comparisonStatus.textContent = message;
    if (comparisonStatusTimer) window.clearTimeout(comparisonStatusTimer);
    if (!message) return;
    comparisonStatusTimer = window.setTimeout(() => {
      comparisonStatus.textContent = "";
    }, 2600);
  }

  function comparisonDistricts() {
    return Array.from(comparedDistrictSlugs)
      .map((slug) => districts.find((district) => district.slug === slug))
      .filter(Boolean);
  }

  function appendComparisonMetric(parent, label, value) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "—";
    item.append(term, description);
    parent.append(item);
  }

  function renderComparisonPanel() {
    districtComparison.hidden = !comparisonMode;
    if (!comparisonMode) {
      comparisonList.replaceChildren();
      return;
    }

    const selectedDistricts = comparisonDistricts();
    comparisonHeading.textContent =
      `${selectedDistricts.length} of ${comparisonLimit} selected`;
    clearComparisonButton.hidden = selectedDistricts.length === 0;
    if (selectedDistricts.length === 0) {
      comparisonGuidance.textContent =
        "Select up to four districts from the map or district list.";
    } else if (selectedDistricts.length === 1) {
      comparisonGuidance.textContent =
        "Choose at least one more district to start comparing.";
    } else if (selectedDistricts.length === comparisonLimit) {
      comparisonGuidance.textContent =
        "Four districts selected. Remove one to choose another.";
    } else {
      comparisonGuidance.textContent =
        `Comparing ${selectedDistricts.length} districts. ` +
        `You can add ${comparisonLimit - selectedDistricts.length} more.`;
    }

    const importedFields = currentVisualization
      ? [currentVisualization.field]
      : importedFieldNames().slice(0, 2);
    comparisonList.replaceChildren();
    selectedDistricts.forEach((district, index) => {
      const row = document.createElement("article");
      row.className = "comparison-row";
      if (district.divisionColor) {
        row.style.setProperty("--division-color", district.divisionColor);
      }
      if (district.divisionSlug) {
        row.dataset.divisionSlug = district.divisionSlug;
      }

      const header = document.createElement("div");
      header.className = "comparison-row-header";
      const order = document.createElement("span");
      order.className = "comparison-order";
      order.textContent = index + 1;
      const identity = document.createElement("div");
      identity.className = "comparison-identity";
      const name = document.createElement("strong");
      const division = document.createElement("span");
      name.textContent = district.name;
      division.textContent = districtGroupLabel(district);
      identity.append(name);
      if (division.textContent) identity.append(division);
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "comparison-remove";
      removeButton.textContent = "Remove";
      removeButton.setAttribute(
        "aria-label",
        `Remove ${district.name} from comparison`,
      );
      removeButton.addEventListener("click", () =>
        toggleComparedDistrict(district.slug),
      );
      header.append(order, identity, removeButton);

      const featureId = document.createElement("code");
      featureId.className = "comparison-feature-id";
      featureId.textContent = district.featureId;

      const metrics = document.createElement("dl");
      metrics.className = "comparison-metrics";
      appendComparisonMetric(metrics, "District code", district.code);
      appendComparisonMetric(metrics, "LGD", district.lgdCode);
      importedFields.forEach((field) => {
        appendComparisonMetric(
          metrics,
          humanizeFieldName(field),
          formatImportedValue(district.dataRecord?.[field]),
        );
      });

      row.append(header, featureId, metrics);
      comparisonList.append(row);
    });
  }

  function refreshComparisonPresentation(updateUrl = true) {
    stateMap.classList.toggle("is-comparison-mode", comparisonMode);
    comparisonModeToggle.classList.toggle("is-active", comparisonMode);
    comparisonModeToggle.setAttribute(
      "aria-pressed",
      String(comparisonMode),
    );
    comparisonModeToggle.textContent = comparisonMode
      ? "Exit compare"
      : "Compare districts";

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      const isCompared = comparedDistrictSlugs.has(district.slug);
      element?.classList.toggle(
        "is-compared",
        comparisonMode && layerVisibility.comparisonMarks && isCompared,
      );
      if (!element) return;
      if (comparisonMode) {
        element.setAttribute("aria-pressed", String(isCompared));
      } else {
        element.removeAttribute("aria-pressed");
      }
    });
    renderDistrictList(districtSearch.value);
    renderComparisonPanel();
    if (updateUrl) updateComparisonUrl();
  }

  function setComparisonMode(active, updateUrl = true) {
    comparisonMode = Boolean(active);
    if (comparisonMode) {
      clearDistrict(false);
    } else {
      comparedDistrictSlugs.clear();
      setComparisonStatus("");
    }
    refreshComparisonPresentation(updateUrl);
  }

  function toggleComparedDistrict(slug, updateUrl = true) {
    const district = districts.find((item) => item.slug === slug);
    if (!district) return;
    if (!comparisonMode) setComparisonMode(true, false);

    if (comparedDistrictSlugs.has(slug)) {
      comparedDistrictSlugs.delete(slug);
      setComparisonStatus(`${district.name} removed.`);
    } else if (comparedDistrictSlugs.size >= comparisonLimit) {
      setComparisonStatus(
        `You can compare up to ${comparisonLimit} districts at a time.`,
      );
      return;
    } else {
      comparedDistrictSlugs.add(slug);
      setComparisonStatus(`${district.name} added.`);
    }
    refreshComparisonPresentation(updateUrl);
  }

  function clearComparison(updateUrl = true) {
    comparedDistrictSlugs.clear();
    setComparisonStatus("Comparison cleared.");
    refreshComparisonPresentation(updateUrl);
  }

  function activateDistrict(slug) {
    if (comparisonMode) {
      runHistoryAction("change district comparison", () =>
        toggleComparedDistrict(slug),
      );
    } else {
      executeDistrictAction(slug);
    }
  }

  function selectDistrict(slug, updateUrl = true, adjustView = true) {
    const district = districts.find((item) => item.slug === slug);
    if (!district) return;

    if (selectedDistrictSlug) {
      districtElement(selectedDistrictSlug)?.classList.remove("is-selected");
      listButton(selectedDistrictSlug)?.classList.remove("is-active");
    }

    selectedDistrictSlug = slug;
    districtElement(slug)?.classList.add("is-selected");
    const button = listButton(slug);
    button?.classList.add("is-active");
    button?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    selectedDistrictName.textContent = district.name;
    if (district.divisionColor) {
      districtSelection.style.setProperty(
        "--division-color",
        district.divisionColor,
      );
    } else {
      districtSelection.style.removeProperty("--division-color");
    }
    selectedDistrictMeta.textContent = districtGroupLabel(district)
      ? `${districtGroupLabel(district)} · ${state.name}`
      : state.name;
    selectedDistrictDivisionId.textContent = district.divisionId || "";
    selectedDistrictId.textContent = district.featureId;
    selectedDistrictCode.textContent = district.code || "—";
    selectedDivisionChip.textContent = districtGroupLabel(district);
    selectedBoundaryChip.textContent = formatBoundaryVintage(
      district.boundaryYear,
    );
    selectedDivisionName.textContent = district.divisionName || "";
    selectedCensusCode.textContent = district.code || "Not available";
    selectedLgdCode.textContent = district.lgdCode || "Not available";
    selectedGeometryType.textContent = formatGeometryType(
      district.geometryType,
    );
    openDistrictMapLink.href = districtPageUrl(district);
    applyContentSettingsToProfile(district);
    if (district.divisionSlug) {
      districtSelection.dataset.divisionSlug = district.divisionSlug;
    } else {
      delete districtSelection.dataset.divisionSlug;
    }
    districtSelection.hidden = false;
    districtActionDistrict.value = slug;
    loadDistrictActionForm(slug);
    if (updateUrl) updateDistrictUrl(slug);
    renderBreadcrumb();
    if (adjustView && layerVisibility.districts) {
      const selected = districtElement(slug);
      if (selected) zoomToElements([selected], 0.34);
    }
  }

  function clearDistrict(adjustView = true) {
    if (selectedDistrictSlug) {
      districtElement(selectedDistrictSlug)?.classList.remove("is-selected");
      listButton(selectedDistrictSlug)?.classList.remove("is-active");
    }
    selectedDistrictSlug = null;
    districtSelection.hidden = true;
    districtSelection.style.removeProperty("--division-color");
    delete districtSelection.dataset.divisionSlug;
    profileCopyStatus.textContent = "";
    renderImportedProfile(null);
    hideTooltip();
    updateDistrictUrl(null);
    renderBreadcrumb();
    if (adjustView) focusCurrentContext();
  }

  function renderDistrictList(filter = "") {
    const query = filter.trim().toLocaleLowerCase();
    const contextDistricts = districts.filter((district) => {
      const matchesDivision =
        !activeDivisionSlug || district.divisionSlug === activeDivisionSlug;
      return matchesDivision && districtMatchesDataFilter(district);
    });
    districtCount.textContent = contextDistricts.length;
    const visibleDistricts = contextDistricts.filter((district) => {
      const matchesSearch = districtSearchText(district)
        .toLocaleLowerCase()
        .includes(query);
      return matchesSearch;
    });
    districtList.replaceChildren();

    visibleDistricts.forEach((district) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "state-button district-button";
      button.dataset.slug = district.slug;
      if (district.divisionColor) {
        button.style.setProperty(
          "--division-color",
          district.divisionColor,
        );
      }
      if (district.divisionSlug) {
        button.dataset.divisionSlug = district.divisionSlug;
      }
      button.innerHTML =
        '<span class="district-button-name"></span>' +
        '<span class="district-button-meta">' +
        '<i class="compare-order-badge" hidden></i>' +
        '<i class="map-value-badge" hidden></i>' +
        '<i class="data-presence-badge">Data</i><small></small></span>';
      button.querySelector(".district-button-name").textContent = district.name;
      button.querySelector("small").textContent = district.code || "District";
      const compareOrder =
        Array.from(comparedDistrictSlugs).indexOf(district.slug) + 1;
      const compareOrderBadge = button.querySelector(".compare-order-badge");
      compareOrderBadge.textContent = compareOrder || "";
      compareOrderBadge.toggleAttribute(
        "hidden",
        !comparisonMode || compareOrder === 0,
      );
      const mapValueBadge = button.querySelector(".map-value-badge");
      mapValueBadge.textContent = district.visualValue || "";
      mapValueBadge.toggleAttribute("hidden", !currentVisualization);
      button
        .querySelector(".data-presence-badge")
        .toggleAttribute("hidden", !district.dataRecord);
      button.title = districtGroupLabel(district)
        ? `${district.name} · ${districtGroupLabel(district)}`
        : `${district.name} district`;

      if (district.slug === selectedDistrictSlug) {
        button.classList.add("is-active");
      }
      if (comparisonMode) {
        const isCompared = comparedDistrictSlugs.has(district.slug);
        button.classList.toggle("is-compared", isCompared);
        button.setAttribute("aria-pressed", String(isCompared));
      }

      button.addEventListener("pointerenter", () =>
        setDistrictHover(district.slug, true),
      );
      button.addEventListener("pointerleave", () =>
        setDistrictHover(district.slug, false),
      );
      button.addEventListener("focus", () =>
        setDistrictHover(district.slug, true),
      );
      button.addEventListener("blur", () =>
        setDistrictHover(district.slug, false),
      );
      button.addEventListener("click", () => activateDistrict(district.slug));
      districtList.append(button);
    });

    if (!visibleDistricts.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = activeDataFilter
        ? "No districts match the current data rule."
        : "No matching district.";
      districtList.append(emptyState);
    }
  }

  function renderDivisionFilters() {
    divisionFilters.replaceChildren();
    if (!supportsDivisions) return;

    const divisionMap = new Map();
    districts.forEach((district) => {
      const existing = divisionMap.get(district.divisionSlug);
      if (existing) {
        existing.count += 1;
      } else {
        divisionMap.set(district.divisionSlug, {
          name: district.divisionName,
          slug: district.divisionSlug,
          id: district.divisionId,
          count: 1,
        });
      }
    });

    const divisions = Array.from(divisionMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((division, index) => ({
        ...division,
        color: divisionPalette[index % divisionPalette.length],
      }));
    const colorsBySlug = new Map(
      divisions.map((division) => [division.slug, division.color]),
    );
    districts.forEach((district) => {
      district.divisionColor =
        colorsBySlug.get(district.divisionSlug) || divisionPalette[0];
      districtElement(district.slug)?.style.setProperty(
        "--division-color",
        district.divisionColor,
      );
    });
    stateMap.querySelectorAll(".map-label[data-division-slug]").forEach(
      (label) => {
        const color = colorsBySlug.get(label.dataset.divisionSlug);
        if (color) label.style.setProperty("--division-color", color);
      },
    );
    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "division-toggle is-active";
    allButton.dataset.divisionSlug = "all";
    allButton.setAttribute("aria-pressed", "true");
    allButton.innerHTML =
      `<span class="division-dot all-division-dot"></span>` +
      `<span>All divisions</span><small>${districts.length}</small>`;
    allButton.addEventListener("click", () => setActiveDivision(null));
    divisionFilters.append(allButton);

    divisions.forEach((division) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "division-toggle";
      button.dataset.divisionSlug = division.slug;
      button.title = division.id;
      button.style.setProperty("--division-color", division.color);
      button.setAttribute("aria-pressed", "false");
      button.innerHTML =
        `<span class="division-dot"></span><span></span><small></small>`;
      button.querySelector("span:nth-child(2)").textContent = division.name;
      button.querySelector("small").textContent = division.count;
      button.addEventListener("click", () => {
        runHistoryAction(
          "change division highlight",
          () =>
            setActiveDivision(
              activeDivisionSlug === division.slug ? null : division.slug,
            ),
        );
      });
      divisionFilters.append(button);
    });
  }

  function setActiveDivision(slug, updateUrl = true) {
    if (!supportsDivisions) {
      activeDivisionSlug = null;
      stateMap.classList.remove("has-active-division");
      districts.forEach((district) => {
        const element = districtElement(district.slug);
        element?.classList.remove(
          "is-division-active",
          "is-division-muted",
        );
      });
      districtCount.textContent = districts.length;
      districtMapStatus.lastChild.textContent =
        ` ${interactiveDistrictCountLabel(districts.length)}`;
      applyLayerVisibility();
      renderDistrictList(districtSearch.value);
      hideTooltip();
      if (updateUrl) updateDivisionUrl(null);
      renderBreadcrumb();
      if (layerVisibility.districts) resetMapView();
      return;
    }

    const division = districts.find(
      (district) => district.divisionSlug === slug,
    );
    activeDivisionSlug = division ? slug : null;

    if (
      selectedDistrictSlug &&
      activeDivisionSlug &&
      districts.find((district) => district.slug === selectedDistrictSlug)
        ?.divisionSlug !== activeDivisionSlug
    ) {
      clearDistrict(false);
    }

    stateMap.classList.toggle(
      "has-active-division",
      Boolean(activeDivisionSlug),
    );

    districts.forEach((district) => {
      const element = districtElement(district.slug);
      const isMatch =
        !activeDivisionSlug || district.divisionSlug === activeDivisionSlug;
      element?.classList.toggle(
        "is-division-active",
        Boolean(activeDivisionSlug && isMatch),
      );
      element?.classList.toggle(
        "is-division-muted",
        Boolean(activeDivisionSlug && !isMatch),
      );
      element?.setAttribute("tabindex", isMatch ? "0" : "-1");
    });
    stateMap.querySelectorAll(".map-label[data-division-slug]").forEach(
      (label) => {
        label.classList.toggle(
          "is-label-muted",
          Boolean(
            activeDivisionSlug &&
              label.dataset.divisionSlug !== activeDivisionSlug,
          ),
        );
      },
    );

    divisionFilters.querySelectorAll(".division-toggle").forEach((button) => {
      const isActive =
        activeDivisionSlug === null
          ? button.dataset.divisionSlug === "all"
          : button.dataset.divisionSlug === activeDivisionSlug;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const activeDistricts = activeDivisionSlug
      ? districts.filter(
          (district) => district.divisionSlug === activeDivisionSlug,
        )
      : districts;
    const activeDivision = activeDistricts[0];
    const totalDivisions = new Set(
      districts.map((district) => district.divisionSlug),
    ).size;
    districtCount.textContent = activeDistricts.length;
    divisionFilterSummary.textContent = activeDivisionSlug
      ? `${activeDivision.divisionName} Division · ${activeDistricts.length} districts`
      : "Showing all divisions";
    districtMapStatus.lastChild.textContent = activeDivisionSlug
      ? ` Highlighting ${activeDivision.divisionName} Division`
      : ` ${districts.length} districts across ${totalDivisions} divisions`;

    applyLayerVisibility();
    renderDistrictList(districtSearch.value);
    hideTooltip();
    if (updateUrl) updateDivisionUrl(activeDivisionSlug);
    renderBreadcrumb();
    if (activeDivisionSlug && layerVisibility.districts) {
      const activeElements = activeDistricts
        .map((district) => districtElement(district.slug))
        .filter(Boolean);
      zoomToElements(activeElements, 0.16);
    } else {
      resetMapView();
    }
  }

  function wireDistricts() {
    const regionElements = Array.from(
      stateMap.querySelectorAll(".district-region"),
    );
    districts = regionElements
      .map((element) => ({
        name: element.dataset.district,
        slug: element.dataset.slug,
        code: element.dataset.code,
        featureId: element.dataset.featureId,
        divisionName: element.dataset.division || "",
        divisionSlug: element.dataset.divisionSlug || "",
        divisionId: element.dataset.divisionId || "",
        lgdCode: element.dataset.lgdCode,
        boundaryYear: element.dataset.boundaryYear,
        geometryType: element.dataset.geometryType,
        ariaLabel:
          element.getAttribute("aria-label") ||
          `${element.dataset.district} district`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!districts.length) {
      divisionLayerStatus.textContent = "Ready to populate";
      districtLayerStatus.textContent = "Ready to populate";
      districtMapStatus.lastChild.textContent = " District layer is ready";
      districtUnavailable.hidden = false;
      return;
    }

    configureDivisionSupport();
    stateMap.classList.add("has-districts");
    districtControls.hidden = false;
    dataImportPanel.hidden = false;
    mapLayerManager.hidden = false;
    mapStyleEditor.hidden = false;
    const divisions = new Set(
      districts
        .map((district) => district.divisionName)
        .filter(Boolean),
    );
    divisionLayerStatus.textContent = supportsDivisions
      ? `${divisions.size} administrative divisions`
      : "Not used for this district layer";
    districtLayerStatus.textContent = interactiveDistrictCountLabel(
      districts.length,
    );
    districtMapStatus.lastChild.textContent = supportsDivisions
      ? ` ${districts.length} districts across ${divisions.size} divisions`
      : ` ${interactiveDistrictCountLabel(districts.length)}`;
    districtCount.textContent = districts.length;
    createMapLabels();
    setLabelMode(currentLabelMode);
    renderDivisionFilters();
    renderDistrictList();
    renderContentFieldOptions();
    refreshProjectStorageUI();
    initializeEmbedCodeBuilder();
    initializeDistrictActionBuilder();
    applyLayerVisibility();

    regionElements.forEach((element) => {
      const district = districts.find(
        (item) => item.slug === element.dataset.slug,
      );
      if (!district) return;

      element.addEventListener("pointerenter", (event) => {
        setDistrictHover(district.slug, true);
        showTooltip(district, event.clientX, event.clientY);
      });
      element.addEventListener("pointermove", (event) => {
        showTooltip(district, event.clientX, event.clientY);
      });
      element.addEventListener("pointerleave", () => {
        setDistrictHover(district.slug, false);
        hideTooltip();
      });
      element.addEventListener("focus", () =>
        setDistrictHover(district.slug, true),
      );
      element.addEventListener("blur", () =>
        setDistrictHover(district.slug, false),
      );
      element.addEventListener("click", () => {
        if (!didPan) activateDistrict(district.slug);
      });
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateDistrict(district.slug);
        }
      });
    });

    const requestedDivision = params.get("division");
    const requestedDistrict = params.get("district");
    const requestedComparison = (params.get("compare") || "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(
        (slug, index, values) =>
          slug &&
          values.indexOf(slug) === index &&
          districts.some((district) => district.slug === slug),
      )
      .slice(0, comparisonLimit);
    if (supportsDivisions && requestedDivision) {
      setActiveDivision(requestedDivision, false);
    }

    if (requestedComparison.length) {
      setComparisonMode(true, false);
      requestedComparison.forEach((slug) => {
        comparedDistrictSlugs.add(slug);
      });
      refreshComparisonPresentation(false);
    } else if (requestedDistrict) {
      const requestedDistrictData = districts.find(
        (district) => district.slug === requestedDistrict,
      );
      if (
        requestedDistrictData &&
        activeDivisionSlug &&
        requestedDistrictData.divisionSlug !== activeDivisionSlug
      ) {
        setActiveDivision(requestedDistrictData.divisionSlug, false);
      }
      selectDistrict(requestedDistrict, false);
    }
    historyReady = true;
    updateHistoryControls();
  }

  fetch(state.svg)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`State SVG request failed: ${response.status}`);
      }
      return response.text();
    })
    .then((svg) => {
      stateMap.innerHTML = svg;
      const svgRoot = stateMap.querySelector("svg");
      if (svgRoot?.querySelector('[tabindex], [role="link"], [role="button"]')) {
        svgRoot.setAttribute("role", "group");
      }
      initializeMapNavigation();
      wireDistricts();
    })
    .catch((error) => {
      stateMap.innerHTML =
        '<p class="load-error">The state SVG could not load. Run this project through a local web server.</p>';
      console.error(error);
    });

  districtSearch.addEventListener("input", (event) => {
    renderDistrictList(event.target.value);
  });
  comparisonModeToggle.addEventListener("click", () => {
    runHistoryAction("toggle comparison mode", () =>
      setComparisonMode(!comparisonMode),
    );
  });
  clearComparisonButton.addEventListener("click", () =>
    runHistoryAction("clear district comparison", () => clearComparison()),
  );
  undoChangeButton.addEventListener("click", undoEditorChange);
  redoChangeButton.addEventListener("click", redoEditorChange);
  saveProjectButton.addEventListener("click", saveProjectSnapshot);
  restoreProjectButton.addEventListener(
    "click",
    restoreSavedProjectWithHistory,
  );
  deleteProjectButton.addEventListener("click", deleteProjectSnapshot);
  exportProjectButton.addEventListener("click", exportProjectFile);
  exportStandaloneMapButton.addEventListener("click", exportStandaloneMap);
  embedFormatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      embedFormat =
        button.dataset.embedFormat === "javascript"
          ? "javascript"
          : "iframe";
      refreshEmbedCode();
    });
  });
  embedMapUrl.addEventListener("input", () => {
    embedUrlCustomized =
      embedMapUrl.value.trim() !== defaultEmbedMapUrl();
    refreshEmbedCode();
  });
  embedMapHeight.addEventListener("input", refreshEmbedCode);
  embedMapHeight.addEventListener("change", () => {
    embedMapHeight.value = normalizedEmbedHeight();
    refreshEmbedCode();
  });
  projectNameInput.addEventListener("input", syncDefaultEmbedMapUrl);
  copyEmbedCodeButton.addEventListener("click", copyEmbedCode);
  exportMapSvgButton.addEventListener("click", exportMapSvg);
  exportMapPngButton.addEventListener("click", exportMapPng);
  [visualExportScope, visualExportBackground, visualExportScale].forEach(
    (control) => {
      control.addEventListener("change", () => {
        setVisualExportStatus("");
      });
    },
  );
  importProjectFileInput.addEventListener("change", () => {
    importProjectFile(importProjectFileInput.files?.[0]);
  });
  clearDistrictButton.addEventListener("click", clearDistrict);
  copyDistrictIdButton.addEventListener("click", () => {
    const district = districts.find(
      (item) => item.slug === selectedDistrictSlug,
    );
    copyText(district?.featureId, "District identifier copied.");
  });
  copyDistrictLinkButton.addEventListener("click", () => {
    copyText(window.location.href, "Direct district link copied.");
  });
  districtDataFile.addEventListener("change", () => {
    importDistrictData(districtDataFile.files?.[0]);
  });
  downloadSampleDataButton.addEventListener("click", downloadSampleData);
  clearImportedDataButton.addEventListener("click", () =>
    runHistoryAction("clear imported data", clearImportedData),
  );
  dataEditorField.addEventListener("change", () => {
    renderDataEditorRows();
    dataEditorStatus.textContent =
      `Editing ${humanizeFieldName(dataEditorField.value)}.`;
  });
  dataEditorSearch.addEventListener("input", () => renderDataEditorRows());
  dataEditorAddFieldButton.addEventListener("click", addDataEditorField);
  dataEditorNewField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addDataEditorField();
    }
  });
  dataEditorApplyButton.addEventListener("click", applyDataEditorEdits);
  dataEditorDiscardButton.addEventListener(
    "click",
    discardDataEditorDrafts,
  );
  applyContentSettingsButton.addEventListener(
    "click",
    () =>
      runHistoryAction(
        "update tooltip and popup",
        applyContentBuilderSettings,
      ),
  );
  resetContentSettingsButton.addEventListener(
    "click",
    () =>
      runHistoryAction(
        "reset tooltip and popup",
        resetContentBuilderSettings,
      ),
  );
  districtActionDistrict.addEventListener("change", () =>
    loadDistrictActionForm(districtActionDistrict.value),
  );
  districtActionType.addEventListener("change", updateDistrictActionFields);
  saveDistrictActionButton.addEventListener("click", saveDistrictAction);
  resetDistrictActionButton.addEventListener("click", resetDistrictAction);
  visualizationField.addEventListener("change", () => {
    runHistoryAction("change data visualization", () =>
      applyDataVisualization(visualizationField.value),
    );
  });
  clearDataVisualizationButton.addEventListener(
    "click",
    () =>
      runHistoryAction(
        "clear data visualization",
        clearDataVisualization,
      ),
  );
  dataFilterField.addEventListener("change", () => {
    configureDataFilterField();
    dataFilterStatus.textContent = activeDataFilter
      ? "Rule changed. Apply to update the active filter."
      : "Choose a condition and value, then apply the filter.";
  });
  dataFilterOperator.addEventListener("change", updateDataFilterOperatorUI);
  applyDataFilterButton.addEventListener("click", () =>
    runHistoryAction("apply data filter", applyDataFilter),
  );
  clearDataFilterButton.addEventListener("click", () =>
    runHistoryAction("clear data filter", () => clearDataFilter(true)),
  );
  [dataFilterValue, dataFilterValueSecondary].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runHistoryAction("apply data filter", applyDataFilter);
      }
    });
  });
  layerToggleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      runHistoryAction("change layer visibility", () =>
        setLayerVisibility(input.dataset.layerToggle, input.checked),
      );
    });
  });
  resetLayerVisibilityButton.addEventListener("click", () =>
    runHistoryAction("reset layer visibility", resetLayerVisibility),
  );
  styleColorInputs.forEach((input) => {
    input.addEventListener("pointerdown", () => beginStyleHistory(input));
    input.addEventListener("focus", () => beginStyleHistory(input));
    input.addEventListener("input", () => applyMapStyle(input));
    input.addEventListener("change", () => commitStyleHistory(input));
  });
  resetMapStylesButton.addEventListener("click", () => {
    pendingStyleHistory = null;
    runHistoryAction("reset map styles", resetMapStyles);
  });
  mapLayerManager.addEventListener("toggle", () => {
    if (mapLayerManager.open) mapStyleEditor.open = false;
  });
  mapStyleEditor.addEventListener("toggle", () => {
    if (mapStyleEditor.open) mapLayerManager.open = false;
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditing =
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") ||
        target.isContentEditable);
    const usesHistoryModifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLocaleLowerCase();
    if (usesHistoryModifier && !event.altKey && !isEditing) {
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoEditorChange();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undoEditorChange();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        redoEditorChange();
        return;
      }
    }
    if (event.key === "Escape") {
      mapLayerManager.open = false;
      mapStyleEditor.open = false;
    }
  });
  zoomInButton.addEventListener("click", () => zoomMap(0.78));
  zoomOutButton.addEventListener("click", () => zoomMap(1.28));
  resetViewButton.addEventListener("click", () => resetMapView());
  labelModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.labelMode === currentLabelMode) return;
      runHistoryAction("change map labels", () =>
        setLabelMode(button.dataset.labelMode),
      );
    });
  });
})();
