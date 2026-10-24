import { describe, expect, it } from "vitest";
import {
  defaultLine,
  defaultRect,
  defaultScene,
  defaultText,
} from "../model/model.ts";
import { installCanvasFakes } from "../test/recording-ctx.ts";
import { inspectLayout, layoutBoxes } from "./layout.ts";
import { registry } from "./tools/index.ts";

installCanvasFakes();

describe("pure inspectLayout (023/T006, R2, R3)", () => {
  it("detects text overlap when two text elements intersect", () => {
    const scene = defaultScene();
    const t1 = { ...defaultText(), id: "text-1", x: 100, y: 100, text: "Hola" };
    const t2 = {
      ...defaultText(),
      id: "text-2",
      x: 105,
      y: 105,
      text: "Mundo",
    };
    scene.elements = [t1, t2];

    const diags = inspectLayout(scene, [0]);
    const overlap = diags.find((d) => d.code === "text_overlap");
    expect(overlap).toBeDefined();
    expect(overlap?.elementId).toBe("text-1");
  });

  it("does not report text overlap when texts are apart", () => {
    const scene = defaultScene();
    const t1 = { ...defaultText(), id: "text-1", x: 50, y: 50, text: "Uno" };
    const t2 = {
      ...defaultText(),
      id: "text-2",
      x: 500,
      y: 500,
      text: "Dos",
    };
    scene.elements = [t1, t2];

    const diags = inspectLayout(scene, [0]);
    expect(diags.filter((d) => d.code === "text_overlap")).toHaveLength(0);
  });

  it("detects out of bounds when an element exceeds canvas dimensions", () => {
    const scene = defaultScene();
    scene.width = 800;
    scene.height = 600;
    const r1 = {
      ...defaultRect(),
      id: "rect-oob",
      x: 750,
      y: 100,
      w: 100,
      h: 50,
    };
    scene.elements = [r1];

    const diags = inspectLayout(scene, [0]);
    const oob = diags.find((d) => d.code === "out_of_bounds");
    expect(oob).toBeDefined();
    expect(oob?.elementId).toBe("rect-oob");
  });

  it("detects line attachments to missing ids", () => {
    const scene = defaultScene();
    const card = {
      ...defaultRect(),
      id: "card-1",
      x: 100,
      y: 100,
      w: 100,
      h: 100,
    };
    const line = defaultLine();
    line.id = "line-1";
    line.a = { x: 0, y: 0, attach: "card-1" };
    line.b = { x: 300, y: 300, attach: "nonexistent-id" };
    scene.elements = [card, line];

    const diags = inspectLayout(scene, [0]);
    const dangling = diags.find((d) => d.code === "dangling_attachment");
    expect(dangling).toBeDefined();
    expect(dangling?.elementId).toBe("line-1");
    expect(dangling?.message).toContain("nonexistent-id");
  });

  it("flags an element entering from outside only at the times it is outside (R2)", () => {
    const scene = defaultScene();
    scene.width = 1000;
    scene.height = 1000;
    scene.duration = 2;

    // An element sliding in from the left (starts at x=20 - 400 = -380, ends at x=20)
    const moving = {
      ...defaultRect(),
      id: "flyer",
      x: 20,
      y: 20,
      w: 100,
      h: 100,
      anim: {
        ...defaultRect().anim,
        in: {
          kind: "slide" as const,
          delay: 0,
          duration: 1,
          amount: 400,
          from: "left" as const,
          easing: "linear" as const,
        },
      },
    };
    scene.elements = [moving];

    const diagsT0 = inspectLayout(scene, [0]);
    const diagsT2 = inspectLayout(scene, [2]);

    // At t=0, slide from left has dx = -400, so x = 20 - 400 = -380 (out of bounds)
    expect(diagsT0.some((d) => d.code === "out_of_bounds")).toBe(true);
    // At t=2, animation is complete (dx = 0, x = 20, w = 100) and it's inside canvas
    expect(diagsT2.some((d) => d.code === "out_of_bounds")).toBe(false);
  });

  it("is registered as scene_inspect_layout in the tool registry (R3)", () => {
    const tool = registry.get("scene_inspect_layout");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("scene_inspect_layout");
  });
});

