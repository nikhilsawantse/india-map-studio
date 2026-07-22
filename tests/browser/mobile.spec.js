import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function expectNoHorizontalOverflow(page) {
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(viewport.scrollWidth, `${page.url()} rendered ${viewport.scrollWidth}px wide in a ${viewport.clientWidth}px viewport`).toBeLessThanOrEqual(viewport.clientWidth + 1);
}

async function expectTargetNearTop(page, selector) {
  await expect.poll(() => page.locator(selector).evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
  const position = await page.locator(selector).evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    viewportHeight: window.innerHeight
  }));
  expect(position.top).toBeLessThan(position.viewportHeight * 0.5);
}

test("long state controls provide persistent jumps between controls and map", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/state.html?state=uttar-pradesh");
  await expect(page.locator("#state-map .district-region")).toHaveCount(75);

  const navigation = page.locator(".mobile-workspace-nav");
  await expect(navigation).toBeVisible();
  await navigation.locator('[data-mobile-workspace-target="map"]').click();
  await expectTargetNearTop(page, ".state-map-panel");
  await navigation.locator('[data-mobile-workspace-target="controls"]').click();
  await expectTargetNearTop(page, ".state-copy");

  const buttonBoxes = await navigation.locator("button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
  expect(buttonBoxes.every((height) => height >= 44)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("interactive example keeps controls and map one tap apart", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/examples/ranking-dashboard.html");
  await expect(page.locator("#ranking-map .map-region")).toHaveCount(36);

  const navigation = page.locator(".mobile-workspace-nav");
  await expect(navigation).toBeVisible();
  await navigation.locator('[data-mobile-workspace-target="map"]').click();
  await expectTargetNearTop(page, ".example-ranking-map-panel");
  await navigation.locator('[data-mobile-workspace-target="controls"]').click();
  await expectTargetNearTop(page, ".example-control-panel");
  await expect(page.locator("#ranking-level")).toHaveCSS("font-size", "16px");
  await expectNoHorizontalOverflow(page);
});

test("printable report presents controls before its mobile preview", async ({ page }) => {
  await page.goto("/examples/printable-report.html");
  await expect(page.locator("#print-map .district-region")).toHaveCount(36);
  await expect(page.locator(".mobile-workspace-nav")).toBeVisible();

  const controls = await page.locator(".example-print-controls").boundingBox();
  const report = await page.locator(".example-print-report").boundingBox();
  expect(controls.y).toBeLessThan(report.y);
  await expectNoHorizontalOverflow(page);
});

test("primary mobile workspaces remain within the viewport", async ({ page }) => {
  const paths = [
    "/",
    "/district.html?state=maharashtra&district=pune",
    "/custom-map.html",
    "/starter-generator.html",
    "/examples/drill-down.html",
    "/examples/incident-alerts.html",
    "/examples/pin-code-explorer.html",
    "/examples/story-map.html",
    "/examples/embedded-map.html"
  ];

  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator(".mobile-workspace-nav")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
