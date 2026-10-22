import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  color,
  font,
  glow,
  noGlow,
  num,
  select,
  text,
  weight,
} from "../fields/index.ts";
import { drawSteps } from "./draw.ts";

const S = { section: "Pasos" };
const C = { section: "Color" };
const T = { section: "Texto" };

type StepsLayout = "horizontal" | "vertical";

/**
 * Numbered steps along a line, one per line of `labels`. Steps up to `active` are lit; it is
 * a plain number field, so keyframes light them one after another (017/D2).
 */
const fields = {
  ...box(720, 160, { section: "Pasos", min: 40, max: 3000 }),
  labels: text("Idea\nDiseño\nCódigo\nLanzamiento", {
    label: "Pasos (uno por línea)",
    multiline: true,
    ...S,
  }),
  layout: select(
    [
      ["horizontal", "Horizontal"],
      ["vertical", "Vertical"],
    ] as const satisfies readonly (readonly [StepsLayout, string])[],
    "horizontal",
    { label: "Disposición", ...S },
  ),
  active: num(2, {
    label: "Paso activo",
    max: 12,
    step: 0.05,
    bounds: [0, Infinity],
    ...S,
  }),
  dot: num(44, { label: "Tamaño del círculo", min: 8, max: 200, ...S }),
  lineWidth: num(4, { label: "Grosor de la línea", min: 1, max: 40, ...S }),
  color: color("#3b82f6", { label: "Activo", ...C }),
  idle: color("#1e293b", { label: "Inactivo", ...C }),
  numberColor: color("#ffffff", { label: "Números", ...C }),
  textColor: color("#e2e8f0", { label: "Texto", ...C }),
  font: { ...font("Inter"), ...T },
  size: num(22, { label: "Tamaño", min: 6, max: 200, ...T }),
  weight: { ...weight(600), ...T },
  glow: glow(noGlow("#3b82f6"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type StepsEl = ElementOf<"steps", typeof fields>;

export const steps = defineComponent<StepsEl>({
  kind: "steps",
  label: "Pasos",
  icon: "ListOrdered",
  fields,
  sections: [
    { title: "Pasos" },
    { title: "Color" },
    { title: "Texto" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawSteps,
});