describe("pure layoutBoxes (023/T009, R2)", () => {
  const sliding = {
    ...defaultRect(),
    id: "flyer",
    x: 20,
    y: 20,
    w: 100,
    h: 100,
    anim: {
      ...defaultRect().anim,
      in: {
        kind: "slide" as const,
        delay: 0,
        duration: 1,
        amount: 400,
        from: "left" as const,
        easing: "linear" as const,
      },
    },
  };

  it("returns a centred element's box with its centre on the canvas centre", () => {
    const scene = { ...defaultScene(), width: 1080, height: 1080 };
    scene.elements = [
      { ...defaultRect(), id: "jar", x: 290, y: 340, w: 500, h: 400 },
    ];

    const [box] = layoutBoxes(scene, [0]);

    expect(box).toEqual({ id: "jar", t: 0, x: 290, y: 340, w: 500, h: 400 });
  });

  it("returns a different box at each time for an element entering from outside", () => {
    const scene = { ...defaultScene(), duration: 2, elements: [sliding] };

    const boxes = layoutBoxes(scene, [0, 2]);

    expect(boxes.map((b) => b.x)).toEqual([-380, 20]);
  });

  it("skips zero-opacity, before-in, after-out, and off-shot inactive elements and tags diagnostics with shot (055/R5, T011)", () => {
    const scene = {
      ...defaultScene(),
      width: 1080,
      height: 1080,
      duration: 10,
      shots: [
        {
          id: "shot-1",
          name: "Intro",
          start: 0,
          end: 3,
        },
        {
          id: "shot-2",
          name: "Main",
          start: 3,
          end: 8,
        },
      ],
      elements: [
        // Out of bounds during shot-1
        {
          ...defaultRect(),
          id: "oob-shot-1",
          shot: "shot-1",
          x: 2000,
          y: 2000,
          w: 100,
          h: 100,
        },
        // Element with opacity: 0
        {
          ...defaultRect(),
          id: "zero-opacity-el",
          shot: "shot-1",
          opacity: 0,
          x: 3000,
          y: 3000,
          w: 100,
          h: 100,
        },
        // Element with in animation starting at t=2
        {
          ...defaultRect(),
          id: "delayed-in-el",
          x: 4000,
          y: 4000,
          w: 100,
          h: 100,
          anim: {
            ...defaultRect().anim,
            in: {
              kind: "fade" as const,
              delay: 2,
              duration: 1,
              amount: 0,
              from: "down" as const,
              easing: "linear" as const,
            },
          },
        },
        // Element with out animation ending at t=5
        {
          ...defaultRect(),
          id: "early-out-el",
          x: 5000,
          y: 5000,
          w: 100,
          h: 100,
          anim: {
            ...defaultRect().anim,
            out: {
              kind: "fade" as const,
              delay: 4,
              duration: 1,
              amount: 0,
              from: "down" as const,
              easing: "linear" as const,
            },
          },
        },
      ],
    };

    // At t = 1:
    // - oob-shot-1 is active (shot-1 [0,3]) and out of bounds -> reports diagnostic with shot: 'shot-1'
    // - zero-opacity-el is skipped (opacity === 0)
    // - delayed-in-el is skipped (t < in.delay = 2)
    // - early-out-el is active (t < 5) and out of bounds
    const diagsAt1 = inspectLayout(scene, [1]);
    const oob1 = diagsAt1.find((d) => d.elementId === "oob-shot-1");
    expect(oob1).toBeDefined();
    expect(oob1?.shot).toBe("shot-1");

    expect(diagsAt1.find((d) => d.elementId === "zero-opacity-el")).toBeUndefined();
    expect(diagsAt1.find((d) => d.elementId === "delayed-in-el")).toBeUndefined();
    expect(diagsAt1.find((d) => d.elementId === "early-out-el")).toBeDefined();

    // At t = 5:
    // - oob-shot-1 is off-shot (t=5 is outside shot-1 [0,3]) -> skipped
    // - delayed-in-el is now active (t >= 2) -> reported
    // - early-out-el has completed exit (t >= 4 + 1 = 5) -> skipped
    const diagsAt5 = inspectLayout(scene, [5]);
    expect(diagsAt5.find((d) => d.elementId === "oob-shot-1")).toBeUndefined();
    expect(diagsAt5.find((d) => d.elementId === "delayed-in-el")).toBeDefined();
    expect(diagsAt5.find((d) => d.elementId === "early-out-el")).toBeUndefined();
  });
});
