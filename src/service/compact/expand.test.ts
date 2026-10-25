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
    const { scene: scene1 } = await expandScene(compact1);
    expect(scene1.width).toBe(1080);
    expect(scene1.height).toBe(1920);

    const compact2: CompactScene = {
      size: "800x600",
      elements: [],
    };
    const { scene: scene2 } = await expandScene(compact2);
    expect(scene2.width).toBe(800);
    expect(scene2.height).toBe(600);
  });

  it("expands background with deep merge onto a solid background (064/R9)", async () => {
    const compact: CompactScene = {
      background: {
        color: "#123456",
        dots: false,
      },
      elements: [],
    };
    const { scene } = await expandScene(compact);
    expect(scene.background.color).toBe("#123456");
    expect(scene.background.dots).toBe(false);
    // 064/R9: an object starts solid, so the gradient is off unless it turns it on
    expect(scene.background.gradient).toBe(false);
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

    const { scene } = await expandScene(compact, {
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

    const { scene } = await expandScene(compact);
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

    const { scene } = await expandScene(compact);
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

    const { scene } = await expandScene(compact);
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

    const { scene } = await expandScene(compact);
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

    const { scene } = await expandScene(readmePost);
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

    const { scene } = await expandScene(compact, {
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

  it("deep-merges partial anim definitions preserving defaults (039/R1, D1)", async () => {
    const compact: CompactScene = {
      elements: [
        {
          kind: "rect",
          anim: {
            in: { kind: "fade" },
            loop: "pulse",
          },
        },
      ],
    };

    const { scene } = await expandScene(compact);
    const rect = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;

    // Canonical defaults should be preserved while kind is updated
    expect(rect.anim?.in?.kind).toBe("fade");
    expect(rect.anim?.in?.duration).toBeDefined();
    expect(rect.anim?.in?.easing).toBeDefined();

    expect(rect.anim?.loop?.kind).toBe("pulse");
    expect(rect.anim?.loop?.cycles).toBe(1);

    // Default 'out' should still be intact on canonical element
    expect(rect.anim?.out?.kind).toBe("none");
  });

  it("expands track object form with repeat, until, and step/hold easing (052/R3, R4)", async () => {
    const compact: CompactScene = {
      elements: [
        {
          kind: "rect",
          tracks: {
            x: {
              keys: [
                [0, 0, "linear"],
                [1, 100],
              ],
              repeat: "loop",
              until: 4,
            },
            y: {
              keys: [
                [0, 10, "step"],
                [2, 50, "hold"],
              ],
              repeat: "pingpong",
            },
            w: {
              keys: [[0, 100]],
              repeat: "none",
            },
          },
        },
      ],
    };

    const { scene } = await expandScene(compact);
    const rect = scene.elements[0] as Extract<
      import("../../model/model.ts").Element,
      { kind: "rect" }
    >;

    expect(rect.tracks?.x).toEqual({
      keys: [
        { t: 0, value: 0, easing: "linear" },
        { t: 1, value: 100, easing: "auto" },
      ],
      repeat: "loop",
      until: 4,
    });
    expect(rect.tracks?.y).toEqual({
      keys: [
        { t: 0, value: 10, easing: "step" },
        { t: 2, value: 50, easing: "hold" },
      ],
      repeat: "pingpong",
    });
    // repeat: "none" without until collapses back to a bare keyframe array
    expect(rect.tracks?.w).toEqual([{ t: 0, value: 100, easing: "auto" }]);
  });

  describe("spec 053: origin and opacity compact expansion", () => {
    it("expands origin from [x, y] tuple and { x, y } object (053/R2)", async () => {
      const compact: CompactScene = {
        elements: [
          {
            kind: "rect",
            origin: [0.25, 0.75],
          },
          {
            kind: "ellipse",
            origin: { x: 0.1, y: 0.9 },
          },
        ],
      };

      const { scene } = await expandScene(compact);
      expect(scene.elements[0]?.origin).toEqual({ x: 0.25, y: 0.75 });
      expect(scene.elements[1]?.origin).toEqual({ x: 0.1, y: 0.9 });
    });

    it("expands origin from all 9 named anchors (053/R2)", async () => {
      const anchors: [
        import("../../model/compact.ts").AnchorName,
        { x: number; y: number },
      ][] = [
        ["top-left", { x: 0, y: 0 }],
        ["top", { x: 0.5, y: 0 }],
        ["top-right", { x: 1, y: 0 }],
        ["left", { x: 0, y: 0.5 }],
        ["center", { x: 0.5, y: 0.5 }],
        ["right", { x: 1, y: 0.5 }],
        ["bottom-left", { x: 0, y: 1 }],
        ["bottom", { x: 0.5, y: 1 }],
        ["bottom-right", { x: 1, y: 1 }],
      ];

      const compact: CompactScene = {
        elements: anchors.map(([anchor]) => ({
          kind: "rect",
          origin: anchor,
        })),
      };

      const { scene } = await expandScene(compact);
      anchors.forEach(([, expected], i) => {
        expect(scene.elements[i]?.origin).toEqual(expected);
      });
    });

    it("expands opacity and tracks.opacity on elements and groups (053/R3)", async () => {
      const compact: CompactScene = {
        elements: [
          {
            kind: "rect",
            opacity: 0.4,
            tracks: {
              opacity: [
                [0, 0],
                [1, 1],
              ],
            },
          },
          {
            kind: "group",
            opacity: 0.8,
            children: [
              {
                kind: "text",
                text: "Hello",
                opacity: 0.5,
              },
            ],
          },
        ],
      };

      const { scene } = await expandScene(compact);
      const rect = scene.elements[0] as Extract<
        import("../../model/model.ts").Element,
        { kind: "rect" }
      >;
      expect(rect.opacity).toBe(0.4);
      expect(rect.tracks?.opacity).toEqual([
        { t: 0, value: 0, easing: "auto" },
        { t: 1, value: 1, easing: "auto" },
      ]);

      const group = scene.elements[1] as Extract<
        import("../../model/model.ts").Element,
        { kind: "group" }
      >;
      expect(group.opacity).toBe(0.8);
      const textChild = group.children[0] as Extract<
        import("../../model/model.ts").Element,
        { kind: "text" }
      >;
      expect(textChild.opacity).toBe(0.5);
    });

    it("resolves nested group child at placement relative to group bounds (055/R4, T010)", async () => {
      const compact: CompactScene = {
        size: "1080x1080",
        elements: [
          {
            kind: "group",
            w: 400,
            h: 300,
            children: [
              {
                kind: "rect",
                w: 100,
                h: 50,
                at: "center",
              },
              {
                kind: "rect",
                w: 50,
                h: 50,
                at: "bottom-right",
              },
            ],
          },
        ],
      };

      const { scene } = await expandScene(compact);
      const group = scene.elements[0] as Extract<
        import("../../model/model.ts").Element,
        { kind: "group" }
      >;

      // In a 400x300 group:
      // center of 100x50 is x: (400 - 100)/2 = 150, y: (300 - 50)/2 = 125
      const child1 = group.children[0] as Extract<
        import("../../model/model.ts").Element,
        { kind: "rect" }
      >;
      expect(child1.x).toBe(150);
      expect(child1.y).toBe(125);

      // bottom-right of 50x50 in 400x300 is x: 400 - 50 = 350, y: 300 - 50 = 250
      const child2 = group.children[1] as Extract<
        import("../../model/model.ts").Element,
        { kind: "rect" }
      >;
      expect(child2.x).toBe(350);
      expect(child2.y).toBe(250);
    });

    it("expands compact scene shots and camera tracks (055/R3, T010)", async () => {
      const compact: CompactScene = {
        size: "1920x1080",
        duration: 10,
        shots: [
          {
            id: "s1",
            name: "Shot 1",
            start: 0,
            end: 4,
            transition: { kind: "fade", duration: 0.5 },
            camera: {
              x: 50,
              y: 20,
              zoom: 1.2,
              tracks: {
                zoom: [
                  [0, 1],
                  [2, 1.5],
                ],
              },
            },
          },
        ],
        elements: [
          {
            kind: "rect",
            shot: "s1",
            w: 200,
            h: 200,
          },
        ],
      };

      const { scene } = await expandScene(compact);
      expect(scene.shots?.length).toBe(1);
      const shot = scene.shots?.[0];
      expect(shot?.id).toBe("s1");
      expect(shot?.name).toBe("Shot 1");
      expect(shot?.start).toBe(0);
      expect(shot?.end).toBe(4);
      expect(shot?.transition).toEqual({ kind: "fade", duration: 0.5 });
      expect(shot?.camera?.x).toBe(50);
      expect(shot?.camera?.y).toBe(20);
      expect(shot?.camera?.zoom).toBe(1.2);
      expect(shot?.camera?.tracks?.zoom).toEqual([
        { t: 0, value: 1, easing: "auto" },
        { t: 2, value: 1.5, easing: "auto" },
      ]);

      const rect = scene.elements[0] as Extract<
        import("../../model/model.ts").Element,
        { kind: "rect" }
      >;
      expect(rect.shot).toBe("s1");
    });
  });
});
