import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  check,
  color,
  font,
  num,
  select,
  text,
  weight,
} from "../fields/index.ts";
import { drawChart } from "./draw.ts";
import { PALETTES, type Palette } from "./palettes.ts";

const D = { section: "Gráfico" };
const C = { section: "Color" };
const T = { section: "Texto" };

type ChartType = "bar" | "line" | "pie" | "donut";

const round = (p: Record<string, unknown>) =>
  p.type === "pie" || p.type === "donut";

/**
 * A chart of the values typed in `data`, one `Etiqueta: valor` per line. `progress` (0–1)
 * draws it in; it is a plain number field, so keyframes run it (017/D2).
 */
const fields = {
  ...box(560, 360, { section: "Gráfico", min: 40, max: 3000 }),
  type: select(
    [
      ["bar", "Barras"],
      ["line", "Línea"],
      ["pie", "Tarta"],
      ["donut", "Donut"],
    ] as const satisfies readonly (readonly [ChartType, string])[],
    "bar",
    { label: "Tipo", ...D },
  ),
  data: text("Ene: 12\nFeb: 19\nMar: 15\nAbr: 27\nMay: 32", {
    label: "Datos (Etiqueta: valor, uno por línea)",
    multiline: true,
    ...D,
  }),
  progress: num(1, {
    label: "Dibujado",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...D,
  }),
  hole: num(0.58, {
    label: "Hueco",
    min: 0.1,
    max: 0.9,
    step: 0.01,
    visible: (p) => p.type === "donut",
    ...D,
  }),
  showValues: check(true, { label: "Mostrar valores", ...D }),
  palette: select(
    Object.entries(PALETTES).map(([k, p]) => [k as Palette, p.label] as const),
    "ocean",
    { label: "Paleta", ...C },
  ),
  axis: color("#334155", {
    label: "Ejes",
    visible: (p) => !round(p),
    ...C,
  }),
  font: { ...font("Inter"), ...T },
  size: num(18, { label: "Tamaño", min: 6, max: 80, ...T }),
  weight: { ...weight(600), ...T },
  color: color("#cbd5e1", { label: "Color", ...T }),
  anim: anim(BOX_ANIMS),
};

export type ChartEl = ElementOf<"chart", typeof fields>;

export const chart = defineComponent<ChartEl>({
  kind: "chart",
  label: "Gráfico",
  icon: "ChartColumn",
  fields,
  sections: [
    { title: "Gráfico" },
    { title: "Color" },
    { title: "Texto" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawChart,
});
