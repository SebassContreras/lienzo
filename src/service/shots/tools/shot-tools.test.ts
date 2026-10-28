import { expect, it } from "vitest";
import { fails, toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

it("shot_set moves the tracks of its elements and its camera keys with a new start", async () => {
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

it("shot_set remove moves the unbound elements' tracks back to the scene's start", async () => {
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

it("keyframe_set rejects an opacity above 1 on a text, as on a rect", async () => {
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

it("shot_set trimming a shot's start leaves its elements' tracks in place", async () => {
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

it("keyframe_remove on a path with no track fails at path", async () => {
  const r = await call("keyframe_remove", {
    scene: "s",
    id: "r",
    path: "x",
    t: 1,
  });

  expect(r).toMatchObject({ ok: false, error: { path: "path" } });
});

it("a bad keyframe value names the keyframe's field, not «Entrada inválida»", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { tracks: { opacity: [[0, "x", "wobbly"]] } },
  });

  expect(r).toMatchObject(
    fails(/elements\.r\.tracks\.opacity\.0\.easing: easing desconocido/),
  );
});

it("keyframe_set fails on a negative radius key", async () => {
  const r = await call("keyframe_set", {
    scene: "s",
    id: "r",
    path: "radius",
    t: 1,
    value: -5,
  });

  expect(r).toMatchObject({ ok: false, error: { code: "invalid_value" } });
});
