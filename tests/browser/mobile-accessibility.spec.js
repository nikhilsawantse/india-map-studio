import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const pages = [
  { name: "state workspace", path: "/state.html?state=uttar-pradesh", ready: "#state-map .district-region" },
  { name: "ranking example", path: "/examples/ranking-dashboard.html", ready: "#ranking-map .map-region" },
  { name: "printable report", path: "/examples/printable-report.html", ready: "#print-map .district-region" }
];

for (const entry of pages) {
  test(`${entry.name} has no serious mobile accessibility violations`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.locator(entry.ready).first()).toBeVisible();
    await expect(page.locator(".mobile-workspace-nav")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(" "))
      }));

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
