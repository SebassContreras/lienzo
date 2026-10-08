import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  check,
  color,
  custom,
  fillFields,
  glow,
  noGlow,
  num,
  obj,
  type Parent,
  position,
} from "../fields/index.ts";
import { drawIcon } from "./draw.ts";

const on = (p: Parent) => p.enabled === true;

/** A lucide icon drawn as strokes, optionally on a rounded tile. */
const fields = {
  ...position(),
  /** Icons are square: the size sets both sides. */
  w: num(120, {
    label: "Tamaño",
    section: "Trazo",
    min: 16,
    max: 1200,
    set: (el: { w: number; h: number }, v: number) => {
      el.w = v;
      el.h = v;
    },
  }),
  h: num(120, { label: "Alto", inspector: false }),
  /** Lucide icon name in PascalCase, e.g. "Wrench". */
  icon: custom("icon", "Wrench", z.string(), {
    label: "Icono",
    section: "Icono",
  }),
  /** Stroke width on lucide's 24x24 grid. */
  stroke: num(2, {
    label: "Grosor",
    section: "Trazo",
    min: 0.5,
    max: 4,
    step: 0.25,
  }),
  color: color("#e0f2fe", { label: "Color", section: "Trazo" }),
  opacity: num(1, { label: "Opacidad", section: "Trazo", max: 1, step: 0.01 }),
  tile: obj(
    {
      enabled: check(true, { label: "Activo" }),
      ...fillFields(
        {
          color: "#1e3a8a",
          gradient: true,
          color2: "#0b1630",
          angle: 135,
          opacity: 1,
        },
        on,
      ),
      radius: num(28, { label: "Esquinas", max: 300, visible: on }),
      /** Space between the tile's edge and the icon, px. */
      padding: num(28, { label: "Margen", max: 300, visible: on }),
    },
    { section: "Fondo del icono" },
  ),
  glow: glow(noGlow("#60a5fa"), "Brillo"),
  anim: anim(BOX_ANIMS),
};

export type IconEl = ElementOf<"icon", typeof fields>;

export const icon = defineComponent<IconEl>({
  kind: "icon",
  label: "Icono",
  fields,
  sections: [
    { title: "Icono" },
    { title: "Trazo" },
    { title: "Fondo del icono" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawIcon,
});
