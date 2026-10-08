import { z } from "zod";
import { num, obj, type Parent, select } from "./field.ts";

export const ANIM_KINDS = [
  "none",
  "float",
  "pulse",
  "breathe",
  "fade-in",
  "pop-in",
  "slide-up",
  "draw",
] as const;

export type AnimKind = (typeof ANIM_KINDS)[number];

export const ANIM_LABELS: Record<AnimKind, string> = {
  none: "Ninguna",
  float: "Flotar",
  pulse: "Pulso (escala)",
  breathe: "Brillo que respira",
  "fade-in": "Aparecer",
  "pop-in": "Pop",
  "slide-up": "Subir",
  draw: "Dibujarse",
};

/** Animations for anything with a box: shapes, icons, images, text, groups. */
export const BOX_ANIMS: readonly AnimKind[] = [
  "none",
  "float",
  "pulse",
  "breathe",
  "fade-in",
  "pop-in",
  "slide-up",
];

const LOOPS: readonly unknown[] = ["float", "pulse", "breathe"];
const MOVES: readonly unknown[] = ["float", "slide-up"];

/**
 * The element's preset animation. `kinds` are the ones the inspector offers; any kind
 * opens, so scenes edited by hand keep working.
 */
export function anim(kinds: readonly AnimKind[], section = "Animación") {
  return obj(
    {
      kind: select(
        kinds.map((k) => [k, ANIM_LABELS[k]] as const),
        "none" as AnimKind,
        { label: "Tipo", schema: z.enum(ANIM_KINDS) },
      ),
      /** px for float/slide-up, % for pulse/breathe. */
      amount: num(12, {
        label: (p: Parent) =>
          MOVES.includes(p.kind) ? "Distancia" : "Intensidad %",
        max: (p: Parent) => (p.kind === "breathe" ? 100 : 80),
        visible: (p: Parent) => LOOPS.includes(p.kind) || p.kind === "slide-up",
      }),
      /** Full cycles per loop; integers keep GIF/MP4 loops seamless. */
      cycles: num(1, {
        label: "Ciclos / loop",
        min: 1,
        max: 8,
        visible: (p: Parent) => LOOPS.includes(p.kind),
      }),
      /** Seconds; phase offset for loops, start time for entries. */
      delay: num(0, {
        label: "Retraso (s)",
        max: 5,
        step: 0.1,
        visible: (p: Parent) => p.kind !== "none",
      }),
    },
    { section },
  );
}
