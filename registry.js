(function () {
  "use strict";

  const elements = {
    version: document.querySelector("#registry-version"),
    schemaVersion: document.querySelector("#registry-schema-version"),
    layerTotal: document.querySelector("#registry-layer-total"),
    readyTotal: document.querySelector("#registry-ready-total"),
    featureTotal: document.querySelector("#registry-feature-total"),
    status: document.querySelector("#registry-status"),
    search: document.querySelector("#registry-search"),
    level: document.querySelector("#registry-level-filter"),
    verification: document.querySelector("#registry-verification-filter"),
    rows: document.querySelector("#registry-rows"),
    empty: document.querySelector("#registry-empty"),
  };

  let registry = { sources: {}, layers: [] };

  function labelForLevel(value) {
    if (value === "regions") return "States / UTs";
    if (value === "other") return "Other local";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function vintageLabel(values) {
    if (!values.length) return "Not declared";
    return values
      .map((value) =>
        value
          .replace(/^2011_c$/i, "Census 2011")
          .replace(/^update2014$/i, "2014 update")
          .replace(/_c$/i, "")
          .replace(/_/g, " "),
      )
      .join(", ");
  }

  function verificationLabel(value) {
    return {
      verified: "Verified",
      compatible: "Compatible",
      declared: "Declared",
      invalid: "Invalid",
    }[value] || value;
  }

  function verificationDetail(layer) {
    if (layer.verification.errors.length) {
      return layer.verification.errors.join("; ");
    }
    if (layer.verification.warnings.length) {
      return layer.verification.warnings.join("; ");
    }
    return "Identifiers and declared count passed";
  }

  function createCell(label, text) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    cell.textContent = text;
    return cell;
  }

  function createRow(layer) {
    const source = registry.sources[layer.sourceId];
    const row = document.createElement("tr");
    row.className = `registry-row registry-row-${layer.verification.status}`;

    const layerCell = document.createElement("th");
    layerCell.scope = "row";
    const layerName = document.createElement("strong");
    layerName.textContent = layer.label;
    const layerId = document.createElement("code");
    layerId.textContent = layer.id;
    layerCell.append(layerName, layerId);

    const sourceCell = document.createElement("td");
    sourceCell.dataset.label = "Source and license";
    const sourceLink = document.createElement("a");
    sourceLink.href = source.url;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer";
    sourceLink.textContent = source.name;
    const license = document.createElement("small");
    license.textContent = `${source.license.spdx} · ${source.revision}`;
    sourceCell.append(sourceLink, license);

    const verificationCell = document.createElement("td");
    verificationCell.dataset.label = "Verification";
    const badge = document.createElement("span");
    badge.className = "registry-verification-badge";
    badge.textContent = verificationLabel(layer.verification.status);
    const verificationCopy = document.createElement("small");
    verificationCopy.textContent = verificationDetail(layer);
    verificationCell.append(badge, verificationCopy);

    const actionCell = document.createElement("td");
    actionCell.className = "registry-row-action";
    const action = document.createElement("a");
    action.href = layer.path;
    action.textContent = layer.status === "ready" ? "Open SVG" : "Inspect SVG";
    action.setAttribute("aria-label", `${action.textContent}: ${layer.label}`);
    actionCell.append(action);

    row.append(
      layerCell,
      createCell("Level", labelForLevel(layer.level)),
      createCell("Features", layer.featureCount.toLocaleString("en-IN")),
      createCell("Vintage", vintageLabel(layer.vintages)),
      sourceCell,
      verificationCell,
      actionCell,
    );
    return row;
  }

  function visibleLayers() {
    const query = elements.search.value.trim().toLocaleLowerCase();
    const level = elements.level.value;
    const verification = elements.verification.value;
    return registry.layers.filter((layer) => {
      const source = registry.sources[layer.sourceId];
      const searchable = `${layer.label} ${layer.id} ${layer.level} ${source.name}`
        .toLocaleLowerCase();
      return (
        searchable.includes(query) &&
        (level === "all" || layer.level === level) &&
        (verification === "all" || layer.verification.status === verification)
      );
    });
  }

  function renderRows() {
    const visible = visibleLayers();
    elements.rows.replaceChildren(...visible.map(createRow));
    elements.empty.hidden = visible.length > 0;
    elements.status.textContent = `${visible.length} of ${registry.layers.length} layers shown`;
  }

  function renderSummary() {
    const ready = registry.layers.filter((layer) => layer.status === "ready");
    const features = ready.reduce((total, layer) => total + layer.featureCount, 0);
    elements.version.textContent = `Version ${registry.registryVersion}`;
    elements.schemaVersion.textContent = `Schema ${registry.schemaVersion} · Published ${registry.publishedAt}`;
    elements.layerTotal.textContent = registry.layers.length.toLocaleString("en-IN");
    elements.readyTotal.textContent = ready.length.toLocaleString("en-IN");
    elements.featureTotal.textContent = features.toLocaleString("en-IN");
  }

  function populateLevels() {
    const levels = [...new Set(registry.layers.map((layer) => layer.level))].sort();
    elements.level.append(
      ...levels.map((level) => {
        const option = document.createElement("option");
        option.value = level;
        option.textContent = labelForLevel(level);
        return option;
      }),
    );
  }

  async function loadRegistry() {
    const response = await fetch("data/boundary-registry.json");
    if (!response.ok) throw new Error(`Registry request failed (${response.status})`);
    registry = await response.json();
    populateLevels();
    renderSummary();
    renderRows();
  }

  elements.search.addEventListener("input", renderRows);
  elements.level.addEventListener("change", renderRows);
  elements.verification.addEventListener("change", renderRows);

  loadRegistry().catch((error) => {
    elements.status.textContent = "The boundary registry could not be loaded.";
    console.error(error);
  });
})();
