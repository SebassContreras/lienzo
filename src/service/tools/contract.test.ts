/**
 * One rule across the scene-writing tools (074/R15): the same wrong input fails in each, and
 * the message names the valid options. Written out per tool, no loops (070/R4).
 */
import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { groupElements, ungroupElement } from "../../engine/groups.ts";
import { defaultRect, defaultScene } from "../../model/model.ts";
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

// 080/R3: audio refs are stored like element assets, so they count as uses
const audioFile = async (name: string) => {
  const dir = join(ctx.root, "projects", "p", "assets");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from("ID3"));
};
const storedAudio = async (scene: string) => {
  const got = (await call("scene_get", { scene, full: true })) as {
    value: { audioTracks?: { assetId: string }[] };
  };
  return got.value.audioTracks?.map((t) => t.assetId);
};

it("scene_update stores a bare audio ref with its project prefix (080/R3)", async () => {
  await audioFile("voz.mp3");

  await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ id: "t1", assetId: "voz.mp3" }] },
  });

  expect(await storedAudio("s")).toEqual(["/projects/p/assets/voz.mp3"]);
});

it("scene_build stores a bare audio ref with its project prefix (080/R3)", async () => {
  await audioFile("voz.mp3");

  await call("scene_build", {
    compact: { audioTracks: [{ assetId: "voz.mp3" }] },
    save: "b",
  });

  expect(await storedAudio("b")).toEqual(["/projects/p/assets/voz.mp3"]);
});

it("asset_delete refuses an audio file a scene uses, given bare (080/R3)", async () => {
  await audioFile("voz.mp3");
  await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ id: "t1", assetId: "voz.mp3" }] },
  });

  expect(await call("asset_delete", { path: "voz.mp3" })).toMatchObject({
    ok: false,
    error: { code: "in_use" },
  });
});

it("scene_update notes an audio file the project lacks (080/R3)", async () => {
  const r = await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ id: "t1", assetId: "falta.mp3" }] },
  });

  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: [expect.stringMatching(/Audio «.*falta\.mp3».*no sonará/)],
    },
  });
});

it("scene_generate_speech stores its audio ref with the project prefix (080/R3)", async () => {
  ctx.tts = {
    synthesizeSpeech: async () => ({
      audioBuffer: new Uint8Array(32000),
      format: "opus",
      mimeType: "audio/ogg",
    }),
    listModels: async () => [],
  };

  await call("scene_generate_speech", {
    scene: "s",
    script: "Hola",
    provider: "local",
    asTrack: true,
  });

  expect(
    (await storedAudio("s"))?.every((id) =>
      id.startsWith("/projects/p/assets/"),
    ),
  ).toBe(true);
});

// 080/R4: a group's shot goes back to its children on ungroup, in the tools as in the editor
it("element_ungroup gives the group's shot back to its children (080/R4)", async () => {
  await call("element_update", { scene: "s", id: "r", patch: { shot: "s1" } });
  await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "q", shot: "s1", x: 300 },
  });
  await call("element_group", { scene: "s", ids: ["r", "q"], id: "g" });

  await call("element_ungroup", { scene: "s", id: "g" });
  const got = (await call("scene_get", { scene: "s" })) as {
    value: { elements: { id: string; shot?: string }[] };
  };

  expect(got.value.elements.map(({ id, shot }) => ({ id, shot }))).toEqual([
    { id: "r", shot: "s1" },
    { id: "q", shot: "s1" },
  ]);
});

// 080/R6: an ignored key names its element as errors do
it("scene_validate names an ignored key of a data element by its id (080/R6)", async () => {
  const r = await call("scene_validate", {
    data: { elements: [{ id: "t", kind: "text", content: "hola" }] },
  });

  expect(r).toMatchObject({
    value: {
      notices: [expect.stringContaining("ignorado: elements.t.content")],
    },
  });
});

it("scene_build names an ignored key of a compact element by its id (080/R6)", async () => {
  const r = await call("scene_build", {
    compact: { elements: [{ id: "t", kind: "text", content: "hola" }] },
  });

  expect(r).toMatchObject({
    value: { notices: [expect.stringContaining("compact.elements.t.content")] },
  });
});

// 080/R7: a failed lookup lists the valid names at the parameter given
it("preset_get of a missing preset fails at name, listing presets (080/R7)", async () => {
  expect(await call("preset_get", { name: "nope" })).toMatchObject({
    ok: false,
    error: {
      path: "name",
      message: expect.stringMatching(/«nope».*(hay|quisiste)/),
    },
  });
});

