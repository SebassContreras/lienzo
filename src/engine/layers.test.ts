import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import { hitTest } from "./geometry.ts";
import {
  moveElementLayer,
  reorderElements,
  toggleElementLock,
  toggleElementVisibility,
  visualIndexToArrayIndex,
  visualLayerOrder,
} from "./layers.ts";
import { drawElements } from "./render.ts";
import { defaultScene, type Element, type GroupEl, type RectEl, type Scene } from "../model/model.ts";
import { ElementSchema, SceneSchema } from "../model/schema.ts";

function makeEl(id: string, name: string): RectEl {
  const el = createElement("rect");
  el.id = id;
  el.name = name;
  return el;
}

describe("layers integration and model", () => {
  it("reorders elements cleanly without mutation", () => {
    const list = ["a", "b", "c", "d"];
    const moved = reorderElements(list, 1, 3);
    expect(moved).toEqual(["a", "c", "d", "b"]);
    expect(list).toEqual(["a", "b", "c", "d"]);

    // Out of bounds or no-op
    expect(reorderElements(list, 0, 0)).toEqual(list);
    expect(reorderElements(list, -1, 2)).toEqual(list);
    expect(reorderElements(list, 1, 99)).toEqual(list);
  });

  it("moves element layer up, down, top, and bottom", () => {
    const el1 = makeEl("1", "One");
    const el2 = makeEl("2", "Two");
    const el3 = makeEl("3", "Three");
    const elements: Element[] = [el1, el2, el3];

    // move '1' up -> index 1
    const up = moveElementLayer(elements, "1", "up");
    expect(up.map((e) => e.id)).toEqual(["2", "1", "3"]);

    // move '1' to top -> index 2
    const top = moveElementLayer(elements, "1", "top");
    expect(top.map((e) => e.id)).toEqual(["2", "3", "1"]);

    // move '3' down -> index 1
    const down = moveElementLayer(elements, "3", "down");
    expect(down.map((e) => e.id)).toEqual(["1", "3", "2"]);

    // move '3' to bottom -> index 0
    const bottom = moveElementLayer(elements, "3", "bottom");
    expect(bottom.map((e) => e.id)).toEqual(["3", "1", "2"]);
  });

  it("moves element layer inside nested groups", () => {
    const el1 = makeEl("1", "One");
    const el2 = makeEl("2", "Two");
    const groupEl = createElement("group") as GroupEl;
    groupEl.id = "g1";
    groupEl.name = "Group 1";
    groupEl.children = [el1, el2];

    const sceneElements: Element[] = [groupEl];
    const moved = moveElementLayer(sceneElements, "1", "up");
    const updatedGroup = moved[0] as GroupEl;
    expect((updatedGroup.children as Element[]).map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("toggles element visibility", () => {
    const el1 = makeEl("1", "One");
    const elements: Element[] = [el1];

    const hidden = toggleElementVisibility(elements, "1");
    expect(hidden[0].hidden).toBe(true);

    const visible = toggleElementVisibility(hidden, "1");
    expect(visible[0].hidden).toBeUndefined();

    // Forced visibility
    const forced = toggleElementVisibility(elements, "1", true);
    expect(forced[0].hidden).toBe(true);
  });

  it("toggles element lock status", () => {
    const el1 = makeEl("1", "One");
    const elements: Element[] = [el1];

    const locked = toggleElementLock(elements, "1");
    expect(locked[0].locked).toBe(true);

    const unlocked = toggleElementLock(locked, "1");
    expect(unlocked[0].locked).toBeUndefined();

    // Forced lock
    const forced = toggleElementLock(elements, "1", true);
    expect(forced[0].locked).toBe(true);
  });

  it("maps visual layer order and indices", () => {
    const elements = ["bottom", "middle", "top"];
    const visual = visualLayerOrder(elements);
    expect(visual).toEqual(["top", "middle", "bottom"]);

    // Visual index 0 ("top") corresponds to array index 2
    expect(visualIndexToArrayIndex(0, elements.length)).toBe(2);
    // Visual index 2 ("bottom") corresponds to array index 0
    expect(visualIndexToArrayIndex(2, elements.length)).toBe(0);
  });

  it("validates hidden and locked attributes in ElementSchema and SceneSchema", () => {
    const el = makeEl("1", "Card");
    el.hidden = true;
    el.locked = true;

    const parsedEl = ElementSchema.parse(el);
    expect(parsedEl.hidden).toBe(true);
    expect(parsedEl.locked).toBe(true);

    const scene: Scene = {
      ...defaultScene(),
      elements: [el],
    };
    const parsedScene = SceneSchema.parse(scene);
    expect(parsedScene.elements[0].hidden).toBe(true);
    expect(parsedScene.elements[0].locked).toBe(true);
  });

  it("skips hidden and locked elements in hitTest", () => {
    const el = makeEl("1", "Card");
    el.x = 10;
    el.y = 10;
    el.w = 100;
    el.h = 100;

    const scene: Scene = {
      ...defaultScene(),
      elements: [el],
    };

    // Hit test succeeds when visible and unlocked
    expect(hitTest(scene, { x: 50, y: 50 }, 1)?.id).toBe("1");

    // Hit test ignores locked element
    el.locked = true;
    expect(hitTest(scene, { x: 50, y: 50 }, 1)).toBeUndefined();

    // Hit test ignores hidden element
    el.locked = undefined;
    el.hidden = true;
    expect(hitTest(scene, { x: 50, y: 50 }, 1)).toBeUndefined();
  });

  it("skips hidden elements during drawElements", () => {
    const el = makeEl("1", "Card");
    el.hidden = true;

    const scene: Scene = {
      ...defaultScene(),
      elements: [el],
    };

    let drawn = false;
    const fakeCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      fill: () => {
        drawn = true;
      },
      stroke: () => {
        drawn = true;
      },
      fillRect: () => {
        drawn = true;
      },
      strokeRect: () => {
        drawn = true;
      },
    } as unknown as CanvasRenderingContext2D;

    drawElements(fakeCtx, scene.elements, scene, 0);
    expect(drawn).toBe(false);
  });
});
