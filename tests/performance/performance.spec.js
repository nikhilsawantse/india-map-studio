import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const budgets = JSON.parse(readFileSync(fileURLToPath(new URL("../../performance-budgets.json", import.meta.url)), "utf8")).browserBudgets;

async function measureReady(page, path, selector, expectedCount) {
  const started = performance.now();
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(selector)).toHaveCount(expectedCount);
  await expect(page.locator(selector).first()).toBeVisible();
  return Math.round(performance.now() - started);
}

async function record(testInfo, name, duration, budget) {
  await testInfo.attach(`${name}.json`, {
    body: JSON.stringify({ metric: name, durationMs: duration, budgetMs: budget }, null, 2),
    contentType: "application/json"
  });
  console.log(`${name}: ${duration} ms / ${budget} ms`);
  expect(duration, `${name} exceeded its ${budget} ms budget`).toBeLessThanOrEqual(budget);
}

test.describe("desktop performance budgets", () => {
  test("national map becomes ready", async ({ page }, testInfo) => {
    const duration = await measureReady(page, "/", "#india-map .map-region", 36);
    await record(testInfo, "desktop-national-map-ready", duration, budgets.desktop.nationalMapReadyMs);
  });

  test("largest public district layer becomes ready", async ({ page }, testInfo) => {
    const duration = await measureReady(page, "/state.html?state=uttar-pradesh", "#state-map .district-region", 75);
    await record(testInfo, "desktop-largest-state-ready", duration, budgets.desktop.largestStateReadyMs);
  });

  test("example gallery filter responds immediately", async ({ page }, testInfo) => {
    await page.goto("/examples/");
    const duration = await page.evaluate(async () => {
      const started = performance.now();
      document.querySelector('[data-example-filter="data"]').click();
      await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
      return Math.round(performance.now() - started);
    });
    await expect(page.locator(".example-card:visible")).toHaveCount(5);
    await record(testInfo, "example-gallery-filter", duration, budgets.interaction.exampleGalleryFilterMs);
  });
});

test.describe("mobile performance budgets", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("national map becomes ready", async ({ page }, testInfo) => {
    const duration = await measureReady(page, "/", "#india-map .map-region", 36);
    await record(testInfo, "mobile-national-map-ready", duration, budgets.mobile.nationalMapReadyMs);
  });

  test("largest public district layer becomes ready", async ({ page }, testInfo) => {
    const duration = await measureReady(page, "/state.html?state=uttar-pradesh", "#state-map .district-region", 75);
    await record(testInfo, "mobile-largest-state-ready", duration, budgets.mobile.largestStateReadyMs);
  });
});