it("background_set of a missing preset lists background presets (080/R7)", async () => {
  expect(
    await call("background_set", { scene: "s", preset: "Azul nohe" }),
  ).toMatchObject({
    ok: false,
    error: { path: "preset", message: expect.stringContaining("«Azul noche»") },
  });
});

it("element_add of a missing preset lists presets (080/R7)", async () => {
  expect(
    await call("element_add", { scene: "s", preset: "nope" }),
  ).toMatchObject(fails(/«nope».*(hay|quisiste)/));
});

it("scene_build of a missing preset lists presets (080/R7)", async () => {
  const compact = { elements: [{ id: "a", preset: "nope" }] };

  expect(await call("scene_build", { compact })).toMatchObject(
    fails(
      /compact\.elements\.a\.preset: No existe el preset «nope» \((hay|¿quisiste)/,
    ),
  );
});

// 080/R8: an animation recipe is strict on its keys, as a preset recipe
it("animation_save fails on an unknown recipe key, naming it (080/R8)", async () => {
  const r = await call("animation_save", {
    recipe: { name: "Aparece", foo: 1, anim: { in: { kind: "fade" } } },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      code: "invalid_animation",
      message: expect.stringContaining("foo"),
    },
  });
});

// 080/R9: a length below 0 fails as a value, in a recipe's set and as a keyframe
it("element_update fails on a negative radius (080/R9)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { radius: -5 },
  });

  expect(r).toMatchObject({ ok: false, error: { path: "elements.r.radius" } });
});

it("preset_validate fails on a negative radius in set (080/R9)", async () => {
  const r = await call("preset_validate", {
    recipe: { name: "Caja", kind: "rect", set: { radius: -5 } },
  });

  expect(r).toMatchObject({
    value: { valid: false, errors: [{ path: "set.radius" }] },
  });
});

it("keyframe_set fails on a negative radius key (080/R9)", async () => {
  const r = await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "radius",
    t: 1,
    value: -5,
  });

  expect(r).toMatchObject({ ok: false, error: { code: "invalid_value" } });
});

// 080/R10: an unknown key close to a nested field suggests its paths
it("element_update suggests the nested paths a misspelled key means (080/R10)", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { colour: "#fff" },
  });

  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: [
        expect.stringMatching(/patch\.colour.*«fill\.color», «border\.color»/),
      ],
    },
  });
});

// 080/R12: the moved-tracks notice names only elements whose keyframes moved
it("element_update rebinding an element with no tracks gives no moved notice (080/R12)", async () => {
  await call("shot_set", { scene: "s", id: "s2", start: 2, end: 4 });

  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "s2" },
  });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("element_group gives the group the shot its members share (080/R4)", async () => {
  await call("element_update", { scene: "s", id: "r", patch: { shot: "s1" } });
  await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "q", shot: "s1", x: 300 },
  });

  await call("element_group", { scene: "s", ids: ["r", "q"], id: "g" });
  const got = (await call("scene_get", { scene: "s" })) as {
    value: { elements: { id: string; shot?: string }[] };
  };

  expect(got.value.elements.map(({ id, shot }) => ({ id, shot }))).toEqual([
    { id: "g", shot: "s1" },
  ]);
});

it("the editor's groupElements and ungroupElement carry the shot as the tools do (080/R4)", () => {
  const scene = {
    ...defaultScene(),
    elements: [
      { ...defaultRect(), id: "r", shot: "s1" },
      { ...defaultRect(), id: "q", shot: "s1", x: 300 },
    ],
  };

  const grouped = groupElements(scene, ["r", "q"], "g");
  const ungrouped = ungroupElement(grouped.scene, "g");

  expect(grouped.group?.shot).toBe("s1");
  expect(ungrouped.scene.elements.map((el) => el.shot)).toEqual(["s1", "s1"]);
});

// 065/R4: an easing on a track's last keyframe shapes nothing, and every writer says so
const DEAD_EASING = /«x».*«r».*ease-out.*t=2/;

it("keyframe_set notes an easing on the track's last keyframe (065/R4)", async () => {
  await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 0,
    value: 0,
  });

  const r = await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "x",
    t: 2,
    value: 100,
    easing: "ease-out",
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(DEAD_EASING)] },
  });
});

