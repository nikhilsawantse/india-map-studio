(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function rawMercator(longitude, latitude) {
    const limitedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
    return [
      (longitude * Math.PI) / 180,
      -Math.log(Math.tan(Math.PI / 4 + ((limitedLatitude * Math.PI) / 180) / 2)),
    ];
  }

  function createProjector(configuration) {
    const [west, south, east, north] = configuration.geographicBounds;
    const [, , width, height] = configuration.viewBox;
    const padding = configuration.padding;
    const [minimumX, maximumY] = rawMercator(west, south);
    const [maximumX, minimumY] = rawMercator(east, north);
    const contentWidth = maximumX - minimumX;
    const contentHeight = maximumY - minimumY;
    const scale = Math.min(
      (width - padding * 2) / contentWidth,
      (height - padding * 2) / contentHeight,
    );
    const offsetX = (width - contentWidth * scale) / 2;
    const offsetY = (height - contentHeight * scale) / 2;
    return (longitude, latitude) => {
      const [x, y] = rawMercator(longitude, latitude);
      return [offsetX + (x - minimumX) * scale, offsetY + (y - minimumY) * scale];
    };
  }

  function parseCsv(text) {
    const [header, ...rows] = text.trim().split(/\r?\n/);
    const fields = header.split(",");
    return rows.map((row) => {
      const values = row.split(",");
      return Object.fromEntries(fields.map((field, index) => [field, values[index]]));
    });
  }

  function colorBetween(low, high, ratio) {
    const amount = Math.max(0, Math.min(1, ratio));
    return `rgb(${low
      .map((channel, index) => Math.round(channel + (high[index] - channel) * amount))
      .join(", ")})`;
  }

  async function loadPresentationMap(mount) {
    const map = new IndiaMapEngine({
      mount,
      src: "../assets/maps/india-states.svg",
      featureSelector: ".map-region",
      featureKey: "slug",
      interactive: false,
    });
    await map.load();
    map.getFeatures().forEach((feature) => {
      feature.element.removeAttribute("tabindex");
      feature.element.removeAttribute("aria-label");
      feature.element.setAttribute("role", "presentation");
    });
    return map;
  }

  window.ExampleMapUtils = {
    colorBetween,
    createProjector,
    loadPresentationMap,
    parseCsv,
    svgElement,
  };
})();
