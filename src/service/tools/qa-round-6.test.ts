import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "./index.ts";

/** Cases the sixth QA run reported, held at the tool boundary (074). */
let ctx: Ctx;
type Result =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; path: string } };
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx) as Promise<Result>;
/** The value of a call that must succeed. */
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

it("builds an unsaved compact scene on the project's canvas (074/R3)", async () => {
  const out = await value("scene_build", { compact: { elements: [] } });

  expect(out.scene).toMatchObject({ width: 1080, height: 1920, duration: 6 });
});

it("rejects an element bound to a shot the scene lacks, listing the shots (074/R1)", async () => {
  await value("scene_create", { scene: "s" });
  await value("shot_set", { scene: "s", id: "s1", start: 0, end: 3 });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "r" } });

  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "nope" },
  });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "unknown_shot", message: expect.stringContaining("«s1»") },
  });
});

it("rejects an unknown shot in scene_validate (074/R1)", async () => {
  const r = await value("scene_validate", {
    compact: { elements: [{ kind: "rect", shot: "s9" }] },
  });

  expect(r).toMatchObject({
    valid: false,
    message: expect.stringContaining("«s9»"),
  });
});

it("runs a preset counter's count-up from the start of its shot in scene_build (074/R4)", async () => {
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

it("runs a preset counter's count-up from the start of its shot in element_add (074/R4)", async () => {
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

it("renames a preset to a slug with its accents folded (074/R6)", async () => {
  await value("preset_save", {
    recipe: { name: "Caja", kind: "rect", traits: [] },
  });

  const out = await value("preset_rename", { from: "Caja", to: "Caja Ámbar" });

  expect(out.preset).toBe("caja-ambar");
});

it("sets a counter preset's final value with `to` in compact (074/R7)", async () => {
  const out = await value("scene_build", {
    compact: {
      elements: [{ preset: "Contador animado", from: 0, to: 1500 }],
    },
  });

  expect(out.scene).toMatchObject({ elements: [{ from: 0, to: 1500 }] });
});

it("takes camera keyframes without easing in shot_set, as scene_build does (074/R8)", async () => {
  await value("scene_create", { scene: "s" });

  const r = await call("shot_set", {
    scene: "s",
    id: "s1",
    start: 0,
    end: 3,
    camera: {
      tracks: {
        zoom: [
          [0, 1],
          [3, 1.2],
        ],
      },
    },
  });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("notes camera keyframes outside their shot, as times are scene time (074/R8)", async () => {
  await value("scene_create", { scene: "s" });

  const out = await value("shot_set", {
    scene: "s",
    id: "s2",
    start: 3,
    end: 6,
    camera: {
      tracks: {
        zoom: [
          [0, 1],
          [3, 1.2],
        ],
      },
    },
  });

  expect(out.notices).toEqual([expect.stringContaining("zoom en 0s")]);
});

it("rejects a recipe whose set gives a field the wrong type (074/R1)", async () => {
  const out = await value("preset_validate", {
    recipe: { name: "Caja", kind: "rect", traits: [], set: { w: "ancho" } },
  });

  expect(out).toMatchObject({ valid: false, path: "set.w" });
});

it("rejects a recipe with a key recipes do not have (074/R1)", async () => {
  const out = await value("preset_validate", {
    recipe: { name: "Caja", kind: "rect", traits: [], values: { w: 10 } },
  });

  expect(out).toMatchObject({
    valid: false,
    message: expect.stringContaining("values"),
  });
});

it("validates a scene given as data with one partial text (074/R9)", async () => {
  const out = await value("scene_validate", {
    data: { elements: [{ id: "t", kind: "text", text: "Hola" }] },
  });

  expect(out).toMatchObject({ valid: true });
});

it("reports every problem of a scene, not only the first (074/R9)", async () => {
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

it("names an element given without id by its index in errors (074/R9)", async () => {
  const out = await value("scene_validate", {
    compact: { elements: [{ kind: "rect", shot: "nope" }] },
  });

  expect(out).toMatchObject({ path: "compact.elements.0.shot" });
});
