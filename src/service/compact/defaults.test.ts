import { describe, expect, it } from "vitest";
import "../../components/index.ts";
import type { Element } from "../../model/model.ts";
import type { PresetRecipe } from "../../model/preset.ts";
import { expandScene } from "./expand.ts";

type Shape = Extract<Element, { kind: "rect" }>;

const flatLook = (el: Element) => {
  const s = el as Shape;
  return {
    gradient: s.fill.gradient,
    shadow: s.shadow.enabled,
    border: s.border.width,
  };
};

describe("compact scene defaults", () => {
  it("turns off gradient, shadow and border on a flat shape", async () => {
    const { scene } = await expandScene({
      defaults: "flat",
      elements: [{ kind: "rect" }],
    });

    expect(flatLook(scene.elements[0])).toEqual({
      gradient: false,
      shadow: false,
      border: 0,
    });
  });

  it("lets a value written on the element win over flat", async () => {
    const { scene } = await expandScene({
      defaults: "flat",
      elements: [{ kind: "ellipse", shadow: { enabled: true } }],
    });

    expect(flatLook(scene.elements[0]).shadow).toBe(true);
  });

  it("leaves text unchanged under flat", async () => {
    const plain = await expandScene({ elements: [{ kind: "text" }] });
    const flat = await expandScene({
      defaults: "flat",
      elements: [{ kind: "text" }],
    });

    const { id: _a, ...expected } = plain.scene.elements[0];
    const { id: _b, ...actual } = flat.scene.elements[0];
    expect(actual).toEqual(expected);
  });

  it("leaves preset-built shapes unchanged under flat", async () => {
    const card: PresetRecipe = {
      name: "card",
      kind: "rect",
      traits: [],
      set: {},
    };

    const { scene } = await expandScene(
      { defaults: "flat", elements: [{ preset: "card" }] },
      { findPreset: () => card },
    );

    expect(flatLook(scene.elements[0])).toEqual({
      gradient: true,
      shadow: true,
      border: 2,
    });
  });

  it("applies flat to shapes inside a group", async () => {
    const { scene } = await expandScene({
      defaults: "flat",
      elements: [{ kind: "group", children: [{ kind: "star" }] }],
    });

    const group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(flatLook(group.children[0]).gradient).toBe(false);
  });

  it("keeps today's shape look without defaults", async () => {
    const { scene } = await expandScene({ elements: [{ kind: "rect" }] });

    expect(flatLook(scene.elements[0])).toEqual({
      gradient: true,
      shadow: true,
      border: 2,
    });
  });
});
