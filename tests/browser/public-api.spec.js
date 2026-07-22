import { expect, test } from "@playwright/test";

const publicMethods = [
  "load",
  "render",
  "refresh",
  "select",
  "clearSelection",
  "hover",
  "setData",
  "getSelectedId",
  "getFeatureElement",
  "getFeatures",
  "on",
  "destroy"
];

const publicEvents = [
  "mapload",
  "maperror",
  "featureenter",
  "featuremove",
  "featureleave",
  "featurefocus",
  "featureblur",
  "featureselect",
  "featureactivate",
  "selectionchange",
  "datachange"
];

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/multiple-maps.html");
  await expect(page.locator("india-svg-map").first()).toHaveClass(/is-map-ready/);
});

test("IndiaMapEngine exposes the frozen v1 public surface", async ({ page }) => {
  const contract = await page.evaluate((methods) => ({
    version: window.IndiaMapEngine.version,
    eventPrefix: window.IndiaMapEngine.eventPrefix,
    events: [...window.IndiaMapEngine.events],
    eventsFrozen: Object.isFrozen(window.IndiaMapEngine.events),
    methods: methods.map((name) => typeof window.IndiaMapEngine.prototype[name]),
    defaults: JSON.parse(JSON.stringify(window.IndiaMapEngine.defaults)),
    defaultsFrozen: Object.isFrozen(window.IndiaMapEngine.defaults),
    nestedDefaultsFrozen: Object.isFrozen(window.IndiaMapEngine.defaults.data)
      && Object.isFrozen(window.IndiaMapEngine.defaults.fetchOptions)
  }), publicMethods);

  expect(contract.version).toBe("1.0.0");
  expect(contract.eventPrefix).toBe("india-map:");
  expect(contract.events).toEqual(publicEvents);
  expect(contract.eventsFrozen).toBe(true);
  expect(contract.methods).toEqual(publicMethods.map(() => "function"));
  expect(contract.defaults).toEqual({
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
    fetchOptions: {}
  });
  expect(contract.defaultsFrozen).toBe(true);
  expect(contract.nestedDefaultsFrozen).toBe(true);
});

test("v1 selection and data events retain their documented detail", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const mount = document.createElement("div");
    document.body.append(mount);
    const engine = new window.IndiaMapEngine({
      mount,
      svgText: '<svg xmlns="http://www.w3.org/2000/svg"><path class="map-region" data-slug="alpha" d="M0 0h10v10z"/></svg>',
      data: [{ slug: "alpha", value: 7 }]
    });
    const details = [];
    engine.on("mapload", (event) => details.push({ name: event.type, detail: event.detail }));
    engine.on("selectionchange", (event) => details.push({ name: event.type, detail: event.detail }));
    await engine.load();
    engine.select("alpha", { source: "contract-test" });
    const description = engine.getFeatures()[0];
    const summary = {
      events: details.map(({ name, detail }) => ({
        name,
        id: detail.id ?? null,
        previousId: detail.previousId ?? null,
        source: detail.source ?? null,
        featureCount: detail.featureCount ?? null,
        hasEngine: detail.engine === engine
      })),
      selectedId: engine.getSelectedId(),
      description: {
        id: description.id,
        data: description.data,
        attributes: description.attributes
      }
    };
    engine.destroy();
    mount.remove();
    return summary;
  });

  expect(result.events).toEqual([
    {
      name: "india-map:mapload",
      id: null,
      previousId: null,
      source: null,
      featureCount: 1,
      hasEngine: true
    },
    {
      name: "india-map:selectionchange",
      id: "alpha",
      previousId: null,
      source: "contract-test",
      featureCount: null,
      hasEngine: true
    }
  ]);
  expect(result.selectedId).toBe("alpha");
  expect(result.description).toMatchObject({
    id: "alpha",
    data: { slug: "alpha", value: 7 },
    attributes: { slug: "alpha", mapFeatureId: "alpha" }
  });
});

test("india-svg-map retains its v1 attributes and component API", async ({ page }) => {
  const contract = await page.evaluate(() => {
    const Component = customElements.get("india-svg-map");
    const element = document.querySelector("india-svg-map");
    return {
      version: Component.version,
      observedAttributes: [...Component.observedAttributes],
      methods: ["select", "clearSelection"].map((name) => typeof element[name]),
      selectedType: typeof Object.getOwnPropertyDescriptor(Component.prototype, "selected")?.get,
      engineAvailable: element.engine instanceof window.IndiaMapEngine
    };
  });

  expect(contract).toEqual({
    version: "1.0.0",
    observedAttributes: ["src", "selected", "disabled"],
    methods: ["function", "function"],
    selectedType: "function",
    engineAvailable: true
  });
});
