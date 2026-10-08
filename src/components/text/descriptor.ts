import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  align,
  anim,
  BOX_ANIMS,
  check,
  color,
  font,
  glow,
  noGlow,
  num,
  type Parent,
  position,
  text as textField,
  weight,
} from "../fields/index.ts";
import { drawText } from "./draw.ts";

const T = { section: "Texto" };
const C = { section: "Color" };

/** Free text; its box is as big as the text it holds. */
const fields = {
  ...position(),
  text: textField("Texto", { label: "Contenido", multiline: true, ...T }),
  font: { ...font("Inter"), ...T },
  size: num(64, { label: "Tamaño", min: 8, max: 300, ...T }),
  weight: { ...weight(800), ...T },
  italic: check(false, { label: "Cursiva", ...T }),
  color: color("#ffffff", { label: "Color", ...C }),
  gradient: check(false, { label: "Degradado", ...C }),
  color2: color("#60a5fa", {
    label: "Color 2",
    ...C,
    visible: (el: Parent) => el.gradient === true,
  }),
  align: { ...align("left"), ...T },
  lineHeight: num(1.15, {
    label: "Interlineado",
    min: 0.7,
    max: 2.5,
    step: 0.05,
    ...T,
  }),
  letterSpacing: num(0, {
    label: "Espaciado",
    min: -10,
    max: 40,
    step: 0.5,
    ...T,
  }),
  opacity: num(1, { label: "Opacidad", max: 1, step: 0.01, ...C }),
  glow: glow(noGlow("#60a5fa"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type TextEl = ElementOf<"text", typeof fields>;

export const text = defineComponent<TextEl>({
  kind: "text",
  label: "Texto",
  icon: "Type",
  fields,
  sections: [
    { title: "Texto" },
    { title: "Color" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawText,
});
