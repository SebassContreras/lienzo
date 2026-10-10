/**
 * Entrances, after the classic Animate.css set: at progress 1 they leave the element as it
 * is, at 0 it is hidden. An exit plays the same kind from 1 to 0 (013/D6), so exits have no
 * code of their own. Directional kinds come from `dir` (an exit leaves towards it).
 */
import { EASINGS } from "../engine/easing.ts";
import { clamp01, type KindDef } from "./kind.ts";

const PX = { label: "distancia", max: 400 };

export const ENTRANCES = {
  fade: {
    label: "Desvanecer",
    ease: EASINGS["cubic-out"],
    fn: (p, e) => ({ alpha: e(p) }),
  },
  pop: {
    label: "Pop",
    ease: EASINGS["back-out"],
    fn: (p, e) => ({ alpha: clamp01(p * 2), scale: Math.max(0, e(p)) }),
  },
  slide: {
    label: "Deslizar",
    ease: EASINGS["cubic-out"],
    amount: PX,
    directional: true,
    fn: (p, e, a, d) => {
      const off = (1 - e(p)) * a;
      return { alpha: e(p), dx: off * d.x, dy: off * d.y };
    },
  },
  zoom: {
    label: "Zoom",
    ease: EASINGS["cubic-out"],
    fn: (p, e) => ({ alpha: e(p), scale: 0.3 + 0.7 * e(p) }),
  },
  rotate: {
    label: "Girar",
    ease: EASINGS["cubic-out"],
    fn: (p, e) => ({ alpha: e(p), rotate: -200 * (1 - e(p)) }),
  },
  bounce: {
    label: "Rebotar",
    ease: EASINGS["bounce-out"],
    amount: PX,
    directional: true,
    fn: (p, e, a, d) => {
      const off = (1 - e(p)) * a;
      return { alpha: clamp01(p * 4), dx: off * d.x, dy: off * d.y };
    },
  },
  flip: {
    label: "Voltear",
    ease: EASINGS["back-out"],
    directional: true,
    // turning about the axis across its side: from above or below it folds vertically
    fn: (p, e, _a, d) => {
      const s = Math.max(0, e(p));
      return d.y !== 0
        ? { alpha: clamp01(p * 2), scaleY: s }
        : { alpha: clamp01(p * 2), scaleX: s };
    },
  },
  back: {
    label: "Desde atrás",
    ease: EASINGS["cubic-out"],
    amount: PX,
    directional: true,
    // travels in held small, then grows to its size
    fn: (p, e, a, d) => {
      const travel = 1 - e(clamp01(p / 0.7));
      const grow = e(clamp01((p - 0.7) / 0.3));
      return {
        alpha: clamp01(p * 3) * (0.7 + 0.3 * grow),
        scale: 0.7 + 0.3 * grow,
        dx: travel * a * d.x,
        dy: travel * a * d.y,
      };
    },
  },
  "light-speed": {
    label: "Velocidad luz",
    ease: EASINGS["cubic-out"],
    amount: PX,
    directional: true,
    // horizontal only: from above or below it comes from the right
    fn: (p, e, a, d) => {
      const side = d.x === 0 ? 1 : d.x;
      const rest = 1 - e(p);
      return {
        alpha: e(p),
        dx: rest * a * side,
        skewX: -30 * rest * side + 10 * Math.sin(e(p) * Math.PI) * side,
      };
    },
  },
  draw: {
    label: "Dibujarse",
    ease: EASINGS["cubic-out"],
    fn: (p, e) => ({ progress: e(p) }),
  },
} satisfies Record<string, KindDef>;
