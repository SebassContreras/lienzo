import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

it("font_install with a bad file fails at file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-font-"));
  const file = join(dir, "x.txt");
  await writeFile(file, "no");
  const r = await call("font_install", { family: "X", file });
  expect(r).toMatchObject({ ok: false, error: { path: "file" } });
});
