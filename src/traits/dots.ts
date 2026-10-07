import { defineTrait } from "./trait.ts";

/** A grid of small dots over the background, `gap` px apart. */
export const dots = defineTrait({
  id: "dots",
  label: "Puntos",
  params: { color: "#1e3a8a", gap: 36 },
  apply: {
    background: (bg, p) => {
      bg.dots = true;
      bg.dotColor = p.color;
      bg.dotGap = p.gap;
    },
  },
});
