import { describe, expect, it } from "vitest";
import type { CompactScene } from "../../model/compact.ts";
import type { PresetRecipe } from "../../model/preset.ts";
import { expandScene } from "./expand.ts";

describe("expandScene pure expansion (011/T002)", () => {
  it("expands canvas size from preset name or custom dimensions", async () => {
    const compact1: CompactScene = {
      size: "Story",
      elements: [],
    };
    const scene1 = await expandScene(compact1);
    expect(scene1.width).toBe(1080);
    expect(scene1.height).toBe(1920);

    const compact2: CompactScene = {
      size: "800x600",
      elements: [],
    };
    const scene2 = await expandScene(compact2);
    expect(scene2.width).toBe(800);
    expect(scene2.height).toBe(600);
  });

  it("expands background with deep merge", async () => {
    const compact: CompactScene = {
      background: {
        color: "#123456",
        dots: false,
      },
      elements: [],
    };
    const scene = await expandScene(compact);
    expect(scene.background.color).toBe("#123456");
    expect(scene.background.dots).toBe(false);
    expect(scene.background.gradient).toBe(true);
  });

  it("builds an element from preset with deep-merged fields", async () => {
    const fakePreset: PresetRecipe = {
      name: "custom-card",
      kind: "rect",
      traits: [],
      set: {
        w: 300,
        h: 200,
        fill: { color: "#ff0000" },
      },
    };

    const compact: CompactScene = {
      elements: [
        {
          preset: "custom-card",
          fill: { color: "#00ff00" },
        },
      ],
    };

    const scene = await expandScene(compact, {
      findPreset: async (name) =>
        name === "custom-card" ? fakePreset : undefined,
    });

    expect(scene.elements).toHaveLength(1);
    const rect = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;
    expect(rect.kind).toBe("rect");
    expect(rect.w).toBe(300);
    expect(rect.h).toBe(200);
    expect(rect.fill.color).toBe("#00ff00");
  });

  it("deep merges groups and particles templates", async () => {
    const compact: CompactScene = {
      elements: [
        {
          kind: "group",
          children: [
            {
              kind: "rect",
              w: 50,
              h: 50,
            },
          ],
        },
        {
          kind: "particles",
          template: {
            kind: "star",
            points: 6,
          },
        },
      ],
    };

    const scene = await expandScene(compact);
    expect(scene.elements).toHaveLength(2);
    const grp = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "group" }
    >;
    expect(grp.kind).toBe("group");
    expect(grp.children).toHaveLength(1);
    expect(
      (
        grp.children[0] as Extract<
          import("../../model/model.ts").Element,
          { kind: "rect" }
        >
      )?.w,
    ).toBe(50);

    const parts = scene.elements[1] as Extract<
      import("../../model/model.ts").Element,
      { kind: "particles" }
    >;
    expect(parts.kind).toBe("particles");
    const tmpl = parts.template as Extract<
      import("../../model/model.ts").Element,
      { kind: "star" }
    >;
    expect(tmpl.kind).toBe("star");
    expect(tmpl.points).toBe(6);
  });

  it("handles short keyframe tracks and anim shorthand (011/T003)", async () => {
    const compact: CompactScene = {
      elements: [
        {
          kind: "rect",
          anim: "float",
          tracks: {
            x: [
              [0, 10, "linear"],
              [1, 100],
            ],
            "@rotate": [
              [0, 0],
              [2, 360, "ease-in-out"],
            ],
          },
        },
        {
          kind: "text",
          anim: "pop-in",
        },
      ],
    };

    const scene = await expandScene(compact);
    const rect = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;
    expect(rect.anim?.loop?.kind).toBe("float");
    expect(rect.tracks?.x).toEqual([
      { t: 0, value: 10, easing: "linear" },
      { t: 1, value: 100, easing: "auto" },
    ]);
    expect(rect.tracks?.["@rotate"]).toEqual([
      { t: 0, value: 0, easing: "auto" },
      { t: 2, value: 360, easing: "ease-in-out" },
    ]);

    const txt = scene.elements[1] as Extract<
      import("../../model/model.ts").Element,
      { kind: "text" }
    >;
    expect(txt.anim?.in?.kind).toBe("pop-in");
  });

  it("handles placement: at anchors with offset and fit: canvas (011/T004)", async () => {
    const compact: CompactScene = {
      size: "1000x800",
      elements: [
        {
          kind: "rect",
          w: 200,
          h: 100,
          at: "center",
        },
        {
          kind: "rect",
          w: 200,
          h: 100,
          at: {
            anchor: "top-left",
            offset: [50, 60],
          },
        },
        {
          kind: "particles",
          fit: "canvas",
        },
      ],
    };

    const scene = await expandScene(compact);
    const centered = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;
    expect(centered.x).toBe((1000 - 200) / 2); // 400
    expect(centered.y).toBe((800 - 100) / 2); // 350

    const offsetEl = scene.elements[1] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;
    expect(offsetEl.x).toBe(50);
    expect(offsetEl.y).toBe(60);

    const fullCanvas = scene.elements[2] as Extract<
      import("../../model/model.ts").Element,
      { kind: "particles" }
    >;
    expect(fullCanvas.x).toBe(0);
    expect(fullCanvas.y).toBe(0);
    expect(fullCanvas.w).toBe(1000);
    expect(fullCanvas.h).toBe(800);
  });

  it("preserves readable ids and links from / to line connections (011/T005)", async () => {
    const compact: CompactScene = {
      elements: [
        {
          id: "card-a",
          kind: "rect",
          w: 100,
          h: 100,
        },
        {
          id: "card-b",
          kind: "rect",
          w: 100,
          h: 100,
        },
        {
          id: "conn-1",
          kind: "line",
          from: "card-a",
          to: "card-b",
        },
      ],
    };

    const scene = await expandScene(compact);
    expect(scene.elements[0]?.id).toBe("card-a");
    expect(scene.elements[1]?.id).toBe("card-b");
    expect(scene.elements[2]?.id).toBe("conn-1");

    const line = scene.elements[2] as Extract<
      import("../../model/model.ts").Element,
      { kind: "line" }
    >;
    expect(line.a.attach).toBe("card-a");
    expect(line.b.attach).toBe("card-b");
  });

  it("builds the README example post successfully (011/T008, R7)", async () => {
    const readmePost: CompactScene = {
      size: "Story",
      duration: 4,
      background: { color: "#050b1a", spotlight: 0.5 },
      elements: [
        {
          id: "bg-particles",
          kind: "particles",
          fit: "canvas",
          count: 40,
        },
        {
          id: "card",
          kind: "rect",
          at: "center",
          w: 600,
          h: 320,
          anim: "float",
        },
        {
          id: "heading",
          kind: "text",
          text: "Lienzo 0.1",
          at: { anchor: "top", offset: [0, 200] },
          size: 56,
          weight: "bold",
          anim: "pop-in",
        },
        {
          id: "conn",
          kind: "line",
          from: "heading",
          to: "card",
        },
      ],
    };

    const scene = await expandScene(readmePost);
    expect(scene.width).toBe(1080);
    expect(scene.height).toBe(1920);
    expect(scene.duration).toBe(4);
    expect(scene.background.color).toBe("#050b1a");
    expect(scene.elements).toHaveLength(4);

    const particles = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "particles" }
    >;
    expect(particles.w).toBe(1080);
    expect(particles.h).toBe(1920);

    const line = scene.elements[3] as Extract<
      import("../../model/model.ts").Element,
      { kind: "line" }
    >;
    expect(line.a.attach).toBe("heading");
    expect(line.b.attach).toBe("card");
  });

  it("expands animPreset through expandAnimPresets (011/T009, R9)", async () => {
    const fakeAnimLibrary = [
      {
        name: "salto-feliz",
        category: "Saltos",
        anim: {
          in: {
            kind: "pop" as const,
            delay: 0,
            duration: 0.5,
            amount: 20,
            from: "down" as const,
            easing: "auto" as const,
          },
        },
        tracks: {
          "@scale": [
            { t: 0, value: 0, easing: "auto" as const },
            { t: 0.5, value: 1, easing: "auto" as const },
          ],
        },
      },
    ];

    const compact: CompactScene = {
      elements: [
        {
          id: "avatar",
          kind: "rect",
          animPreset: "salto-feliz",
        },
      ],
    };

    const scene = await expandScene(compact, {
      animLibrary: fakeAnimLibrary,
    });

    const el = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;
    expect(el.animPreset).toEqual({ name: "salto-feliz", start: 0 });
    expect(el.anim?.in?.kind).toBe("pop");
    expect(el.tracks?.["@scale"]).toHaveLength(2);
  });
});
