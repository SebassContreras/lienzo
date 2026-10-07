import { defineTrait } from "./trait.ts";

/** Frosted glass: an almost transparent white-to-tint fill with a thin light border. */
export const glass = defineTrait({
  id: "glass",
  label: "Vidrio",
  params: { tint: "#93c5fd", opacity: 0.08, border: 0.25 },
  apply: {
    shape: (el, p) => {
      el.fill = {
        color: "#ffffff",
        color2: p.tint,
        gradient: true,
        angle: 135,
        opacity: p.opacity,
      };
      el.border = {
        width: 1.5,
        color: "#ffffff",
        opacity: p.border,
        style: "solid",
        flow: 0,
      };
      el.borderGlow.enabled = false;
    },
  },
});
