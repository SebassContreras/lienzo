import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  check,
  custom,
  num,
  plainBorder,
  position,
  shadow,
  softShadow,
} from "../fields/index.ts";
import { drawImage } from "./draw.ts";

type Sized = { w: number; h: number; aspect: number; keepAspect: boolean };

const size = { section: "Forma", min: 10, max: 2000 };

/** A picture file stored in `assets/`, drawn into its box. */
const fields = {
  ...position(),
  w: num(320, {
    label: "Ancho",
    ...size,
    set: (el: Sized, v: number) => {
      el.w = v;
      if (el.keepAspect) el.h = v / el.aspect;
    },
  }),
  h: num(240, {
    label: "Alto",
    ...size,
    set: (el: Sized, v: number) => {
      el.h = v;
      if (el.keepAspect) el.w = v * el.aspect;
    },
  }),
  /** URL path such as `/assets/3f2a….png`; empty until a file is chosen. */
  src: custom("image", "", z.string(), { label: "Imagen", section: "Imagen" }),
  /** Width / height of the picture itself; resizing keeps it when `keepAspect`. */
  aspect: num(4 / 3, { label: "Proporción", inspector: false }),
  keepAspect: check(true, {
    label: "Proporción",
    section: "Forma",
    set: (el: Sized, v: boolean) => {
      el.keepAspect = v;
      if (v) el.h = el.w / el.aspect;
    },
  }),
  radius: num(16, { label: "Esquinas", section: "Forma", max: 300 }),
  opacity: num(1, { label: "Opacidad", section: "Forma", max: 1, step: 0.01 }),
  border: plainBorder({ width: 0, color: "#ffffff", opacity: 0.3 }, "Borde"),
  shadow: shadow(softShadow(false)),
  anim: anim(BOX_ANIMS),
};

export type ImageEl = ElementOf<"image", typeof fields>;

export const image = defineComponent<ImageEl>({
  kind: "image",
  label: "Imagen",
  icon: "Image",
  fields,
  sections: [
    { title: "Imagen" },
    { title: "Forma" },
    { title: "Borde" },
    { title: "Sombra", open: false },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawImage,
});
