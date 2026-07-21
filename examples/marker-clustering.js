(function () {
  "use strict";

  const DATA_URL = "../sample-data/india-poi-layers-demo.json";
  const { createProjector, loadPresentationMap, svgElement } = window.ExampleMapUtils;
  const elements = {
    mount: document.querySelector("#cluster-map"),
    status: document.querySelector("#cluster-status"),
    caption: document.querySelector("#cluster-caption"),
    radius: document.querySelector("#cluster-radius"),
    reset: document.querySelector("#cluster-reset"),
    selection: document.querySelector("#cluster-selection"),
    meta: document.querySelector("#cluster-selection-meta"),
  };
  let points = [];
  let layer;

  function groupPoints(radius) {
    const clusters = [];
    points.forEach((point) => {
      let target = clusters.find((cluster) => Math.hypot(point.x - cluster.x, point.y - cluster.y) <= radius);
      if (!target) {
        target = { x: point.x, y: point.y, members: [] };
        clusters.push(target);
      }
      target.members.push(point);
      target.x = target.members.reduce((sum, member) => sum + member.x, 0) / target.members.length;
      target.y = target.members.reduce((sum, member) => sum + member.y, 0) / target.members.length;
    });
    return clusters;
  }

  function selectCluster(cluster) {
    const names = cluster.members.map((point) => point.marker.name);
    elements.selection.textContent = cluster.members.length === 1 ? names[0] : `${cluster.members.length} nearby places`;
    elements.meta.textContent = names.join(" · ");
    elements.caption.textContent = cluster.members.length === 1
      ? `${names[0]} in ${cluster.members[0].marker.state}.`
      : `Cluster contains ${names.join(", ")}.`;
  }

  function render() {
    const radius = Number(elements.radius.value);
    const clusters = groupPoints(radius);
    const nodes = clusters.map((cluster) => {
      const many = cluster.members.length > 1;
      const group = svgElement("g", {
        class: `example-cluster-node${many ? " is-cluster" : ""}`,
        transform: `translate(${cluster.x.toFixed(2)} ${cluster.y.toFixed(2)})`,
        tabindex: "0",
        role: "button",
        "aria-label": many
          ? `${cluster.members.length} nearby places: ${cluster.members.map((point) => point.marker.name).join(", ")}`
          : cluster.members[0].marker.name,
      });
      group.append(svgElement("circle", { r: many ? String(12 + Math.sqrt(cluster.members.length) * 3) : "8" }));
      if (many) {
        const count = svgElement("text", { "text-anchor": "middle", y: "4" });
        count.textContent = String(cluster.members.length);
        group.append(count);
      }
      group.addEventListener("click", () => selectCluster(cluster));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectCluster(cluster);
        }
      });
      return group;
    });
    layer.replaceChildren(...nodes);
    const grouped = clusters.filter((cluster) => cluster.members.length > 1).length;
    elements.status.textContent = `${points.length} places rendered as ${clusters.length} symbols · ${grouped} clusters`;
    elements.caption.textContent = "Select a marker or numbered cluster.";
  }

  async function initialize() {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`POI dataset request failed (${response.status}).`);
    const dataset = await response.json();
    const project = createProjector(dataset.projection);
    points = dataset.markers.map((marker) => {
      const [x, y] = project(marker.longitude, marker.latitude);
      return { marker, x, y };
    });
    const map = await loadPresentationMap(elements.mount);
    layer = svgElement("g", { class: "example-cluster-layer", "aria-label": "Clustered places" });
    map.svg.append(layer);
    render();
  }

  elements.radius.addEventListener("change", render);
  elements.reset.addEventListener("click", () => {
    elements.radius.value = "68";
    elements.selection.textContent = "Nothing selected";
    elements.meta.textContent = "Choose a map symbol to inspect its members.";
    render();
  });
  initialize().catch((error) => {
    elements.status.textContent = "The clustering example could not load.";
    elements.caption.textContent = error.message;
    console.error(error);
  });
})();
