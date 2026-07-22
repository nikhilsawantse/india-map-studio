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

  await expect(page.locator(".example-card")).toHaveCount(17);
  await expect(page.locator('a[href="incident-alerts.html"]')).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});
