# Performance budgets

India Map Studio uses versioned static-asset and browser timing budgets to stop
map layers and application code from becoming slower unnoticed.

The canonical limits live in `performance-budgets.json`. Run both checks with:

```text
pnpm test:performance
```

## Current scenarios

| Scenario | Desktop budget | Mobile budget |
| --- | ---: | ---: |
| India map with 36 state/UT features | 2,500 ms | 4,000 ms |
| Uttar Pradesh layer with 75 districts | 3,500 ms | 5,500 ms |
| Example-gallery filtering | 250 ms | Same interaction budget |

The mobile run uses a 390 by 844 pixel touch viewport. Timings cover navigation,
SVG fetching, parsing, feature discovery, and first visible map geometry from a
local HTTP server. They are deliberately tolerant of shared CI hardware and are
regression limits, not claims about every visitor's device or network.

Static budgets use uncompressed file sizes. The checks cover core CSS and
JavaScript, the location index, the national layer, every public state layer,
and all example scripts. The current largest public state layer is Uttar
Pradesh at approximately 1.25 MB; all 36 public state layers total approximately
16.2 MB.

## Measure a map in your application

Copy this around an existing `IndiaMapEngine` setup:

```js
const startedAt = performance.now();

map.on("mapload", event => {
  const duration = Math.round(performance.now() - startedAt);
  console.log(`${event.detail.featureCount} features ready in ${duration} ms`);
}, { once: true });

map.load();
```

## When a budget fails

1. Confirm the change intentionally added data or behavior.
2. Prefer simplifying SVG paths, loading optional data on demand, or splitting
   page-specific code before increasing a limit.
3. Run the performance suite several times on the same machine.
4. If a larger budget is justified, update `performance-budgets.json` in the
   same pull request and explain the tradeoff.

GitHub Actions runs these budgets after the browser and accessibility suite.
Failure reports include JSON timing attachments and retained Playwright traces.
