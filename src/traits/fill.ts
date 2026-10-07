import { defineTrait } from "./trait.ts";

/** A rectangle's fill: solid color or two-color gradient. */
export const fill = defineTrait({
  id: "fill",
  label: "Relleno",
  params: {
    color: "#13254a",
    color2: "#0b1630",
    gradient: true,
    angle: 90,
    opacity: 0.9,
  },
  apply: {
    shape: (el, p) => {
      el.fill = { ...p };
    },
  },
});
