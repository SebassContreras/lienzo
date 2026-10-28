import { expect, it } from "vitest";
import { fails, toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

const SHORT = { opacity: [[0, 0], { t: 0.5, value: 1 }] };

it("preset_validate lists each recipe problem at its own path", async () => {
  const recipe = {
    name: "X",
    kind: "rect",
    traits: [],
    set: { w: "ancho" },
    values: {},
  };

  const r = await call("preset_validate", { recipe });

  expect(r).toMatchObject({
    value: { errors: [{ path: "values" }, { path: "set.w" }] },
  });
});

it("preset_rename of a built-in preset says it is built in", async () => {
  const r = await call("preset_rename", {
    from: "Contador animado",
    to: "Mi contador",
  });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in", path: "from" },
  });
});

it("preset_delete of a built-in preset says it is built in", async () => {
  const r = await call("preset_delete", { name: "31-contador" });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "built_in", path: "name" },
  });
});

it("animation_save takes short keyframes", async () => {
  const r = await call("animation_save", {
    recipe: { name: "Aparece", tracks: SHORT },
  });

  expect(r).toMatchObject({
    ok: true,
    value: { animation: expect.any(String) },
  });
});

it("preset_get of a missing preset fails at name, listing presets", async () => {
  expect(await call("preset_get", { name: "nope" })).toMatchObject({
    ok: false,
    error: {
      path: "name",
      message: expect.stringMatching(/«nope».*(hay|quisiste)/),
    },
  });
});

it("animation_save fails on an unknown recipe key, naming it", async () => {
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

it("preset_validate fails on a negative radius in set", async () => {
  const r = await call("preset_validate", {
    recipe: { name: "Caja", kind: "rect", set: { radius: -5 } },
  });

  expect(r).toMatchObject({
    value: { valid: false, errors: [{ path: "set.radius" }] },
  });
});

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
    value: {
      notices: expect.arrayContaining([expect.stringMatching(/set.zzz/)]),
    },
  });
});

it("preset_save notices when the file is named differently", async () => {
  const r = await call("preset_save", {
    recipe: { name: "Caja Ámbar", kind: "rect" },
  });
  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: expect.arrayContaining([expect.stringMatching(/caja-ambar/)]),
    },
  });
});

it("animation_save refuses two keyframes at one time", async () => {
  const recipe = {
    name: "Dos",
    tracks: {
      x: [
        [0, 1],
        [0, 2],
      ],
    },
  };
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
      message: expect.stringMatching(
        /nonexistent[\s\S]*set\.w|set\.w[\s\S]*nonexistent/,
      ),
    },
  });
});

it("preset_save lists a bad trait with a bad set value", async () => {
  const recipe = {
    name: "X",
    kind: "rect",
    traits: ["nonexistent"],
    set: { w: "abc" },
  };
  const r = await call("preset_save", { recipe });
  expect(r).toMatchObject(fails(/nonexistent[\s\S]*set\.w/));
});

it("animation_save names the extra key as the path", async () => {
  const r = await call("animation_save", {
    recipe: { name: "M", anim: { in: { kind: "fade" } }, extra: 1 },
  });
  expect(r).toMatchObject({ ok: false, error: { path: "extra" } });
});
