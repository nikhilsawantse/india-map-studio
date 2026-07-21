#!/usr/bin/env node
/**
 * Generate a dedicated district SVG from published child-boundary GeoJSON.
 *
 * The project stays framework-free at runtime. This build helper uses a pinned
 * d3-geo bundle to project longitude/latitude coordinates into the SVG viewBox.
 *
 * Example:
 * node tools/generate_district_svg.mjs \
 *   --source SubDistricts_2011.geojsonl \
 *   --output assets/maps/districts/maharashtra/pune.svg \
 *   --state-code 27 \
 *   --district-code 521 \
 *   --state-slug maharashtra \
 *   --district-slug pune \
 *   --district-name Pune \
 *   --district-feature-id IN-REGION-27-DISTRICT-521
 */

import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { createInterface } from "node:readline";
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

function normalizedCode(value) {
  return String(value ?? "").replace(/^0+/, "") || "0";
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

function featureMatches(feature, stateCode, districtCode) {
  const properties = feature?.properties || {};
  return (
    normalizedCode(properties.stcode11 ?? properties.State_LGD) ===
      normalizedCode(stateCode) &&
    normalizedCode(properties.dtcode11 ?? properties.Dist_LGD) ===
      normalizedCode(districtCode)
  );
}

async function readFeatures(sourcePath, stateCode, districtCode) {
  const matches = [];
  if (extname(sourcePath).toLowerCase() === ".geojsonl") {
    const lines = createInterface({
      input: createReadStream(sourcePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const feature = JSON.parse(line);
      if (featureMatches(feature, stateCode, districtCode)) {
        matches.push(feature);
      }
    }
    return matches;
  }

  const document = JSON.parse(await readFile(sourcePath, "utf8"));
  const features =
    document.type === "FeatureCollection" ? document.features : [document];
  return features.filter((feature) =>
    featureMatches(feature, stateCode, districtCode),
  );
}

function featureMetadata(feature) {
  const properties = feature.properties || {};
  const name =
    properties.sdtname ||
    properties.SUB_DIST ||
    properties.SUBDISTRICT ||
    properties.subdistrict ||
    properties.name;
  if (!name) {
    throw new Error("A child feature is missing its subdistrict name");
  }
  const rawCensusCode = String(
    properties.sdtcode11 ?? properties.subdistrict_code ?? "",
  ).trim();
  const censusCode = rawCensusCode
    ? rawCensusCode.padStart(5, "0")
    : "";
  const lgdCode = String(
    properties.Subdt_LGD ??
      properties.SUBDIS_LGD ??
      properties.subdistrict_lgd ??
      "",
  ).trim();
  const featureCode =
    censusCode ||
    lgdCode ||
    String(properties.source_id ?? properties.OBJECTID ?? slugify(name));
  return {
    name: String(name).trim().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    slug: slugify(name),
    censusCode,
    lgdCode,
    featureCode,
    geometryType: feature.geometry?.type || "",
  };
}

function layerMarkup(id, type, layerId, featurePattern, status = "placeholder") {
  return (
    `  <g id="${id}" class="district-child-layer" ` +
    `data-layer-type="${type}" data-status="${status}" ` +
    `data-layer-id="${layerId}" data-feature-pattern="${featurePattern}"></g>`
  );
}

function buildSvg(features, options, d3) {
  const districtName = required(options, "district-name");
  const districtFeatureId = required(options, "district-feature-id");
  const stateSlug = required(options, "state-slug");
  const districtSlug = required(options, "district-slug");
  const boundaryYear = options["boundary-year"] || "2011";
  const sourceLabel =
    options["source-label"] || "Census 2011 subdistrict boundaries";
  const sourceUrl = options["source-url"] || "";
  const collection = { type: "FeatureCollection", features };
  const projection = d3
    .geoMercator()
    .fitExtent(
      [
        [PADDING, PADDING],
        [VIEWBOX_WIDTH - PADDING, VIEWBOX_HEIGHT - PADDING],
      ],
      collection,
    );
  const path = d3.geoPath(projection).digits(2);
  const tehsilLayerId = `${districtFeatureId}-TEHSILS`;
  const featurePattern = `${districtFeatureId}-TEHSIL-{CODE}`;

  const regions = features
    .map((feature) => ({ feature, ...featureMetadata(feature) }))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((region) => {
      const identifier = `${districtFeatureId}-TEHSIL-${region.featureCode}`;
      return (
        `    <g id="tehsil-${escapeAttribute(region.slug)}" ` +
        `class="child-region" data-child-region="true" ` +
        `data-name="${escapeAttribute(region.name)}" ` +
        `data-slug="${escapeAttribute(region.slug)}" ` +
        `data-census-code="${escapeAttribute(region.censusCode)}" ` +
        `data-lgd-code="${escapeAttribute(region.lgdCode)}" ` +
        `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
        `data-geometry-type="${escapeAttribute(region.geometryType)}" ` +
        `data-feature-id="${escapeAttribute(identifier)}" ` +
        `tabindex="0" role="button" ` +
        `aria-label="Select ${escapeAttribute(region.name)} tehsil">\n` +
        `      <path d="${path(region.feature)}" vector-effect="non-scaling-stroke"/>\n` +
        "    </g>"
      );
    })
    .join("\n");

  const outline = path(collection);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" ` +
    'role="img" aria-labelledby="district-map-title district-map-description" ' +
    `data-state-slug="${escapeAttribute(stateSlug)}" ` +
    `data-district-slug="${escapeAttribute(districtSlug)}" ` +
    `data-district="${escapeAttribute(districtName)}" ` +
    `data-feature-id="${escapeAttribute(districtFeatureId)}" ` +
    `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
    `data-source="${escapeAttribute(sourceLabel)}" ` +
    `data-source-url="${escapeAttribute(sourceUrl)}">\n` +
    `  <title id="district-map-title">${escapeAttribute(districtName)} tehsil map</title>\n` +
    `  <desc id="district-map-description">Interactive ${escapeAttribute(districtName)} district map containing ${features.length} tehsil or taluka boundaries.</desc>\n` +
    `  <g id="district-outline" class="district-focus-region" data-feature-id="${escapeAttribute(districtFeatureId)}">\n` +
    `    <path d="${outline}" vector-effect="non-scaling-stroke"/>\n` +
    "  </g>\n" +
    `  <g id="tehsil-layer" class="district-child-layer" data-layer-type="tehsils" ` +
    `data-status="ready" data-feature-count="${features.length}" ` +
    `data-layer-id="${escapeAttribute(tehsilLayerId)}" ` +
    `data-feature-pattern="${escapeAttribute(featurePattern)}" ` +
    `data-boundary-year="${escapeAttribute(boundaryYear)}" ` +
    `data-source="${escapeAttribute(sourceLabel)}" ` +
    `data-source-url="${escapeAttribute(sourceUrl)}">\n` +
    `${regions}\n` +
    "  </g>\n" +
    `${layerMarkup("subdivision-layer", "subdivisions", `${districtFeatureId}-SUBDIVISIONS`, `${districtFeatureId}-SUBDIVISION-{CODE}`)}\n` +
    `${layerMarkup("block-layer", "blocks", `${districtFeatureId}-BLOCKS`, `${districtFeatureId}-BLOCK-{CODE}`)}\n` +
    `${layerMarkup("ward-layer", "wards", `${districtFeatureId}-WARDS`, `${districtFeatureId}-WARD-{CODE}`)}\n` +
    `${layerMarkup("other-boundary-layer", "other", `${districtFeatureId}-LOCAL-AREAS`, `${districtFeatureId}-LOCAL-AREA-{CODE}`)}\n` +
    "</svg>\n"
  );
}

async function main() {
  const options = argumentsByName(process.argv.slice(2));
  const source = required(options, "source");
  const output = required(options, "output");
  const stateCode = required(options, "state-code");
  const districtCode = required(options, "district-code");
  required(options, "state-slug");
  required(options, "district-slug");

  const features = await readFeatures(source, stateCode, districtCode);
  if (!features.length) {
    throw new Error(
      `No child features matched state ${stateCode}, district ${districtCode}`,
    );
  }
  const d3 = await loadD3();
  const svg = buildSvg(features, options, d3);
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(output, svg, "utf8");
  process.stdout.write(
    `Generated ${output} with ${features.length} projected child regions.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
