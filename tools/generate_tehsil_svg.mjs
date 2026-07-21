#!/usr/bin/env node
/**
 * Generate a dedicated tehsil SVG with one populated local boundary layer.
 *
 * Published longitude/latitude geometry is projected with a pinned d3-geo
 * bundle. The runtime site remains plain HTML, CSS, and JavaScript.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const D3_URL = "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js";
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 1100;
const PADDING = 54;

function argumentsByName(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      continue;
    }
    const name = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }
    options[name] = value;
    index += 1;
  }
  return options;
}

function required(options, name) {
  if (!options[name]) {
    throw new Error(`--${name} is required`);
  }
  return options[name];
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function identifierPart(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function optionBoolean(options, name, fallback = false) {
  const value = options[name];
  if (value === undefined) {
    return fallback;
  }
  return !["false", "0", "no", "off"].includes(String(value).toLowerCase());
}

function signedRingArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function orientRing(ring, clockwise) {
  const isClockwise = signedRingArea(ring) < 0;
  return isClockwise === clockwise ? ring : [...ring].reverse();
}

function normalizeGeometryForD3(geometry) {
  if (!geometry) {
    return geometry;
  }
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring, index) =>
        orientRing(ring, index === 0),
      ),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring, index) => orientRing(ring, index === 0)),
      ),
    };
  }
  return geometry;
}

function normalizeFeatureForD3(feature) {
  return {
    ...feature,
    geometry: normalizeGeometryForD3(feature.geometry),
  };
}

async function loadD3() {
  const response = await fetch(D3_URL);
  if (!response.ok) {
    throw new Error(`Could not load the pinned d3-geo bundle (${response.status})`);
  }
  const source = await response.text();
  const context = {};
  context.globalThis = context;
  context.self = context;
  context.window = context;
  vm.runInNewContext(source, context, { filename: "d3-7.9.0.min.js" });
  if (!context.d3?.geoMercator || !context.d3?.geoPath) {
    throw new Error("The d3-geo projection functions were not available");
  }
  return context.d3;
}

function placeholderLayer(
  id,
  type,
  layerId,
  featurePattern,
) {
  return (
    `  <g id="${id}" class="district-child-layer tehsil-child-layer" ` +
    `data-layer-type="${type}" data-status="placeholder" ` +
    `data-layer-id="${layerId}" data-feature-pattern="${featurePattern}"></g>`
  );
}

function buildSvg(features, outline, options, d3) {
  const stateSlug = required(options, "state-slug");
  const districtSlug = required(options, "district-slug");
  const tehsilSlug = required(options, "tehsil-slug");
  const tehsilName = required(options, "tehsil-name");
  const tehsilFeatureId = required(options, "tehsil-feature-id");
  const boundaryYear = options["boundary-year"] || "";
  const sourceDate = options["source-date"] || "";
  const sourceLabel = required(options, "source-label");
  const sourceUrl = required(options, "source-url");
  const layerType = options["layer-type"] || "villages";
  const layerSingular = options["layer-singular"] || "village";
  const layerPlural = options["layer-plural"] || "villages";
  const featureSuffix =
    options["feature-suffix"] || identifierPart(layerSingular);
  const featureIdProperty = options["feature-id-property"] || "source_id";
  const clipToOutline = optionBoolean(options, "clip-to-outline");
  const populatedLayerGroupIds = {
    blocks: "block-layer",
    villages: "village-layer",
    "gram-panchayats": "gram-panchayat-layer",
    wards: "ward-layer",
    other: "other-boundary-layer",
  };
  const populatedLayerGroupId =
    populatedLayerGroupIds[layerType] || `${slugify(layerType)}-layer`;
  const projectedFeatures = features.map(normalizeFeatureForD3);
  const projectedOutline = normalizeFeatureForD3(outline);
  const projection = d3
    .geoMercator()
    .fitExtent(
      [
        [PADDING, PADDING],
        [VIEWBOX_WIDTH - PADDING, VIEWBOX_HEIGHT - PADDING],
      ],
      projectedOutline,
    );
  const path = d3.geoPath(projection).digits(2);
  const localLayerId = `${tehsilFeatureId}-${identifierPart(layerType)}`;
  const localPattern = `${tehsilFeatureId}-${featureSuffix}-{SOURCE_ID}`;
  const nameCounts = new Map();
  features.forEach((feature) => {
    const name = String(
      feature.properties?.name || `Unnamed ${layerSingular}`,
    ).trim();
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });

  const localRegionMarkup = [...projectedFeatures]
    .sort((left, right) =>
      String(left.properties?.name || "").localeCompare(
        String(right.properties?.name || ""),
      ),
    )
    .map((feature, index) => {
      const properties = feature.properties || {};
      const name = String(
        properties.name || `${layerSingular} ${index + 1}`,
      ).trim();
      const sourceId =
        properties[featureIdProperty] ||
        properties.source_id ||
        properties.vilcode11 ||
        `SOURCE-${index + 1}`;
      const code = identifierPart(sourceId);
      const identifier = `${tehsilFeatureId}-${featureSuffix}-${code}`;
      const baseSlug = slugify(name);
      const slug =
        nameCounts.get(name) > 1
          ? `${baseSlug}-${slugify(sourceId)}`
          : baseSlug;
      return (
        `    <g id="${escapeAttribute(slugify(layerSingular))}-${escapeAttribute(slug)}" class="child-region" ` +
        `data-child-region="true" data-name="${escapeAttribute(name)}" ` +
        `data-slug="${escapeAttribute(slug)}" ` +
        `data-source-id="${escapeAttribute(sourceId)}" ` +
        `data-ward-code="${escapeAttribute(properties.ward_code || "")}" ` +
        `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
        `data-geometry-type="${escapeAttribute(feature.geometry?.type || "")}" ` +
        `data-feature-id="${escapeAttribute(identifier)}" ` +
        `tabindex="0" role="button" ` +
        `aria-label="Select ${escapeAttribute(name)} ${escapeAttribute(layerSingular)}">\n` +
        `      <path d="${path(feature)}" vector-effect="non-scaling-stroke"/>\n` +
        "    </g>"
      );
    })
    .join("\n");

  const outlinePath = path(projectedOutline);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" ` +
    'role="img" aria-labelledby="tehsil-map-title tehsil-map-description" ' +
    `data-state-slug="${escapeAttribute(stateSlug)}" ` +
    `data-district-slug="${escapeAttribute(districtSlug)}" ` +
    `data-tehsil-slug="${escapeAttribute(tehsilSlug)}" ` +
    `data-tehsil="${escapeAttribute(tehsilName)}" ` +
    `data-feature-id="${escapeAttribute(tehsilFeatureId)}" ` +
    `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
    `data-source-date="${escapeAttribute(sourceDate)}" ` +
    `data-source="${escapeAttribute(sourceLabel)}" ` +
    `data-source-url="${escapeAttribute(sourceUrl)}">\n` +
    `  <title id="tehsil-map-title">${escapeAttribute(tehsilName)} ${escapeAttribute(layerSingular)} map</title>\n` +
    `  <desc id="tehsil-map-description">Interactive ${escapeAttribute(tehsilName)} tehsil map containing ${features.length} published ${escapeAttribute(layerPlural)}.</desc>\n` +
    (clipToOutline
      ? `  <defs>\n    <clipPath id="tehsil-boundary-clip" clipPathUnits="userSpaceOnUse">\n      <path d="${outlinePath}"/>\n    </clipPath>\n  </defs>\n`
      : "") +
    `  <g id="tehsil-outline" class="district-focus-region tehsil-focus-region" data-feature-id="${escapeAttribute(tehsilFeatureId)}">\n` +
    `    <path d="${outlinePath}" vector-effect="non-scaling-stroke"/>\n` +
    "  </g>\n" +
    `  <g id="${escapeAttribute(populatedLayerGroupId)}" class="district-child-layer tehsil-child-layer" ` +
    `data-layer-type="${escapeAttribute(layerType)}" data-status="ready" ` +
    `data-feature-count="${features.length}" ` +
    `data-layer-id="${escapeAttribute(localLayerId)}" ` +
    `data-feature-pattern="${escapeAttribute(localPattern)}" ` +
    `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
    `data-source-date="${escapeAttribute(sourceDate)}" ` +
    `data-source="${escapeAttribute(sourceLabel)}" ` +
    `data-source-url="${escapeAttribute(sourceUrl)}"` +
    (clipToOutline ? ' clip-path="url(#tehsil-boundary-clip)"' : "") +
    ">\n" +
    `${localRegionMarkup}\n` +
    "  </g>\n" +
    (layerType === "blocks"
      ? ""
      : `${placeholderLayer("block-layer", "blocks", `${tehsilFeatureId}-BLOCKS`, `${tehsilFeatureId}-BLOCK-{CODE}`)}\n`) +
    (layerType === "villages"
      ? ""
      : `${placeholderLayer("village-layer", "villages", `${tehsilFeatureId}-VILLAGES`, `${tehsilFeatureId}-VILLAGE-{SOURCE_ID}`)}\n`) +
    (layerType === "gram-panchayats"
      ? ""
      : `${placeholderLayer("gram-panchayat-layer", "gram-panchayats", `${tehsilFeatureId}-GRAM-PANCHAYATS`, `${tehsilFeatureId}-GRAM-PANCHAYAT-{CODE}`)}\n`) +
    (layerType === "wards"
      ? ""
      : `${placeholderLayer("ward-layer", "wards", `${tehsilFeatureId}-WARDS`, `${tehsilFeatureId}-WARD-{CODE}`)}\n`) +
    (layerType === "other"
      ? ""
      : `${placeholderLayer("other-boundary-layer", "other", `${tehsilFeatureId}-LOCAL-AREAS`, `${tehsilFeatureId}-LOCAL-AREA-{CODE}`)}\n`) +
    "</svg>\n"
  );
}

async function main() {
  const options = argumentsByName(process.argv.slice(2));
  const sourcePath = required(options, "source");
  const outlinePath = required(options, "outline-source");
  const output = required(options, "output");
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const outlineDocument = JSON.parse(await readFile(outlinePath, "utf8"));
  const features =
    source.type === "FeatureCollection" ? source.features : [source];
  const outline =
    outlineDocument.type === "FeatureCollection"
      ? outlineDocument.features[0]
      : outlineDocument;
  if (!features.length || !outline?.geometry) {
    throw new Error("The local boundary or outline geometry is empty");
  }

  const d3 = await loadD3();
  const svg = buildSvg(features, outline, options, d3);
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(output, svg, "utf8");
  process.stdout.write(
    `Generated ${output} with ${features.length} projected ${options["layer-plural"] || "local boundary regions"}.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
