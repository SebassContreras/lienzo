import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
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

const twoRects = async () => {
  await value("scene_create", { scene: "s" });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "a" } });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "b" } });
};

it("names a new group with the id given to element_group (074/R10)", async () => {
  await twoRects();

  const out = await value("element_group", {
    scene: "s",
    ids: ["a", "b"],
    id: "caja",
  });

  expect(out.id).toBe("caja");
});

it("lists every id element_group cannot group, saying why (074/R10)", async () => {
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

it("rejects a layer index past the last sibling (074/R1)", async () => {
  await twoRects();

  const r = await call("element_move", { scene: "s", id: "a", to: 99 });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "to", message: expect.stringContaining("0–1") },
  });
});

it("lists the easings when one is unknown (074/R1)", async () => {
  const r = await call("scene_build", {
    compact: {
      elements: [
        {
          kind: "rect",
          tracks: {
            x: [
              [0, 0, "wobbly"],
              [1, 10],
            ],
          },
        },
      ],
    },
  });

  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringContaining("ease-out") },
  });
});

it("lists a track's keyframe times when none is at t (074/R13)", async () => {
  await twoRects();
  await value("keyframe_set", {
    scene: "s",
    id: "a",
    path: "x",
    t: 1,
    value: 10,
  });

  const r = await call("keyframe_remove", {
    scene: "s",
    id: "a",
    path: "x",
    t: 2,
  });

  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringContaining("1s") },
  });
});

it("points effects.glow at the element's own glow field (074/R13)", async () => {
  const out = await value("scene_build", {
    compact: { elements: [{ kind: "rect", effects: { glow: true } }] },
  });

  expect(out.notices).toEqual([
    expect.stringContaining("Glow: { enabled: true }"),
  ]);
});

it("wraps a long centred text with no w inside the canvas margins (074/R11)", async () => {
  const out = await value("scene_build", {
    compact: {
      size: "1080x1080",
      elements: [{ kind: "text", at: "center", text: "palabra ".repeat(80) }],
    },
  });

  expect(out.scene).toMatchObject({ elements: [{ w: 1080 - 2 * 54 }] });
});

it("returns only what differs from the kind's defaults in scene_get (074/R12)", async () => {
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

it("takes a sparse scene_get result back into scene_create (074/R12)", async () => {
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

it("names a failing path once in the message (074/R9)", async () => {
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
