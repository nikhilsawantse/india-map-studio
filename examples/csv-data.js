(function () {
  "use strict";

  const SAMPLE_URL = "../sample-data/maharashtra-district-demo.csv";
  const IDENTIFIER_FIELDS = new Set([
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
  ]);
  const elements = {
    map: document.querySelector("#csv-map"),
    status: document.querySelector("#csv-status"),
    clear: document.querySelector("#csv-clear"),
    file: document.querySelector("#csv-file"),
    reset: document.querySelector("#csv-reset"),
    field: document.querySelector("#csv-field"),
    detail: document.querySelector("#csv-detail"),
    summary: document.querySelector("#csv-join-summary"),
    legend: document.querySelector("#csv-legend"),
    selection: document.querySelector("#csv-selection"),
    profile: document.querySelector("#csv-profile-fields"),
  };

  let map = null;
  let recordsByFeature = new Map();
  let currentField = "";
  let joinField = "";

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
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }

    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
    if (rows.length < 2) throw new Error("The CSV needs a header and at least one data row.");

    const headers = rows[0].map((header, index) =>
      (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim(),
    );
    if (headers.some((header) => !header)) throw new Error("Every CSV column needs a header.");

    return rows.slice(1).map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
  }

  function normalize(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function humanize(value) {
    const label = String(value).replace(/[_-]+/g, " ").trim();
    return label ? label[0].toLocaleUpperCase() + label.slice(1) : "Field";
  }

  function featureLookup() {
    const lookup = new Map();
    map.getFeatures().forEach((feature) => {
      const values = [
        feature.id,
        feature.attributes.featureId,
        feature.attributes.slug,
        feature.attributes.code,
        feature.attributes.lgdCode,
        feature.attributes.district,
      ];
      values.forEach((value) => {
        const key = normalize(value);
        if (key) lookup.set(key, feature.id);
      });
    });
    return lookup;
  }

  function detectJoin(records, lookup) {
    const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
    const priority = [...IDENTIFIER_FIELDS];
    const candidates = columns.map((column) => ({
      column,
      matches: records.reduce(
        (count, record) => count + (lookup.has(normalize(record[column])) ? 1 : 0),
        0,
      ),
      priority: priority.indexOf(column.toLocaleLowerCase()),
    }));
    candidates.sort(
      (left, right) =>
        right.matches - left.matches ||
        (left.priority < 0 ? priority.length : left.priority) -
          (right.priority < 0 ? priority.length : right.priority),
    );
    return candidates[0]?.matches ? candidates[0] : null;
  }

  function fieldNames(records, matchedField) {
    return [...new Set(records.flatMap((record) => Object.keys(record)))].filter((field) => {
      if (field === matchedField || IDENTIFIER_FIELDS.has(field.toLocaleLowerCase())) return false;
      const values = [...recordsByFeature.values()]
        .map((record) => record[field])
        .filter((value) => String(value ?? "").trim() !== "");
      const numeric = values.length > 0 && values.every((value) => Number.isFinite(Number(value)));
      return numeric || new Set(values.map(String)).size <= 6;
    });
  }

  function isNumericField(field) {
    const values = [...recordsByFeature.values()]
      .map((record) => record[field])
      .filter((value) => String(value ?? "").trim() !== "");
    return values.length > 0 && values.every((value) => Number.isFinite(Number(value)));
  }

  function colorForNumber(value, minimum, maximum) {
    const ratio = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum || 1)));
    const low = [224, 238, 228];
    const high = [17, 93, 77];
    return `rgb(${low
      .map((channel, index) => Math.round(channel + (high[index] - channel) * ratio))
      .join(", ")})`;
  }

  function clearFeatureColors() {
    map.getFeatures().forEach((feature) => feature.element.style.removeProperty("--example-fill"));
  }

  function buildNumericLegend(field, values) {
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const title = document.createElement("strong");
    title.textContent = humanize(field);
    const gradient = document.createElement("div");
    gradient.className = "example-gradient";
    const labels = document.createElement("div");
    labels.className = "example-legend-labels";
    labels.append(
      Object.assign(document.createElement("span"), { textContent: String(minimum) }),
      Object.assign(document.createElement("span"), { textContent: String(maximum) }),
    );
    elements.legend.replaceChildren(title, gradient, labels);
    return { minimum, maximum };
  }

  function buildCategoryLegend(field, categories) {
    const title = document.createElement("strong");
    title.textContent = humanize(field);
    const list = document.createElement("ul");
    list.className = "example-category-legend";
    categories.forEach((category, index) => {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "example-category-swatch";
      swatch.style.setProperty("--swatch-color", `var(--csv-category-${(index % 6) + 1})`);
      item.append(swatch, category);
      list.append(item);
    });
    elements.legend.replaceChildren(title, list);
  }

  function applyField(field) {
    currentField = field;
    clearFeatureColors();
    const entries = map.getFeatures()
      .map((feature) => ({ feature, value: feature.data?.[field] }))
      .filter((entry) => String(entry.value ?? "").trim() !== "");

    if (isNumericField(field)) {
      const values = entries.map((entry) => Number(entry.value));
      const scale = buildNumericLegend(field, values);
      entries.forEach(({ feature, value }) => {
        feature.element.style.setProperty(
          "--example-fill",
          colorForNumber(Number(value), scale.minimum, scale.maximum),
        );
      });
    } else {
      const categories = [...new Set(entries.map((entry) => String(entry.value)))].sort();
      const colors = new Map(
        categories.map((category, index) => [category, `var(--csv-category-${(index % 6) + 1})`]),
      );
      buildCategoryLegend(field, categories);
      entries.forEach(({ feature, value }) => {
        feature.element.style.setProperty("--example-fill", colors.get(String(value)));
      });
    }

    const selectedId = map.getSelectedId();
    if (selectedId) renderProfile(map.describe(selectedId));
    elements.detail.textContent = `${humanize(field)} colors ${entries.length} matched districts.`;
  }

  function renderProfile(feature) {
    if (!feature?.data) {
      elements.selection.textContent = "Nothing selected";
      const row = document.createElement("div");
      row.append(
        Object.assign(document.createElement("dt"), { textContent: "Tip" }),
        Object.assign(document.createElement("dd"), { textContent: "Select a district on the map." }),
      );
      elements.profile.replaceChildren(row);
      return;
    }

    elements.selection.textContent = feature.attributes.district || feature.data.district_name || feature.id;
    const fields = [
      currentField,
      "population_index",
      "literacy_rate",
      "development_zone",
      "project_status",
      "priority_score",
      "summary",
    ]
      .filter((field, index, fieldsList) => field && fieldsList.indexOf(field) === index)
      .filter((field) => Object.hasOwn(feature.data, field));
    elements.profile.replaceChildren(
      ...fields.map((field) => {
        const row = document.createElement("div");
        row.append(
          Object.assign(document.createElement("dt"), { textContent: humanize(field) }),
          Object.assign(document.createElement("dd"), {
            textContent:
              feature.data[field] === "" || feature.data[field] == null
                ? "-"
                : String(feature.data[field]),
          }),
        );
        return row;
      }),
    );
  }

  function describe(feature) {
    if (!feature) return "No district data is available.";
    const name = feature.attributes.district || feature.id;
    const value = feature.data?.[currentField];
    return value === undefined || value === ""
      ? `${name}: no ${humanize(currentField).toLocaleLowerCase()} value.`
      : `${name}: ${humanize(currentField)} = ${value}.`;
  }

  function applyRecords(records, fileName) {
    if (!records.length) throw new Error("The CSV contains no data rows.");
    const lookup = featureLookup();
    const detected = detectJoin(records, lookup);
    if (!detected) throw new Error("No CSV column matches a district identifier or name.");

    joinField = detected.column;
    recordsByFeature = new Map();
    const unmatched = [];
    records.forEach((record) => {
      const featureId = lookup.get(normalize(record[joinField]));
      if (featureId) recordsByFeature.set(featureId, record);
      else unmatched.push(record[joinField]);
    });
    map.setData(recordsByFeature);

    const fields = fieldNames(records, joinField);
    if (!fields.length) throw new Error("Add at least one data column after the identifier column.");
    elements.field.replaceChildren(
      ...fields.map((field) => {
        const option = new Option(
          `${humanize(field)} (${isNumericField(field) ? "numeric" : "category"})`,
          field,
        );
        return option;
      }),
    );
    elements.field.disabled = false;
    const preferred = ["priority_score", "population_index", "literacy_rate"].find((field) =>
      fields.includes(field),
    );
    elements.field.value = preferred || fields[0];
    elements.summary.textContent = `${recordsByFeature.size} of ${records.length} rows matched by ${joinField}${
      unmatched.length ? `; ${unmatched.length} unmatched` : ""
    }.`;
    elements.status.textContent = `${fileName}: ${recordsByFeature.size} districts joined`;
    map.clearSelection({ source: "csv-import", force: true });
    applyField(elements.field.value);
  }

  async function loadSample() {
    elements.status.textContent = "Loading sample CSV...";
    const response = await fetch(SAMPLE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Sample CSV request failed (${response.status}).`);
    applyRecords(parseCsv(await response.text()), "maharashtra-district-demo.csv");
  }

  async function initialize() {
    map = new IndiaMapEngine({
      mount: elements.map,
      src: "../assets/maps/states/maharashtra.svg",
      featureSelector: ".district-region",
      featureKey: "featureId",
    });
    map.on("featureenter", (event) => {
      elements.detail.textContent = describe(event.detail.feature);
    });
    map.on("featurefocus", (event) => {
      elements.detail.textContent = describe(event.detail.feature);
    });
    map.on("featureleave", () => {
      elements.detail.textContent = map.getSelectedId()
        ? describe(map.describe(map.getSelectedId()))
        : "Hover, focus, or select a district to inspect its imported value.";
    });
    map.on("selectionchange", (event) => {
      elements.clear.disabled = !event.detail.id;
      renderProfile(event.detail.feature);
      elements.detail.textContent = event.detail.id
        ? describe(event.detail.feature)
        : "Hover, focus, or select a district to inspect its imported value.";
    });
    await map.load();
    await loadSample();
  }

  elements.field.addEventListener("change", () => applyField(elements.field.value));
  elements.clear.addEventListener("click", () => map.clearSelection({ source: "control" }));
  elements.reset.addEventListener("click", () => loadSample().catch(showError));
  elements.file.addEventListener("change", async () => {
    const file = elements.file.files?.[0];
    if (!file) return;
    try {
      applyRecords(parseCsv(await file.text()), file.name);
    } catch (error) {
      showError(error);
    } finally {
      elements.file.value = "";
    }
  });

  function showError(error) {
    elements.status.textContent = "CSV data could not be loaded.";
    elements.summary.textContent = error.message;
    console.error(error);
  }

  initialize().catch(showError);
})();
