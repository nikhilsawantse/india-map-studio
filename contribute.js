(function () {
  "use strict";

  const MAX_BYTES = 50 * 1024 * 1024;
  const STABLE_ID = /^IN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
  const STABLE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const SVG_SELECTOR = /^(?:\.[A-Za-z_][\w-]*|#[A-Za-z_][\w-]*|[A-Za-z][\w-]*)$/;
  const GEOMETRY_TAGS = new Set(["path", "polygon", "polyline", "rect", "circle", "ellipse"]);
  const FORBIDDEN_TAGS = new Set(["script", "foreignobject", "iframe", "object", "embed"]);

  const byId = (id) => document.getElementById(id);
  const elements = {
    form: byId("contribution-form"),
    file: byId("contribution-file"),
    fileSummary: byId("contribution-file-summary"),
    fileName: byId("contribution-file-name"),
    fileFormat: byId("contribution-file-format"),
    featureCount: byId("contribution-feature-count"),
    layerId: byId("contribution-layer-id"),
    layerLabel: byId("contribution-layer-label"),
    level: byId("contribution-level"),
    parentId: byId("contribution-parent-id"),
    selector: byId("contribution-selector"),
    featureKey: byId("contribution-feature-key"),
    slugKey: byId("contribution-slug-key"),
    declaredCount: byId("contribution-declared-count"),
    sourceName: byId("contribution-source-name"),
    sourceUrl: byId("contribution-source-url"),
    sourceRevision: byId("contribution-source-revision"),
    retrieved: byId("contribution-retrieved"),
    vintage: byId("contribution-vintage"),
    licenseName: byId("contribution-license-name"),
    licenseSpdx: byId("contribution-license-spdx"),
    licenseUrl: byId("contribution-license-url"),
    attribution: byId("contribution-attribution"),
    transformations: byId("contribution-transformations"),
    command: byId("contribution-command"),
    rights: byId("contribution-rights"),
    badge: byId("contribution-status-badge"),
    status: byId("contribution-status"),
    checks: byId("contribution-checks"),
    output: byId("contribution-output"),
    manifest: byId("contribution-manifest"),
    generate: byId("contribution-generate"),
    copy: byId("contribution-copy"),
    download: byId("contribution-download"),
  };

  const state = {
    file: null,
    format: "",
    document: null,
    parseErrors: [],
    safetyErrors: [],
    count: 0,
    lastResult: null,
  };

  const today = new Date();
  elements.retrieved.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function localName(element) {
    return element.localName.toLowerCase();
  }

  function selectSvgFeatures(root, selector) {
    if (!SVG_SELECTOR.test(selector)) {
      throw new Error("Use an SVG class (.district-region), ID (#layer), or element name (path). ");
    }
    return Array.from(root.querySelectorAll(selector));
  }

  function inspectSvgSafety(root) {
    const errors = [];
    Array.from(root.querySelectorAll("*")).forEach((element) => {
      const tag = localName(element);
      if (FORBIDDEN_TAGS.has(tag)) errors.push(`Forbidden <${tag}> content was found.`);
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.localName.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith("on")) errors.push(`Event-handler attribute ${name} was found.`);
        if (
          name === "href" &&
          value &&
          !value.startsWith("#") &&
          !value.startsWith("data:image/")
        ) {
          errors.push("An external SVG href was found.");
        }
        if (name === "style" && value.includes("url(")) {
          errors.push("An SVG style URL reference was found.");
        }
      });
    });
    return [...new Set(errors)];
  }

  function hasSvgGeometry(feature) {
    if (GEOMETRY_TAGS.has(localName(feature))) return true;
    return Array.from(feature.querySelectorAll("*")).some((item) =>
      GEOMETRY_TAGS.has(localName(item)),
    );
  }

  function coordinatePairs(value, callback) {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      callback(value[0], value[1]);
      return;
    }
    value.forEach((child) => coordinatePairs(child, callback));
  }

  function inspectFeatures() {
    const errors = [...state.parseErrors, ...state.safetyErrors];
    const warnings = [];
    const passes = [];
    let features = [];
    const featureKey = elements.featureKey.value.trim();
    const slugKey = elements.slugKey.value.trim();

    if (!state.document || errors.length) {
      state.count = 0;
      return { errors, warnings, passes, features };
    }

    if (state.format === "svg") {
      const selector = elements.selector.value.trim();
      try {
        features = selectSvgFeatures(state.document.documentElement, selector);
      } catch (error) {
        errors.push(error.message);
      }
      if (!state.document.documentElement.hasAttribute("viewBox")) {
        warnings.push("SVG root has no viewBox; responsive rendering may be unreliable.");
      }
      const emptyGeometry = features.filter((feature) => !hasSvgGeometry(feature)).length;
      if (emptyGeometry) errors.push(`${emptyGeometry} selected feature(s) contain no supported geometry.`);
    } else {
      features = state.document.features || [];
      features.forEach((feature, index) => {
        if (!feature || feature.type !== "Feature") {
          errors.push(`Item ${index + 1} is not a GeoJSON Feature.`);
          return;
        }
        const geometry = feature.geometry;
        if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
          errors.push(`Feature ${index + 1} must use Polygon or MultiPolygon geometry.`);
          return;
        }
        let pairs = 0;
        let invalid = false;
        coordinatePairs(geometry.coordinates, (longitude, latitude) => {
          pairs += 1;
          if (
            !Number.isFinite(longitude) ||
            !Number.isFinite(latitude) ||
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
          ) {
            invalid = true;
          }
        });
        if (!pairs) errors.push(`Feature ${index + 1} has empty coordinates.`);
        if (invalid) errors.push(`Feature ${index + 1} has coordinates outside WGS84 bounds.`);
      });
    }

    if (!features.length && !errors.length) errors.push("The feature selector matched no features.");
    const ids = [];
    const slugs = [];
    features.forEach((feature, index) => {
      const properties = state.format === "svg" ? null : feature.properties || {};
      const id = String(
        state.format === "svg" ? feature.getAttribute(featureKey) || "" : properties[featureKey] || "",
      ).trim();
      const slug = String(
        state.format === "svg" ? feature.getAttribute(slugKey) || "" : properties[slugKey] || "",
      ).trim();
      if (!id) errors.push(`Feature ${index + 1} is missing ${featureKey || "its ID key"}.`);
      else if (!STABLE_ID.test(id)) errors.push(`Feature ${index + 1} has an invalid stable ID.`);
      if (!slug) errors.push(`Feature ${index + 1} is missing ${slugKey || "its slug key"}.`);
      else if (!STABLE_SLUG.test(slug)) errors.push(`Feature ${index + 1} has an invalid slug.`);
      ids.push(id);
      slugs.push(slug);
    });
    const duplicateValues = (values) => {
      const seen = new Set();
      const duplicates = new Set();
      values.forEach((item) => {
        if (!item) return;
        if (seen.has(item)) duplicates.add(item);
        seen.add(item);
      });
      return duplicates;
    };
    const duplicateIds = duplicateValues(ids);
    const duplicateSlugs = duplicateValues(slugs);
    if (duplicateIds.length) errors.push("Stable feature IDs are not unique.");
    if (duplicateSlugs.length) errors.push("Feature slugs are not unique.");

    state.count = features.length;
    elements.featureCount.textContent = features.length.toLocaleString("en-IN");
    elements.declaredCount.value = features.length ? String(features.length) : "";
    if (features.length) passes.push(`${features.length.toLocaleString("en-IN")} boundary features discovered.`);
    if (features.length && !ids.some((value) => !value) && !duplicateIds.length) {
      passes.push("Stable feature identifiers are present and unique.");
    }
    if (features.length && !slugs.some((value) => !value) && !duplicateSlugs.length) {
      passes.push("Feature slugs are present and unique.");
    }
    if (!state.safetyErrors.length && state.format === "svg") {
      passes.push("No active or externally referenced SVG content was found.");
    }
    if (state.format === "geojson" && !errors.some((item) => item.includes("geometry") || item.includes("WGS84") || item.includes("coordinates"))) {
      passes.push("GeoJSON polygon geometry is within WGS84 coordinate bounds.");
    }
    return {
      errors: [...new Set(errors)].slice(0, 12),
      warnings: [...new Set(warnings)].slice(0, 6),
      passes,
      features,
    };
  }

  function value(element) {
    return element.value.trim();
  }

  function isHttpUrl(candidate) {
    try {
      const url = new URL(candidate);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_error) {
      return false;
    }
  }

  function inspectMetadata() {
    const errors = [];
    const passes = [];
    const required = [
      [elements.layerId, "Layer ID"],
      [elements.layerLabel, "Layer label"],
      [elements.level, "Administrative level"],
      [elements.selector, "Feature selector"],
      [elements.featureKey, "Feature ID key"],
      [elements.slugKey, "Slug key"],
      [elements.sourceName, "Source name"],
      [elements.sourceUrl, "Source URL"],
      [elements.sourceRevision, "Source revision"],
      [elements.retrieved, "Retrieval date"],
      [elements.vintage, "Boundary vintage"],
      [elements.licenseName, "License name"],
      [elements.licenseSpdx, "SPDX identifier"],
      [elements.licenseUrl, "License URL"],
      [elements.attribution, "Attribution"],
      [elements.transformations, "Transformations"],
      [elements.command, "Reproducible process"],
    ];
    const missing = required.filter(([element]) => !value(element)).map(([, label]) => label);
    if (missing.length) errors.push(`Complete required metadata: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}.`);

    if (value(elements.layerId) && !STABLE_ID.test(value(elements.layerId))) {
      errors.push("Layer ID must begin with IN- and use uppercase letters, numbers, and hyphens.");
    }
    if (value(elements.parentId) && !STABLE_ID.test(value(elements.parentId))) {
      errors.push("Parent feature ID does not follow the stable IN- identifier format.");
    }
    if (value(elements.sourceUrl) && !isHttpUrl(value(elements.sourceUrl))) {
      errors.push("Source URL must be an absolute HTTP(S) address.");
    }
    if (value(elements.licenseUrl) && !isHttpUrl(value(elements.licenseUrl))) {
      errors.push("License URL must be an absolute HTTP(S) address.");
    }
    if (/\s/.test(value(elements.licenseSpdx))) {
      errors.push("SPDX identifier cannot contain spaces.");
    }
    if (!elements.rights.checked) {
      errors.push("Confirm that redistribution and derivative files are permitted.");
    }
    if (!missing.length && !errors.some((item) => item.includes("URL") || item.includes("identifier"))) {
      passes.push("Required provenance, license, and processing metadata is complete.");
    }
    if (elements.rights.checked) passes.push("Redistribution rights have been explicitly confirmed.");
    return { errors, passes };
  }

  function createCheck(text, type) {
    const item = document.createElement("li");
    item.className = `contribution-check contribution-check-${type}`;
    const marker = document.createElement("span");
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = type === "pass" ? "✓" : type === "warning" ? "!" : "×";
    const copy = document.createElement("span");
    copy.textContent = text;
    item.append(marker, copy);
    return item;
  }

  function validateAll() {
    if (!state.file) {
      state.lastResult = { errors: [], warnings: [], passes: [], ready: false };
      elements.checks.replaceChildren();
      elements.badge.className = "contribution-status-badge";
      elements.badge.textContent = "Waiting";
      elements.status.textContent = "Select an SVG or GeoJSON file to begin.";
      elements.generate.disabled = true;
      elements.copy.disabled = true;
      elements.download.disabled = true;
      elements.output.hidden = true;
      return false;
    }
    const asset = inspectFeatures();
    const metadata = inspectMetadata();
    const errors = [...asset.errors, ...metadata.errors];
    const warnings = asset.warnings;
    const passes = [...asset.passes, ...metadata.passes];
    const ready = Boolean(state.file) && !errors.length;
    state.lastResult = { errors, warnings, passes, ready };

    elements.checks.replaceChildren(
      ...errors.map((item) => createCheck(item, "error")),
      ...warnings.map((item) => createCheck(item, "warning")),
      ...passes.map((item) => createCheck(item, "pass")),
    );
    elements.badge.className = `contribution-status-badge ${ready ? "is-ready" : errors.length ? "has-errors" : ""}`;
    elements.badge.textContent = ready ? "Ready" : errors.length ? "Needs work" : "Waiting";
    elements.status.textContent = !state.file
      ? "Select an SVG or GeoJSON file to begin."
      : ready
        ? `Ready to generate a manifest for ${state.count.toLocaleString("en-IN")} features.`
        : `${errors.length} issue${errors.length === 1 ? "" : "s"} must be resolved before export.`;
    elements.generate.disabled = !ready;
    if (!ready) {
      elements.copy.disabled = true;
      elements.download.disabled = true;
      elements.output.hidden = true;
    }
    return ready;
  }

  function suggestedSelector(root) {
    for (const className of ["district-region", "map-region", "child-region"]) {
      if (root.querySelector(`.${className}`)) return `.${className}`;
    }
    return "path";
  }

  async function loadFile() {
    const file = elements.file.files[0];
    state.file = file || null;
    state.document = null;
    state.parseErrors = [];
    state.safetyErrors = [];
    state.count = 0;
    elements.fileSummary.hidden = !file;
    if (!file) {
      validateAll();
      return;
    }
    elements.fileName.textContent = file.name;
    if (file.size > MAX_BYTES) {
      state.parseErrors.push("Boundary file exceeds the 50 MB contribution limit.");
      validateAll();
      return;
    }
    const suffix = file.name.split(".").pop().toLowerCase();
    state.format = suffix === "svg" ? "svg" : "geojson";
    elements.fileFormat.textContent = state.format === "svg" ? "SVG" : "GeoJSON";
    try {
      const text = await file.text();
      if (state.format === "svg") {
        const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
        if (parsed.querySelector("parsererror") || parsed.documentElement.localName !== "svg") {
          throw new Error("The file is not valid SVG XML.");
        }
        state.document = parsed;
        state.safetyErrors = inspectSvgSafety(parsed.documentElement);
        elements.selector.value = suggestedSelector(parsed.documentElement);
        elements.featureKey.value = "data-feature-id";
        elements.slugKey.value = "data-slug";
      } else {
        const parsed = JSON.parse(text);
        if (!parsed || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
          throw new Error("GeoJSON root must be a FeatureCollection with a features array.");
        }
        state.document = parsed;
        elements.selector.value = "Feature";
        elements.featureKey.value = "feature_id";
        elements.slugKey.value = "slug";
      }
    } catch (error) {
      state.parseErrors.push(error.message || "The selected file could not be parsed.");
    }
    validateAll();
  }

  function manifestDocument() {
    return {
      schemaVersion: "1.0.0",
      layer: {
        id: value(elements.layerId),
        label: value(elements.layerLabel),
        level: value(elements.level),
        parentId: value(elements.parentId) || null,
        file: state.file.name,
        format: state.format,
        featureCount: state.count,
        featureSelector: value(elements.selector),
        identifiers: {
          feature: value(elements.featureKey),
          slug: value(elements.slugKey),
        },
      },
      source: {
        name: value(elements.sourceName),
        url: value(elements.sourceUrl),
        revision: value(elements.sourceRevision),
        retrievedAt: value(elements.retrieved),
        vintage: value(elements.vintage),
        license: {
          name: value(elements.licenseName),
          spdx: value(elements.licenseSpdx),
          url: value(elements.licenseUrl),
        },
        attribution: value(elements.attribution),
        redistributionConfirmed: true,
      },
      processing: {
        transformations: value(elements.transformations)
          .split(/\n|;/)
          .map((item) => item.trim())
          .filter(Boolean),
        command: value(elements.command),
      },
    };
  }

  function generateManifest() {
    if (!validateAll()) return;
    elements.manifest.value = `${JSON.stringify(manifestDocument(), null, 2)}\n`;
    elements.output.hidden = false;
    elements.copy.disabled = false;
    elements.download.disabled = false;
    elements.status.textContent = "Manifest generated. Keep it beside the selected boundary file.";
  }

  async function copyManifest() {
    try {
      await navigator.clipboard.writeText(elements.manifest.value);
      elements.status.textContent = "Manifest JSON copied to the clipboard.";
    } catch (_error) {
      elements.manifest.select();
      elements.status.textContent = "Select and copy the manifest JSON manually.";
    }
  }

  function downloadManifest() {
    const blob = new Blob([elements.manifest.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "boundary-contribution.json";
    anchor.click();
    URL.revokeObjectURL(url);
    elements.status.textContent = "Manifest downloaded as boundary-contribution.json.";
  }

  elements.file.addEventListener("change", loadFile);
  elements.form.addEventListener("input", (event) => {
    if (event.target !== elements.file) validateAll();
  });
  elements.form.addEventListener("change", (event) => {
    if (event.target !== elements.file) validateAll();
  });
  elements.generate.addEventListener("click", generateManifest);
  elements.copy.addEventListener("click", copyManifest);
  elements.download.addEventListener("click", downloadManifest);
  validateAll();
})();
