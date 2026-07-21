(function initializeStandaloneMapExporter(global) {
  "use strict";

  const standaloneStyles = `
:root {
  color-scheme: light;
  --page: #f3f0e8;
  --surface: #fffdf8;
  --surface-soft: #f8f5ed;
  --ink: #10231f;
  --muted: #62706b;
  --line: #d9ddd7;
  --focus: #d7653b;
  --map-fill: #dce9df;
  --map-stroke: #607b70;
  --hover: #f2a65a;
  --outline-color: #d7653b;
  --label-color: #10231f;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at 10% 0%, rgba(215, 101, 59, 0.1), transparent 26rem),
    var(--page);
}

button,
input,
select {
  font: inherit;
}

button,
select {
  cursor: pointer;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
.district-region:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--focus) 40%, transparent);
  outline-offset: 2px;
}

.skip-link {
  position: fixed;
  z-index: 20;
  top: 8px;
  left: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--surface);
  background: var(--ink);
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: none;
}

.export-header,
.export-main {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding-right: 28px;
  padding-left: 28px;
}

.export-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 18px;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--focus);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2rem, 5vw, 4.4rem);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.95;
}

.map-identity {
  max-width: 30rem;
  margin: 0;
  color: var(--muted);
  text-align: right;
}

.export-controls {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) auto;
  align-items: end;
  gap: 10px;
  margin-bottom: 12px;
}

.export-controls.no-group-filter {
  grid-template-columns: minmax(180px, 1fr) auto;
}

.control-field {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 750;
}

.control-field input,
.control-field select {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: var(--surface);
}

.zoom-controls {
  display: flex;
  gap: 6px;
}

.zoom-controls button {
  min-width: 42px;
  min-height: 42px;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: var(--surface);
  font-weight: 800;
}

.zoom-controls button:last-child {
  min-width: 58px;
}

.export-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.72fr);
  align-items: start;
  gap: 14px;
}

.map-panel,
.profile-panel,
.district-list-panel {
  border: 1px solid rgba(16, 35, 31, 0.11);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 18px 48px rgba(16, 35, 31, 0.07);
}

.map-panel {
  position: relative;
  min-height: 680px;
  overflow: hidden;
}

.portable-map {
  display: grid;
  width: 100%;
  min-height: 680px;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(rgba(96, 123, 112, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 123, 112, 0.055) 1px, transparent 1px),
    var(--surface-soft);
  background-size: 32px 32px;
}

.portable-map svg {
  width: 100%;
  height: 680px;
  max-width: 100%;
  touch-action: none;
  user-select: none;
}

.portable-map #state-outline path {
  fill: none;
  fill-rule: evenodd;
  stroke: var(--outline-color);
  stroke-linejoin: round;
  stroke-width: 3;
  pointer-events: none;
}

.portable-map.hide-state-outline #state-outline,
.portable-map.hide-labels #map-label-layer,
.portable-map.hide-districts #district-layer {
  display: none;
}

.district-region {
  cursor: pointer;
  outline: none;
}

.district-region path {
  fill: var(--map-fill);
  fill-rule: evenodd;
  stroke: var(--map-stroke);
  stroke-linejoin: round;
  stroke-width: 1.1;
  transition: fill 140ms ease, opacity 140ms ease, filter 140ms ease;
}

.portable-map.has-data-colors
  .district-region[data-visualized="true"]
  path {
  fill: var(--data-fill);
}

.district-region.is-division-active path {
  stroke: var(--division-color, var(--map-stroke));
  stroke-width: 1.45;
}

.district-region.is-division-muted,
.district-region.is-filter-muted {
  pointer-events: none;
}

.district-region.is-division-muted path,
.district-region.is-filter-muted path {
  fill: #e7e8e3 !important;
  stroke: #c2c7c1;
  opacity: 0.18;
  filter: none;
}

.portable-map.hide-division-focus .district-region.is-division-muted path {
  opacity: 0.38;
}

.district-region:hover path,
.district-region:focus path {
  fill: var(--hover) !important;
  opacity: 1;
  filter: drop-shadow(0 4px 4px rgba(59, 52, 25, 0.18));
}

.district-region.is-selected path {
  fill: var(
    --selected-fill,
    var(--data-fill, var(--division-color, var(--focus)))
  ) !important;
  stroke: var(--surface);
  stroke-width: 2.8;
  opacity: 1;
  paint-order: stroke fill;
  filter:
    drop-shadow(0 0 1.5px rgba(16, 35, 31, 0.3))
    drop-shadow(0 5px 6px rgba(16, 35, 31, 0.2));
}

.district-region.is-compared path {
  stroke: var(--ink);
  stroke-dasharray: 5 2;
  stroke-width: 2.5;
  paint-order: stroke fill;
}

.map-label {
  display: none;
  opacity: 1;
  pointer-events: none;
}

.portable-map[data-label-mode="divisions"] .division-label,
.portable-map[data-label-mode="districts"] .district-label,
.portable-map[data-label-mode="codes"] .code-label {
  display: block;
}

.map-label.is-label-muted {
  opacity: 0.08;
}

.district-label text,
.division-label text {
  fill: var(--label-color);
  stroke: var(--surface);
  stroke-linejoin: round;
  paint-order: stroke fill;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.district-label text {
  stroke-width: 3.5px;
  font-size: 12px;
  font-weight: 750;
}

.division-label text {
  stroke-width: 5px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 19px;
  font-weight: 700;
}

.code-label circle {
  fill: rgba(255, 253, 247, 0.95);
  stroke: var(--division-color, var(--focus));
  stroke-width: 1.5px;
}

.code-label text {
  fill: var(--label-color);
  font-family: Consolas, "Liberation Mono", monospace;
  font-size: 9px;
  font-weight: 800;
}

.map-legend {
  position: absolute;
  z-index: 3;
  right: 14px;
  bottom: 14px;
  width: min(240px, calc(100% - 28px));
  padding: 11px;
  border: 1px solid rgba(16, 35, 31, 0.12);
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.94);
  backdrop-filter: blur(8px);
}

.map-legend[hidden] {
  display: none;
}

.map-legend header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.map-legend header span {
  color: var(--muted);
  font-size: 0.68rem;
}

.legend-items {
  display: grid;
  gap: 5px;
}

.legend-row {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(16, 35, 31, 0.13);
  border-radius: 3px;
  background: var(--swatch);
}

.legend-row small {
  color: var(--muted);
}

.export-sidebar {
  display: grid;
  gap: 14px;
}

.profile-panel,
.district-list-panel {
  padding: 18px;
}

.profile-panel h2 {
  margin-bottom: 4px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.75rem;
  font-weight: 500;
}

.profile-meta,
.profile-empty,
.custom-copy,
.export-footer,
.list-status {
  color: var(--muted);
}

.profile-empty {
  margin: 14px 0 0;
  line-height: 1.55;
}

.profile-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0 0;
}

.profile-fields div {
  min-width: 0;
  padding: 9px;
  border-radius: 10px;
  background: var(--surface-soft);
}

.profile-fields dt {
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.profile-fields dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.84rem;
}

.custom-content {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.custom-content[hidden],
.custom-content img[hidden],
.custom-content a[hidden],
.custom-content p[hidden] {
  display: none;
}

.custom-content img {
  width: 100%;
  max-height: 220px;
  border-radius: 12px;
  object-fit: cover;
}

.custom-content a {
  width: fit-content;
  color: var(--focus);
  font-weight: 750;
}

.district-list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.district-list-heading h2,
.district-list-heading p {
  margin: 0;
}

.district-list-heading h2 {
  font-size: 1rem;
}

.district-list {
  display: grid;
  max-height: 430px;
  gap: 6px;
  overflow-y: auto;
}

.district-button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3px 9px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: var(--surface);
  text-align: left;
}

.district-button:hover,
.district-button.is-selected {
  border-color: var(--division-color, var(--focus));
  background: color-mix(
    in srgb,
    var(--division-color, var(--focus)) 9%,
    var(--surface)
  );
}

.district-button small {
  color: var(--muted);
}

.district-button .district-value {
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
  color: var(--muted);
  font-size: 0.7rem;
}

.map-tooltip {
  position: fixed;
  z-index: 30;
  max-width: min(280px, calc(100vw - 24px));
  padding: 9px 11px;
  border-radius: 9px;
  color: var(--surface);
  background: rgba(16, 35, 31, 0.94);
  box-shadow: 0 10px 28px rgba(16, 35, 31, 0.2);
  pointer-events: none;
}

.map-tooltip[hidden] {
  display: none;
}

.map-tooltip strong,
.map-tooltip span {
  display: block;
}

.map-tooltip span {
  margin-top: 3px;
  color: rgba(255, 253, 248, 0.76);
  font-size: 0.72rem;
}

.export-footer {
  padding: 18px 0 28px;
  font-size: 0.72rem;
  text-align: center;
}

@media (max-width: 920px) {
  .export-layout {
    grid-template-columns: 1fr;
  }

  .map-panel,
  .portable-map {
    min-height: 560px;
  }

  .portable-map svg {
    height: 560px;
  }

  .district-list {
    max-height: none;
  }
}

@media (max-width: 620px) {
  .export-header,
  .export-main {
    padding-right: 14px;
    padding-left: 14px;
  }

  .export-header {
    align-items: start;
    flex-direction: column;
  }

  .map-identity {
    text-align: left;
  }

  .export-controls {
    grid-template-columns: 1fr;
  }

  .zoom-controls {
    justify-content: stretch;
  }

  .zoom-controls button {
    flex: 1;
  }

  .map-panel,
  .portable-map {
    min-height: 480px;
  }

  .portable-map svg {
    height: 480px;
  }

  .profile-fields {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
`;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function safeJson(value) {
    return JSON.stringify(value)
      .replaceAll("<", "\\u003c")
      .replaceAll("\u2028", "\\u2028")
      .replaceAll("\u2029", "\\u2029");
  }

  function standaloneMapRuntime(config) {
    "use strict";

    const map = document.querySelector("#portable-map");
    const svg = map.querySelector("svg");
    const search = document.querySelector("#district-search");
    const division = document.querySelector("#division-filter");
    const districtList = document.querySelector("#district-list");
    const listStatus = document.querySelector("#list-status");
    const tooltip = document.querySelector("#map-tooltip");
    const tooltipName = document.querySelector("#tooltip-name");
    const tooltipMeta = document.querySelector("#tooltip-meta");
    const profileName = document.querySelector("#profile-name");
    const profileMeta = document.querySelector("#profile-meta");
    const profileEmpty = document.querySelector("#profile-empty");
    const profileFields = document.querySelector("#profile-fields");
    const customContent = document.querySelector("#custom-content");
    const customText = document.querySelector("#custom-text");
    const customLink = document.querySelector("#custom-link");
    const customImage = document.querySelector("#custom-image");
    const legend = document.querySelector("#map-legend");
    const legendTitle = document.querySelector("#legend-title");
    const legendType = document.querySelector("#legend-type");
    const legendItems = document.querySelector("#legend-items");
    const zoomIn = document.querySelector("#zoom-in");
    const zoomOut = document.querySelector("#zoom-out");
    const fitMap = document.querySelector("#fit-map");
    const districts = Array.isArray(config.districts) ? config.districts : [];
    const terminology = config.terminology || {};
    const entitySingular = terminology.entitySingular || "district";
    const entityPlural = terminology.entityPlural || "districts";
    const groupLabel = terminology.groupLabel || "Division";
    const groupSuffix =
      terminology.groupSuffix === undefined
        ? " Division"
        : terminology.groupSuffix;
    const supportsGroups =
      config.map?.groupFilter !== false &&
      districts.some(
        (district) => district.divisionSlug && district.divisionName,
      );
    const parentName = terminology.parentName || config.state.name;
    const entityIdLabel = terminology.entityIdLabel || "District ID";
    const groupIdLabel = terminology.groupIdLabel || "Division ID";
    const entityTemplateKey =
      terminology.entityTemplateKey || "district";
    const districtBySlug = new Map(
      districts.map((district) => [district.slug, district]),
    );
    const regionBySlug = new Map(
      Array.from(svg.querySelectorAll(".district-region")).map((region) => [
        region.dataset.slug,
        region,
      ]),
    );
    const initialViewBox = (() => {
      const values = (svg.getAttribute("viewBox") || "0 0 1000 1000")
        .trim()
        .split(/\s+/)
        .map(Number);
      return {
        x: values[0] || 0,
        y: values[1] || 0,
        width: values[2] || 1000,
        height: values[3] || 1000,
      };
    })();
    const savedViewBox = config.map?.viewBox;
    let currentViewBox =
      savedViewBox &&
      ["x", "y", "width", "height"].every((key) =>
        Number.isFinite(Number(savedViewBox[key])),
      )
        ? {
            x: Number(savedViewBox.x),
            y: Number(savedViewBox.y),
            width: Number(savedViewBox.width),
            height: Number(savedViewBox.height),
          }
        : { ...initialViewBox };
    let activeDivision = config.map?.activeDivisionSlug || "";
    let selectedSlug = "";
    let pointerStart = null;
    let didPan = false;

    function groupText(district) {
      if (!supportsGroups) return "";
      return `${district.divisionName || ""}${groupSuffix}`.trim();
    }

    Object.entries(config.map?.styles || {}).forEach(([property, value]) => {
      if (typeof value === "string" && value.trim()) {
        document.documentElement.style.setProperty(property, value);
      }
    });
    const requestedLabelMode = config.map?.labelMode;
    map.dataset.labelMode =
      !supportsGroups && requestedLabelMode === "divisions"
        ? "districts"
        : requestedLabelMode || (supportsGroups ? "divisions" : "districts");
    map.classList.toggle("hide-labels", config.map?.layers?.labels === false);
    map.classList.toggle(
      "hide-state-outline",
      config.map?.layers?.stateOutline === false,
    );
    map.classList.toggle(
      "hide-districts",
      config.map?.layers?.districts === false,
    );
    map.classList.toggle(
      "hide-division-focus",
      config.map?.layers?.divisionFocus === false,
    );
    map.classList.toggle(
      "has-data-colors",
      Boolean(config.map?.visualization && config.map?.layers?.dataColors),
    );

    function formatBoundary(value) {
      const text = String(value || "").replaceAll("_", " ").trim();
      return text ? text.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
    }

    function parseConfiguredNumber(value) {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
      }
      const normalized = String(value || "")
        .trim()
        .replace(/[,\s]/g, "")
        .replace(/^[\u20B9$\u20AC\u00A3]/, "")
        .replace(/%$/, "");
      if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
      const number = Number(normalized);
      return Number.isFinite(number) ? number : null;
    }

    function parseConfiguredDate(value) {
      const candidate = String(value || "").trim();
      const match =
        candidate.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/) ||
        candidate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (!match) return null;
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

    function formatValue(value, field = "") {
      if (value === null || value === undefined || value === "") return "—";
      const type = config.content?.fieldSettings?.[field]?.type || "auto";
      if (type === "date") {
        const timestamp = parseConfiguredDate(value);
        return timestamp === null
          ? String(value)
          : new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(timestamp));
      }
      if (["number", "percentage", "currency"].includes(type)) {
        const number = parseConfiguredNumber(value);
        if (number === null) return String(value);
        if (type === "percentage") {
          return `${new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 3,
          }).format(number)}%`;
        }
        if (type === "currency") {
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
          }).format(number);
        }
        return new Intl.NumberFormat("en-IN", {
          maximumFractionDigits: 3,
        }).format(number);
      }
      return typeof value === "number"
        ? new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 3,
          }).format(value)
        : String(value);
    }

    function templateValues(district) {
      const values = {
        district: district.name,
        division: district.divisionName || "",
        slug: district.slug,
        code: district.code || "",
        census_code: district.code || "",
        lgd_code: district.lgdCode || "",
        district_id: district.featureId || "",
        division_id: district.divisionId || "",
        feature_id: district.featureId || "",
        identifier: district.featureId || "",
        source_id: district.sourceId || "",
        source_code: district.sourceId || "",
        state: config.context?.state || config.state.name || "",
        state_slug: config.context?.stateSlug || config.state.slug || "",
        district_slug: config.context?.districtSlug || district.slug,
        tehsil: config.context?.tehsil || "",
        tehsil_slug: config.context?.tehsilSlug || "",
      };
      values[entityTemplateKey] = district.name;
      if (entityTemplateKey !== "district" && config.context?.district) {
        values.district = config.context.district;
      }
      Object.entries(district.data || {}).forEach(([field, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          typeof value !== "object"
        ) {
          values[field.toLocaleLowerCase()] = String(value);
        }
      });
      return values;
    }

    function applyTemplate(template, district) {
      const values = templateValues(district);
      return String(template || "").replace(/\{([^{}]+)\}/g, (_, key) => {
        const normalized = key.trim().toLocaleLowerCase();
        return Object.prototype.hasOwnProperty.call(values, normalized)
          ? values[normalized]
          : "";
      });
    }

    function safeUrl(value, image = false) {
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

    function fieldValue(district, key) {
      if (key.startsWith("imported:")) {
        const field = key.slice(9);
        return formatValue(district.data?.[field], field);
      }
      const values = {
        division: groupText(district),
        census: district.code ? `Code ${district.code}` : "",
        lgd: district.lgdCode ? `LGD ${district.lgdCode}` : "",
        boundary: formatBoundary(district.boundaryYear),
        geometry: district.geometryType || "",
        identifiers: district.featureId || "",
        activeData: config.map?.visualization
          ? `${config.map.visualization.label}: ${formatValue(
              district.data?.[config.map.visualization.field],
              config.map.visualization.field,
            )}`
          : "",
      };
      return values[key] || "";
    }

    function tooltipParts(district) {
      return (config.content?.tooltipFields || [])
        .map((key) => fieldValue(district, key))
        .filter(Boolean);
    }

    function showTooltip(district, x, y) {
      tooltipName.textContent = district.name;
      tooltipMeta.textContent =
        tooltipParts(district).join(" · ") || groupText(district);
      tooltip.hidden = false;
      const left = Math.min(x + 14, window.innerWidth - tooltip.offsetWidth - 12);
      const top = Math.min(y + 14, window.innerHeight - tooltip.offsetHeight - 12);
      tooltip.style.left = `${Math.max(12, left)}px`;
      tooltip.style.top = `${Math.max(12, top)}px`;
    }

    function hideTooltip() {
      tooltip.hidden = true;
    }

    function appendProfileField(label, value, field = "") {
      if (!value && value !== 0) return;
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = formatValue(value, field);
      group.append(term, description);
      profileFields.append(group);
    }

    function clearProfile() {
      selectedSlug = "";
      regionBySlug.forEach((region) => region.classList.remove("is-selected"));
      profileName.textContent = `Choose a ${entitySingular}`;
      profileMeta.textContent = parentName;
      profileEmpty.hidden = false;
      profileFields.replaceChildren();
      customText.hidden = true;
      customLink.hidden = true;
      customImage.hidden = true;
      customContent.hidden = true;
    }

    function renderCustomContent(district) {
      const text = applyTemplate(config.content?.customText, district).trim();
      const linkLabel =
        applyTemplate(config.content?.linkLabel, district).trim() || "Open link";
      const linkUrl = safeUrl(
        applyTemplate(config.content?.linkUrl, district),
      );
      const imageUrl = safeUrl(
        applyTemplate(config.content?.imageUrl, district),
        true,
      );
      const imageAlt =
        applyTemplate(config.content?.imageAlt, district).trim() ||
        `${district.name} ${entitySingular}`;

      customText.textContent = text;
      customText.hidden = !text;
      customLink.textContent = linkLabel;
      customLink.href = linkUrl || "#";
      customLink.hidden = !linkUrl;
      customLink.target = /^https?:/i.test(linkUrl) ? "_blank" : "_self";
      customLink.rel = customLink.target === "_blank" ? "noopener noreferrer" : "";
      customImage.hidden = !imageUrl;
      customImage.alt = imageAlt;
      customImage.onerror = () => {
        customImage.hidden = true;
      };
      if (imageUrl) {
        customImage.src = imageUrl;
      } else {
        customImage.removeAttribute("src");
      }
      customContent.hidden = !text && !linkUrl && !imageUrl;
    }

    function selectDistrict(slug) {
      const district = districtBySlug.get(slug);
      if (!district || district.matchesFilter === false) return;
      if (selectedSlug) {
        regionBySlug.get(selectedSlug)?.classList.remove("is-selected");
      }
      selectedSlug = slug;
      regionBySlug.get(slug)?.classList.add("is-selected");
      profileName.textContent = district.name;
      profileMeta.textContent = groupText(district)
        ? `${groupText(district)} · ${parentName}`
        : parentName;
      profileEmpty.hidden = true;
      profileFields.replaceChildren();

      const fields = new Set(config.content?.popupFields || []);
      if (supportsGroups && fields.has("division")) {
        appendProfileField(groupLabel, district.divisionName);
      }
      if (fields.has("census")) {
        appendProfileField("District code", district.code);
      }
      if (fields.has("lgd")) {
        appendProfileField("LGD code", district.lgdCode);
      }
      if (fields.has("boundary")) {
        appendProfileField("Boundary vintage", formatBoundary(district.boundaryYear));
      }
      if (fields.has("geometry")) {
        appendProfileField("Geometry", district.geometryType);
      }
      if (fields.has("identifiers")) {
        appendProfileField(entityIdLabel, district.featureId);
        if (supportsGroups) {
          appendProfileField(groupIdLabel, district.divisionId);
        }
      }
      Array.from(fields)
        .filter((key) => key.startsWith("imported:"))
        .forEach((key) => {
          const field = key.slice(9);
          appendProfileField(
            field.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
              letter.toUpperCase(),
            ),
            district.data?.[field],
            field,
          );
        });
      renderCustomContent(district);
      renderDistrictList();
    }

    function executeAction(slug) {
      const district = districtBySlug.get(slug);
      if (!district) return;
      const action = district.action;
      if (!action || action.type === "profile") {
        selectDistrict(slug);
        return;
      }
      if (action.type === "district-page") {
        selectDistrict(slug);
        return;
      }
      if (action.type === "none") return;
      if (action.type === "url") {
        const url = safeUrl(applyTemplate(action.url, district));
        if (url) {
          if (action.target === "same") {
            window.location.assign(url);
          } else {
            window.open(url, "_blank", "noopener,noreferrer");
          }
          return;
        }
      }
      if (action.type === "map" && action.stateSlug) {
        window.location.assign(
          `state.html?state=${encodeURIComponent(action.stateSlug)}`,
        );
        return;
      }
      selectDistrict(slug);
    }

    function districtIsVisible(district) {
      return (
        district.matchesFilter !== false &&
        (!activeDivision || district.divisionSlug === activeDivision)
      );
    }

    function renderDistrictList() {
      const query = search.value.trim().toLocaleLowerCase();
      const visible = districts.filter(
        (district) =>
          districtIsVisible(district) &&
          `${district.name} ${groupText(district)}`
            .toLocaleLowerCase()
            .includes(query),
      );
      districtList.replaceChildren();
      visible.forEach((district) => {
        const button = document.createElement("button");
        const name = document.createElement("strong");
        const meta = document.createElement("small");
        button.type = "button";
        button.className = "district-button";
        button.style.setProperty("--division-color", district.divisionColor);
        button.classList.toggle("is-selected", district.slug === selectedSlug);
        name.textContent = district.name;
        meta.textContent = groupText(district);
        button.append(name);
        if (meta.textContent) button.append(meta);
        if (config.map?.visualization) {
          const value = document.createElement("span");
          value.className = "district-value";
          value.textContent = formatValue(
            district.data?.[config.map.visualization.field],
            config.map.visualization.field,
          );
          button.append(value);
        }
        button.addEventListener("click", () => executeAction(district.slug));
        districtList.append(button);
      });
      listStatus.textContent =
        `${visible.length} ${
          visible.length === 1 ? entitySingular : entityPlural
        }`;
    }

    function updateMapState() {
      districts.forEach((district) => {
        const region = regionBySlug.get(district.slug);
        if (!region) return;
        const inDivision =
          !activeDivision || district.divisionSlug === activeDivision;
        region.classList.toggle("is-division-active", Boolean(activeDivision && inDivision));
        region.classList.toggle("is-division-muted", Boolean(activeDivision && !inDivision));
        region.classList.toggle("is-filter-muted", district.matchesFilter === false);
        region.setAttribute(
          "tabindex",
          districtIsVisible(district) && config.map?.layers?.districts !== false
            ? "0"
            : "-1",
        );
      });
      svg.querySelectorAll(".map-label[data-division-slug]").forEach((label) => {
        const districtSlug = label.dataset.districtSlug;
        const district = districtSlug ? districtBySlug.get(districtSlug) : null;
        const divisionHasMatch = districts.some(
          (item) =>
            item.divisionSlug === label.dataset.divisionSlug &&
            item.matchesFilter !== false,
        );
        const muted =
          (activeDivision &&
            label.dataset.divisionSlug !== activeDivision) ||
          (district
            ? district.matchesFilter === false
            : !divisionHasMatch);
        label.classList.toggle("is-label-muted", Boolean(muted));
      });
      renderDistrictList();
    }

    function setViewBox(viewBox) {
      currentViewBox = viewBox;
      svg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
      );
    }

    function zoom(factor, centerX, centerY) {
      const minimumWidth = initialViewBox.width * 0.12;
      const maximumWidth = initialViewBox.width * 1.35;
      const nextWidth = Math.min(
        maximumWidth,
        Math.max(minimumWidth, currentViewBox.width * factor),
      );
      const ratio = nextWidth / currentViewBox.width;
      const nextHeight = currentViewBox.height * ratio;
      const x = centerX ?? currentViewBox.x + currentViewBox.width / 2;
      const y = centerY ?? currentViewBox.y + currentViewBox.height / 2;
      setViewBox({
        x: x - (x - currentViewBox.x) * ratio,
        y: y - (y - currentViewBox.y) * ratio,
        width: nextWidth,
        height: nextHeight,
      });
    }

    function clientToSvg(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      return {
        x:
          currentViewBox.x +
          ((clientX - rect.left) / rect.width) * currentViewBox.width,
        y:
          currentViewBox.y +
          ((clientY - rect.top) / rect.height) * currentViewBox.height,
      };
    }

    function fitCurrentContext() {
      if (config.map?.layers?.districts === false) {
        setViewBox({ ...initialViewBox });
        return;
      }
      const visibleRegions = districts
        .filter(districtIsVisible)
        .map((district) => regionBySlug.get(district.slug))
        .filter(Boolean);
      if (!visibleRegions.length || visibleRegions.length === districts.length) {
        setViewBox({ ...initialViewBox });
        return;
      }
      const bounds = visibleRegions.map((region) => region.getBBox());
      const left = Math.min(...bounds.map((box) => box.x));
      const top = Math.min(...bounds.map((box) => box.y));
      const right = Math.max(...bounds.map((box) => box.x + box.width));
      const bottom = Math.max(...bounds.map((box) => box.y + box.height));
      const padding = Math.max(right - left, bottom - top) * 0.16;
      setViewBox({
        x: left - padding,
        y: top - padding,
        width: right - left + padding * 2,
        height: bottom - top + padding * 2,
      });
    }

    const divisions = supportsGroups
      ? Array.from(
          new Map(
            districts
              .filter(
                (district) =>
                  district.divisionSlug && district.divisionName,
              )
              .map((district) => [
                district.divisionSlug,
                district.divisionName,
              ]),
          ),
          ([slug, name]) => ({ slug, name }),
        ).sort((a, b) => a.name.localeCompare(b.name))
      : [];
    divisions.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.slug;
      option.textContent = `${item.name}${groupSuffix}`;
      division.append(option);
    });
    division.value = divisions.some((item) => item.slug === activeDivision)
      ? activeDivision
      : "";
    activeDivision = division.value;

    districts.forEach((district) => {
      const region = regionBySlug.get(district.slug);
      if (!region) return;
      region.style.setProperty("--division-color", district.divisionColor);
      if (district.dataColor) {
        region.style.setProperty("--data-fill", district.dataColor);
        region.dataset.visualized = "true";
      } else {
        region.removeAttribute("data-visualized");
      }
      region.classList.toggle(
        "is-compared",
        Boolean(config.map?.layers?.comparisonMarks && district.compared),
      );
      region.setAttribute(
        "aria-label",
        groupText(district)
          ? `${district.name} ${entitySingular}, ${groupText(district)}`
          : `${district.name} ${entitySingular}`,
      );
      region.addEventListener("pointerenter", (event) =>
        showTooltip(district, event.clientX, event.clientY),
      );
      region.addEventListener("pointermove", (event) =>
        showTooltip(district, event.clientX, event.clientY),
      );
      region.addEventListener("pointerleave", hideTooltip);
      region.addEventListener("focus", () => {
        const box = region.getBoundingClientRect();
        showTooltip(district, box.left + box.width / 2, box.top + box.height / 2);
      });
      region.addEventListener("blur", hideTooltip);
      region.addEventListener("click", () => {
        if (!didPan) executeAction(district.slug);
      });
      region.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          executeAction(district.slug);
        }
      });
    });

    svg.querySelectorAll(".map-label[data-division-slug]").forEach((label) => {
      const district = districts.find(
        (item) => item.divisionSlug === label.dataset.divisionSlug,
      );
      if (district) {
        label.style.setProperty("--division-color", district.divisionColor);
      }
    });

    search.addEventListener("input", renderDistrictList);
    if (supportsGroups) {
      division.addEventListener("change", () => {
        activeDivision = division.value;
        clearProfile();
        updateMapState();
        fitCurrentContext();
      });
    }
    zoomIn.addEventListener("click", () => zoom(0.78));
    zoomOut.addEventListener("click", () => zoom(1.28));
    fitMap.addEventListener("click", fitCurrentContext);
    svg.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const point = clientToSvg(event.clientX, event.clientY);
        zoom(event.deltaY < 0 ? 0.86 : 1.16, point.x, point.y);
      },
      { passive: false },
    );
    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      pointerStart = {
        clientX: event.clientX,
        clientY: event.clientY,
        viewBox: { ...currentViewBox },
      };
      didPan = false;
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (!pointerStart) return;
      const rect = svg.getBoundingClientRect();
      const dx = event.clientX - pointerStart.clientX;
      const dy = event.clientY - pointerStart.clientY;
      if (Math.hypot(dx, dy) > 4) didPan = true;
      setViewBox({
        ...pointerStart.viewBox,
        x:
          pointerStart.viewBox.x -
          (dx / rect.width) * pointerStart.viewBox.width,
        y:
          pointerStart.viewBox.y -
          (dy / rect.height) * pointerStart.viewBox.height,
      });
      hideTooltip();
    });
    const finishPointer = (event) => {
      if (!pointerStart) return;
      pointerStart = null;
      if (svg.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }
      window.setTimeout(() => {
        didPan = false;
      }, 0);
    };
    svg.addEventListener("pointerup", finishPointer);
    svg.addEventListener("pointercancel", finishPointer);

    legend.hidden = !config.legend?.items?.length;
    if (!legend.hidden) {
      legendTitle.textContent = config.legend.title;
      legendType.textContent = config.legend.type;
      config.legend.items.forEach((item) => {
        const row = document.createElement("div");
        const swatch = document.createElement("span");
        const label = document.createElement("span");
        const count = document.createElement("small");
        row.className = "legend-row";
        swatch.className = "legend-swatch";
        swatch.style.setProperty("--swatch", item.color);
        label.textContent = item.label;
        count.textContent = item.count;
        row.append(swatch, label, count);
        legendItems.append(row);
      });
    }

    setViewBox(currentViewBox);
    updateMapState();
    const selected = districtBySlug.get(config.map?.selectedDistrictSlug);
    if (selected && selected.matchesFilter !== false) {
      selectDistrict(selected.slug);
    }
  }

  function buildHtml({ config, svgMarkup }) {
    if (!config || typeof config !== "object") {
      throw new Error("A standalone map configuration is required.");
    }
    if (!svgMarkup || !/<svg[\s>]/i.test(svgMarkup)) {
      throw new Error("Standalone map SVG markup is missing.");
    }
    const title = escapeHtml(
      config.projectName || `${config.state?.name || "District"} map`,
    );
    const stateName = escapeHtml(config.state?.name || "District map");
    const districtCount = Array.isArray(config.districts)
      ? config.districts.length
      : 0;
    const terminology = config.terminology || {};
    const entitySingularRaw = terminology.entitySingular || "district";
    const entityPluralRaw = terminology.entityPlural || "districts";
    const entitySingular = escapeHtml(entitySingularRaw);
    const entityPlural = escapeHtml(entityPluralRaw);
    const entityTitle = escapeHtml(
      terminology.entityTitle ||
        entityPluralRaw.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
    const groupLabelRaw = terminology.groupLabel || "Division";
    const groupLabel = escapeHtml(groupLabelRaw);
    const groupPlural = escapeHtml(
      terminology.groupPlural || `${groupLabelRaw}s`,
    );
    const mapKind = escapeHtml(
      terminology.mapKind || `Interactive ${entitySingularRaw} map`,
    );
    const showGroupFilter = config.map?.groupFilter !== false;
    const runtime = `(${standaloneMapRuntime.toString()})(
  JSON.parse(document.querySelector("#map-config").textContent)
);`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Portable interactive ${entitySingular} map of ${stateName}"
    />
    <title>${title}</title>
    <style>${standaloneStyles}</style>
  </head>
  <body>
    <a class="skip-link" href="#portable-map">Skip to map</a>
    <header class="export-header">
      <div>
        <p class="eyebrow">${mapKind}</p>
        <h1>${stateName}</h1>
      </div>
      <p class="map-identity">${districtCount} ${entityPlural} · Portable standalone map</p>
    </header>
    <main class="export-main">
      <section class="export-controls${showGroupFilter ? "" : " no-group-filter"}" aria-label="Map controls">
        <label class="control-field">
          <span>Find a ${entitySingular}</span>
          <input
            id="district-search"
            type="search"
            placeholder="Search ${entityPlural}"
            autocomplete="off"
          />
        </label>
        <label class="control-field"${showGroupFilter ? "" : " hidden"}>
          <span>${groupLabel}</span>
          <select id="division-filter">
            <option value="">All ${groupPlural}</option>
          </select>
        </label>
        <div class="zoom-controls" aria-label="Zoom controls">
          <button id="zoom-in" type="button" aria-label="Zoom in">+</button>
          <button id="zoom-out" type="button" aria-label="Zoom out">−</button>
          <button id="fit-map" type="button">Fit</button>
        </div>
      </section>
      <div class="export-layout">
        <section class="map-panel" aria-label="${stateName} ${entitySingular} map">
          <div
            id="portable-map"
            class="portable-map"
            aria-describedby="map-instructions"
          >
            ${svgMarkup}
          </div>
          <p id="map-instructions" hidden>
            Use Tab to focus ${entityPlural}, Enter to activate one, drag to pan,
            and scroll to zoom.
          </p>
          <aside id="map-legend" class="map-legend" hidden>
            <header>
              <strong id="legend-title"></strong>
              <span id="legend-type"></span>
            </header>
            <div id="legend-items" class="legend-items"></div>
          </aside>
        </section>
        <aside class="export-sidebar">
          <section class="profile-panel" aria-live="polite">
            <p class="eyebrow">Selected ${entitySingular}</p>
            <h2 id="profile-name">Choose a ${entitySingular}</h2>
            <p id="profile-meta" class="profile-meta">${stateName}</p>
            <p id="profile-empty" class="profile-empty">
              Select a ${entitySingular} on the map or from the list to view its details.
            </p>
            <dl id="profile-fields" class="profile-fields"></dl>
            <div id="custom-content" class="custom-content" hidden>
              <img id="custom-image" alt="" hidden />
              <p id="custom-text" class="custom-copy" hidden></p>
              <a id="custom-link" href="#" hidden></a>
            </div>
          </section>
          <section class="district-list-panel">
            <div class="district-list-heading">
              <h2>${entityTitle}</h2>
              <p id="list-status" class="list-status"></p>
            </div>
            <div id="district-list" class="district-list"></div>
          </section>
        </aside>
      </div>
      <footer class="export-footer">
        Generated as a self-contained interactive map.
      </footer>
    </main>
    <div id="map-tooltip" class="map-tooltip" role="tooltip" hidden>
      <strong id="tooltip-name"></strong>
      <span id="tooltip-meta"></span>
    </div>
    <script id="map-config" type="application/json">${safeJson(config)}</script>
    <script>${runtime}</script>
  </body>
</html>`;
  }

  function safeEmbedSource(value) {
    const source = String(value || "").trim();
    if (!source || /[\u0000-\u001f\u007f]/.test(source)) return "";
    const scheme = source.match(/^([a-z][a-z0-9+.-]*):/i)?.[1];
    return !scheme || /^(?:http|https)$/i.test(scheme) ? source : "";
  }

  function safeScriptString(value) {
    return JSON.stringify(String(value || ""))
      .replaceAll("<", "\\u003c")
      .replaceAll("\u2028", "\\u2028")
      .replaceAll("\u2029", "\\u2029");
  }

  function buildEmbedCode({
    format = "iframe",
    source,
    title = "Interactive district map",
    height = 720,
  }) {
    const safeSource = safeEmbedSource(source);
    if (!safeSource) {
      throw new Error("Use an HTTP, HTTPS, or relative map URL.");
    }
    const safeHeight = Math.min(
      1200,
      Math.max(320, Math.round(Number(height) || 720)),
    );
    if (format === "iframe") {
      return `<iframe
  src="${escapeHtml(safeSource)}"
  title="${escapeHtml(title)}"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  style="display:block;width:100%;height:${safeHeight}px;border:0"
  allowfullscreen
></iframe>`;
    }
    if (format !== "javascript") {
      throw new Error("Choose iframe or JavaScript embed code.");
    }
    return `<div data-interactive-map-embed></div>
<script>
(function (host) {
  var frame = document.createElement("iframe");
  frame.src = ${safeScriptString(safeSource)};
  frame.title = ${safeScriptString(title)};
  frame.loading = "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  frame.style.cssText = "display:block;width:100%;height:${safeHeight}px;border:0";
  host.appendChild(frame);
})(document.currentScript.previousElementSibling);
</script>`;
  }

  global.ImageMapStandaloneExporter = Object.freeze({
    buildHtml,
    buildEmbedCode,
  });
})(typeof window === "undefined" ? globalThis : window);
