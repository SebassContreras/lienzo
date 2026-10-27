/**
 * One rule across the scene-writing tools (074/R15): the same wrong input fails in each, and
 * the message names the valid options. Written out per tool, no loops (070/R4).
 */
import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "./index.ts";

let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);
const fails = (message: RegExp) => ({
  ok: false,
  error: { message: expect.stringMatching(message) },
});
const invalid = (message: RegExp) => ({
  ok: true,
  value: { valid: false, message: expect.stringMatching(message) },
});

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-contract-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
  await call("shot_set", { scene: "s", id: "s1", start: 0, end: 2 });
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "r" } });
});

const UNKNOWN_SHOT = /«nope».*«s1»/;
const UNKNOWN_ICON = /«Wrenchh».*«Wrench»/;
const UNKNOWN_TARGET = /«fantasma».*«r»/;
const UNKNOWN_EASING = /easing desconocido.*ease-out/;
const UNKNOWN_SIZE = /«potato».*9:16/;

it("scene_build fails on an unknown size", async () => {
  expect(
    await call("scene_build", { compact: { size: "potato" } }),
  ).toMatchObject(fails(UNKNOWN_SIZE));
});

it("scene_validate fails on an unknown size", async () => {
  expect(
    await call("scene_validate", { compact: { size: "potato" } }),
  ).toMatchObject(invalid(UNKNOWN_SIZE));
});

it("scene_build fails on an unknown shot", async () => {
  const compact = {
    shots: [{ id: "s1", start: 0, end: 2 }],
    elements: [{ kind: "rect", shot: "nope" }],
  };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(UNKNOWN_SHOT),
  );
});

it("element_add fails on an unknown shot", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { shot: "nope" },
  });
  expect(r).toMatchObject(fails(UNKNOWN_SHOT));
});

it("element_update fails on an unknown shot", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "nope" },
  });
  expect(r).toMatchObject(fails(UNKNOWN_SHOT));
});

it("scene_create fails on an unknown shot", async () => {
  const data = {
    elements: [{ id: "x", kind: "rect", shot: "nope" }],
    shots: [{ id: "s1", name: "s1", start: 0, end: 2 }],
  };
  expect(await call("scene_create", { scene: "t", data })).toMatchObject(
    fails(UNKNOWN_SHOT),
  );
});

it("scene_validate fails on an unknown shot given as data", async () => {
  const data = {
    elements: [{ id: "x", kind: "rect", shot: "nope" }],
    shots: [{ id: "s1", name: "s1", start: 0, end: 2 }],
  };
  expect(await call("scene_validate", { data })).toMatchObject(
    invalid(UNKNOWN_SHOT),
  );
});

it("scene_build fails on an unknown icon", async () => {
  const compact = { elements: [{ kind: "icon", icon: "Wrenchh" }] };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(UNKNOWN_ICON),
  );
});

it("element_add fails on an unknown icon", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "icon",
    patch: { icon: "Wrenchh" },
  });
  expect(r).toMatchObject(fails(UNKNOWN_ICON));
});

it("scene_build fails on a line attached to an id the scene lacks", async () => {
  const compact = {
    elements: [
      { kind: "rect", id: "r" },
      { kind: "line", to: "fantasma" },
    ],
  };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(UNKNOWN_TARGET),
  );
});

it("element_add fails on a line attached to an id the scene lacks", async () => {
  const patch = { b: { x: 0, y: 0, attach: "fantasma" } };
  const r = await call("element_add", { scene: "s", kind: "line", patch });
  expect(r).toMatchObject(fails(UNKNOWN_TARGET));
});

it("scene_build fails on an unknown easing", async () => {
  const compact = {
    elements: [{ kind: "rect", tracks: { x: [[0, 0, "wobbly"]] } }],
  };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(UNKNOWN_EASING),
  );
});

it("keyframe_set fails on an unknown easing", async () => {
  const r = await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
    value: 5,
    easing: "wobbly",
  });
  expect(r).toMatchObject(fails(UNKNOWN_EASING));
});

it("shot_set fails on an unknown camera easing", async () => {
  const camera = { tracks: { zoom: [[0, 1, "wobbly"]] } };
  const r = await call("shot_set", { scene: "s", id: "s1", camera });
  expect(r).toMatchObject(fails(UNKNOWN_EASING));
});

it("element_update moves an element's tracks with the shot it is rebound to (075/R1)", async () => {
  await call("shot_set", { scene: "s", id: "s2", start: 3, end: 5 });
  await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
    value: 50,
  });

  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "s2" },
  });
  const scene = await call("scene_get", { scene: "s", full: true });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«r» \+3s/)] },
  });
  expect(scene).toMatchObject({
    value: { elements: [{ id: "r", tracks: { x: [{ t: 4 }] } }] },
  });
});

