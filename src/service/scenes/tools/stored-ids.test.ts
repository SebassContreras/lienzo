import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
let root: string;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-ids-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s", data: {} });
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "old" } });
  const file = join(root, "projects", "p", "scenes", "s.json");
  await writeFile(
    file,
    (await readFile(file, "utf8")).replace('"old"', '"a/b"'),
  );
});

it("a stored scene with an id the tools cannot address still opens and takes edits elsewhere", async () => {
  const add = await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "ok" },
  });
  const bad = await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "c/d" },
  });

  expect(add).toMatchObject({ ok: true });
  expect(bad).toMatchObject({ ok: false, error: { code: "invalid_id" } });
});
