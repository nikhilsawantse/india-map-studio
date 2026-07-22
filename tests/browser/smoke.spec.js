import { expect, test } from "@playwright/test";

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test("national explorer loads and selects a state", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/");

  await expect(page.locator("#india-map svg")).toBeVisible();
  await expect(page.locator("#india-map .map-region")).toHaveCount(36);

  await page.locator('#state-list button[data-slug="maharashtra"]').click();
  await expect(page.locator("#selected-name")).toHaveText("Maharashtra");
  await expect(page.locator("#selection-card")).toBeVisible();
  await expect(page.locator("#open-state")).toHaveAttribute("href", "state.html?state=maharashtra");
  expect(errors).toEqual([]);
});

test("service coverage switches district layers", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/service-coverage.html");

  await expect(page.locator("#coverage-map .district-region")).toHaveCount(36);
  await page.locator("#coverage-state").selectOption("assam");
  await expect(page.locator("#coverage-map .district-region")).toHaveCount(33);
  await expect(page.locator("#coverage-centre-list li")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("incident filters update the map and priority queue", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/incident-alerts.html");

  await expect(page.locator("#incident-map .district-region")).toHaveCount(36);
  await expect(page.locator(".example-incident-marker")).not.toHaveCount(0);
  await expect(page.locator("#incident-critical-count")).not.toHaveText("0");

  await page.locator('.example-incident-severity input[value="critical"]').uncheck();
  await expect(page.locator("#incident-critical-count")).toHaveText("0");
  await expect(page.locator(".example-incident-marker.is-critical")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("example gallery fits a narrow viewport", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/examples/");

  await expect(page.locator(".example-card")).toHaveCount(22);
  await expect(page.locator('a[href="pin-code-explorer.html"]')).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});

test("ranking dashboard synchronizes district filters and statistics", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/ranking-dashboard.html");
  await expect(page.locator("#ranking-map .map-region")).toHaveCount(36);
  await page.locator("#ranking-level").selectOption("districts");
  await expect(page.locator("#ranking-map .district-region")).toHaveCount(36);
  await page.locator("#ranking-state").selectOption("assam");
  await expect(page.locator("#ranking-map .district-region")).toHaveCount(33);
  await page.locator("#ranking-filter").selectOption("top-5");
  await expect(page.locator("#ranking-list li")).toHaveCount(5);
  await expect(page.locator("#ranking-average")).not.toHaveText("—");
  expect(errors).toEqual([]);
});

test("editable annotations persist locally", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/editable-annotations.html");
  await expect(page.locator("#annotation-map .district-region")).toHaveCount(36);
  await page.locator("#annotation-note").fill("Browser test note");
  await page.locator("#annotation-place-district").click();
  await expect(page.locator(".example-annotation-marker")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".example-annotation-marker")).toHaveCount(1);
  await expect(page.locator("#annotation-list")).toContainText("Browser test note");
  expect(errors).toEqual([]);
});

test("story map advances into a district chapter", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/story-map.html");
  await expect(page.locator("#story-map .map-region")).toHaveCount(36);
  await page.locator("#story-next").click();
  await expect(page.locator("#story-map .district-region")).toHaveCount(36);
  await expect(page.locator("#story-progress")).toHaveText("Step 2 of 4");
  await expect(page.locator("#story-map .is-story-focus")).toHaveCount(1);
  await expect(page.locator("#story-map #state-outline path")).toHaveCSS("fill", "none");
  await expect(page.locator("#story-map .is-story-focus path")).toHaveCSS("fill", "rgb(199, 101, 63)");
  expect(errors).toEqual([]);
});

test("printable report keeps map, list, and title synchronized", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/printable-report.html");
  await expect(page.locator("#print-map .district-region")).toHaveCount(36);
  await page.locator("#print-title").fill("Monsoon readiness");
  await page.locator("#print-district-list input").first().check();
  await expect(page.locator("#print-preview-title")).toHaveText("Monsoon readiness");
  await expect(page.locator("#print-map .is-print-selected")).toHaveCount(1);
  await expect(page.locator("#print-preview-subtitle")).toContainText("1 of 36");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#print-svg").click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let exportedSvg = "";
  for await (const chunk of stream) exportedSvg += chunk.toString();
  expect(exportedSvg).toContain('class="district-region is-print-selected"');
  expect(exportedSvg).toContain('fill="#bf6540"');
  expect(exportedSvg).toMatch(/id="state-outline"[\s\S]*?fill="none"/);
  expect(errors).toEqual([]);
});

test("PIN explorer searches official sample records and highlights a district", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/examples/pin-code-explorer.html");
  await expect(page.locator("#pin-map .district-region")).toHaveCount(36);
  await page.locator("#pin-search").fill("411001");
  await expect(page.locator("#pin-results li")).toHaveCount(1);
  await page.locator("#pin-results button").click();
  await expect(page.locator("#pin-detail-title")).toContainText("411001");
  await expect(page.locator("#pin-map .is-pin-focus")).toHaveCount(1);
  expect(errors).toEqual([]);
});