it("scene_validate notes an easing on the last keyframe of a data track (065/R4)", async () => {
  await call("element_update", {
    scene: "s",
    id: "r",
    patch: {
      tracks: {
        x: [
          [0, 0],
          [2, 100, "ease-out"],
        ],
      },
    },
  });
  const data = (await call("scene_get", { scene: "s", full: true })) as {
    value: Record<string, unknown>;
  };

  const r = await call("scene_validate", { data: data.value });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(DEAD_EASING)] },
  });
});

it("scene_build notes an easing on the last keyframe of a compact track (065/R4)", async () => {
  const compact = {
    elements: [
      {
        kind: "rect",
        id: "r",
        tracks: {
          x: [
            [0, 0],
            [2, 100, "ease-out"],
          ],
        },
      },
    ],
  };

  const r = await call("scene_build", { compact });

  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: expect.arrayContaining([expect.stringMatching(DEAD_EASING)]),
    },
  });
});

// 081/D3: a shot has to last, shot ids are unique, `name` and an audio track's `id` are optional

const NO_SPAN = /«a».*no dura/;
const REPEATED_SHOT = /dos tomas con el id «a»/;

it("scene_validate data fails on a shot that ends before it starts", async () => {
  const data = { shots: [{ id: "a", start: 3, end: 1 }] };
  expect(await call("scene_validate", { data })).toMatchObject(
    invalid(NO_SPAN),
  );
});

it("scene_validate compact fails on a zero-length shot", async () => {
  const compact = { shots: [{ id: "a", start: 2, end: 2 }] };
  expect(await call("scene_validate", { compact })).toMatchObject(
    invalid(NO_SPAN),
  );
});

it("scene_build fails on a shot that ends before it starts", async () => {
  const compact = { shots: [{ id: "a", start: 3, end: 1 }] };
  expect(await call("scene_build", { compact })).toMatchObject(fails(NO_SPAN));
});

it("scene_create fails on a zero-length shot", async () => {
  const data = { shots: [{ id: "a", name: "a", start: 1, end: 1 }] };
  expect(await call("scene_create", { scene: "z", data })).toMatchObject(
    fails(NO_SPAN),
  );
});

it("shot_set fails on a zero-length shot", async () => {
  const r = await call("shot_set", { scene: "s", id: "a", start: 4, end: 4 });
  expect(r).toMatchObject(fails(NO_SPAN));
});

it("scene_validate data fails on two shots with one id", async () => {
  const data = {
    shots: [
      { id: "a", start: 0, end: 1 },
      { id: "a", start: 2, end: 3 },
    ],
  };
  expect(await call("scene_validate", { data })).toMatchObject(
    invalid(REPEATED_SHOT),
  );
});

it("scene_build fails on two shots with one id", async () => {
  const compact = {
    shots: [
      { id: "a", start: 0, end: 1 },
      { id: "a", start: 2, end: 3 },
    ],
  };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(REPEATED_SHOT),
  );
});

it("scene_create names a shot after its id when it has no name", async () => {
  await call("scene_create", {
    scene: "z",
    data: { shots: [{ id: "a", start: 0, end: 1 }] },
  });
  const got = await call("scene_get", { scene: "z" });
  expect(got).toMatchObject({
    ok: true,
    value: { shots: [{ id: "a", name: "a" }] },
  });
});

it("scene_update takes an audio track without an id", async () => {
  const r = await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ assetId: "voz.mp3" }] },
  });
  expect(r).toMatchObject({ ok: true });
});

// 081/D4: shot notices

it("shot_set notices a transition longer than its shot", async () => {
  const r = await call("shot_set", {
    scene: "s",
    id: "a",
    start: 3,
    end: 4,
    transition: { kind: "fade", duration: 5 },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/transición.*«a».*5s/)] },
  });
});

it("shot_set notices a camera track the camera does not have", async () => {
  const r = await call("shot_set", {
    scene: "s",
    id: "s1",
    camera: { tracks: { rotation: [[0, 1]] } },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/pista «rotation»/)] },
  });
});

it("scene_validate notices an easing on a camera track's last keyframe", async () => {
  const data = {
    shots: [
      {
        id: "a",
        start: 0,
        end: 3,
        camera: { tracks: { zoom: [[0, 1], [3, 2, "ease-out"]] } },
      },
    ],
  };
  const r = await call("scene_validate", { data });
  expect(r).toMatchObject({
    ok: true,
    value: { valid: true, notices: [expect.stringMatching(/«ease-out»/)] },
  });
});

