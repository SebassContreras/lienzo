import { describe, expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import type { AnimPreset } from "../../model/anim-preset.ts";
import { defaultScene, type Element, type Scene } from "../../model/model.ts";
import type { ToolFailure } from "../core/registry.ts";
import { checkAnimPresets, checkUniqueIds } from "./scenes.ts";

const rect = (id: string, fields: Record<string, unknown> = {}) =>
  ({ ...createElement("rect"), id, ...fields }) as Element;
const group = (id: string, children: Element[]) =>
  ({ ...createElement("group"), id, children }) as Element;
const scene = (elements: Element[]): Scene => ({ ...defaultScene(), elements });

/** The failure `run` throws, or undefined when it does not. */
function failure(run: () => void) {
  try {
    run();
  } catch (e) {
    return (e as ToolFailure).error;
  }
}

describe("checkAnimPresets", () => {
  const library = [{ name: "Entrada suave" }] as AnimPreset[];
  const preset = (name: string) => ({ animPreset: { name, start: 0 } });

  it("accepts a preset of the library, by its folded name", () => {
    expect(
      failure(() =>
        checkAnimPresets(scene([rect("a", preset("entrada-suave"))]), library),
      ),
    ).toBeUndefined();
  });

  it("refuses an unknown preset inside a group, at its path", () => {
    const error = failure(() =>
      checkAnimPresets(
        scene([group("g", [rect("ok"), rect("x", preset("nope"))])]),
        library,
      ),
    );
    expect(error).toMatchObject({
      code: "unknown_anim_preset",
      path: "elements.0.children.1.animPreset",
    });
  });
});

describe("checkUniqueIds", () => {
  it("refuses an id the write repeats", () => {
    expect(
      failure(() => checkUniqueIds(scene([rect("x"), rect("x")]))),
    ).toMatchObject({ code: "duplicate_id", path: "elements.1.id" });
  });

  it("a stored scene that already repeats an id can still be edited elsewhere", () => {
    const before = scene([rect("x"), rect("x"), rect("y")]);
    const after = scene([rect("x"), rect("x"), rect("y", { w: 300 })]);
    expect(failure(() => checkUniqueIds(after, before))).toBeUndefined();
  });

  it("but not with one more copy of that id", () => {
    const before = scene([rect("x"), rect("x")]);
    const after = scene([rect("x"), rect("x"), rect("x")]);
    expect(failure(() => checkUniqueIds(after, before))?.code).toBe(
      "duplicate_id",
    );
  });
});
