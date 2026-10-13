import { describe, expect, it } from "vitest";
import {
  defaultLine,
  defaultRect,
  defaultScene,
  defaultText,
} from "../model/model.ts";
import { installCanvasFakes } from "../test/recording-ctx.ts";
import { inspectLayout } from "./layout.ts";
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
