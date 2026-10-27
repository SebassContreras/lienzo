import { describe, expect, it } from "vitest";
import type { GroupEl } from "../components/group/descriptor.ts";
import type { RectEl } from "../components/rect/descriptor.ts";
import {
  defaultElement,
  defaultScene,
  type Element,
  type Scene,
  type Shot,
} from "../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";
import type { Ctx } from "./paint.ts";
import { drawScene } from "./render.ts";

installCanvasFakes();

/** Draws the scene and returns the transform in effect at each element fill, background excluded. */
function fillTransforms(scene: Scene, t: number): string[] {
  const ctx = new RecordingCtx();
  const seen: string[] = [];
  const fill = ctx.fill.bind(ctx);
  ctx.fill = ((...args: never[]) => {
    const m = ctx.getTransform();
    seen.push([m.a, m.d, m.e, m.f].map((v) => v.toFixed(3)).join(","));
    fill(...args);
  }) as typeof ctx.fill;
  drawScene(ctx as unknown as Ctx, scene, t);
  return seen;
}

function rect(id: string, shot?: string): RectEl {
  const el = defaultElement("rect") as RectEl;
  return { ...el, id, x: 100, y: 100, w: 200, h: 100, shot };
}

function sceneOf(elements: Element[], shots: Shot[]): Scene {
  const scene = defaultScene();
  return {
    ...scene,
    background: { ...scene.background, dots: false, spotlight: 0 },
    elements,
    shots,
  };
}

const zoomShot: Shot = {
  id: "s1",
  name: "A",
  start: 0,
  end: 5,
  camera: { zoom: 2 },
};

describe("shot camera scope (063/R2, R3)", () => {
  it("transforms a grouped element exactly as its ungrouped copy", () => {
    // Arrange
    const child = rect("child");
    const group: GroupEl = {
      ...(defaultElement("group") as GroupEl),
      id: "g",
      shot: "s1",
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      cw: 100,
      ch: 100,
      children: [child],
    };
    const grouped = sceneOf([group], [zoomShot]);
    const flat = sceneOf([rect("child", "s1")], [zoomShot]);

    // Act
    const inGroup = fillTransforms(grouped, 1);
    const alone = fillTransforms(flat, 1);

    // Assert
    expect(inGroup.at(-1)).toBe(alone.at(-1));
  });

  it("leaves an element with no shot unmoved under a camera", () => {
    // Arrange
    const withCamera = sceneOf([rect("logo")], [zoomShot]);
    const withoutCamera = sceneOf([rect("logo")], []);

    // Act
    const moved = fillTransforms(withCamera, 1);
    const still = fillTransforms(withoutCamera, 1);

    // Assert
    expect(moved).toEqual(still);
  });
});

describe("shot transitions on screen (063/R1)", () => {
  it("draws an entering slide shot offset by the transition", () => {
    // Arrange
    const shot: Shot = {
      id: "s1",
      name: "A",
      start: 2,
      end: 4,
      transition: { kind: "slide", duration: 1 },
    };
    const scene = sceneOf([rect("card", "s1")], [shot]);

    // Act
    const entering = fillTransforms(scene, 1.5);

    // Assert
    expect(entering.at(-1)).toBe("1.000,1.000,540.000,0.000");
  });
});

describe("grouped children of different shots (071/D2)", () => {
  /** The texts drawn at `t`. */
  function textsAt(scene: Scene, t: number): string[] {
    const ctx = new RecordingCtx();
    const texts: string[] = [];
    const fillText = ctx.fillText.bind(ctx);
    ctx.fillText = ((text: string, ...rest: never[]) => {
      texts.push(text);
      fillText(text, ...rest);
    }) as typeof ctx.fillText;
    drawScene(ctx as unknown as Ctx, scene, t);
    return texts;
  }
  const shots: Shot[] = [
    { id: "s1", name: "A", start: 0, end: 3 },
    { id: "s2", name: "B", start: 3, end: 6 },
  ];
  const grouped = (): Scene => {
    const counter = { ...defaultElement("counter"), id: "n", shot: "s2" };
    const group: GroupEl = {
      ...(defaultElement("group") as GroupEl),
      id: "g",
      children: [rect("r", "s1"), counter as Element],
    };
    return { ...sceneOf([group], shots), duration: 6 };
  };

  it("draws a grouped child inside its own shot", () => {
    const texts = textsAt(grouped(), 4);

    expect(texts).toHaveLength(1);
  });

  it("skips a grouped child outside its own shot", () => {
    const texts = textsAt(grouped(), 1);

    expect(texts).toEqual([]);
  });
});
