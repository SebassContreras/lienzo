import { describe, expect, it } from "vitest";
import { imageElementFor } from "./asset-drop.ts";

describe("imageElementFor", () => {
  it("creates an image element centred on the drop point", () => {
    const el = imageElementFor("/a.png", "a.png", { x: 500, y: 400 });

    expect(el.kind).toBe("image");
    expect(el.src).toBe("/a.png");
    expect(el.x + el.w / 2).toBe(500);
    expect(el.y + el.h / 2).toBe(400);
  });

  it("keeps the image's aspect ratio when its natural size is known", () => {
    const el = imageElementFor(
      "/a.png",
      "a.png",
      { x: 0, y: 0 },
      {
        width: 200,
        height: 100,
      },
    );

    expect(el.h).toBe(Math.round(el.w / 2));
    // resizing from a corner keeps the picture's shape, so `aspect` must match it
    expect(el.aspect).toBe(2);
  });
});
