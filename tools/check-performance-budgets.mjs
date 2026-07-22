import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budgets = JSON.parse(await readFile(join(root, "performance-budgets.json"), "utf8"));
const failures = [];

function formatBytes(bytes) {
  return new Intl.NumberFormat("en-IN").format(bytes);
}

for (const budget of budgets.assetBudgets) {
  const size = (await stat(join(root, budget.path))).size;
  const passed = size <= budget.maxBytes;
  console.log(`${passed ? "PASS" : "FAIL"} ${budget.path}: ${formatBytes(size)} / ${formatBytes(budget.maxBytes)} bytes`);
  if (!passed) failures.push(`${budget.path} exceeds its budget by ${formatBytes(size - budget.maxBytes)} bytes`);
}

for (const budget of budgets.collectionBudgets) {
  const directory = join(root, budget.directory);
  const names = (await readdir(directory)).filter((name) => extname(name).toLowerCase() === budget.extension);
  const sizes = await Promise.all(names.map(async (name) => ({ name, size: (await stat(join(directory, name))).size })));
  const total = sizes.reduce((sum, item) => sum + item.size, 0);
  const largest = sizes.slice().sort((a, b) => b.size - a.size)[0] || { name: "none", size: 0 };
  const countPassed = budget.expectedFiles == null || names.length === budget.expectedFiles;
  const filePassed = largest.size <= budget.maxFileBytes;
  const totalPassed = total <= budget.maxTotalBytes;
  const passed = countPassed && filePassed && totalPassed;
  console.log(`${passed ? "PASS" : "FAIL"} ${budget.id}: ${names.length} files, ${formatBytes(total)} / ${formatBytes(budget.maxTotalBytes)} bytes; largest ${largest.name} at ${formatBytes(largest.size)} bytes`);
  if (!countPassed) failures.push(`${budget.id} contains ${names.length} files; expected ${budget.expectedFiles}`);
  if (!filePassed) failures.push(`${budget.id}/${largest.name} exceeds the per-file budget by ${formatBytes(largest.size - budget.maxFileBytes)} bytes`);
  if (!totalPassed) failures.push(`${budget.id} exceeds its total budget by ${formatBytes(total - budget.maxTotalBytes)} bytes`);
}

if (failures.length) {
  console.error("\nPerformance budget check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("\nAll static performance budgets passed.");
