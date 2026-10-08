import { check, color, num, obj, type Parent } from "./field.ts";

export type GlowDefaults = {
  enabled: boolean;
  color: string;
  blur: number;
  /** Number of stacked passes, 1–4. */
  strength: number;
};

/** An off glow of `color` with the usual spread. */
export const noGlow = (color: string): GlowDefaults => ({
  enabled: false,
  color,
  blur: 24,
  strength: 1,
});

export function glow(d: GlowDefaults, section: string) {
  const on = (p: Parent) => p.enabled === true;
  return obj(
    {
      enabled: check(d.enabled, { label: "Activo" }),
      color: color(d.color, { label: "Color", visible: on }),
      blur: num(d.blur, { label: "Difusión", max: 150, visible: on }),
      strength: num(d.strength, {
        label: "Intensidad",
        min: 1,
        max: 4,
        visible: on,
      }),
    },
    { section },
  );
}
