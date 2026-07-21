(function () {
  "use strict";

  const { colorBetween, parseCsv } = window.ExampleMapUtils;
  const elements = {
    status: document.querySelector("#time-status"), caption: document.querySelector("#time-caption"),
    year: document.querySelector("#time-year"), yearValue: document.querySelector("#time-year-value"),
    heading: document.querySelector("#time-year-heading"), play: document.querySelector("#time-play"),
  };
  let map;
  let records = [];
  let playingTimer = null;

  function stableOffset(slug, year) {
    const hash = [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
    return ((hash + (year - 2022) * 7) % 13) - 6;
  }

  function valueFor(record, year) {
    return Math.max(30, Math.min(100, record.demo_index + stableOffset(record.slug, year) + (year - 2022) * 2));
  }

  function describe(feature, year) {
    const record = records.find((item) => item.slug === feature?.id);
    return record ? `${record.name}: ${valueFor(record, year)} synthetic index points in ${year}.` : "No value is available.";
  }

  function renderYear() {
    const year = Number(elements.year.value);
    elements.yearValue.textContent = String(year);
    elements.heading.textContent = `Year ${year}`;
    map.getFeatures().forEach((feature) => {
      const record = records.find((item) => item.slug === feature.id);
      if (!record) return;
      feature.element.style.setProperty("--example-fill", colorBetween([224, 238, 228], [17, 93, 77], (valueFor(record, year) - 30) / 70));
      feature.element.setAttribute("aria-label", `${record.name}, ${valueFor(record, year)} synthetic index points in ${year}`);
    });
    elements.status.textContent = `${records.length} regions shown for ${year}`;
    elements.caption.textContent = "Hover or focus a region to inspect its value.";
  }

  function stopPlayback() {
    if (playingTimer) window.clearInterval(playingTimer);
    playingTimer = null;
    elements.play.textContent = "Play";
    elements.play.setAttribute("aria-pressed", "false");
  }

  function togglePlayback() {
    if (playingTimer) { stopPlayback(); return; }
    elements.play.textContent = "Pause";
    elements.play.setAttribute("aria-pressed", "true");
    playingTimer = window.setInterval(() => {
      const next = Number(elements.year.value) >= 2026 ? 2022 : Number(elements.year.value) + 1;
      elements.year.value = String(next);
      renderYear();
    }, 900);
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-state-demo.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`Base dataset request failed (${response.status}).`);
    records = parseCsv(await response.text()).map((record) => ({ ...record, demo_index: Number(record.demo_index) }));
    map = new IndiaMapEngine({ mount: "#time-map", src: "../assets/maps/india-states.svg", featureSelector: ".map-region", featureKey: "slug" });
    map.on("featureenter", (event) => { elements.caption.textContent = describe(event.detail.feature, Number(elements.year.value)); });
    map.on("featurefocus", (event) => { elements.caption.textContent = describe(event.detail.feature, Number(elements.year.value)); });
    map.on("featureleave", () => { elements.caption.textContent = "Hover or focus a region to inspect its value."; });
    await map.load();
    renderYear();
  }

  elements.year.addEventListener("input", () => { stopPlayback(); renderYear(); });
  elements.play.addEventListener("click", togglePlayback);
  initialize().catch((error) => { elements.status.textContent = "The time-series example could not load."; elements.caption.textContent = error.message; console.error(error); });
})();
