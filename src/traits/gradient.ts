import { defineTrait } from "./trait.ts";

/** A two-color background gradient with nothing on top; later traits can add dots or a light. */
export const gradient = defineTrait({
  id: "gradient",
  label: "Degradado",
  params: { color: "#0a1430", color2: "#030712", angle: 120 },
  apply: {
    background: (bg, p) => {
      bg.color = p.color;
      bg.color2 = p.color2;
      bg.angle = p.angle;
      bg.gradient = true;
      bg.dots = false;
      bg.spotlight = 0;
    },
  },
});
