import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { name: "national explorer", path: "/", ready: "#india-map svg" },
  { name: "example gallery", path: "/examples/", ready: ".examples-grid" },
  { name: "performance guide", path: "/docs/performance.html", ready: ".engine-docs" },
  { name: "mobile UX guide", path: "/docs/mobile-ux.html", ready: ".engine-docs" },
  { name: "API stability guide", path: "/docs/api-stability.html", ready: ".engine-docs" },
  { name: "starter", path: "/starter/", ready: "india-svg-map svg" },
  { name: "service coverage", path: "/examples/service-coverage.html", ready: "#coverage-map svg" },
  { name: "incident alerts", path: "/examples/incident-alerts.html", ready: "#incident-map svg" },
  { name: "ranking dashboard", path: "/examples/ranking-dashboard.html", ready: "#ranking-map svg" },
  { name: "editable annotations", path: "/examples/editable-annotations.html", ready: "#annotation-map svg" },
  { name: "printable report", path: "/examples/printable-report.html", ready: "#print-map svg" },
  { name: "PIN explorer", path: "/examples/pin-code-explorer.html", ready: "#pin-map svg" },
];

for (const entry of pages) {
  test(`${entry.name} has no serious automated accessibility violations`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.locator(entry.ready)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(" ")),
      }));

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
