/**
 * Emphasis kinds, played in the loop slot: they draw the eye without moving the element. At
 * progress 0 and 1 they leave it as it is (A6).
 */
import { EASINGS } from "../engine/easing.ts";
import type { KindDef } from "./kind.ts";

export const EMPHASIS = {
  highlight: {
    label: "Resaltar (brillo)",
    ease: EASINGS.linear,
    amount: { label: "intensidad %", max: 300 },
    // one flare of its glow early in the cycle, a touch of scale with it
    fn: (p, e, a) => {
      const q = e(p);
      const flare = q < 0.4 ? Math.sin((q / 0.4) * Math.PI) ** 2 : 0;
      return { glowMul: 1 + (a / 100) * flare, scale: 1 + 0.03 * flare };
    },
  },
} satisfies Record<string, KindDef>;