it("shot_set moves the tracks of its elements and its camera keys with a new start (075/R2)", async () => {
  await call("element_update", { scene: "s", id: "r", patch: { shot: "s1" } });
  await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
    value: 50,
  });
  await call("shot_set", {
    scene: "s",
    id: "s1",
    camera: {
      tracks: {
        zoom: [
          [0, 1],
          [2, 1.2],
        ],
      },
    },
  });

  const r = await call("shot_set", { scene: "s", id: "s1", start: 2, end: 4 });
  const scene = await call("scene_get", { scene: "s", full: true });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«r» \+2s/)] },
  });
  expect(scene).toMatchObject({
    value: {
      elements: [{ tracks: { x: [{ t: 3 }] } }],
      shots: [{ camera: { tracks: { zoom: [{ t: 2 }, { t: 4 }] } } }],
    },
  });
});

it("shot_set remove moves the unbound elements' tracks back to the scene's start (075/R3)", async () => {
  await call("shot_set", { scene: "s", id: "s2", start: 3, end: 5 });
  await call("element_update", { scene: "s", id: "r", patch: { shot: "s2" } });
  await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 4,
    value: 50,
  });

  await call("shot_set", { scene: "s", id: "s2", remove: true });
  const scene = await call("scene_get", { scene: "s", full: true });

  expect(scene).toMatchObject({
    value: { elements: [{ tracks: { x: [{ t: 1 }] } }] },
  });
});

it("scene_validate lists schema and rule problems together (075/R4)", async () => {
  const compact = {
    duration: 6,
    shots: [
      { id: "s1", start: 0, end: 4 },
      { id: "s2", start: 3, end: 6 },
    ],
    elements: [
      { kind: "rect", tracks: { x: [[0, 0, "wobbly"]] } },
      { kind: "rect", shot: "s9" },
    ],
  };

  const r = await call("scene_validate", { compact });

  expect(r).toMatchObject({
    value: {
      errors: [
        { path: "compact.elements.0.tracks.x.0.easing" },
        { path: "compact.shots" },
        { path: "compact.elements.1.shot" },
      ],
    },
  });
});

it("element_update lists a bad field and an unknown shot together (075/R4)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { w: -50, shot: "nope" },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      errors: [{ path: "elements.r.w" }, { path: "elements.r.shot" }],
    },
  });
});

it("element_update keeps tracks given with a new shot as given (075/R1)", async () => {
  await call("shot_set", { scene: "s", id: "s2", start: 3, end: 5 });

  await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "s2", tracks: { x: [{ t: 3, value: 0, easing: "auto" }] } },
  });
  const scene = await call("scene_get", { scene: "s", full: true });

  expect(scene).toMatchObject({
    value: { elements: [{ tracks: { x: [{ t: 3 }] } }] },
  });
});

it("scene_build given the compact fields at the top level says they go in compact (076/R2)", async () => {
  const r = await call("scene_build", { elements: [], size: "9:16" });

  expect(r).toMatchObject(
    fails(
      /«elements», «size» no son parámetros de scene_build: ¿van dentro de «compact»\?/,
    ),
  );
});

it("a tool given a key it does not take lists its parameters (076/R2)", async () => {
  const r = await call("element_move", { scene: "s", id: "r", position: 2 });

  expect(r).toMatchObject(
    fails(/«position» no es un parámetro de element_move \(parámetros: .*«to»/),
  );
});

it("suggests text for content on a text element (076/R3)", async () => {
  const r = await call("scene_build", {
    compact: { elements: [{ kind: "text", content: "Hola" }] },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«text»")] },
  });
});

it("project_create makes the project id from the name alone (076/R4)", async () => {
  const r = await registry.call("project_create", { name: "Café Norte" }, ctx);

  expect(r).toMatchObject({ ok: true, value: { project: "cafe-norte" } });
});

it("project_create fills the canvas fields not given (076/D4)", async () => {
  const r = await registry.call(
    "project_create",
    { name: "Vertical", canvas: { height: 1920 } },
    ctx,
  );

  expect(r).toMatchObject({
    ok: true,
    value: { canvas: { width: 1080, height: 1920, fps: 30, duration: 5 } },
  });
});

it("keyframe_set rejects an opacity above 1 on a text, as on a rect (078/R1)", async () => {
  await call("element_add", { scene: "s", kind: "text", patch: { id: "t" } });

  const r = await call("keyframe_set", {
    scene: "s",
    id: "t",
    path: "opacity",
    t: 1,
    value: 5,
  });

  expect(r).toMatchObject({ ok: false, error: { path: "value" } });
});

it("element_update rejects a fill opacity above 1 (078/R1)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { fill: { opacity: 3 } },
  });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "elements.r.fill.opacity" },
  });
});

