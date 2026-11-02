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

it("rejects a negative width in an element_update patch", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { w: -50 },
  });

  expect(r).toMatchObject({ ok: false, error: { path: "elements.r.w" } });
});

it("places a top-level element against the scene canvas when at is provided", async () => {
  await call("scene_update", { scene: "s", patch: { width: 1000, height: 800 } });
  await call("element_update", {
    scene: "s",
    id: "r",
    patch: { w: 200, h: 100 },
    at: "center",
  });
  const res = (await call("scene_get", { scene: "s" })) as any;
  const el = res.value.elements.find((e: any) => e.id === "r");
  expect(el).toMatchObject({ x: 400, y: 350 });
});
