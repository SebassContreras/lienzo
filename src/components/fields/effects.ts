import { z } from "zod";
import { custom, num, obj, select } from "./field.ts";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

export const BLEND_MODES: readonly (readonly [BlendMode, string])[] = [
  ["normal", "Normal"],
  ["multiply", "Multiplicar"],
  ["screen", "Trama"],
  ["overlay", "Superponer"],
  ["darken", "Oscurecer"],
  ["lighten", "Aclarar"],
  ["color-dodge", "Sobreexponer color"],
  ["color-burn", "Subexponer color"],
  ["hard-light", "Luz intensa"],
  ["soft-light", "Luz suave"],
  ["difference", "Diferencia"],
  ["exclusion", "Exclusión"],
] as const;

export type EffectsDefaults = {
  blur: number;
  blend: BlendMode;
  mask?: string;
};

export const defaultEffects = (): EffectsDefaults => ({
  blur: 0,
  blend: "normal",
  mask: "",
});

/**
 * Shared effects field group (025/D1, D2, D3): blur, blend mode and mask target element ID.
 * Blur is an animatable number (025/D3).
 * Mask holds the id of another element that clips this one (025/D2).
 */
export function effects(
  d: EffectsDefaults = defaultEffects(),
  section = "Efectos",
) {
  return obj(
    {
      blur: num(d.blur, {
        label: "Desenfoque",
        min: 0,
        max: 100,
        step: 1,
        bounds: [0, 200],
      }),
      blend: select(BLEND_MODES, d.blend, {
        label: "Modo de fusión",
      }),
      mask: custom("mask", d.mask ?? "", z.string().optional().default(""), {
        label: "Máscara de recorte",
      }),
    },
    { section },
  );
}
