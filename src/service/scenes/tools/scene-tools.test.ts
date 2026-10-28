import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { fails, invalid, toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

const UNKNOWN_SIZE = /«potato».*9:16/;

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

const audioFile = async (name: string) => {
  const dir = join(suite.ctx().root, "projects", "p", "assets");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from("ID3"));
};

const storedAudio = async (scene: string) => {
  const got = (await call("scene_get", { scene, full: true })) as {
    value: { audioTracks?: { assetId: string }[] };
  };
  return got.value.audioTracks?.map((t) => t.assetId);
};

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

it("scene_validate lists schema and rule problems together", async () => {
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

it("scene_build given the compact fields at the top level says they go in compact", async () => {
  const r = await call("scene_build", { elements: [], size: "9:16" });

  expect(r).toMatchObject(
    fails(
      /«elements», «size» no son parámetros de scene_build: ¿van dentro de «compact»\?/,
    ),
  );
});

it("suggests text for content on a text element", async () => {
  const r = await call("scene_build", {
    compact: { elements: [{ kind: "text", content: "Hola" }] },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«text»")] },
  });
});

it("scene_update removing a symbol a use names leaves a notice", async () => {
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

it("scene_delete of a missing scene fails at scene", async () => {
  const r = await call("scene_delete", { scene: "nada" });

  expect(r).toMatchObject({
    ok: false,
    error: { path: "scene", message: expect.stringContaining("escena") },
  });
});

it("scene_build names a duplicate id at the element that repeats it", async () => {
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

it("scene_create takes short keyframes in data", async () => {
  await call("scene_create", {
    scene: "t",
    data: { elements: [{ id: "q", kind: "rect", tracks: SHORT }] },
  });

  expect(await storedTracks("t", "q")).toEqual(STORED);
});

it("scene_validate takes short keyframes in data", async () => {
  const r = await call("scene_validate", {
    data: { elements: [{ id: "q", kind: "rect", tracks: SHORT }] },
  });

  expect(r).toMatchObject({ ok: true, value: { valid: true } });
});

it("scene_build lists a bad element value and an unknown shot together, by id", async () => {
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

it("scene_validate lists a bad element value and an unknown shot together, by id", async () => {
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

it("scene_validate lists a late shot and an overlap together", async () => {
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

it("scene_validate lists every unknown animation preset with the library's names", async () => {
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

it("scene_update takes partial symbol children with short keyframes", async () => {
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

it("scene_update stores a bare audio ref with its project prefix", async () => {
  await audioFile("voz.mp3");

  await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ id: "t1", assetId: "voz.mp3" }] },
  });

  expect(await storedAudio("s")).toEqual(["/projects/p/assets/voz.mp3"]);
});

it("scene_build stores a bare audio ref with its project prefix", async () => {
  await audioFile("voz.mp3");

  await call("scene_build", {
    compact: { audioTracks: [{ assetId: "voz.mp3" }] },
    save: "b",
  });

  expect(await storedAudio("b")).toEqual(["/projects/p/assets/voz.mp3"]);
});

it("scene_validate names an ignored key of a data element by its id", async () => {
  const r = await call("scene_validate", {
    data: { elements: [{ id: "t", kind: "text", content: "hola" }] },
  });

  expect(r).toMatchObject({
    value: {
      notices: [expect.stringContaining("ignorado: elements.t.content")],
    },
  });
});

it("scene_build names an ignored key of a compact element by its id", async () => {
  const r = await call("scene_build", {
    compact: { elements: [{ id: "t", kind: "text", content: "hola" }] },
  });

  expect(r).toMatchObject({
    value: { notices: [expect.stringContaining("compact.elements.t.content")] },
  });
});

it("background_set of a missing preset lists background presets", async () => {
  expect(
    await call("background_set", { scene: "s", preset: "Azul nohe" }),
  ).toMatchObject({
    ok: false,
    error: { path: "preset", message: expect.stringContaining("«Azul noche»") },
  });
});

it("scene_build of a missing preset lists presets", async () => {
  const compact = { elements: [{ id: "a", preset: "nope" }] };

  expect(await call("scene_build", { compact })).toMatchObject(
    fails(
      /compact\.elements\.a\.preset: No existe el preset «nope» \((hay|¿quisiste)/,
    ),
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

it("scene_build with save notices an element off the canvas", async () => {
  const compact = { elements: [{ id: "far", kind: "rect", x: 2000, y: 10 }] };
  const r = await call("scene_build", { compact, save: "z" });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«far» se sale del lienzo/)] },
  });
});

it("scene_validate compact lists a bad size with a bad element", async () => {
  const compact = {
    size: "banana",
    elements: [
      { id: "a", kind: "nokind" },
      { id: "b", kind: "rect", w: "big" },
    ],
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
      message: expect.stringMatching(
        /compact\.elements\.f\.fit[\s\S]*wobble|compact\.elements\.f\.fit[\s\S]*anim/,
      ),
    },
  });
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

it("scene_build says a loop cycles value must be a whole number", async () => {
  const compact = {
    elements: [
      {
        id: "e",
        kind: "text",
        text: "hi",
        anim: { loop: { kind: "float", cycles: 0.5 } },
      },
    ],
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
    error: {
      message: expect.stringMatching(/Una pista es una lista de keyframes/),
    },
  });
});

it("scene_update notices a long transition and a camera channel the camera lacks", async () => {
  const shots = [
    {
      id: "a",
      name: "a",
      start: 0,
      end: 2,
      camera: { tracks: { rotation: [[0, 1]] } },
      transition: { kind: "fade", duration: 5 },
    },
  ];
  const r = await call("scene_create", { scene: "z", data: { shots } });
  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: expect.arrayContaining([
        expect.stringMatching(/transición/),
        expect.stringMatching(/«rotation»/),
      ]),
    },
  });
});
