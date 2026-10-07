import { defineTrait } from "./trait.ts";

/** Text painted with a left-to-right two-color gradient. */
export const gradientText = defineTrait({
  id: "gradient-text",
  label: "Texto degradado",
  params: { color: "#3b82f6", color2: "#22d3ee" },
  apply: {
    text: (el, p) => {
      el.gradient = true;
      el.color = p.color;
      el.color2 = p.color2;
    },
  },
});
