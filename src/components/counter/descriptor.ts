import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  align,
  anim,
  BOX_ANIMS,
  box,
  color,
  elementOpacity,
  font,
  glow,
  length,
  noGlow,
  num,
  select,
  text,
  weight,
} from "../fields/index.ts";
import { drawCounter } from "./draw.ts";

const N = { section: "Número" };
const T = { section: "Texto" };

/** How thousands are separated. */
export type Separator = "," | "." | " " | "";

const SEPARATORS = [
  [",", "Coma (1,000)"],
  [".", "Punto (1.000)"],
  [" ", "Espacio (1 000)"],
  ["", "Ninguno (1000)"],
] as const satisfies readonly (readonly [Separator, string])[];

/**
 * A number counting from `from` to `to` as `progress` goes from 0 to 1; `progress` is a
 * plain number field, so keyframes run the count (017/D2).
 */
const fields = {
  ...box(420, 140, { section: "Número", min: 10, max: 1600 }),
  opacity: elementOpacity("Número"),
  from: num(0, { label: "Desde", min: -1e6, max: 1e6, ...N }),
  to: num(1250, { label: "Hasta", min: -1e6, max: 1e6, ...N }),
  progress: num(1, {
    label: "Avance",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...N,
  }),
  decimals: num(0, {
    label: "Decimales",
    max: 4,
    int: true,
    bounds: [0, 6],
    ...N,
  }),
  separator: select(SEPARATORS, ",", { label: "Separador de miles", ...N }),
  prefix: text("", { label: "Prefijo", ...N }),
  suffix: text("", { label: "Sufijo", ...N }),
  font: { ...font("Inter"), ...T },
  size: length(96, { label: "Tamaño", min: 8, max: 400, ...T }),
  weight: { ...weight(800), ...T },
  color: color("#ffffff", { label: "Color", ...T }),
  align: { ...align("center"), ...T },
  glow: glow(noGlow("#60a5fa"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type CounterEl = ElementOf<"counter", typeof fields>;

export const counter = defineComponent<CounterEl>({
  kind: "counter",
  label: "Contador",
  icon: "Hash",
  fields,
  sections: [
    { title: "Número" },
    { title: "Texto" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawCounter,
});