// 081/D2: element ids are unique in every writer

const REPEATED_ID = /ID duplicado «x»/;
const twoX = [
  { id: "x", kind: "rect" },
  { id: "x", kind: "text" },
];

it("scene_create fails on two elements with one id", async () => {
  const r = await call("scene_create", { scene: "z", data: { elements: twoX } });
  expect(r).toMatchObject(fails(REPEATED_ID));
});

it("scene_validate data fails on two elements with one id", async () => {
  const r = await call("scene_validate", { data: { elements: twoX } });
  expect(r).toMatchObject(invalid(REPEATED_ID));
});

it("scene_validate data fails on a group child that repeats a root id", async () => {
  const elements = [
    { id: "x", kind: "rect" },
    { id: "g", kind: "group", children: [{ id: "x", kind: "text" }] },
  ];
  const r = await call("scene_validate", { data: { elements } });
  expect(r).toMatchObject(invalid(REPEATED_ID));
});

it("element_add fails on an id the scene has, at patch.id", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "text",
    patch: { id: "r" },
  });
  expect(r).toMatchObject({ ok: false, error: { code: "duplicate_id" } });
});

it("element_group fails on a group id the scene has", async () => {
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "r2" } });
  const r = await call("element_group", {
    scene: "s",
    ids: ["r", "r2"],
    id: "r",
  });
  expect(r).toMatchObject({ ok: false, error: { code: "duplicate_id" } });
});


// 081/D5: one set of limits for every writer

const TOO_BIG = /Demasiado grande/;

it("scene_validate compact fails on an fps above 60", async () => {
  const r = await call("scene_validate", { compact: { fps: 500 } });
  expect(r).toMatchObject({ ok: false, error: { message: expect.stringMatching(TOO_BIG) } });
});

it("scene_build fails on a duration above ten minutes", async () => {
  const r = await call("scene_build", { compact: { duration: 100000 } });
  expect(r).toMatchObject(fails(TOO_BIG));
});

it("scene_update fails on a side above 7680", async () => {
  const r = await call("scene_update", { scene: "s", patch: { width: 20000 } });
  expect(r).toMatchObject(fails(TOO_BIG));
});

it("scene_validate data fails on a spotlight above 1", async () => {
  const data = { background: { spotlight: 7 } };
  const r = await call("scene_validate", { data });
  expect(r).toMatchObject(invalid(TOO_BIG));
});

it("background_set fails on a spotlight above 1", async () => {
  const r = await call("background_set", { scene: "s", patch: { spotlight: 7 } });
  expect(r).toMatchObject(fails(TOO_BIG));
});

it("project_update fails on a canvas side above 7680", async () => {
  const r = await call("project_update", { canvas: { width: 20000 } });
  expect(r).toMatchObject(fails(TOO_BIG));
});

// 081/D6: assets keep their type

it("asset_add refuses an .mp3 that is not audio", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-audio-"));
  const file = join(dir, "voz.mp3");
  await writeFile(file, "not audio at all");
  expect(await call("asset_add", { file })).toMatchObject({
    ok: false,
    error: { code: "invalid_audio", path: "file" },
  });
});

it("asset_rename refuses a new extension", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-audio-"));
  const file = join(dir, "voz.mp3");
  await writeFile(file, "ID3\u0004audio");
  const added = await call("asset_add", { file });
  const from = (added as { value: { filename: string } }).value.filename;
  expect(await call("asset_rename", { from, to: "voz.wav" })).toMatchObject({
    ok: false,
    error: { code: "asset_type_changed", path: "to" },
  });
});

it("scene_export lists an asset the project lacks", async () => {
  await call("element_add", {
    scene: "s",
    kind: "image",
    patch: { id: "pic", src: "missing.png" },
  });
  const r = await call("scene_export", { scene: "s", format: "png" });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/missing\.png.*marcador/)] },
  });
});

it("scene_preview lists an asset the project lacks and a changed extension", async () => {
  await call("element_add", {
    scene: "s",
    kind: "image",
    patch: { id: "pic", src: "missing.png" },
  });
  const r = await call("scene_preview", { scene: "s", out: "p.jpg" });
  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: [
        expect.stringMatching(/extensión sigue al formato real/),
        expect.stringMatching(/missing\.png/),
      ],
    },
  });
});

