import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

/** One shot rule for every scene write and scene_validate (072/D4). */
let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);
const lateShot = {
  duration: 2,
  shots: [{ id: "s2", name: "s2", start: 3, end: 6 }],
};

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-shots-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
  await call("scene_update", { scene: "s", patch: { duration: 6 } });
  await call("shot_set", { scene: "s", id: "s2", start: 3, end: 6 });
});

it("rejects a scene_update that leaves a shot after the scene", async () => {
  const r = await call("scene_update", { scene: "s", patch: { duration: 2 } });

  expect(r).toMatchObject({ ok: false, error: { path: "shots" } });
});

it("finds a scene with a shot after its end invalid", async () => {
  const scene = (await call("scene_get", { scene: "s" })) as {
    value: Record<string, unknown>;
  };

  const r = await call("scene_validate", {
    data: { ...scene.value, duration: 2 },
  });

  expect(r).toMatchObject({ ok: true, value: { valid: false } });
});

it("rejects a compact scene whose shot ends after it", async () => {
  const r = await call("scene_build", {
    compact: { ...lateShot, elements: [] },
    save: "s",
    overwrite: true,
  });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "compact.shots" },
  });
});
