import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa5-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
});

it("names a nested element by its id path in a failing write", async () => {
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "a" } });
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "b" } });
  const grouped = await call("element_group", { scene: "s", ids: ["a", "b"] });
  const g = (grouped as { value: { id: string } }).value.id;

  const r = await call("element_update", {
    scene: "s",
    id: `${g}/b`,
    patch: { w: -50 },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      path: `elements.${g}/b.w`,
      message: expect.stringContaining(`elements.${g}/b.w:`),
    },
  });
});
