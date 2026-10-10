/**
 * Text entrances (018/D8): they reveal a text in characters, words or lines; at progress 0
 * nothing shows, at 1 all of it. Only components that draw `reveal` offer them.
 */
import { EASINGS } from "../engine/easing.ts";
import type { KindDef, RevealUnit } from "./kind.ts";

const reveal = (label: string, unit: RevealUnit, soft: boolean): KindDef => ({
  label,
  ease: EASINGS.linear,
  fn: (p, e) => ({ reveal: e(p), revealUnit: unit, revealSoft: soft }),
});

export const TEXT = {
  typewriter: reveal("Máquina de escribir", "char", false),
  "reveal-char": reveal("Revelar por letra", "char", true),
  "reveal-word": reveal("Revelar por palabra", "word", true),
  "reveal-line": reveal("Revelar por línea", "line", true),
};
