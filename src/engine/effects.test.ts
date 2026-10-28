import { describe, expect, it } from "vitest";
import { defaultRect, defaultScene } from "../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";
import { withEffects } from "./effects.ts";
import type { Ctx } from "./paint.ts";
import { drawScene } from "./render.ts";

installCanvasFakes();

describe("effects field group and withEffects", () => {
  it("does not save or restore ctx when blur is 0 and blend is normal", () => {
    const ctx = new RecordingCtx();
    withEffects(ctx as unknown as Ctx, { blur: 0, blend: "normal" }, () => {
      ctx.fillRect(0, 0, 10, 10);
    });
    expect(ctx.log).toEqual(["fillRect(0,0,10,10)"]);
  });

  it("applies blur filter and restores ctx afterwards", () => {
    const ctx = new RecordingCtx();
    withEffects(ctx as unknown as Ctx, { blur: 15, blend: "normal" }, () => {
      ctx.fillRect(0, 0, 10, 10);
    });
    expect(ctx.log).toEqual([
      "save()",
      "filter=(blur(15px))",
      "fillRect(0,0,10,10)",
      "restore()",
    ]);
  });

  it("applies blend mode and restores ctx afterwards", () => {
    const ctx = new RecordingCtx();
    withEffects(ctx as unknown as Ctx, { blur: 0, blend: "multiply" }, () => {
      ctx.fillRect(0, 0, 10, 10);
    });
    expect(ctx.log).toEqual([
      "save()",
      "globalCompositeOperation=(multiply)",
      "fillRect(0,0,10,10)",
      "restore()",
    ]);
  });

  it("applies both blur and blend mode when specified", () => {
    const ctx = new RecordingCtx();
    withEffects(ctx as unknown as Ctx, { blur: 8, blend: "screen" }, () => {
      ctx.fillRect(0, 0, 10, 10);
    });
    expect(ctx.log).toEqual([
      "save()",
      "globalCompositeOperation=(screen)",
      "filter=(blur(8px))",
      "fillRect(0,0,10,10)",
      "restore()",
    ]);
  });

  it("is applied by drawScene around element draw", () => {
    const ctx = new RecordingCtx();
    const scene = defaultScene();
    const el = {
      ...defaultRect(),
      effects: { blur: 20, blend: "overlay" as const },
    };
    scene.elements = [el];
    drawScene(ctx as unknown as Ctx, scene, 0);

    const hasSave = ctx.log.includes("save()");
    const hasFilter = ctx.log.includes("filter=(blur(20px))");
    const hasBlend = ctx.log.includes("globalCompositeOperation=(overlay)");
    const hasRestore = ctx.log.includes("restore()");

    expect(hasSave).toBe(true);
    expect(hasFilter).toBe(true);
    expect(hasBlend).toBe(true);
    expect(hasRestore).toBe(true);
  });

  it("skips drawing mask elements directly and clips masked elements", () => {
    const ctx = new RecordingCtx();
    const scene = defaultScene();
    const maskRect = {
      ...defaultRect(),
      id: "mask-1",
      x: 50,
      y: 50,
      w: 100,
      h: 100,
    };
    const targetRect = {
      ...defaultRect(),
      id: "target-1",
      x: 10,
      y: 10,
      w: 200,
      h: 200,
      effects: { blur: 0, blend: "normal" as const, mask: "mask-1" },
    };
    scene.background = { ...scene.background, dots: false };
    scene.elements = [maskRect, targetRect];
    drawScene(ctx as unknown as Ctx, scene, 0);

    // maskRect should not be drawn directly (background fill, border, etc.)
    // Only targetRect should be drawn, wrapped in a clip() call
    const clipCalls = ctx.log.filter((l) => l.startsWith("clip("));
    expect(clipCalls.length).toBe(1);

    // Verify mask element itself wasn't drawn in addition to the masked element.
    // targetRect has shadow disabled by default or bgGlow, let's check stroke/fill
    // Since only targetRect is drawn, there should be exactly 1 fill for targetRect's fill.
    const fills = ctx.log.filter((l) => l.startsWith("fill("));
    // 1 for shadow (enabled by default in defaultRect), 1 for fill
    const expectedFills = targetRect.shadow.enabled ? 2 : 1;
    expect(fills.length).toBe(expectedFills);
  });

  it("applies blur, blend and mask to every registered component kind", async () => {
    // Dynamically check every kind in KINDS
    const { KINDS, createElement } = await import("../components/index.ts");
    for (const kind of KINDS) {
      const ctx = new RecordingCtx();
      const scene = defaultScene();
      scene.background = { ...scene.background, dots: false };
      const mask = {
        ...defaultRect(),
        id: `mask-${kind}`,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      };
      const el = {
        ...createElement(kind),
        id: `el-${kind}`,
        effects: { blur: 10, blend: "multiply" as const, mask: `mask-${kind}` },
      };
      scene.elements = [mask, el];
      drawScene(ctx as unknown as Ctx, scene, 0);

      // Verify that clip, filter blur and blend were applied
      expect(
        ctx.log.some((l) => l.startsWith("clip(")),
        `${kind} has clip`,
      ).toBe(true);
      expect(ctx.log.includes("filter=(blur(10px))"), `${kind} has blur`).toBe(
        true,
      );
      expect(
        ctx.log.includes("globalCompositeOperation=(multiply)"),
        `${kind} has blend`,
      ).toBe(true);
    }
  });

  it("applies blur, blend and mask to a test-only descriptor registered at runtime", async () => {
    const { registerComponent, createElement } = await import(
      "../components/index.ts"
    );
    const { defineComponent } = await import("../components/descriptor.ts");
    const { BOX_ANIMS, anim, box } = await import(
      "../components/fields/index.ts"
    );

    const testKind = `custom-widget-${Date.now()}`;
    const testFields = {
      ...box(150, 150),
      anim: anim(BOX_ANIMS),
    };

    const desc = defineComponent({
      kind: testKind,
      label: "Custom Widget",
      icon: "Square",
      fields: testFields,
      sections: [{ title: "Forma" }],
      anims: { motions: ["none"], loops: ["none"] },
      draw: (ctx) => {
        ctx.fillRect(10, 10, 50, 50);
      },
    });

    registerComponent(desc as never);

    const ctx = new RecordingCtx();
    const scene = defaultScene();
    scene.background = { ...scene.background, dots: false };
    const mask = {
      ...defaultRect(),
      id: "mask-custom",
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    };
    const el = {
      ...(createElement(testKind as never) as Record<string, unknown>),
      id: "el-custom",
      effects: { blur: 12, blend: "screen" as const, mask: "mask-custom" },
    };
    scene.elements = [mask, el as never];
    drawScene(ctx as unknown as Ctx, scene, 0);

    expect(ctx.log.some((l) => l.startsWith("clip("))).toBe(true);
    expect(ctx.log.includes("filter=(blur(12px))")).toBe(true);
    expect(ctx.log.includes("globalCompositeOperation=(screen)")).toBe(true);
  });

  it("leaves a valid scene and draws without crashing when mask target is deleted", async () => {
    const { SceneSchema } = await import("../model/schema.ts");
    const scene = defaultScene();
    const el = {
      ...defaultRect(),
      id: "target-el",
      effects: { blur: 5, blend: "normal" as const, mask: "deleted-mask-id" },
    };
    scene.elements = [el];

    // 1. Scene with non-existent mask target still validates against SceneSchema
    const parseRes = SceneSchema.safeParse(scene);
    expect(parseRes.success).toBe(true);

    // 2. Drawing it does not throw, and draws the element without clipping
    const ctx = new RecordingCtx();
    scene.background = { ...scene.background, dots: false };
    expect(() => drawScene(ctx as unknown as Ctx, scene, 0)).not.toThrow();
    expect(ctx.log.some((l) => l.startsWith("clip("))).toBe(false);
  });
});
