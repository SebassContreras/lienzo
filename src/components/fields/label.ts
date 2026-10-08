import { z } from "zod";
import { FONTS } from "../../model/fonts.ts";
import { color, num, obj, select, text } from "./field.ts";

export type Align = "left" | "center" | "right";

export const ALIGNS = [
  ["left", "Izquierda"],
  ["center", "Centro"],
  ["right", "Derecha"],
] as const satisfies readonly (readonly [Align, string])[];

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900].map(
  (w) => [w, String(w)] as const,
);

/** Any font name opens; the list offers the bundled ones. */
export function font(value: string) {
  return select(
    FONTS.map((f) => [f as string, f] as const),
    value,
    { label: "Fuente", schema: z.string() },
  );
}

export function weight(value: number) {
  return select(WEIGHTS, value, { label: "Peso", schema: z.number() });
}

export function align(value: Align) {
  return select(ALIGNS, value, { label: "Alineación" });
}

/** Text drawn inside a shape, centred vertically; moves and animates with it. */
export function label(
  d: {
    text: string;
    font: string;
    size: number;
    weight: number;
    color: string;
    align: Align;
    padding: number;
  },
  section = "Texto interior",
) {
  return obj(
    {
      text: text(d.text, { label: "Texto", multiline: true }),
      font: font(d.font),
      size: num(d.size, { label: "Tamaño", min: 8, max: 200 }),
      weight: weight(d.weight),
      color: color(d.color, { label: "Color" }),
      align: align(d.align),
      padding: num(d.padding, { label: "Margen", max: 200 }),
    },
    { section },
  );
}
