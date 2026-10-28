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

const twoRects = async () => {
  await value("scene_create", { scene: "s" });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "a" } });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "b" } });
};

it("runs a preset counter's count-up from the start of its shot in scene_build", async () => {
  const out = await value("scene_build", {
    compact: {
      duration: 6,
      shots: [
        { id: "s1", start: 0, end: 3 },
        { id: "s2", start: 3, end: 6 },
      ],
      elements: [{ preset: "Contador animado", id: "c", shot: "s2" }],
    },
  });

  expect(out.scene).toMatchObject({
    elements: [{ tracks: { progress: [{ t: 3 }, { t: 5 }] } }],
  });
});

it("runs a preset counter's count-up from the start of its shot in element_add", async () => {
  await value("scene_create", { scene: "s" });
  await value("shot_set", { scene: "s", id: "s2", start: 3, end: 6 });

  await value("element_add", {
    scene: "s",
    preset: "Contador animado",
    patch: { id: "c", shot: "s2" },
  });
  const scene = await value("scene_get", { scene: "s", full: true });

  expect(scene).toMatchObject({
    elements: [{ tracks: { progress: [{ t: 3 }, { t: 5 }] } }],
  });
});

it("names a new group with the id given to element_group", async () => {
  await twoRects();

  const out = await value("element_group", {
    scene: "s",
    ids: ["a", "b"],
    id: "caja",
  });

  expect(out.id).toBe("caja");
});

it("lists every id element_group cannot group, saying why", async () => {
  await twoRects();
  await value("element_group", { scene: "s", ids: ["a", "b"], id: "g" });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "c" } });

  const r = await call("element_group", {
    scene: "s",
    ids: ["a", "c", "fantasma"],
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      errors: [
        { path: "ids.0", message: expect.stringContaining("«g»") },
        { path: "ids.2", message: expect.stringContaining("«fantasma»") },
      ],
    },
  });
});

it("rejects a layer index past the last sibling", async () => {
  await twoRects();

  const r = await call("element_move", { scene: "s", id: "a", to: 99 });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "to", message: expect.stringContaining("0–1") },
  });
});