it("shot_set trimming a shot's start leaves its elements' tracks in place (078/R2)", async () => {
  await call("element_update", { scene: "s", id: "r", patch: { shot: "s1" } });
  await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
    value: 50,
  });

  const r = await call("shot_set", { scene: "s", id: "s1", start: 0.5 });
  const scene = await call("scene_get", { scene: "s", full: true });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
  expect(scene).toMatchObject({
    value: { elements: [{ tracks: { x: [{ t: 1 }] } }] },
  });
});

it("scene_build fails on a use naming a symbol the scene lacks, listing the symbols (078/R3)", async () => {
  const compact = {
    symbols: { sol: { w: 10, h: 10, children: [] } },
    elements: [{ kind: "use", symbol: "luna" }],
  };

  const r = await call("scene_build", { compact });

  expect(r).toMatchObject(fails(/«luna».*«sol»/));
});

it("scene_update removing a symbol a use names leaves a notice (078/R3)", async () => {
  await call("scene_update", {
    scene: "s",
    patch: { symbols: { sol: { w: 10, h: 10, children: [] } } },
  });
  await call("element_add", {
    scene: "s",
    kind: "use",
    patch: { id: "u", symbol: "sol" },
  });

  const r = await call("scene_update", {
    scene: "s",
    patch: { symbols: { sol: null } },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«u».*«sol»/)] },
  });
});

it("element_add names a failure about the new element by its patch (078/R4)", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { shot: "nope", w: -5 },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      path: "patch.w",
      errors: [{ path: "patch.w" }, { path: "patch.shot" }],
    },
  });
});

it("tells a value below its range in Spanish (078/R5)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { w: -5 },
  });

  expect(r).toMatchObject(fails(/Demasiado pequeño/));
});

it("preset_validate lists each recipe problem at its own path (078/R6)", async () => {
  const recipe = {
    name: "X",
    kind: "rect",
    traits: [],
    set: { w: "ancho" },
    values: {},
  };

  const r = await call("preset_validate", { recipe });

  expect(r).toMatchObject({
    value: { errors: [{ path: "" }, { path: "set.w" }] },
  });
});

it("scene_delete of a missing scene fails at scene (078/R7)", async () => {
  const r = await call("scene_delete", { scene: "nada" });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "scene", message: expect.stringContaining("escena") },
  });
});

it("keyframe_remove on a path with no track fails at path (078/R7)", async () => {
  const r = await call("keyframe_remove", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
  });

  expect(r).toMatchObject({ ok: false, error: { path: "path" } });
});

it("scene_build names a duplicate id at the element that repeats it (078/R7)", async () => {
  const compact = {
    elements: [
      { kind: "rect", id: "a" },
      { kind: "rect", id: "a" },
    ],
  };

  const r = await call("scene_build", { compact });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "compact.elements.1.id" },
  });
});

it("project_create of an existing project fails with exists (078/R7)", async () => {
  const r = await call("project_create", { name: "P" });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "exists", path: "project" },
  });
});

it("preset_rename of a built-in preset says it is built in (078/R8)", async () => {
  const r = await call("preset_rename", {
    from: "Contador animado",
    to: "Mi contador",
  });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in", path: "from" },
  });
});

it("preset_delete of a built-in preset says it is built in (078/R8)", async () => {
  const r = await call("preset_delete", { name: "31-contador" });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in", path: "name" },
  });
});

it("element_add of an image whose asset is missing says it does not exist (078/R8)", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "image",
    patch: { src: "nada.png" },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("no existe")] },
  });
});

it("element_add rounds the box in the off-canvas notice (078/R8)", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "text",
    patch: { text: "fuera", x: 5000, y: 5000 },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.not.stringMatching(/\d\.\d{3,}/)] },
  });
});

it("element_update reads a patch sent as a JSON string, as some MCP clients send it (078/R9)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: '{"w": 321}',
  });
  const scene = await call("scene_get", { scene: "s" });

  expect(r).toMatchObject({ ok: true });
  expect(scene).toMatchObject({ value: { elements: [{ id: "r", w: 321 }] } });
});

it("element_update still fails on a patch string that is not JSON (078/R9)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: "w=321",
  });

  expect(r).toMatchObject({ ok: false, error: { path: "patch" } });
});

// 080/R1: every writer takes the short keyframe forms and stores the full one
const SHORT = { opacity: [[0, 0], { t: 0.5, value: 1 }] };
const STORED = {
  opacity: [
    { t: 0, value: 0, easing: "auto" },
    { t: 0.5, value: 1, easing: "auto" },
  ],
};
const storedTracks = async (scene: string, id: string) => {
  const got = await call("scene_get", { scene, full: true });
  const { elements } = (
    got as { value: { elements: Record<string, unknown>[] } }
  ).value;
  return elements.find((el) => el.id === id)?.tracks;
};

