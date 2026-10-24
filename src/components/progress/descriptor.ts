import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  check,
  color,
  elementOpacity,
  font,
  glow,
  noGlow,
  num,
  type Parent,
  select,
  text,
  weight,
} from "../fields/index.ts";
import { drawProgress } from "./draw.ts";

type ProgressStyle = "bar" | "ring";

const P = { section: "Progreso" };
const ring = (p: Parent) => p.style === "ring";
const numbered = (p: Parent) => ring(p) && p.showNumber === true;

/**
 * A bar or a ring filled to `value` (0–100). The value is a plain number field, so
 * keyframes fill it in (017/D2).
 */
const fields = {
  ...box(420, 36, { section: "Progreso", min: 10, max: 1600 }),
  opacity: elementOpacity("Progreso"),
  style: select(
    [
      ["bar", "Barra"],
      ["ring", "Anillo"],
    ] as const satisfies readonly (readonly [ProgressStyle, string])[],
    "bar",
    { label: "Estilo", ...P },
  ),
  value: num(65, {
    label: "Valor",
    max: 100,
    step: 0.5,
    bounds: [0, 100],
    ...P,
  }),
  /** The ring's line width; a bar is as thick as its box. */
  thickness: num(18, {
    label: "Grosor",
    min: 1,
    max: 200,
    visible: ring,
    ...P,
  }),
  rounded: check(true, { label: "Extremos redondeados", ...P }),
  color: color("#3b82f6", { label: "Color", section: "Color" }),
  gradient: check(true, { label: "Degradado", section: "Color" }),
  color2: color("#22d3ee", {
    label: "Color 2",
    section: "Color",
    visible: (p: Parent) => p.gradient === true,
  }),
  track: color("#1e293b", { label: "Color del fondo", section: "Color" }),
  showNumber: check(true, {
    label: "Número en el centro",
    section: "Número",
    visible: ring,
  }),
  suffix: text("%", { label: "Sufijo", section: "Número", visible: numbered }),
  font: { ...font("Inter"), section: "Número", visible: numbered },
  size: num(48, {
    label: "Tamaño",
    min: 8,
    max: 300,
    section: "Número",
    visible: numbered,
  }),
  weight: { ...weight(800), section: "Número", visible: numbered },
  numberColor: color("#ffffff", {
    label: "Color",
    section: "Número",
    visible: numbered,
  }),
  glow: glow(noGlow("#3b82f6"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type ProgressEl = ElementOf<"progress", typeof fields>;

export const progress = defineComponent<ProgressEl>({
  kind: "progress",
  label: "Progreso",
  icon: "Loader",
  fields,
  sections: [
    { title: "Progreso" },
    { title: "Color" },
    { title: "Número" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawProgress,
});
