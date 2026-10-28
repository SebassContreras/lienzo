// pnpm test:mutate:rules : Stryker on the rule modules (082/D10), failing when their mutation
// score drops below the one taken before the old contract tests were deleted (082/T025).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const RULE_MODULES = [
  "src/model/ids.ts",
  "src/model/shots.ts",
  "src/model/shot-timing.ts",
  "src/model/limits.ts",
  "src/model/size.ts",
  "src/service/scenes/scenes.ts",
  "src/service/scenes/scene-references.ts",
  "src/service/scenes/scene-notices.ts",
];
/** Killed and timed-out mutants over all valid ones, at `b195ab0c` with `ignoreStatic`. */
const MINIMUM = 76.54;

const run = spawnSync("node", ["scripts/mutate.mjs", ...RULE_MODULES], {
  stdio: "inherit",
});
if (run.status !== 0) process.exit(run.status ?? 1);

const report = JSON.parse(
  readFileSync("reports/mutation/mutation.json", "utf8"),
);
const mutants = Object.values(report.files).flatMap((f) => f.mutants);
const detected = mutants.filter(
  (m) => m.status === "Killed" || m.status === "Timeout",
).length;
const valid = mutants.filter(
  (m) =>
    m.status !== "CompileError" &&
    m.status !== "RuntimeError" &&
    m.status !== "Ignored",
).length;
const score = Math.round((detected / valid) * 10000) / 100;
console.log(`\nRule modules: ${score}% (minimum ${MINIMUM}%)`);
process.exit(score >= MINIMUM ? 0 : 1);
