import { describe, expect, it } from "vitest";
import { migrateAnim } from "../components/fields/index.ts";
import type { PresetRecipe } from "../model/preset.ts";
import fixture from "./built-in.fixture.json";
import { BUILT_IN_RECIPES } from "./recipes.ts";
import { resolveElement } from "./resolve.ts";

/**
 * `built-in.fixture.json` holds, in library order and without ids, the 13 elements the
 * hand-written presets module produced before the presets became recipes. Presets added
 * since come after them.
 */
describe("built-in recipes", () => {
  it("start with the 13 presets, in the same order", () => {
    expect(
      BUILT_IN_RECIPES.slice(0, fixture.length).map((r) => r.name),
    ).toEqual(fixture.map((el) => el.name));
  });

  it.each(
    BUILT_IN_RECIPES.slice(0, fixture.length).map(
      (r, i) => [r.name, i] as const,
    ),
  )("«%s» resolves to the element it built before", (_name, i) => {
    const r = resolveElement(BUILT_IN_RECIPES[i] as PresetRecipe);
    if ("error" in r) throw new Error(r.error);
    const { id, ...element } = r.element;
    expect(typeof id).toBe("string");
    // Recorded before spec 013: its flat `anim` now lives in the slot of its kind.
    const before = fixture[i] as (typeof fixture)[number] & { anim?: unknown };
    const migrated = before.anim
      ? { ...before, anim: migrateAnim(before.anim) }
      : before;
    // Lines recorded before spec 021 are straight; rects recorded before 053 have opacity 1,
    // and their fills, recorded before 059, are linear.
    const expected =
      migrated.kind === "line"
        ? { ...migrated, route: "straight" }
        : migrated.kind === "rect"
          ? {
              opacity: 1,
              ...migrated,
              fill: { type: "linear", ...migrated.fill },
            }
          : migrated;
    expect(element).toEqual(expected);
  });

  it.each(
    BUILT_IN_RECIPES.slice(fixture.length).map((r) => [r.name, r] as const),
  )("«%s» resolves without errors", (_name, recipe) => {
    expect(resolveElement(recipe)).not.toHaveProperty("error");
  });

  it("include the presets for the new components", () => {
    const kinds = new Map(BUILT_IN_RECIPES.map((r) => [r.name, r.kind]));
    expect(kinds.get("Tarjeta con icono")).toBe("group");
    expect(kinds.get("Icono con fondo")).toBe("icon");
    expect(kinds.get("Avatar circular")).toBe("ellipse");
    expect(kinds.get("Logo (imagen)")).toBe("image");
  });
});
