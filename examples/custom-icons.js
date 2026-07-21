(function () {
  "use strict";

  const { createProjector, loadPresentationMap, svgElement } = window.ExampleMapUtils;
  const elements = {
    mount: document.querySelector("#icon-map"), status: document.querySelector("#icon-status"),
    caption: document.querySelector("#icon-caption"), upload: document.querySelector("#icon-upload"),
    color: document.querySelector("#icon-color"), size: document.querySelector("#icon-size"),
    sizeValue: document.querySelector("#icon-size-value"), reset: document.querySelector("#icon-reset"),
    error: document.querySelector("#icon-error"), selection: document.querySelector("#icon-selection"),
    meta: document.querySelector("#icon-selection-meta"),
  };
  let stations = [];
  let layer;
  let customIconUrl = null;

  function sanitizeSvg(source) {
    const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
    if (documentNode.querySelector("parsererror") || documentNode.documentElement.localName !== "svg") throw new Error("Choose a valid SVG file.");
    documentNode.querySelectorAll("script, style, foreignObject, iframe, object, embed, audio, video").forEach((node) => node.remove());
    documentNode.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        const externalReference = value.includes("url(") && !value.includes("url(#");
        if (
          name.startsWith("on")
          || name === "style"
          || externalReference
          || ((name === "href" || name.endsWith(":href")) && !value.startsWith("#") && !value.startsWith("data:image/"))
        ) node.removeAttribute(attribute.name);
      });
    });
    const serialized = new XMLSerializer().serializeToString(documentNode.documentElement);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  }

  function makeDefaultIcon(group, size) {
    const scale = size / 26;
    const pin = svgElement("path", { d: "M0 12C-7 3-10-1-10-6A10 10 0 0110-6C10-1 7 3 0 12Z", class: "example-custom-pin", transform: `scale(${scale.toFixed(3)})` });
    pin.style.setProperty("--icon-color", elements.color.value);
    group.append(pin, svgElement("circle", { r: String(3.3 * scale), cy: String(-5 * scale), class: "example-custom-pin-dot" }));
  }

  function selectStation(station) {
    layer.querySelectorAll(".example-custom-marker").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.markerId === station.id));
    elements.selection.textContent = station.name;
    elements.meta.textContent = `${station.state} · ${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`;
    elements.caption.textContent = `${station.name} selected.`;
  }

  function render() {
    const size = Number(elements.size.value);
    elements.sizeValue.textContent = String(size);
    const markers = stations.map((station) => {
      const group = svgElement("g", { class: "example-custom-marker", transform: `translate(${station.x.toFixed(2)} ${station.y.toFixed(2)})`, tabindex: "0", role: "button", "aria-label": `${station.name}, ${station.state}` });
      group.dataset.markerId = station.id;
      group.append(svgElement("circle", { r: String(Math.max(15, size * 0.7)), class: "example-custom-hit" }));
      if (customIconUrl) {
        group.append(svgElement("image", { href: customIconUrl, x: String(-size / 2), y: String(-size / 2), width: String(size), height: String(size), preserveAspectRatio: "xMidYMid meet" }));
      } else makeDefaultIcon(group, size);
      group.addEventListener("click", () => selectStation(station));
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectStation(station); } });
      return group;
    });
    layer.replaceChildren(...markers);
    elements.status.textContent = `${stations.length} station markers · ${customIconUrl ? "custom SVG" : "default pin"}`;
  }

  async function handleUpload() {
    elements.error.textContent = "";
    const [file] = elements.upload.files;
    if (!file) return;
    if (file.size > 100000) { elements.error.textContent = "Keep the SVG under 100 KB."; elements.upload.value = ""; return; }
    try {
      customIconUrl = sanitizeSvg(await file.text());
      render();
      elements.caption.textContent = `${file.name} is now used for every station marker.`;
    } catch (error) {
      customIconUrl = null;
      elements.error.textContent = error.message;
      elements.upload.value = "";
      render();
    }
  }

  async function initialize() {
    const response = await fetch("../sample-data/india-poi-layers-demo.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Station dataset request failed (${response.status}).`);
    const dataset = await response.json();
    const project = createProjector(dataset.projection);
    stations = dataset.markers.filter((marker) => marker.category === "station").map((marker) => {
      const [x, y] = project(marker.longitude, marker.latitude);
      return { ...marker, x, y };
    });
    const map = await loadPresentationMap(elements.mount);
    layer = svgElement("g", { class: "example-custom-layer", "aria-label": "Custom station markers" });
    map.svg.append(layer);
    render();
  }

  elements.upload.addEventListener("change", handleUpload);
  elements.color.addEventListener("input", () => { if (!customIconUrl) render(); });
  elements.size.addEventListener("input", render);
  elements.reset.addEventListener("click", () => { customIconUrl = null; elements.upload.value = ""; elements.color.value = "#bf6b3d"; elements.size.value = "26"; elements.error.textContent = ""; render(); elements.caption.textContent = "Default pin restored."; });
  initialize().catch((error) => { elements.status.textContent = "The icon example could not load."; elements.caption.textContent = error.message; console.error(error); });
})();
