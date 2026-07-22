import { expect, test } from "@playwright/test";

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test("generator previews every supported boundary depth", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/starter-generator.html");

  await expect(page.locator("#generator-map .map-region")).toHaveCount(36);
  await expect(page.locator("#generator-feature-count")).toHaveText("36 regions");

  await page.locator('input[name="map-level"][value="state"]').check();
  await expect(page.locator("#generator-map .district-region")).toHaveCount(36);
  await expect(page.locator("#generator-feature-count")).toHaveText("36 districts");

  await page.locator('input[name="map-level"][value="district"]').check();
  await expect(page.locator("#generator-map .child-region")).toHaveCount(14);
  await expect(page.locator("#generator-feature-count")).toHaveText("14 tehsils");
  expect(errors).toEqual([]);
});

test("generator synchronizes presets, data, and standalone output", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/starter-generator.html");
  await expect(page.locator("#generator-map .map-region")).toHaveCount(36);

  await page.locator("#generator-preset").selectOption("ranking");
  await expect(page.locator("#generator-ranking li")).toHaveCount(8);
  const fills = await page.locator("#generator-map .map-region").evaluateAll((features) =>
    new Set(features.map((feature) => feature.style.getPropertyValue("--generator-fill"))).size,
  );
  expect(fills).toBeGreaterThan(2);

  await page.locator("#generator-csv").setInputFiles({
    name: "sample.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("slug,label,value\nmaharashtra,Maharashtra custom,99\ndelhi,Delhi custom,12\n"),
  });
  await expect(page.locator("#generator-data-status")).toContainText("2 of 2 imported rows matched");

  await page.locator("#generator-project-title").fill("Regional progress map");
  await expect(page.locator("#generator-preview-title")).toHaveText("Regional progress map");
  await expect(page.locator("#generator-code")).toContainText("Regional progress map");
  await expect(page.locator("#generator-code")).toContainText("https://nikhilsawantse.github.io/india-map-studio/map-engine.js");
  await expect(page.locator("#generator-code")).toContainText('"maharashtra"');

  const generatedHtml = await page.locator("#generator-code").textContent();
  await page.setContent(
    generatedHtml.replaceAll(
      "https://nikhilsawantse.github.io/india-map-studio/",
      "http://127.0.0.1:4173/",
    ),
  );
  await expect(page.locator("#map .map-region")).toHaveCount(36);
  await expect(page.locator("#list li")).toHaveCount(10);
  expect(errors).toEqual([]);
});
