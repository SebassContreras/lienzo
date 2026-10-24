import { describe, expect, it } from "vitest";
import type { Ctx } from "../../engine/paint.ts";
import { drawScene } from "../../engine/render.ts";
import { ElementSchema } from "../../model/element-schema.ts";
import {
  defaultGroup,
  defaultRect,
  defaultScene,
  type GroupEl,
} from "../../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../../test/recording-ctx.ts";

installCanvasFakes();

function group(over: Partial<GroupEl>): GroupEl {
  const child = { ...defaultRect(), x: -50, y: -50, w: 300, h: 300 };
  return {
    ...defaultGroup(),
    x: 10,
    y: 20,
    w: 200,
    h: 100,
    children: [child],
    ...over,
  };
}

/** The canvas `clip` calls made drawing a scene that holds only `el`. */
function clipsOf(el: GroupEl): string[] {
  const ctx = new RecordingCtx();
  drawScene(ctx as unknown as Ctx, { ...defaultScene(), elements: [el] }, 0);
  return ctx.log.filter((l) => l.startsWith("clip("));
}

describe("group clip (059/R2)", () => {
  it("clips the children to the group's rounded box when `clip` is on and there is no frame", () => {
    const clipped = group({ clip: true, radius: 12 });

    expect(clipsOf(clipped)).toEqual(["clip({roundRect(10,20,200,100,12)})"]);
  });

  it("caps the radius at half the box's short side", () => {
    const pill = group({ clip: true, radius: 999 });

    expect(clipsOf(pill)).toEqual(["clip({roundRect(10,20,200,100,50)})"]);
  });

  it("does not clip when `clip` is off (R4)", () => {
    const open = group({ clip: false });

    expect(clipsOf(open)).toEqual([]);
  });

  it("a group saved before 059 reads with `clip: false` and `radius: 0` (R4)", () => {
    const { clip: _c, radius: _r, ...old } = group({});

    const parsed = ElementSchema.parse(old) as GroupEl;

    expect([parsed.clip, parsed.radius]).toEqual([false, 0]);
  });
});
