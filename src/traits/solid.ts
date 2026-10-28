import type { Background } from "../model/model.ts";
import { defineTrait } from "./trait.ts";

/** A one-color background with nothing on top; later traits can add dots or a light. */
export const solid = defineTrait({
  id: "solid",
  label: "Color liso",
  params: { color: "#0a1430" },
  apply: {
    background: (bg, p) => {
      bg.color = p.color;
      bg.gradient = false;
      bg.dots = false;
      bg.spotlight = 0;
    },
  },
});

/** `base` as a one-color background: no gradient, dots or light (065/D2). */
export function solidBackground(base: Background, color: string): Background {
  const bg = structuredClone(base);
  solid.apply.background?.(bg, { color });
  return bg;
}
