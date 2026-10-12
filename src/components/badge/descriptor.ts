import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  border,
  check,
  color,
  custom,
  fill,
  font,
  glow,
  noGlow,
  num,
  position,
  text,
  weight,
} from "../fields/index.ts";
import { drawBadge } from "./draw.ts";

const B = { section: "Insignia" };

/** A pill holding an icon and a text; its box is as big as what it holds. */
const fields = {
  ...position(),
  text: text("Nuevo", { label: "Texto", ...B }),
  showIcon: check(true, { label: "Con icono", ...B }),
  icon: custom("icon", "Sparkles", z.string(), {
    label: "Icono",
    ...B,
    visible: (p) => p.showIcon === true,
  }),
  font: { ...font("Inter"), ...B },
  size: num(26, { label: "Tamaño", min: 8, max: 160, ...B }),
  weight: { ...weight(700), ...B },
  color: color("#e0f2fe", { label: "Color del texto", ...B }),
  /** Space around the content, as a fraction of the text size. */
  padding: num(0.6, {
    label: "Margen",
    min: 0.1,
    max: 2,
    step: 0.05,
    ...B,
  }),
  fill: fill(
    {
      color: "#1d4ed8",
      gradient: true,
      color2: "#7c3aed",
      angle: 0,
      opacity: 1,
    },
    "Fondo",
  ),
  border: border(
    { width: 0, color: "#93c5fd", opacity: 0.8, style: "solid", flow: 0 },
    "Borde",
  ),
  glow: glow(noGlow("#60a5fa"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type BadgeEl = ElementOf<"badge", typeof fields>;

export const badge = defineComponent<BadgeEl>({
  kind: "badge",
  label: "Insignia",
  icon: "BadgeCheck",
  fields,
  sections: [
    { title: "Insignia" },
    { title: "Fondo" },
    { title: "Borde" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawBadge,
});
