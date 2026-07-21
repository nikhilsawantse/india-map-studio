(function () {
  "use strict";

  const { colorBetween, parseCsv } = window.ExampleMapUtils;
  const elements = { status: document.querySelector("#comparison-status"), caption: document.querySelector("#comparison-caption") };

  function baselineShare(record) {
    return 38 + ((record.demo_index - 35) / 56) * 24;
  }

  function currentShare(record) {
    const hash = [...record.slug].reduce((total, character) => total + character.charCodeAt(0), 0);
    return Math.max(32, Math.min(68, baselineShare(record) + ((hash % 11) - 5) * 1.15));
  }

  function fillFor(share) {
    const margin = Math.min(1, Math.abs(share - 50) / 18);
    return share >= 50
      ? colorBetween([238, 220, 211], [183, 77, 43], margin)
      : colorBetween([215, 229, 232], [42, 104, 119], margin);
  }

  function describe(record) {
    const before = baselineShare(record);
    const after = currentShare(record);
    const leader = after >= 50 ? "Group A" : "Group B";
    const changed = (before >= 50) !== (after >= 50) ? " The leading group changed." : "";
    return `${record.name}: baseline ${before.toFixed(1)}% Group A; current ${after.toFixed(1)}%. ${leader} leads now.${changed}`;
  }

  async function buildMap(mount, records, valueAccessor) {
    const map = new IndiaMapEngine({ mount, src: "../assets/maps/india-states.svg", featureSelector: ".map-region", featureKey: "slug", dataKey: "slug", data: records });
    map.on("featureenter", (event) => { if (event.detail.feature?.data) elements.caption.textContent = describe(event.detail.feature.data); });
    map.on("featurefocus", (event) => { if (event.detail.feature?.data) elements.caption.textContent = describe(event.detail.feature.data); });
    map.on("featureleave", () => { elements.caption.textContent = "Hover or focus either map to compare that region."; });
    await map.load();
    map.getFeatures().forEach((feature) => {
      if (!feature.data) return;
      const value = valueAccessor(feature.data);
      feature.element.style.setProperty("--example-fill", fillFor(value));
      feature.element.setAttribute("aria-label", `${feature.data.name}, Group A ${value.toFixed(1)} percent`);
    });
    return map;
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-state-demo.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`Base dataset request failed (${response.status}).`);
    const records = parseCsv(await response.text()).map((record) => ({ ...record, demo_index: Number(record.demo_index) }));
    await Promise.all([
      buildMap("#comparison-map-a", records, baselineShare),
      buildMap("#comparison-map-b", records, currentShare),
    ]);
    const changed = records.filter((record) => (baselineShare(record) >= 50) !== (currentShare(record) >= 50)).length;
    elements.status.textContent = `${records.length} matching regions compared · ${changed} changed leaders`;
  }

  initialize().catch((error) => { elements.status.textContent = "The comparison example could not load."; elements.caption.textContent = error.message; console.error(error); });
})();
