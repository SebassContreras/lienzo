import { color, num, obj, type Parent, select } from "./field.ts";

export type StrokeStyle = "solid" | "dashed" | "dotted";

export const STROKE_STYLES = [
  ["solid", "Continuo"],
  ["dashed", "Guiones"],
  ["dotted", "Puntos"],
] as const satisfies readonly (readonly [StrokeStyle, string])[];

export function strokeStyle(value: StrokeStyle) {
  return select(STROKE_STYLES, value, { label: "Estilo" });
}

export function strokeWidth(value: number, min = 0, max = 20) {
  return num(value, { label: "Grosor", min, max, step: 0.5 });
}

const opacity = (value: number, visible?: (p: Parent) => boolean) =>
  num(value, { label: "Opacidad", max: 1, step: 0.01, visible });

/** A shape's border: dashes can march around it (`flow` periods per loop, 0 = still). */
export function border(
  d: {
    width: number;
    color: string;
    opacity: number;
    style: StrokeStyle;
    flow: number;
  },
  section: string,
) {
  return obj(
    {
      width: strokeWidth(d.width),
      color: color(d.color, { label: "Color" }),
      opacity: opacity(d.opacity),
      style: strokeStyle(d.style),
      flow: num(d.flow, {
        label: "Movimiento",
        min: -20,
        max: 20,
        visible: (p: Parent) => p.style !== "solid",
      }),
    },
    { section },
  );
}

/** A plain border whose color shows only once it has a width. */
export function plainBorder(
  d: { width: number; color: string; opacity: number },
  section: string,
) {
  const drawn = (p: Parent) => (p.width as number) > 0;
  return obj(
    {
      width: strokeWidth(d.width),
      color: color(d.color, { label: "Color", visible: drawn }),
      opacity: opacity(d.opacity, drawn),
    },
    { section },
  );
}
