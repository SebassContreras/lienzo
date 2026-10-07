import { defineTrait } from "./trait.ts";

/** Grows and shrinks by `amount` %, `cycles` times per loop. */
export const pulse = defineTrait({
  id: "pulse",
  label: "Pulso",
  params: { amount: 6, cycles: 2, delay: 0 },
  apply: {
    shape: (el, p) => {
      el.anim = { kind: "pulse", ...p };
    },
    text: (el, p) => {
      el.anim = { kind: "pulse", ...p };
    },
    icon: (el, p) => {
      el.anim = { kind: "pulse", ...p };
    },
    group: (el, p) => {
      el.anim = { kind: "pulse", ...p };
    },
  },
});
