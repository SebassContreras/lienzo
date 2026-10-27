import { describe, expect, it } from "vitest";
import "../../components/index.ts";
import type { GroupEl } from "../../components/group/descriptor.ts";
import type { RectEl } from "../../components/rect/descriptor.ts";
import { expandScene } from "./expand.ts";

async function first(el: Record<string, unknown>) {
  const { scene } = await expandScene({ elements: [el as never] });
  return scene.elements[0];
}

describe("implied fields (068/D2)", () => {
  it("draws a fill given only a color flat (R2)", async () => {
    const rect = (await first({
      kind: "rect",
      fill: { color: "#22C55E" },
    })) as RectEl;

    expect(rect.fill.gradient).toBe(false);
  });

  it("keeps a gradient the input asks for", async () => {
    const rect = (await first({
      kind: "rect",
      fill: { color: "#22C55E", color2: "#000000" },
    })) as RectEl;

    expect(rect.fill.gradient).toBe(true);
  });

  it("sizes a group's content to its box (R3)", async () => {
    const group = (await first({ kind: "group", w: 600, h: 300 })) as GroupEl;

    expect([group.cw, group.ch]).toEqual([600, 300]);
  });

  it("keeps a content size the input gives", async () => {
    const group = (await first({
      kind: "group",
      w: 600,
      h: 300,
      cw: 100,
      ch: 50,
    })) as GroupEl;

    expect([group.cw, group.ch]).toEqual([100, 50]);
  });
});
