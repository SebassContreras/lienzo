import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  border,
  box,
  fill,
  glow,
  label,
  noGlow,
  num,
  shadow,
  softShadow,
} from "../fields/index.ts";
import { drawRect } from "./draw.ts";

/**
 * What rectangles and ellipses share: fill, border, glows, shadow and the inner label, in a
 * `w` × `h` box.
 */
export function shapeFields(w: number, h: number) {
  return {
    ...box(w, h, { section: "Forma", min: 10, max: 1600 }),
    fill: fill(
      {
        color: "#13254a",
        gradient: true,
        color2: "#0b1630",
        angle: 90,
        opacity: 0.9,
      },
      "Fondo",
    ),
    border: border(
      {
        width: 2,
        color: "#3b82f6",
        opacity: 0.8,
        style: "solid",
        flow: 0,
      },
      "Borde",
    ),
    borderGlow: glow(
      { ...noGlow("#3b82f6"), enabled: true, blur: 18 },
      "Brillo del borde",
    ),
    bgGlow: glow(noGlow("#2563eb"), "Brillo de fondo"),
    shadow: shadow(softShadow(true)),
    label: label({
      text: "",
      font: "Inter",
      size: 28,
      weight: 600,
      color: "#ffffff",
      align: "center",
      padding: 24,
    }),
    anim: anim(BOX_ANIMS),
  };
}

/** The inspector sections of shapes; `Forma` holds the size. */
export const SHAPE_SECTIONS = [
  { title: "Forma" },
  { title: "Fondo" },
  { title: "Brillo de fondo" },
  { title: "Borde" },
  { title: "Brillo del borde" },
  { title: "Sombra", open: false },
  { title: "Texto interior" },
  { title: "Animación" },
];

/** Anything drawn like a rectangle (see `drawShape`). */
export type ShapeEl = ElementOf<
  "rect" | "ellipse",
  ReturnType<typeof shapeFields>
>;

const { x, y, w, h, ...style } = shapeFields(280, 180);

const fields = {
  x,
  y,
  w,
  h,
  radius: num(24, { label: "Esquinas", max: 300, section: "Forma" }),
  ...style,
};

export type RectEl = ElementOf<"rect", typeof fields>;

export const rect = defineComponent<RectEl>({
  kind: "rect",
  label: "Rectángulo",
  fields,
  sections: SHAPE_SECTIONS,
  anims: BOX_ANIMS,
  draw: drawRect,
});
