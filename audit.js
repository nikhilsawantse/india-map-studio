(function () {
  "use strict";

  const states = Array.isArray(window.INDIA_STATES) ? window.INDIA_STATES : [];
  const audit = window.INDIA_BOUNDARY_AUDIT || { reference: {}, regions: [] };
  const officialBySlug = new Map(
    audit.regions.map((region) => [region.slug, region.officialDistricts]),
  );

  const rowsMount = document.querySelector("#audit-rows");
  const emptyState = document.querySelector("#audit-empty");
  const status = document.querySelector("#audit-status");
  const search = document.querySelector("#audit-search");
  const filter = document.querySelector("#audit-filter");
  const sort = document.querySelector("#audit-sort");
  const sourceName = document.querySelector("#audit-source-name");
  const sourceDate = document.querySelector("#audit-source-date");
  const sourceLink = document.querySelector("#audit-source-link");
  const mappedTotal = document.querySelector("#audit-mapped-total");
  const officialTotal = document.querySelector("#audit-official-total");
  const reviewTotal = document.querySelector("#audit-review-total");
  const alignedTotal = document.querySelector("#audit-aligned-total");

  let records = [];

  function formatDate(value) {
    if (!value) return "Report date unavailable";
    const date = new Date(`${value}T00:00:00`);
    return `Report generated ${new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)}`;
  }

  function normalizeVintage(value) {
    const raw = String(value || "").trim();
    if (!raw) return "Not declared";
    if (/^2011(?:_c)?$/i.test(raw)) return "Census 2011";
    return raw
      .replace(/_c$/i, "")
      .replace(/_/g, " ")
      .replace(/\b(\d{4})\s+(\d{2})\b/, "$1-$2");
  }

  function summarizeVintages(values) {
    const normalized = [...new Set(values.map(normalizeVintage))];
    const declared = normalized.filter((value) => value !== "Not declared");
    if (!declared.length) return "Not declared";
    if (declared.length === 1 && normalized.length === 1) return declared[0];
    if (declared.length === 1) return `${declared[0]} + unspecified`;
    return "Mixed vintages";
  }

  async function inspectState(state) {
    const response = await fetch(state.svg);
    if (!response.ok) {
      throw new Error(`${state.name}: map request failed (${response.status})`);
    }

    const source = await response.text();
    const svg = new DOMParser().parseFromString(source, "image/svg+xml");
    if (svg.querySelector("parsererror")) {
      throw new Error(`${state.name}: invalid SVG`);
    }

    const layer = svg.querySelector('[data-layer-type="districts"], #district-layer');
    const districtElements = layer
      ? [...layer.querySelectorAll(".district-region")]
      : [];
    const attributeCount = Number(layer?.dataset.districtCount);
    const mappedDistricts = Number.isFinite(attributeCount)
      ? attributeCount
      : districtElements.length;
    const officialDistricts = officialBySlug.get(state.slug);
    const gap = officialDistricts - mappedDistricts;

    return {
      ...state,
      mappedDistricts,
      officialDistricts,
      gap,
      result: gap === 0 ? "aligned" : "review",
      vintage: summarizeVintages(
        districtElements.map((element) => element.dataset.boundaryYear),
      ),
    };
  }

  function resultCopy(record) {
    if (record.gap > 0) {
      return `${record.gap} ${record.gap === 1 ? "district" : "districts"} not represented`;
    }
    if (record.gap < 0) {
      const amount = Math.abs(record.gap);
      return `${amount} extra mapped ${amount === 1 ? "feature" : "features"}; reconcile definitions`;
    }
    return "Count aligned; validate geometry";
  }

  function renderSummary() {
    const totals = records.reduce(
      (summary, record) => {
        summary.mapped += record.mappedDistricts;
        summary.official += record.officialDistricts;
        summary[record.result] += 1;
        return summary;
      },
      { mapped: 0, official: 0, review: 0, aligned: 0 },
    );

    mappedTotal.textContent = totals.mapped.toLocaleString("en-IN");
    officialTotal.textContent = totals.official.toLocaleString("en-IN");
    reviewTotal.textContent = totals.review;
    alignedTotal.textContent = totals.aligned;
  }

  function sortedVisibleRecords() {
    const query = search.value.trim().toLocaleLowerCase();
    const resultFilter = filter.value;
    const sortMode = sort.value;

    return records
      .filter((record) => {
        const matchesSearch = `${record.name} ${record.type}`
          .toLocaleLowerCase()
          .includes(query);
        const matchesResult =
          resultFilter === "all" || record.result === resultFilter;
        return matchesSearch && matchesResult;
      })
      .sort((first, second) => {
        if (sortMode === "name") return first.name.localeCompare(second.name);
        if (sortMode === "mapped") {
          return (
            second.mappedDistricts - first.mappedDistricts ||
            first.name.localeCompare(second.name)
          );
        }
        return (
          Math.abs(second.gap) - Math.abs(first.gap) ||
          first.name.localeCompare(second.name)
        );
      });
  }

  function createRow(record) {
    const row = document.createElement("tr");
    row.className = `audit-row audit-row-${record.result}`;

    const regionCell = document.createElement("th");
    regionCell.scope = "row";
    regionCell.innerHTML = "<strong></strong><small></small>";
    regionCell.querySelector("strong").textContent = record.name;
    regionCell.querySelector("small").textContent = record.type;

    const mappedCell = document.createElement("td");
    mappedCell.dataset.label = "Mapped";
    mappedCell.textContent = record.mappedDistricts;

    const officialCell = document.createElement("td");
    officialCell.dataset.label = "LGD";
    officialCell.textContent = record.officialDistricts;

    const gapCell = document.createElement("td");
    gapCell.dataset.label = "Gap";
    gapCell.className = "audit-gap";
    gapCell.textContent =
      record.gap === 0 ? "0" : `${record.gap > 0 ? "+" : ""}${record.gap}`;

    const vintageCell = document.createElement("td");
    vintageCell.dataset.label = "Source vintage";
    vintageCell.textContent = record.vintage;

    const resultCell = document.createElement("td");
    resultCell.dataset.label = "Audit result";
    resultCell.innerHTML = '<span class="audit-result-badge"></span><small></small>';
    resultCell.querySelector("span").textContent =
      record.result === "aligned" ? "Count aligned" : "Review";
    resultCell.querySelector("small").textContent = resultCopy(record);

    const actionCell = document.createElement("td");
    actionCell.className = "audit-row-action";
    const link = document.createElement("a");
    link.href = `state.html?state=${encodeURIComponent(record.slug)}`;
    link.textContent = "Open map";
    link.setAttribute("aria-label", `Open ${record.name} district map`);
    actionCell.append(link);

    row.append(
      regionCell,
      mappedCell,
      officialCell,
      gapCell,
      vintageCell,
      resultCell,
      actionCell,
    );
    return row;
  }

  function renderRows() {
    const visible = sortedVisibleRecords();
    rowsMount.replaceChildren(...visible.map(createRow));
    emptyState.hidden = visible.length > 0;
    status.textContent = `${visible.length} of ${records.length} layers shown`;
  }

  async function loadAudit() {
    sourceName.textContent = audit.reference.name || "Official district reference";
    sourceDate.textContent = formatDate(audit.reference.reportDate);
    sourceLink.href = audit.reference.url || sourceLink.href;

    const inspections = await Promise.allSettled(states.map(inspectState));
    records = inspections
      .filter((inspection) => inspection.status === "fulfilled")
      .map((inspection) => inspection.value);

    const failures = inspections.filter(
      (inspection) => inspection.status === "rejected",
    );
    renderSummary();
    renderRows();

    if (failures.length) {
      status.textContent = `${records.length} layers loaded; ${failures.length} could not be read`;
      console.error(
        "Boundary audit failures",
        failures.map((failure) => failure.reason),
      );
    }
  }

  search.addEventListener("input", renderRows);
  filter.addEventListener("change", renderRows);
  sort.addEventListener("change", renderRows);

  loadAudit().catch((error) => {
    status.textContent = "The boundary audit could not be loaded.";
    console.error(error);
  });
})();
