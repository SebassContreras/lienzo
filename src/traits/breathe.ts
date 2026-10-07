import { defineTrait } from "./trait.ts";

/** The glow swells and fades by `amount` %, `cycles` times per loop. */
export const breathe = defineTrait({
  id: "breathe",
  label: "Brillo que respira",
  params: { amount: 60, cycles: 2, delay: 0 },
  apply: {
    shape: (el, p) => {
      el.anim = { kind: "breathe", ...p };
    },
    text: (el, p) => {
      el.anim = { kind: "breathe", ...p };
    },
  },
});
