import { defineTrait } from "./trait.ts";

/** Floats up and down by `amount` px, `cycles` times per loop. */
export const float = defineTrait({
  id: "float",
  label: "Flotar",
  params: { amount: 12, cycles: 1, delay: 0 },
  apply: {
    shape: (el, p) => {
      el.anim = { kind: "float", ...p };
    },
    text: (el, p) => {
      el.anim = { kind: "float", ...p };
    },
    icon: (el, p) => {
      el.anim = { kind: "float", ...p };
    },
    group: (el, p) => {
      el.anim = { kind: "float", ...p };
    },
  },
});
