/**
 * Attention kinds, played in the loop slot, after the classic Animate.css set. At progress 0
 * and 1 each leaves the element as it is, so a loop closes seamlessly (A6).
 */
import { EASINGS } from "../engine/easing.ts";
import type { KindDef } from "./kind.ts";

const TAU = Math.PI * 2;
const { sin, cos, max } = Math;

const PX = { label: "distancia", max: 80 };
const PCT = { label: "intensidad %", max: 80 };
const DEG = { label: "ángulo °", max: 45 };

/** 1 at the start, 0 at the end: damps a swing so it settles back to rest. */
const settle = (p: number) => 1 - p;

export const ATTENTION = {
  float: {
    label: "Flotar",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => ({ dy: -sin(e(p) * TAU) * a }),
  },
  pulse: {
    label: "Pulso (escala)",
    ease: EASINGS.linear,
    amount: PCT,
    fn: (p, e, a) => ({ scale: 1 + (a / 100) * (0.5 - 0.5 * cos(e(p) * TAU)) }),
  },
  breathe: {
    label: "Brillo que respira",
    ease: EASINGS.linear,
    amount: { label: "intensidad %", max: 100 },
    fn: (p, e, a) => ({ glowMul: max(0, 1 + (a / 100) * sin(e(p) * TAU)) }),
  },
  bounce: {
    label: "Rebotar",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => {
      const q = e(p);
      // two hops, the second lower, as a ball would
      const hop =
        q < 0.6
          ? sin((q / 0.6) * Math.PI)
          : 0.4 * sin(((q - 0.6) / 0.4) * Math.PI);
      return { dy: -hop * a, scaleY: 1 + 0.05 * hop };
    },
  },
  flash: {
    label: "Destello",
    ease: EASINGS.linear,
    fn: (p, e) => ({ alpha: 0.5 + 0.5 * cos(e(p) * 2 * TAU) }),
  },
  "rubber-band": {
    label: "Goma elástica",
    ease: EASINGS.linear,
    amount: PCT,
    fn: (p, e, a) => {
      const s = (a / 100) * sin(e(p) * 1.5 * TAU) * settle(e(p));
      return { scaleX: 1 + s, scaleY: 1 - s };
    },
  },
  "shake-x": {
    label: "Sacudir (horizontal)",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => ({ dx: sin(e(p) * 5 * TAU) * a }),
  },
  "shake-y": {
    label: "Sacudir (vertical)",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => ({ dy: sin(e(p) * 5 * TAU) * a }),
  },
  swing: {
    label: "Columpio",
    ease: EASINGS.linear,
    amount: DEG,
    fn: (p, e, a) => ({ rotate: a * sin(e(p) * 2 * TAU) * settle(e(p)) }),
  },
  tada: {
    label: "Tada",
    ease: EASINGS.linear,
    amount: PCT,
    fn: (p, e, a) => {
      const env = sin(e(p) * Math.PI);
      return {
        scale: 1 + (a / 100) * env,
        rotate: 3 * sin(e(p) * 4 * TAU) * env,
      };
    },
  },
  wobble: {
    label: "Tambalear",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => {
      const w = sin(e(p) * 2.5 * TAU) * settle(e(p));
      return { dx: -w * a, rotate: -w * 5 };
    },
  },
  jello: {
    label: "Gelatina",
    ease: EASINGS.linear,
    amount: DEG,
    fn: (p, e, a) => {
      const k = a * sin(e(p) * 3 * TAU) * settle(e(p));
      return { skewX: k, skewY: k };
    },
  },
  heartbeat: {
    label: "Latido",
    ease: EASINGS.linear,
    amount: PCT,
    // two beats in the first half, then still
    fn: (p, e, a) => {
      const q = e(p);
      return { scale: 1 + (a / 100) * (q < 0.5 ? sin(q * 2 * TAU) ** 2 : 0) };
    },
  },
  "head-shake": {
    label: "Negar con la cabeza",
    ease: EASINGS.linear,
    amount: PX,
    fn: (p, e, a) => {
      const q = e(p);
      const w = q < 0.5 ? sin(q * 4 * TAU) * (1 - 2 * q) : 0;
      return { dx: w * a, rotate: w * 9 };
    },
  },
} satisfies Record<string, KindDef>;
