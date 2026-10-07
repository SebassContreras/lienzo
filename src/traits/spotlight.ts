import { defineTrait } from "./trait.ts";

/** A soft radial light in the upper middle of the background; `amount` from 0 to 1. */
export const spotlight = defineTrait({
  id: "spotlight",
  label: "Luz central",
  params: { amount: 0.35, color: "#1d4ed8" },
  apply: {
    background: (bg, p) => {
      bg.spotlight = p.amount;
      bg.spotlightColor = p.color;
    },
  },
});
