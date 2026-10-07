import { describe, expect, it } from "vitest";
import {
  defaultLine,
  defaultRect,
  defaultText,
  type LineEl,
  type RectEl,
  type TextEl,
} from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { TRAITS } from "../traits/index.ts";
import { resolveElement, resolvePreset } from "./resolve.ts";

function resolved(recipe: PresetRecipe) {
  const r = resolveElement(recipe);
  if ("error" in r) throw new Error(r.error);
  return r.element;
}

describe("traits", () => {
  it("each trait declares at least one kind and only known kinds", () => {
    for (const trait of TRAITS.values()) {
      const kinds = Object.keys(trait.apply);
      expect(kinds.length).toBeGreaterThan(0);
      for (const k of kinds) {
        expect([
          "shape",
          "rect",
          "ellipse",
          "icon",
          "image",
          "group",
          "text",
          "line",
          "background",
        ]).toContain(k);
      }
    }
  });

  it("one trait sets the matching field on each kind", () => {
    const glow = { use: "glow", color: "#22d3ee", blur: 9, strength: 2 };
    const expected = {
      enabled: true,
      color: "#22d3ee",
      blur: 9,
      strength: 2,
    };
    const rect = resolved({ name: "r", kind: "rect", traits: [glow] });
    const text = resolved({ name: "t", kind: "text", traits: [glow] });
    const line = resolved({ name: "l", kind: "line", traits: [glow] });
    expect((rect as RectEl).borderGlow).toEqual(expected);
    expect((text as TextEl).glow).toEqual(expected);
    expect((line as LineEl).glow).toEqual(expected);
  });

  it("parameters fall back to the trait's defaults", () => {
    const el = resolved({
      name: "r",
      kind: "rect",
      traits: [{ use: "float", amount: 30 }],
    }) as RectEl;
    expect(el.anim).toEqual({ kind: "float", amount: 30, cycles: 1, delay: 0 });
  });
});

describe("resolvePreset", () => {
  it("starts from the kind's default and names the element after the recipe", () => {
    const el = resolved({ name: "Vacío", kind: "text", traits: [] });
    const { id: _a, ...rest } = el;
    const { id: _b, ...def } = { ...defaultText(), name: "Vacío" };
    expect(rest).toEqual(def);
  });

  it("applies traits in order, so a later trait wins", () => {
    const el = resolved({
      name: "r",
      kind: "rect",
      traits: [{ use: "glow", color: "#ff0000" }, "no-glow"],
    }) as RectEl;
    expect(el.borderGlow.enabled).toBe(false);
    expect(el.borderGlow.color).toBe("#ff0000");
  });

  it("deep-merges `set` last, keeping the fields it does not name", () => {
    const el = resolved({
      name: "r",
      kind: "rect",
      traits: [{ use: "border", color: "#ff0000" }],
      set: { w: 500, border: { width: 7 }, label: { text: "Hola" } },
    }) as RectEl;
    const def = defaultRect();
    expect(el.w).toBe(500);
    expect(el.border).toEqual({ ...def.border, color: "#ff0000", width: 7 });
    expect(el.label).toEqual({ ...def.label, text: "Hola" });
  });

  it("gives every resolved element a fresh id", () => {
    const recipe: PresetRecipe = { name: "l", kind: "line", traits: [] };
    expect(resolved(recipe).id).not.toBe(resolved(recipe).id);
    expect(resolved(recipe).id).not.toBe(defaultLine().id);
  });

  it("reports an unknown trait by name", () => {
    const r = resolvePreset({ name: "x", kind: "rect", traits: ["sparkle"] });
    expect(r).toEqual({ error: "Trait desconocido «sparkle»" });
  });

  it("reports a trait that does not apply to the kind", () => {
    const r = resolvePreset({ name: "x", kind: "text", traits: ["glass"] });
    expect(r).toEqual({ error: "El trait «glass» no se aplica a «text»" });
  });

  it("reports an unknown parameter", () => {
    const r = resolvePreset({
      name: "x",
      kind: "rect",
      traits: [{ use: "glow", colour: "#fff" }],
    });
    expect("error" in r && r.error).toContain("colour");
  });

  it("reports an unknown element kind", () => {
    const r = resolvePreset({
      name: "x",
      kind: "star" as PresetRecipe["kind"],
      traits: [],
    });
    expect("error" in r).toBe(true);
  });
});
