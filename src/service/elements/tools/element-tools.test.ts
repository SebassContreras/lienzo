import { expect, it } from "vitest";
import { groupElements, ungroupElement } from "../../../engine/groups.ts";
import { defaultRect, defaultScene } from "../../../model/model.ts";
import { fails, toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

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

it("element_update moves an element's tracks with the shot it is rebound to", async () => {
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

it("element_update lists a bad field and an unknown shot together", async () => {
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

it("element_update keeps tracks given with a new shot as given", async () => {
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

it("element_update rejects a fill opacity above 1", async () => {
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

it("element_add names a failure about the new element by its patch", async () => {
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

it("element_add of an image whose asset is missing says it does not exist", async () => {
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

it("element_add rounds the box in the off-canvas notice", async () => {
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

it("element_update reads a patch sent as a JSON string, as some MCP clients send it", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: '{"w": 321}',
  });
  const scene = await call("scene_get", { scene: "s" });

  expect(r).toMatchObject({ ok: true });
  expect(scene).toMatchObject({ value: { elements: [{ id: "r", w: 321 }] } });
});

it("element_update still fails on a patch string that is not JSON", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: "w=321",
  });

  expect(r).toMatchObject({ ok: false, error: { path: "patch" } });
});

it("element_add takes short keyframes and stores them whole", async () => {
  await call("element_add", {
    scene: "s",
    kind: "rect",
    patch: { id: "q", tracks: SHORT },
  });

  expect(await storedTracks("s", "q")).toEqual(STORED);
});

it("element_update takes short keyframes and stores them whole", async () => {
  await call("element_update", {
    scene: "s",
    id: "r",
    patch: { tracks: SHORT },
  });

  expect(await storedTracks("s", "r")).toEqual(STORED);
});

it("element_ungroup gives the group's shot back to its children", async () => {
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

it("element_add of a missing preset lists presets", async () => {
  expect(
    await call("element_add", { scene: "s", preset: "nope" }),
  ).toMatchObject(fails(/«nope».*(hay|quisiste)/));
});

it("element_update fails on a negative radius", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { radius: -5 },
  });

  expect(r).toMatchObject({ ok: false, error: { path: "elements.r.radius" } });
});

it("element_update suggests the nested paths a misspelled key means", async () => {
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

it("element_update rebinding an element with no tracks gives no moved notice", async () => {
  await call("shot_set", { scene: "s", id: "s2", start: 2, end: 4 });

  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { shot: "s2" },
  });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("element_group gives the group the shot its members share", async () => {
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

it("the editor's groupElements and ungroupElement carry the shot as the tools do", () => {
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

it("element_add fails on an id the scene has, at patch.id", async () => {
  const r = await call("element_add", {
    scene: "s",
    kind: "text",
    patch: { id: "r" },
  });
  expect(r).toMatchObject({ ok: false, error: { code: "duplicate_id" } });
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

it("element_add without kind or preset says to give one", async () => {
  expect(await call("element_add", { scene: "s" })).toMatchObject(
    fails(/Indica un preset \(preset_list\) o un tipo/),
  );
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