it("element_add takes short keyframes and stores them whole (080/R1)", async () => {
  await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "q", tracks: SHORT },
  });

  expect(await storedTracks("s", "q")).toEqual(STORED);
});

it("element_update takes short keyframes and stores them whole (080/R1)", async () => {
  await call("element_update", {
    scene: "s",
    id: "r",
    patch: { tracks: SHORT },
  });

  expect(await storedTracks("s", "r")).toEqual(STORED);
});

it("scene_create takes short keyframes in data (080/R1)", async () => {
  await call("scene_create", {
    scene: "t",
    data: { elements: [{ id: "q", kind: "rect", tracks: SHORT }] },
  });

  expect(await storedTracks("t", "q")).toEqual(STORED);
});

it("scene_validate takes short keyframes in data (080/R1)", async () => {
  const r = await call("scene_validate", {
    data: { elements: [{ id: "q", kind: "rect", tracks: SHORT }] },
  });

  expect(r).toMatchObject({ ok: true, value: { valid: true } });
});

it("animation_save takes short keyframes (080/R1)", async () => {
  const r = await call("animation_save", {
    recipe: { name: "Aparece", tracks: SHORT },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { animation: expect.any(String) },
  });
});

it("a bad keyframe value names the keyframe's field, not «Entrada inválida» (080/R1)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { tracks: { opacity: [[0, "x", "wobbly"]] } },
  });

  expect(r).toMatchObject(
    fails(/elements\.r\.tracks\.opacity\.0\.easing: easing desconocido/),
  );
});

// 080/R5: a compact scene's problems come back together, elements named by id
it("scene_build lists a bad element value and an unknown shot together, by id (080/R5)", async () => {
  const compact = {
    shots: [{ id: "s1", start: 0, end: 2 }],
    elements: [
      { id: "a", kind: "rect", opacity: 5 },
      { id: "b", kind: "rect", shot: "nope" },
    ],
  };

  expect(await call("scene_build", { compact })).toMatchObject({
    ok: false,
    error: {
      errors: [
        { path: "compact.elements.a.opacity" },
        { path: "compact.elements.b.shot" },
      ],
    },
  });
});

it("scene_validate lists a bad element value and an unknown shot together, by id (080/R5)", async () => {
  const compact = {
    shots: [{ id: "s1", start: 0, end: 2 }],
    elements: [
      { id: "a", kind: "rect", opacity: 5 },
      { id: "b", kind: "rect", shot: "nope" },
    ],
  };

  expect(await call("scene_validate", { compact })).toMatchObject({
    value: {
      valid: false,
      errors: [
        { path: "compact.elements.a.opacity" },
        { path: "compact.elements.b.shot" },
      ],
    },
  });
});

it("scene_validate lists a late shot and an overlap together (080/R5)", async () => {
  const compact = {
    duration: 4,
    shots: [
      { id: "s1", start: 0, end: 3 },
      { id: "s2", start: 2, end: 5 },
    ],
  };

  expect(await call("scene_validate", { compact })).toMatchObject({
    value: {
      errors: [
        { message: expect.stringContaining("«s2» termina en 5s") },
        { message: expect.stringContaining("se solapa") },
      ],
    },
  });
});

it("scene_validate lists every unknown animation preset with the library's names (080/R5)", async () => {
  const compact = {
    elements: [
      { id: "a", kind: "rect", animPreset: "nada" },
      { id: "b", kind: "rect", animPreset: "tampoco" },
    ],
  };

  expect(await call("scene_validate", { compact })).toMatchObject({
    value: {
      errors: [
        {
          path: "compact.elements.a.animPreset",
          message: expect.stringMatching(/«nada».*(hay|quisiste)/),
        },
        { path: "compact.elements.b.animPreset" },
      ],
    },
  });
});

// 080/R2: partial elements are filled wherever a scene comes in
it("scene_update takes partial symbol children with short keyframes (080/R1, R2)", async () => {
  const r = await call("scene_update", {
    scene: "s",
    patch: {
      symbols: {
        chip: {
          w: 100,
          h: 100,
          children: [{ id: "d", kind: "ellipse", w: 50, h: 50, tracks: SHORT }],
        },
      },
    },
  });

  expect(r).toMatchObject({ ok: true });
});

it("scene_inspect_layout takes scene_get's sparse result as data (080/R2)", async () => {
  const got = (await call("scene_get", { scene: "s" })) as { value: unknown };

  const r = await call("scene_inspect_layout", { data: got.value });

  expect(r).toMatchObject({ ok: true, value: { boxes: expect.any(Array) } });
});
