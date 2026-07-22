(function () {
  "use strict";

  const layouts = [
    { root: ".workspace", controls: ".control-panel", map: ".map-panel" },
    { root: ".state-workspace", controls: ".state-copy", map: ".state-map-panel" },
    { root: ".district-workspace", controls: ".district-page-copy", map: ".district-page-map-panel" },
    { root: ".custom-map-workspace", controls: ".custom-import-panel", map: ".custom-map-preview-panel" },
    { root: ".example-workspace", controls: ".example-control-panel", map: ".example-map-panel" },
    { root: ".example-print-layout", controls: ".example-print-controls", map: ".example-print-report" },
    { root: ".example-embed-layout", controls: ".example-control-panel", map: ".example-embed-preview", controlsLabel: "Settings", mapLabel: "Preview" },
    { root: ".example-story-layout", controls: ".example-story-panel", map: ".example-map-panel", controlsLabel: "Story", mapLabel: "Map" }
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function ensureId(element, suffix) {
    if (!element.id) element.id = `mobile-workspace-${suffix}`;
    return element.id;
  }

  function jumpButton(label, target, name) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.mobileWorkspaceTarget = name;
    button.setAttribute("aria-controls", ensureId(target, name));
    button.addEventListener("click", () => {
      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    });
    return button;
  }

  const configuration = layouts
    .map((layout) => ({ ...layout, rootElement: document.querySelector(layout.root) }))
    .find((layout) => layout.rootElement);

  if (!configuration || configuration.rootElement.querySelector(":scope > .mobile-workspace-nav")) return;

  const controls = configuration.rootElement.querySelector(configuration.controls);
  const map = configuration.rootElement.querySelector(configuration.map);
  if (!controls || !map) return;

  const navigation = document.createElement("nav");
  navigation.className = "mobile-workspace-nav";
  navigation.setAttribute("aria-label", "Mobile workspace navigation");
  const label = document.createElement("span");
  label.textContent = "Jump to";
  navigation.append(
    label,
    jumpButton(configuration.controlsLabel || "Controls", controls, "controls"),
    jumpButton(configuration.mapLabel || "Map", map, "map")
  );
  configuration.rootElement.classList.add("has-mobile-workspace-nav");
  configuration.rootElement.prepend(navigation);
})();
