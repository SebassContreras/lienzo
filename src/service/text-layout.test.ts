import { describe, expect, it } from "vitest";
import type { TextEl } from "../components/text/descriptor.ts";
import { defaultElement, defaultScene } from "../model/model.ts";
import { expandScene } from "./compact/expand.ts";
import { layoutBoxes } from "./layout.ts";

describe("text layout and compact placement (054/R4, T007)", () => {
  it("centers unwrapped text in compact scenes using accurate measured metrics (R1, R4)", async () => {
    // When expanding a compact scene with at: "center" on text
    const { scene: expanded } = await expandScene({
      size: "1080x1080",
      elements: [
        {
          kind: "text",
          text: "Título Centrado",
          font: "Inter",
          size: 64,
          weight: 800,
          at: "center",
        },
      ],
    });

    const [box] = layoutBoxes(expanded, [0]);

    // Box dimensions must be strictly positive and reflect real text width (> 300px)
    expect(box.w).toBeGreaterThan(300);
    expect(box.h).toBeGreaterThan(50);

    // Anchoring at center means box center (x + w/2) should be canvas center (540) within 1px
    expect(box.x + box.w / 2).toBeCloseTo(540, 0);
    expect(box.y + box.h / 2).toBeCloseTo(540, 0);
  });

  it("places wrapped text in compact scenes using box width w (R2, R4)", async () => {
    const { scene: expanded } = await expandScene({
      size: "1080x1080",
      elements: [
        {
          kind: "text",
          text: "Texto largo que se envuelve dentro de una caja fija de 400 píxeles de ancho",
          font: "Inter",
          size: 32,
          weight: 400,
          w: 400,
          at: "center",
        },
      ],
    });

    const el = expanded.elements[0] as TextEl;
    expect(el.w).toBe(400);

    const [box] = layoutBoxes(expanded, [0]);
    // The layout box width must equal the explicit w (400)
    expect(box.w).toBe(400);

    // Center of the 400px box must land at canvas center (540)
    expect(box.x).toBe(340); // 540 - 400/2
    expect(box.x + box.w / 2).toBe(540);
  });

  it("returns layout boxes reflecting wrapped dimensions in scene layout inspection", () => {
    const scene = defaultScene();
    scene.width = 1080;
    scene.height = 1080;

    const textEl = defaultElement("text") as TextEl;
    textEl.id = "txt1";
    textEl.text = "Línea uno\nLínea dos más larga";
    textEl.w = 500;
    textEl.x = 100;
    textEl.y = 100;
    scene.elements = [textEl];

    const [box] = layoutBoxes(scene, [0]);
    expect(box.id).toBe("txt1");
    expect(box.w).toBe(500);
    expect(box.x).toBe(100);
    expect(box.y).toBe(100);
  });
});
