(function (global) {
  "use strict";

  const EVENT_PREFIX = "india-map:";
  const DEFAULTS = Object.freeze({
    mount: null,
    src: "",
    svgText: "",
    featureSelector: ".map-region",
    featureKey: "slug",
    dataKey: "",
    data: [],
    selectedClass: "is-selected",
    hoveredClass: "is-hovered",
    interactive: true,
    keyboard: true,
    sanitize: true,
    fetchOptions: {},
  });

  function resolveElement(value) {
    if (value instanceof Element) return value;
    if (typeof value === "string") return document.querySelector(value);
    return null;
  }

  function normalizeData(data, keyName) {
    if (data instanceof Map) return new Map(data);
    if (Array.isArray(data)) {
      return new Map(
        data
          .map((item) => [String(item?.[keyName] ?? ""), item])
          .filter(([key]) => key),
      );
    }
    if (data && typeof data === "object") return new Map(Object.entries(data));
    return new Map();
  }

  function safeSvgFragment(svgText) {
    const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
    if (parsed.querySelector("parsererror") || !parsed.documentElement.matches("svg")) {
      throw new Error("The map source is not a valid SVG document.");
    }
    parsed
      .querySelectorAll("script, foreignObject, iframe, object, embed")
      .forEach((node) => node.remove());
    parsed.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith("on") || value.includes("javascript:")) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return document.importNode(parsed.documentElement, true);
  }

  class IndiaMapEngine {
    static defaults = DEFAULTS;
    static eventPrefix = EVENT_PREFIX;

    constructor(configuration = {}) {
      this.config = { ...DEFAULTS, ...configuration };
      this.mount = resolveElement(this.config.mount);
      if (!this.mount) {
        throw new TypeError("IndiaMapEngine requires a valid mount element.");
      }
      this.features = [];
      this.featuresById = new Map();
      this.data = normalizeData(
        this.config.data,
        this.config.dataKey ||
          (typeof this.config.featureKey === "string" ? this.config.featureKey : "id"),
      );
      this.selectedId = null;
      this.hoveredId = null;
      this.svg = null;
      this.abortController = null;
      this.cleanup = [];
      this.destroyed = false;
    }

    async load() {
      if (this.destroyed) throw new Error("This map engine instance has been destroyed.");
      this.abortController?.abort();
      this.abortController = new AbortController();
      try {
        let svgText = this.config.svgText;
        if (!svgText) {
          if (!this.config.src) throw new Error("A map src or svgText value is required.");
          const response = await fetch(this.config.src, {
            ...this.config.fetchOptions,
            signal: this.abortController.signal,
          });
          if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
          svgText = await response.text();
        }
        this.render(svgText);
        return this;
      } catch (error) {
        if (error.name !== "AbortError") this.emit("maperror", { error });
        throw error;
      }
    }

    render(svgText) {
      this._clearFeatureListeners();
      this.mount.replaceChildren();
      if (this.config.sanitize) this.mount.append(safeSvgFragment(svgText));
      else this.mount.innerHTML = svgText;
      this.svg = this.mount.querySelector("svg");
      if (!this.svg) throw new Error("The map source did not contain an SVG element.");
      if (this.svg.querySelector('[tabindex], [role="link"], [role="button"]')) {
        this.svg.setAttribute("role", "group");
      }
      this.refresh();
      this.mount.classList.add("is-map-ready");
      this.emit("mapload", { featureCount: this.features.length, svg: this.svg });
      return this;
    }

    refresh() {
      this._clearFeatureListeners();
      this.features = [...this.mount.querySelectorAll(this.config.featureSelector)];
      this.featuresById.clear();
      this.features.forEach((element, index) => {
        const id = this._featureId(element, index);
        if (!id) return;
        element.dataset.mapFeatureId = id;
        this.featuresById.set(id, element);
        if (this.config.interactive) this._wireFeature(element, id);
      });
      this._applyState();
      return this;
    }

    select(id, options = {}) {
      const nextId = id == null || id === "" ? null : String(id);
      const previousId = this.selectedId;
      if (previousId === nextId && !options.force) return this;
      this.selectedId = nextId;
      this._applyState();
      const feature = nextId ? this.describe(nextId) : null;
      this.emit("selectionchange", {
        id: nextId,
        previousId,
        feature,
        source: options.source || "api",
      });
      if (nextId) {
        this.emit("featureselect", {
          id: nextId,
          feature,
          source: options.source || "api",
        });
      }
      return this;
    }

    clearSelection(options = {}) {
      return this.select(null, options);
    }

    hover(id, active = true, options = {}) {
      const nextId = active && id != null ? String(id) : null;
      const previousId = this.hoveredId;
      if (previousId === nextId) return this;
      this.hoveredId = nextId;
      this._applyState();
      this.emit(active ? "featureenter" : "featureleave", {
        id: active ? nextId : previousId,
        feature: this.describe(active ? nextId : previousId),
        source: options.source || "api",
      });
      return this;
    }

    setData(data) {
      this.data = normalizeData(
        data,
        this.config.dataKey ||
          (typeof this.config.featureKey === "string" ? this.config.featureKey : "id"),
      );
      this.emit("datachange", { size: this.data.size });
      return this;
    }

    getSelectedId() {
      return this.selectedId;
    }

    getFeatureElement(id) {
      return this.featuresById.get(String(id)) || null;
    }

    getFeatures() {
      return [...this.featuresById.keys()].map((id) => this.describe(id));
    }

    describe(id) {
      if (id == null) return null;
      const key = String(id);
      const element = this.featuresById.get(key) || null;
      if (!element && !this.data.has(key)) return null;
      return {
        id: key,
        element,
        data: this.data.get(key) || null,
        attributes: element ? { ...element.dataset } : {},
      };
    }

    on(eventName, handler, options) {
      const name = eventName.includes(":") ? eventName : `${EVENT_PREFIX}${eventName}`;
      this.mount.addEventListener(name, handler, options);
      return () => this.mount.removeEventListener(name, handler, options);
    }

    emit(eventName, detail = {}) {
      const name = eventName.includes(":") ? eventName : `${EVENT_PREFIX}${eventName}`;
      this.mount.dispatchEvent(
        new CustomEvent(name, { bubbles: true, detail: { engine: this, ...detail } }),
      );
    }

    destroy(options = {}) {
      this.abortController?.abort();
      this._clearFeatureListeners();
      this.mount.classList.remove("is-map-ready");
      if (options.clear !== false) this.mount.replaceChildren();
      this.features = [];
      this.featuresById.clear();
      this.svg = null;
      this.destroyed = true;
    }

    _featureId(element, index) {
      if (typeof this.config.featureKey === "function") {
        return String(this.config.featureKey(element, index) ?? "");
      }
      return String(element.dataset[this.config.featureKey] ?? element.id ?? "");
    }

    _wireFeature(element, id) {
      const listen = (type, handler) => {
        element.addEventListener(type, handler);
        this.cleanup.push(() => element.removeEventListener(type, handler));
      };
      const pointerDetail = (event, source = "map") => ({
        id,
        feature: this.describe(id),
        source,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      listen("pointerenter", (event) => {
        this.hoveredId = id;
        this._applyState();
        this.emit("featureenter", pointerDetail(event));
      });
      listen("pointermove", (event) => this.emit("featuremove", pointerDetail(event)));
      listen("pointerleave", (event) => {
        if (this.hoveredId === id) this.hoveredId = null;
        this._applyState();
        this.emit("featureleave", pointerDetail(event));
      });
      listen("focus", () => {
        this.hoveredId = id;
        this._applyState();
        this.emit("featurefocus", { id, feature: this.describe(id), source: "keyboard" });
      });
      listen("blur", () => {
        if (this.hoveredId === id) this.hoveredId = null;
        this._applyState();
        this.emit("featureblur", { id, feature: this.describe(id), source: "keyboard" });
      });
      listen("click", () => this.select(id, { source: "map" }));
      listen("dblclick", () =>
        this.emit("featureactivate", { id, feature: this.describe(id), source: "map" }),
      );
      listen("keydown", (event) => this._handleKeydown(event, id));
    }

    _handleKeydown(event, id) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.select(id, { source: "keyboard" });
        return;
      }
      if (!this.config.keyboard) return;
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const available = this.features.filter((feature) => !feature.hasAttribute("disabled"));
      const current = available.indexOf(event.currentTarget);
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      let next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : current + direction;
      next = (next + available.length) % available.length;
      available[next]?.focus();
    }

    _applyState() {
      this.featuresById.forEach((element, id) => {
        element.classList.toggle(this.config.selectedClass, id === this.selectedId);
        element.classList.toggle(this.config.hoveredClass, id === this.hoveredId);
        if (id === this.selectedId) element.setAttribute("aria-current", "true");
        else element.removeAttribute("aria-current");
      });
    }

    _clearFeatureListeners() {
      this.cleanup.splice(0).forEach((remove) => remove());
    }
  }

  global.IndiaMapEngine = IndiaMapEngine;
})(window);
