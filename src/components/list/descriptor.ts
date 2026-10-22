import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  color,
  font,
  num,
  select,
  text,
  weight,
} from "../fields/index.ts";
import { drawList } from "./draw.ts";

const L = { section: "Lista" };
const T = { section: "Texto" };

type Bullet = "dot" | "number" | "check" | "dash";

/**
 * A bullet list, one item per line of `items`. `reveal` (0–1) shows the items one after
 * another; it is a plain number field, so keyframes run it (017/D2).
 */
const fields = {
  ...box(520, 220, { section: "Lista", min: 20, max: 3000 }),
  items: text("Rápido de usar\nAnimaciones listas\nExporta a GIF y MP4", {
    label: "Elementos (uno por línea)",
    multiline: true,
    ...L,
  }),
  bullet: select(
    [
      ["dot", "Punto"],
      ["number", "Número"],
      ["check", "Check"],
      ["dash", "Guion"],
    ] as const satisfies readonly (readonly [Bullet, string])[],
    "check",
    { label: "Viñeta", ...L },
  ),
  bulletColor: color("#22d3ee", { label: "Color de la viñeta", ...L }),
  spacing: num(1.7, {
    label: "Interlineado",
    min: 1,
    max: 4,
    step: 0.05,
    ...L,
  }),
  reveal: num(1, {
    label: "Revelado",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...L,
  }),
  font: { ...font("Inter"), ...T },
  size: num(30, { label: "Tamaño", min: 6, max: 200, ...T }),
  weight: { ...weight(500), ...T },
  color: color("#e2e8f0", { label: "Color", ...T }),
  anim: anim(BOX_ANIMS),
};

export type ListEl = ElementOf<"list", typeof fields>;

export const list = defineComponent<ListEl>({
  kind: "list",
  label: "Lista",
  icon: "List",
  fields,
  sections: [{ title: "Lista" }, { title: "Texto" }, { title: "Animación" }],
  anims: BOX_ANIMS,
  draw: drawList,
});
