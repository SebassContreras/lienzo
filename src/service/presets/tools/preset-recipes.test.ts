import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
type Result =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; path: string } };

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx) as Promise<Result>;

const value = async (name: string, input: Record<string, unknown>) => {
  const r = await call(name, input);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa6-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", {
    name: "P",
    canvas: { width: 1080, height: 1920, fps: 30, duration: 6 },
  });
});

it("renames a preset to a slug with its accents folded", async () => {
  await value("preset_save", {
    recipe: { name: "Caja", kind: "rect", traits: [] },
  });

  const out = await value("preset_rename", { from: "Caja", to: "Caja Ámbar" });

  expect(out.preset).toBe("caja-ambar");
});

it("rejects a recipe whose set gives a field the wrong type", async () => {
  const out = await value("preset_validate", {
    recipe: { name: "Caja", kind: "rect", traits: [], set: { w: "ancho" } },
  });

  expect(out).toMatchObject({ valid: false, path: "set.w" });
});

it("rejects a recipe with a key recipes do not have", async () => {
  const out = await value("preset_validate", {
    recipe: { name: "Caja", kind: "rect", traits: [], values: { w: 10 } },
  });

  expect(out).toMatchObject({
    valid: false,
    message: expect.stringContaining("values"),
  });
});
