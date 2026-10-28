import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import { isColor } from "./color.ts";
import { defaultScene } from "./model.ts";
import { parseScene } from "./schema.ts";

describe("isColor", () => {
  it.each([
    "#fff",
    "#ffff",
    "#0f172a",
    "#0f172a80",
    "rgb(1, 2, 3)",
    "rgba(0 0 0 / 50%)",
    "hsl(200 50% 40%)",
    "hsl(0.5turn, 10%, 20%, .5)",
    "Red",
    "transparent",
  ])("takes %s, a form the canvas parses", (c) => {
    expect(isColor(c)).toBe(true);
  });

  it.each([
    "azul",
    "not-a-color",
    "#ggg",
    "#12345",
    "",
    "rgb",
    "url(x)",
    "rgb(abc)",
    "hsl(red)",
    "rgb(1, 2)",
  ])("rejects %s", (c) => {
    expect(isColor(c)).toBe(false);
  });
});

describe("scene values", () => {
  const sceneWith = (patch: Record<string, unknown>) => {
    const scene = defaultScene();
    scene.elements = [{ ...createElement("rect"), ...patch } as never];
    return parseScene(scene);
  };
  it("rejects a non-color background and a negative width", () => {
    const scene = defaultScene();
    scene.background.color = "azul";
    expect(parseScene(scene).ok).toBe(false);
    expect(sceneWith({ w: -50 }).ok).toBe(false);
  });
  it("checks keyframe values against their field", () => {
    const key = (value: unknown) => [{ t: 0, value, easing: "auto" }];
    expect(sceneWith({ tracks: { opacity: key(5) } })).toMatchObject({
      ok: false,
      path: "elements.0.tracks.opacity.0.value",
    });
    expect(sceneWith({ tracks: { "fill.color": key("rojo") } }).ok).toBe(false);
    expect(
      sceneWith({ tracks: { opacity: key(0.5), "fill.color": key("#f00") } })
        .ok,
    ).toBe(true);
  });
});