// 081/D7: presets and animation presets

it("preset_save refuses the name of a built-in preset", async () => {
  const r = await call("preset_save", {
    recipe: { name: "Tarjeta neón", kind: "rect" },
  });
  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in_name", path: "recipe.name" },
  });
});

it("preset_rename refuses the name of a built-in preset", async () => {
  await call("preset_save", { recipe: { name: "Mía", kind: "rect" } });
  const r = await call("preset_rename", { from: "Mía", to: "Pill" });
  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in_name", path: "to" },
  });
});

it("preset_get finds a preset by its name without accents", async () => {
  const r = await call("preset_get", { name: "tarjeta neon" });
  expect(r).toMatchObject({ ok: true, value: { source: "built-in" } });
});

it("preset_save notices a set key the kind has no field for", async () => {
  const r = await call("preset_save", {
    recipe: { name: "Con zzz", kind: "text", set: { zzz: 1, text: "hola" } },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: expect.arrayContaining([expect.stringMatching(/set.zzz/)]) },
  });
});

it("preset_save notices when the file is named differently", async () => {
  const r = await call("preset_save", {
    recipe: { name: "Caja Ámbar", kind: "rect" },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: expect.arrayContaining([expect.stringMatching(/caja-ambar/)]) },
  });
});

it("animation_save refuses two keyframes at one time", async () => {
  const recipe = { name: "Dos", tracks: { x: [[0, 1], [0, 2]] } };
  expect(await call("animation_save", { recipe })).toMatchObject({
    ok: false,
    error: { message: expect.stringMatching(/dos keyframes en t=0/) },
  });
});

it("animation_save refuses a recipe with neither anim nor tracks", async () => {
  const r = await call("animation_save", { recipe: { name: "Vacía" } });
  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringMatching(/necesita `anim` o `tracks`/) },
  });
});

it("element_add takes an animPreset by its file name", async () => {
  await call("animation_save", {
    recipe: { name: "Entrada Rebote", anim: { in: { kind: "bounce" } } },
  });
  const r = await call("element_add", {
    scene: "s",
    kind: "text",
    patch: { animPreset: "entrada-rebote" },
  });
  expect(r).toMatchObject({ ok: true });
});

// 081/D8: the same notices and failures from every writer of an element

it("element_add notices a font that is not installed", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "text",
    patch: { id: "t", font: "Fuente Rara" },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«Fuente Rara».*font_install/)] },
  });
});

it("element_update notices a font that is not installed", async () => {
  await call("element_add", { scene: "s", kind: "text", patch: { id: "t" } });
  const r = await call("element_update", {
    scene: "s",
    id: "t",
    patch: { font: "Fuente Rara" },
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«Fuente Rara»/)] },
  });
});

it("scene_create notices a font that is not installed", async () => {
  const data = { elements: [{ id: "t", kind: "text", font: "Fuente Rara" }] };
  const r = await call("scene_create", { scene: "z", data });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«Fuente Rara»/)] },
  });
});

it("scene_build with save notices an element off the canvas", async () => {
  const compact = { elements: [{ id: "far", kind: "rect", x: 2000, y: 10 }] };
  const r = await call("scene_build", { compact, save: "z" });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«far» se sale del lienzo/)] },
  });
});

it("element_update fails on a track path the kind cannot animate", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { tracks: { nofield: [[0, 1]] } },
  });
  expect(r).toMatchObject(fails(/«nofield» no se puede animar en «rect»/));
});

it("scene_build fails on a use override naming a child the symbol lacks", async () => {
  const compact = {
    symbols: { card: { w: 100, h: 50, children: [{ id: "c1", kind: "rect" }] } },
    elements: [{ id: "u", kind: "use", symbol: "card", overrides: { nope: {} } }],
  };
  const r = await call("scene_build", { compact });
  expect(r).toMatchObject(fails(/«card» no tiene el elemento «nope».*«c1»/));
});

// 081/D8: brand font weights

it("project_update notices a brand font weight that is not installed", async () => {
  const r = await call("project_update", {
    fonts: [{ family: "Inter", role: "body", weights: [400, 300] }],
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«Inter».*pesos 300/)] },
  });
});

// 081/D9: a failing call lists every problem it can find

