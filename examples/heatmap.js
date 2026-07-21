(function () {
  "use strict";

  const { createProjector, loadPresentationMap, svgElement } = window.ExampleMapUtils;
  const elements = {
    mount: document.querySelector("#heat-map"), status: document.querySelector("#heat-status"),
    caption: document.querySelector("#heat-caption"), category: document.querySelector("#heat-category"),
    radius: document.querySelector("#heat-radius"), radiusValue: document.querySelector("#heat-radius-value"),
  };
  let dataset;
  let heatLayer;
  let focusLayer;
  const weights = { reservoir: 0.72, sanctuary: 0.58, station: 1 };

  function isVisible(marker) {
    return elements.category.value === "all" || marker.category === elements.category.value;
  }

  function render() {
    const radius = Number(elements.radius.value);
    elements.radiusValue.textContent = String(radius);
    const visible = dataset.markers.filter(isVisible);
    heatLayer.querySelectorAll("circle").forEach((circle) => {
      const marker = dataset.markers.find((item) => item.id === circle.dataset.markerId);
      circle.classList.toggle("is-hidden", !isVisible(marker));
      circle.setAttribute("r", String(radius * weights[marker.category]));
    });
    focusLayer.querySelectorAll("g").forEach((group) => {
      const marker = dataset.markers.find((item) => item.id === group.dataset.markerId);
      group.classList.toggle("is-hidden", !isVisible(marker));
    });
    elements.status.textContent = `${visible.length} source points contributing to the heat layer`;
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-poi-layers-demo.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`POI dataset request failed (${response.status}).`);
    dataset = await response.json();
    const project = createProjector(dataset.projection);
    const map = await loadPresentationMap(elements.mount);
    const defs = svgElement("defs");
    const gradient = svgElement("radialGradient", { id: "example-heat-gradient" });
    gradient.append(svgElement("stop", { offset: "0%", "stop-color": "#e04f2f", "stop-opacity": "0.84" }));
    gradient.append(svgElement("stop", { offset: "42%", "stop-color": "#f2a13a", "stop-opacity": "0.56" }));
    gradient.append(svgElement("stop", { offset: "100%", "stop-color": "#f3cf58", "stop-opacity": "0" }));
    defs.append(gradient);
    map.svg.prepend(defs);
    heatLayer = svgElement("g", { class: "example-heat-layer", "aria-hidden": "true" });
    focusLayer = svgElement("g", { class: "example-heat-focus-layer", "aria-label": "Heat source places" });
    dataset.markers.forEach((marker) => {
      const [x, y] = project(marker.longitude, marker.latitude);
      const heat = svgElement("circle", { cx: x.toFixed(2), cy: y.toFixed(2), fill: "url(#example-heat-gradient)" });
      heat.dataset.markerId = marker.id;
      heatLayer.append(heat);
      const focus = svgElement("g", { class: "example-heat-source", transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`, tabindex: "0", role: "button", "aria-label": `${marker.name}, ${marker.categoryLabel}` });
      focus.dataset.markerId = marker.id;
      focus.append(svgElement("circle", { r: "12", class: "example-heat-hit" }), svgElement("circle", { r: "2.8", class: "example-heat-dot" }));
      const describe = () => { elements.caption.textContent = `${marker.name}: ${marker.categoryLabel} in ${marker.state}.`; };
      focus.addEventListener("focus", describe);
      focus.addEventListener("pointerenter", describe);
      focusLayer.append(focus);
    });
    map.svg.append(heatLayer, focusLayer);
    render();
  }

  elements.category.addEventListener("change", render);
  elements.radius.addEventListener("input", render);
  initialize().catch((error) => {
    elements.status.textContent = "The heatmap example could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  });
})();
