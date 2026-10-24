import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  check,
  color,
  elementOpacity,
  font,
  num,
  text,
  weight,
} from "../fields/index.ts";
import { drawTable } from "./draw.ts";

const D = { section: "Tabla" };
const C = { section: "Color" };
const T = { section: "Texto" };

/**
 * A table: one row per line of `cells`, columns split by `|`. `reveal` (0–1) shows the rows
 * one after another; it is a plain number field, so keyframes run it (017/D2).
 */
const fields = {
  ...box(640, 260, { section: "Tabla", min: 40, max: 3000 }),
  cells: text(
    "Plan | Precio | Usuarios\nGratis | 0 € | 1\nPro | 12 € | 5\nEquipo | 40 € | 25",
    {
      label: "Celdas (una fila por línea, columnas con |)",
      multiline: true,
      ...D,
    },
  ),
  header: check(true, { label: "Primera fila como cabecera", ...D }),
  radius: num(14, { label: "Esquinas", max: 60, ...D }),
  reveal: num(1, {
    label: "Revelado",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...D,
  }),
  headerColor: color("#1d4ed8", { label: "Cabecera", ...C }),
  rowColor: color("#0f172a", { label: "Filas", ...C }),
  stripeColor: color("#1e293b", { label: "Filas alternas", ...C }),
  borderColor: color("#334155", { label: "Bordes", ...C }),
  opacity: elementOpacity("Color"),
  font: { ...font("Inter"), ...T },
  size: num(22, { label: "Tamaño", min: 6, max: 120, ...T }),
  weight: { ...weight(500), ...T },
  color: color("#e2e8f0", { label: "Color", ...T }),
  headerTextColor: color("#ffffff", { label: "Color de la cabecera", ...T }),
  anim: anim(BOX_ANIMS),
};

export type TableEl = ElementOf<"table", typeof fields>;

export const table = defineComponent<TableEl>({
  kind: "table",
  label: "Tabla",
  icon: "Table",
  fields,
  sections: [
    { title: "Tabla" },
    { title: "Color" },
    { title: "Texto" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawTable,
});
