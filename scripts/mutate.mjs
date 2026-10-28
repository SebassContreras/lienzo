// pnpm test:mutate <folder or file>… : Stryker on that part of src, never on the tests (082/D2).
import { spawnSync } from "node:child_process";

const targets = process.argv
  .slice(2)
  .map((t) => (/\.tsx?$/.test(t) ? t : `${t}/**/*.{ts,tsx}`));
if (targets.length === 0) {
  console.error("Usage: pnpm test:mutate <folder|file>… (e.g. src/model)");
  process.exit(2);
}
const mutate = [...targets, "!src/**/*.test.{ts,tsx}"].join(",");
const run = spawnSync("pnpm", ["exec", "stryker", "run", "--mutate", mutate], {
  stdio: "inherit",
  shell: true,
});
process.exit(run.status ?? 1);
