// pnpm replay [id…]: runs the QA replay corpus (082/D7) in a fresh process, on the code at HEAD.
// A report of a bug that is "still open" counts only when it fails here too; if it passes here,
// the MCP server that reported it started on an older commit and needs a restart.
import { execFileSync } from "node:child_process";
import { loadCorpus, runCase } from "../src/service/contract/corpus.ts";
import { sandbox } from "../src/service/contract/harness.ts";

const wanted = process.argv.slice(2);
const cases = loadCorpus().filter(
  (c) => wanted.length === 0 || wanted.some((id) => c.id.includes(id)),
);
const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();

let failed = 0;
for (const c of cases) {
  const box = await sandbox();
  const problems = await runCase(box.ctx, c);
  await box.ctx.dispose();
  if (problems.length > 0) failed++;
  console.log(
    `${problems.length === 0 ? "PASS" : "FAIL"}  ${c.id} (${c.source})`,
  );
  for (const problem of problems) console.log(`      ${problem}`);
}
console.log(
  `\n${cases.length - failed} of ${cases.length} cases pass at ${head}`,
);
process.exit(failed === 0 ? 0 : 1);
