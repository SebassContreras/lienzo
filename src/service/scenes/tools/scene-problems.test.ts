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

it("validates a scene given as data with one partial text", async () => {
  const out = await value("scene_validate", {
    data: { elements: [{ id: "t", kind: "text", text: "Hola" }] },
  });

  expect(out).toMatchObject({ valid: true });
});

it("reports every problem of a scene, not only the first", async () => {
  const out = await value("scene_validate", {
    compact: {
      duration: 6,
      shots: [
        { id: "s1", start: 0, end: 4 },
        { id: "s2", start: 3, end: 6 },
      ],
      elements: [{ kind: "rect", shot: "s9" }],
    },
  });

  expect(out.errors).toEqual([
    expect.objectContaining({ path: "compact.shots" }),
    expect.objectContaining({ path: "compact.elements.0.shot" }),
  ]);
});

it("names an element given without id by its index in errors", async () => {
  const out = await value("scene_validate", {
    compact: { elements: [{ kind: "rect", shot: "nope" }] },
  });

  expect(out).toMatchObject({ path: "compact.elements.0.shot" });
});

it("returns only what differs from the kind's defaults in scene_get", async () => {
  await value("scene_create", { scene: "s" });
  await value("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "r", w: 333 },
  });

  const scene = await value("scene_get", { scene: "s" });

  expect(scene.elements).toEqual([
    {
      id: "r",
      kind: "rect",
      x: expect.any(Number),
      y: expect.any(Number),
      w: 333,
    },
  ]);
});

it("takes a sparse scene_get result back into scene_create", async () => {
  await value("scene_create", { scene: "s" });
  await value("element_add", {
    scene: "s",
    kind: "text",
    patch: { id: "t", text: "Hola" },
  });
  const sparse = await value("scene_get", { scene: "s" });

  const r = await call("scene_create", { scene: "copia", data: sparse });

  expect(r).toMatchObject({ ok: true });
});

it("names a failing path once in the message", async () => {
  const r = await call("scene_build", {
    compact: { elements: [{ kind: "line", to: "nope" }] },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      message: expect.stringMatching(
        /^compact\.elements\.0\.b\.attach: El extremo/,
      ),
    },
  });
});
