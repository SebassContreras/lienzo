import { describe, expect, it } from "vitest";
import "../../components/index.ts";
import { CompactElementSchema } from "../../model/compact.ts";
import { expandEffects } from "./effects.ts";
import { expandScene } from "./expand.ts";

describe("compact effects (058/R1)", () => {
  it("merges partial effects over the defaults", () => {
    const { effects, notices } = expandEffects(undefined, { blur: 6 }, "e");

    expect(effects).toEqual({ blur: 6, blend: "normal", mask: "" });
    expect(notices).toEqual([]);
  });

  it("keeps the base effects a preset gave the element", () => {
    const { effects } = expandEffects(
      { blur: 3, blend: "multiply", mask: "" },
      { blur: 6 },
      "e",
    );

    expect(effects).toEqual({ blur: 6, blend: "multiply", mask: "" });
  });

  it("drops an unknown effect key and reports it with its path", () => {
    const { effects, notices } = expandEffects(
      undefined,
      { glow: 4 },
      "elements.0.effects",
    );

    expect(effects).not.toHaveProperty("glow");
    expect(notices).toEqual([
      "elements.0.effects: «glow» no es un efecto conocido (hay: blur, blend, mask); se ignoró",
    ]);
  });

  it("reports an unknown effect inside a group with the child's path", async () => {
    const { notices } = await expandScene({
      elements: [
        {
          kind: "group",
          children: [{ kind: "rect" }, { kind: "rect", effects: { glow: 1 } }],
        },
      ],
    });

    expect(notices).toEqual([
      expect.stringMatching(/^elements\.0\.children\.1\.effects: «glow»/),
    ]);
  });

  it("rejects a non-number blur with its exact path", () => {
    const r = CompactElementSchema.safeParse({
      kind: "rect",
      effects: { blur: "lots" },
    });

    expect(r.error?.issues[0]?.path).toEqual(["effects", "blur"]);
  });

  it("keeps every common canonical element key", () => {
    const common = {
      effects: { blur: 2 },
      origin: "center",
      w: 100,
      shot: "intro",
      tracks: { x: [[0, 10]] },
      animPreset: "fade-in",
    };

    const r = CompactElementSchema.safeParse({ kind: "rect", ...common });

    expect(Object.keys(r.data ?? {})).toEqual(
      expect.arrayContaining(Object.keys(common)),
    );
  });
});
