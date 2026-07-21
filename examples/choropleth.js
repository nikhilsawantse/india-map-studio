(function () {
  "use strict";

  const status = document.querySelector("#choropleth-status");
  const detail = document.querySelector("#choropleth-detail");
  const clear = document.querySelector("#choropleth-clear");

  function parseCsv(text) {
    const [header, ...rows] = text.trim().split(/\r?\n/);
    const fields = header.split(",");
    return rows.map((row) => {
      const values = row.split(",");
      return Object.fromEntries(fields.map((field, index) => [field, values[index]]));
    });
  }

  function colorFor(value, minimum, maximum) {
    const ratio = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum || 1)));
    const low = [224, 238, 228];
    const high = [17, 93, 77];
    const color = low.map((channel, index) =>
      Math.round(channel + (high[index] - channel) * ratio),
    );
    return `rgb(${color.join(", ")})`;
  }

  function describe(feature) {
    if (!feature?.data) return "No demonstration value is available.";
    return `${feature.data.name}: ${feature.data.demo_index} synthetic index points.`;
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-state-demo.csv");
    if (!response.ok) throw new Error(`Dataset request failed (${response.status})`);
    const records = parseCsv(await response.text()).map((record) => ({
      ...record,
      demo_index: Number(record.demo_index),
    }));
    const values = records.map((record) => record.demo_index);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const map = new IndiaMapEngine({
      mount: "#choropleth-map",
      src: "../assets/maps/india-states.svg",
      featureSelector: ".map-region",
      featureKey: "slug",
      dataKey: "slug",
      data: records,
    });

    map.on("featureenter", (event) => {
      detail.textContent = describe(event.detail.feature);
    });
    map.on("featurefocus", (event) => {
      detail.textContent = describe(event.detail.feature);
    });
    map.on("featureleave", () => {
      detail.textContent = map.getSelectedId()
        ? describe(map.describe(map.getSelectedId()))
        : "Hover or focus a region to inspect its demonstration value.";
    });
    map.on("selectionchange", (event) => {
      clear.disabled = !event.detail.id;
      detail.textContent = event.detail.id
        ? describe(event.detail.feature)
        : "Hover or focus a region to inspect its demonstration value.";
    });

    await map.load();
    map.getFeatures().forEach((feature) => {
      const value = feature.data?.demo_index;
      if (Number.isFinite(value)) {
        feature.element.style.setProperty("--example-fill", colorFor(value, minimum, maximum));
      }
    });
    status.textContent = `${records.length} CSV rows joined to ${map.getFeatures().length} regions`;
    clear.addEventListener("click", () => map.clearSelection({ source: "control" }));
  }

  initialize().catch((error) => {
    status.textContent = "The choropleth example could not load.";
    detail.textContent = error.message;
    console.error(error);
  });
})();
