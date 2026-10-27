import {
  check,
  color,
  fraction,
  length,
  num,
  obj,
  type Parent,
} from "./field.ts";

export type ShadowDefaults = {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  x: number;
  y: number;
};

/** The drop shadow cards and images start with. */
export const softShadow = (enabled: boolean): ShadowDefaults => ({
  enabled,
  color: "#000000",
  opacity: 0.5,
  blur: 40,
  x: 0,
  y: 16,
});

export function shadow(d: ShadowDefaults, section = "Sombra") {
  const on = (p: Parent) => p.enabled === true;
  const offset = { min: -100, max: 100, visible: on };
  return obj(
    {
      enabled: check(d.enabled, { label: "Activa" }),
      color: color(d.color, { label: "Color", visible: on }),
      opacity: fraction(d.opacity, { label: "Opacidad", visible: on }),
      blur: length(d.blur, { label: "Difusión", max: 150, visible: on }),
      x: num(d.x, { label: "X", ...offset }),
      y: num(d.y, { label: "Y", ...offset }),
    },
    { section },
  );
}
