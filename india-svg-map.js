(function (global) {
  "use strict";

  class IndiaSvgMapElement extends HTMLElement {
    static get observedAttributes() {
      return ["src", "selected", "disabled"];
    }

    constructor() {
      super();
      this.engine = null;
      this.loading = null;
      this.reflectingSelection = false;
      this.handleSelection = this.handleSelection.bind(this);
    }

    connectedCallback() {
      this.setAttribute("role", this.getAttribute("role") || "group");
      this.initialize();
    }

    disconnectedCallback() {
      this.teardown();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === "selected" && this.engine && !this.reflectingSelection) {
        this.engine.select(newValue, { source: "attribute" });
        return;
      }
      if (name === "disabled" && this.engine) {
        this.engine.config.interactive = newValue == null;
        this.engine.refresh();
        return;
      }
      if (name === "src") this.initialize();
    }

    async initialize() {
      const src = this.getAttribute("src");
      if (!src || typeof global.IndiaMapEngine !== "function") return;
      this.teardown(false);
      this.engine = new global.IndiaMapEngine({
        mount: this,
        src,
        featureSelector: this.getAttribute("feature-selector") || ".map-region",
        featureKey: this.getAttribute("feature-key") || "slug",
        interactive: !this.hasAttribute("disabled"),
      });
      this.addEventListener("india-map:selectionchange", this.handleSelection);
      this.loading = this.engine.load();
      try {
        await this.loading;
        const selected = this.getAttribute("selected");
        if (selected) this.engine.select(selected, { source: "attribute" });
      } catch (error) {
        if (error.name !== "AbortError") this.textContent = "The SVG map could not load.";
      }
    }

    handleSelection(event) {
      if (event.target !== this) return;
      this.reflectingSelection = true;
      if (event.detail.id) this.setAttribute("selected", event.detail.id);
      else this.removeAttribute("selected");
      this.reflectingSelection = false;
    }

    select(id) {
      this.engine?.select(id, { source: "component-api" });
    }

    clearSelection() {
      this.engine?.clearSelection({ source: "component-api" });
    }

    get selected() {
      return this.engine?.getSelectedId() || null;
    }

    teardown(clear = true) {
      this.removeEventListener("india-map:selectionchange", this.handleSelection);
      this.engine?.destroy({ clear });
      this.engine = null;
      this.loading = null;
    }
  }

  if (!customElements.get("india-svg-map")) {
    customElements.define("india-svg-map", IndiaSvgMapElement);
  }
})(window);
