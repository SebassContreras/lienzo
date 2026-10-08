import { defineTrait } from "./trait.ts";

/** Turns the neon glow off (border glow of a rectangle, glow of a text, a line or particles). */
export const noGlow = defineTrait({
  id: "no-glow",
  label: "Sin brillo",
  params: {},
  apply: {
    shape: (el) => {
      el.borderGlow.enabled = false;
    },
    text: (el) => {
      el.glow.enabled = false;
    },
    line: (el) => {
      el.glow.enabled = false;
    },
    particles: (el) => {
      el.glow.enabled = false;
    },
  },
});
