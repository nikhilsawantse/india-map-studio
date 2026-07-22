import { expect, test } from "@playwright/test";

const representativePages = [
  { path: "/examples/choropleth.html", text: "IndiaMapEngine" },
  { path: "/examples/nearby-places.html", text: "distanceKm" },
  { path: "/examples/multiple-maps.html", text: "india-svg-map" }
];

for (const entry of representativePages) {
  test(`${entry.path} exposes a collapsed copy-ready recipe`, async ({ page }) => {
    await page.goto(entry.path);
    const details = page.locator(".example-copy-snippet details");
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.locator("code")).toContainText(entry.text);
    await expect(details.locator("button")).toHaveText("Copy snippet");
  });
}

test("copy action provides clipboard or keyboard-copy feedback", async ({ page }) => {
  await page.goto("/examples/choropleth.html");
  await page.locator(".example-copy-snippet summary").click();
  await page.locator(".example-copy-snippet button").click();
  await expect(page.locator(".example-copy-snippet [role='status']")).toHaveText(
    /Copied|Snippet selected/
  );
});

test("an expanded recipe stays inside a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/examples/choropleth.html");
  await page.locator(".example-copy-snippet summary").click();
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
