import { describe, expect, it } from "vitest";
import { defineComponent } from "../components/descriptor.ts";
import { num } from "../components/fields/index.ts";
import { registerComponent } from "../components/index.ts";
import {
  CompactElementSchema,
  CompactSceneSchema,
  CompactTracksSchema,
} from "./compact.ts";

describe("Compact Schema derived from descriptor registry (011/T001)", () => {
  it("validates a compact scene with defaults and partial values", () => {
    const compact = {
      size: "1080x1080",
      duration: 3,
      background: "azul-noche",
      elements: [
        {
          kind: "rect",
          at: "center",
          fill: { color: "#ff0000" },
        },
      ],
    };

    const parsed = CompactSceneSchema.safeParse(compact);
    expect(parsed.success).toBe(true);
  });

  it("accepts placement shortcuts: at with offset and fit: canvas", () => {
    const compact = {
      elements: [
        {
          kind: "text",
          text: "Hola",
          at: { anchor: "top-left", offset: [20, 40] },
        },
        {
          kind: "particles",
          fit: "canvas",
        },
      ],
    };

    const parsed = CompactSceneSchema.safeParse(compact);
    expect(parsed.success).toBe(true);
  });

  it("accepts short tracks [t, value, easing?]", () => {
    const tracks = {
      x: [
        [0, 10, "linear"],
        [1, 100],
      ],
      "@rotate": [
        [0, 0],
        [2, 360, "ease-in-out"],
      ],
    };

    const parsed = CompactTracksSchema.safeParse(tracks);
    expect(parsed.success).toBe(true);
  });

  it("accepts anim string shorthand and animPreset reference", () => {
    const element = {
      kind: "rect",
      anim: "float",
      animPreset: "mi-animacion",
    };

    const parsed = CompactElementSchema.safeParse(element);
    expect(parsed.success).toBe(true);
  });

  it("accepts an element with preset only and no kind", () => {
    const element = {
      preset: "tarjeta-neon",
      at: "center",
      fill: { color: "#00ff00" },
    };

    const parsed = CompactElementSchema.safeParse(element);
    expect(parsed.success).toBe(true);
  });

  it("dynamically accepts a new test-only component registered at runtime (R8)", () => {
    const testKind = `test_widget_${Date.now()}`;
    const testDescriptor = defineComponent({
      kind: testKind,
      label: "Test Widget",
      icon: "Box",
      fields: {
        score: num(42, { label: "Puntuación" }),
      },
      sections: [{ title: "General" }],
      anims: { motions: ["none"], loops: ["none"] },
      draw: () => {},
    });

    // biome-ignore lint/suspicious/noExplicitAny: test descriptor registered at runtime
    registerComponent(testDescriptor as any);

    const testElement = {
      kind: testKind,
      score: 100,
    };

    const parsed = CompactElementSchema.safeParse(testElement);
    expect(parsed.success).toBe(true);
  });

  it("validates recursive compact group children (039/R2, D2)", () => {
    const groupElement = {
      kind: "group",
      children: [
        {
          kind: "rect",
          w: 50,
          h: 50,
        },
        {
          kind: "group",
          children: [
            {
              kind: "text",
              text: "Anidado",
            },
          ],
        },
      ],
    };

    const parsed = CompactElementSchema.safeParse(groupElement);
    expect(parsed.success).toBe(true);
  });

  it("reports the deepest field path inside nested group children when a known kind has an invalid field (051/R3)", () => {
    const compact = {
      elements: [
        { kind: "rect" },
        { kind: "rect" },
        { kind: "rect" },
        {
          kind: "group",
          children: [
            { kind: "rect", w: 50 },
            { kind: "particles", speed: 0 },
          ],
        },
      ],
    };

    const parsed = CompactSceneSchema.safeParse(compact);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path.join(".")).toBe(
        "elements.3.children.1.speed",
      );
    }
  });

  it("reports missing or unknown kind at the exact element path (051/R4)", () => {
    const missingKind = CompactSceneSchema.safeParse({
      elements: [{ kind: "group", children: [{ w: 100 }] }],
    });
    expect(missingKind.success).toBe(false);
    if (!missingKind.success) {
      expect(missingKind.error.issues[0]?.path.join(".")).toBe(
        "elements.0.children.0.kind",
      );
    }

    const unknownKind = CompactSceneSchema.safeParse({
      elements: [{ kind: "spaceship" }],
    });
    expect(unknownKind.success).toBe(false);
    if (!unknownKind.success) {
      expect(unknownKind.error.issues[0]?.path.join(".")).toBe(
        "elements.0.kind",
      );
      expect(unknownKind.error.issues[0]?.message).toContain("spaceship");
    }
  });
});