it("scene_validate compact lists a bad size with a bad element", async () => {
  const compact = {
    size: "banana",
    elements: [{ id: "a", kind: "nokind" }, { id: "b", kind: "rect", w: "big" }],
  };
  const r = await call("scene_validate", { compact });
  expect(r).toMatchObject({
    ok: true,
    value: {
      valid: false,
      message: expect.stringMatching(/size.*banana[\s\S]*nokind/),
    },
  });
});

it("scene_build lists an element value problem with an unknown animation kind", async () => {
  const compact = {
    elements: [
      { id: "f", kind: "rect", fit: "box" },
      { id: "b", kind: "text", text: "hi", anim: "wobble" },
    ],
  };
  const r = await call("scene_build", { compact });
  expect(r).toMatchObject({
    ok: false,
    error: {
      message: expect.stringMatching(/compact\.elements\.f\.fit[\s\S]*wobble|compact\.elements\.f\.fit[\s\S]*anim/),
    },
  });
});

it("preset_validate lists a bad trait with a bad set value", async () => {
  const recipe = {
    name: "X",
    kind: "rect",
    traits: ["glow", "nonexistent"],
    set: { w: "abc" },
    extra: 1,
  };
  const r = await call("preset_validate", { recipe });
  expect(r).toMatchObject({
    ok: true,
    value: {
      valid: false,
      message: expect.stringMatching(/nonexistent[\s\S]*set\.w|set\.w[\s\S]*nonexistent/),
    },
  });
});

it("preset_save lists a bad trait with a bad set value", async () => {
  const recipe = { name: "X", kind: "rect", traits: ["nonexistent"], set: { w: "abc" } };
  const r = await call("preset_save", { recipe });
  expect(r).toMatchObject(fails(/nonexistent[\s\S]*set\.w/));
});

it("scene_validate data lists a bad opacity with a shot that ends after the scene", async () => {
  const data = {
    duration: 2,
    elements: [{ id: "a", kind: "rect", opacity: 5 }],
    shots: [{ id: "x", start: 0, end: 9 }],
  };
  const r = await call("scene_validate", { data });
  expect(r).toMatchObject(invalid(/opacity[\s\S]*«x» termina en 9s/));
});

it("scene_inspect_layout fails when given scene and data", async () => {
  const r = await call("scene_inspect_layout", { scene: "s", data: { elements: [] } });
  expect(r).toMatchObject(fails(/no ambos/));
});

// 081/D10: messages that say what to do

it("animation_save names the extra key as the path", async () => {
  const r = await call("animation_save", {
    recipe: { name: "M", anim: { in: { kind: "fade" } }, extra: 1 },
  });
  expect(r).toMatchObject({ ok: false, error: { path: "extra" } });
});

it("scene_build says a loop cycles value must be a whole number", async () => {
  const compact = {
    elements: [{ id: "e", kind: "text", text: "hi", anim: { loop: { kind: "float", cycles: 0.5 } } }],
  };
  expect(await call("scene_build", { compact })).toMatchObject(
    fails(/cycles: Debe ser un número entero/),
  );
});

it("scene_build explains a track that is not a list of keyframes", async () => {
  const compact = { elements: [{ id: "c", kind: "rect", tracks: { x: 5 } }] };
  const r = await call("scene_build", { compact });
  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringMatching(/Una pista es una lista de keyframes/) },
  });
});

it("element_add without kind or preset says to give one", async () => {
  expect(await call("element_add", { scene: "s" })).toMatchObject(
    fails(/Indica un preset \(preset_list\) o un tipo/),
  );
});

it("font_install with a bad file fails at file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-font-"));
  const file = join(dir, "x.txt");
  await writeFile(file, "no");
  const r = await call("font_install", { family: "X", file });
  expect(r).toMatchObject({ ok: false, error: { path: "file" } });
});

it("element_group says a child path is not top-level", async () => {
  await call("element_add", {
    scene: "s",
    preset: "Tarjeta con icono",
    patch: { id: "card" },
  });
  const r = await call("element_group", {
    scene: "s",
    ids: ["r", "card/anything"],
  });
  expect(r).toMatchObject(fails(/ruta de un hijo.*primer nivel/));
});

it("project_create with an existing id says to pass project", async () => {
  expect(await call("project_create", { name: "P" })).toMatchObject(
    fails(/pasa `project` con otro id/),
  );
});
