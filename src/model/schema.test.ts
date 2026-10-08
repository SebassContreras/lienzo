import { describe, expect, it } from "vitest";
import { demoScene } from "../demo.ts";
import { recipeFromBackground, recipeFromElement } from "../presets/diff.ts";
import { BUILT_IN_BACKGROUNDS, BUILT_IN_RECIPES } from "../presets/recipes.ts";
import {
  defaultBackground,
  defaultGroup,
  defaultLine,
  defaultRect,
  defaultScene,
  defaultText,
} from "./model.ts";
import { parsePresetRecipe, parseScene } from "./schema.ts";

describe("scene schema", () => {
  it("accepts the demo scene as saved to disk", () => {
    const saved = JSON.parse(JSON.stringify(demoScene()));
    expect(parseScene(saved)).toEqual({ ok: true, value: saved });
  });

  it("accepts nested groups", () => {
    const inner = { ...defaultGroup(), children: [defaultText()] };
    const outer = { ...defaultGroup(), children: [inner, defaultLine()] };
    const scene = { ...defaultScene(), elements: [outer] };
    expect(parseScene(JSON.parse(JSON.stringify(scene))).ok).toBe(true);
  });

  it("rejects a wrong value naming its path", () => {
    const rect = defaultRect();
    const scene = {
      ...defaultScene(),
      elements: [defaultText(), { ...rect, fill: { ...rect.fill, color: 3 } }],
    };
    const r = parseScene(scene);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^elements\.1\.fill\.color: /);
  });

  it("rejects an unknown element kind deep inside a group", () => {
    const group = {
      ...defaultGroup(),
      children: [{ ...defaultRect(), kind: "star" }],
    };
    const r = parseScene({ ...defaultScene(), elements: [group] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("elements.0.children.0.kind");
  });

  it("rejects something that is not a scene at all", () => {
    expect(parseScene({ name: "Tarjeta", kind: "rect", traits: [] }).ok).toBe(
      false,
    );
    expect(parseScene(null).ok).toBe(false);
  });
});

describe("preset schema", () => {
  it("accepts every built-in recipe", () => {
    for (const recipe of [...BUILT_IN_RECIPES, ...BUILT_IN_BACKGROUNDS]) {
      expect(parsePresetRecipe(recipe), recipe.name).toMatchObject({
        ok: true,
      });
    }
  });

  it("accepts recipes saved from elements and backgrounds, groups included", () => {
    const group = {
      ...defaultGroup(),
      children: [defaultRect(), defaultText()],
    };
    for (const recipe of [
      recipeFromElement("Grupo", group),
      recipeFromElement("Línea", defaultLine()),
      recipeFromBackground("Fondo", { ...defaultBackground(), dots: false }),
    ]) {
      const saved = JSON.parse(JSON.stringify(recipe));
      expect(parsePresetRecipe(saved)).toEqual({ ok: true, value: saved });
    }
  });

  it("keeps the category", () => {
    const r = parsePresetRecipe({
      name: "A",
      category: "Tarjetas",
      kind: "rect",
      traits: [],
    });
    expect(r.ok && r.value.category).toBe("Tarjetas");
  });

  it("rejects a bad field naming its path", () => {
    const r = parsePresetRecipe({ name: "A", kind: "rect", traits: [42] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^traits\.0: /);
  });

  it("rejects an unknown kind", () => {
    const r = parsePresetRecipe({ name: "A", kind: "star", traits: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^kind: /);
  });

  it("rejects a recipe that does not resolve", () => {
    const unknown = parsePresetRecipe({
      name: "A",
      kind: "rect",
      traits: ["no-such-trait"],
    });
    expect(unknown).toEqual({
      ok: false,
      error: "Trait desconocido «no-such-trait»",
    });
    const child = parsePresetRecipe({
      name: "G",
      kind: "group",
      traits: [],
      set: { children: [{ kind: "star" }] },
    });
    expect(child.ok).toBe(false);
  });

  it("rejects a scene given as a preset", () => {
    expect(parsePresetRecipe(defaultScene()).ok).toBe(false);
  });
});
