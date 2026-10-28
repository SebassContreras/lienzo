import { describe, expect, it } from "vitest";
import type { Ctx } from "../../engine/paint.ts";
import { drawScene } from "../../engine/render.ts";
import { defaultElement, defaultScene } from "../../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../../test/recording-ctx.ts";
import type { EllipseEl } from "./descriptor.ts";

installCanvasFakes();

/** The radial gradients centred on (100, 100) created drawing a scene that holds only `el`. */
function radialsOf(el: EllipseEl): string[] {
  const ctx = new RecordingCtx();
  drawScene(ctx as unknown as Ctx, { ...defaultScene(), elements: [el] }, 0);
  return ctx.log.join(";").match(/radial\(100,100,[^)]*\)/g) ?? [];
}

describe("ellipse radial fill", () => {
  it("ends the radial gradient on the circle's edge, so its last color shows", () => {
    // Arrange
    const base = defaultElement("ellipse") as EllipseEl;
    const circle: EllipseEl = {
      ...base,
      x: 0,
      y: 0,
      w: 200,
      h: 200,
      fill: { ...base.fill, gradient: true, type: "radial" },
    };

    // Act
    const radials = radialsOf(circle);

    // Assert
    expect(radials[0]).toBe("radial(100,100,0,100,100,100)");
  });
});
