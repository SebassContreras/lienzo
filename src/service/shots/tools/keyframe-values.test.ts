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
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa3-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "r" } });
});

it("rejects an opacity keyframe above 1", async () => {
  const r = await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "opacity",
    t: 1,
    value: 5,
  });

  expect(r).toMatchObject({ ok: false, error: { code: "invalid_value" } });
});
