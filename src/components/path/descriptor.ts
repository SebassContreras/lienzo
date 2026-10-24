import { z } from "zod";
import {
  EASING_NAMES,
  type Easing,
  EasingSchema,
} from "../../engine/easing.ts";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  type AnimOffer,
  anim,
  BOX_ANIMS,
  border,
  box,
  custom,
  defaulted,
  elementOpacity,
  fill,
  glow,
  LOOP_KINDS,
  noGlow,
  num,
  type Parent,
  select,
  shadow,
  softShadow,
} from "../fields/index.ts";
import { drawPath } from "./draw.ts";

/**
 * One shape of the list: an SVG `d` string and, optionally, its own colours, opacity and
 * stroke width; without them it takes the element's (024/R7).
 */
export type PathShape = {
  d: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
  width?: number;
};

/** The region of path coordinates drawn into the element's box. */
export type ViewBox = { x: number; y: number; w: number; h: number };

const ShapeSchema: z.ZodType<PathShape> = z.object({
  d: z.string(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  width: z.number().min(0).optional(),
});

const ViewSchema: z.ZodType<ViewBox> = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

/** An arrow, in a 100 × 100 view box. */
const ARROW = "M10 40 H60 V20 L90 50 L60 80 V60 H10 Z";

/** A box's animations plus drawing the stroke on. */
const PATH_ANIMS: AnimOffer = {
  motions: [...BOX_ANIMS.motions, "draw"],
  loops: LOOP_KINDS,
};

export type PathMode = "morph" | "layers";

/** The morph controls only matter with several shapes blending into each other. */
const morphs = (p: Parent) =>
  (p.shapes as unknown[]).length > 1 && p.mode !== "layers";

const MORPH_EASINGS = EASING_NAMES.map((n) => [n, n] as const);

/** Any SVG path, drawn with fill and stroke into its box; it can draw itself on and morph. */
const fields = {
  ...box(200, 200, { section: "Forma", min: 10, max: 1600 }),
  opacity: elementOpacity("Forma"),
  /** Two or more shapes morph through `morph`; one is just drawn (024/D1). */
  shapes: custom(
    "path-shapes",
    [{ d: ARROW }] as PathShape[],
    z.array(ShapeSchema).min(1),
    { label: "Formas", section: "Trazado" },
  ),
  /** Set from the pasted shapes' bounds or the imported file's `viewBox`. */
  view: custom(
    "path-view",
    { x: 0, y: 0, w: 100, h: 100 } as ViewBox,
    ViewSchema,
    { label: "Vista", inspector: false },
  ),
  /** "morph" blends the shapes through `morph`; "layers" draws them all stacked (057/D1). */
  mode: defaulted(
    select<PathMode>(
      [
        ["morph", "Transformar"],
        ["layers", "Capas"],
      ],
      "morph",
      {
        label: "Modo",
        section: "Trazado",
        visible: (p: Parent) => (p.shapes as unknown[]).length > 1,
      },
    ),
  ),
  /** 0 = first shape, 1 = second…; animated by keyframes. */
  morph: num(0, {
    label: "Transformación",
    section: "Trazado",
    max: (p: Parent) => Math.max(1, (p.shapes as unknown[]).length - 1),
    step: 0.01,
    bounds: [0, Infinity],
    visible: morphs,
  }),
  morphEasing: select<Easing>(MORPH_EASINGS, "ease-in-out", {
    label: "Curva de la transformación",
    section: "Trazado",
    schema: EasingSchema,
    visible: morphs,
  }),
  /** How much of the stroke is drawn, 0–1 (024/D2). */
  progress: num(1, {
    label: "Trazo dibujado",
    section: "Trazado",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
  }),
  fill: fill(
    {
      color: "#3b82f6",
      gradient: false,
      color2: "#22d3ee",
      angle: 90,
      opacity: 0.9,
    },
    "Relleno",
  ),
  border: border(
    { width: 3, color: "#93c5fd", opacity: 1, style: "solid", flow: 0 },
    "Trazo",
  ),
  borderGlow: glow(noGlow("#60a5fa"), "Brillo del trazo"),
  shadow: shadow(softShadow(false)),
  anim: anim(PATH_ANIMS),
};

export type PathEl = ElementOf<"path", typeof fields>;

export const path = defineComponent<PathEl>({
  kind: "path",
  label: "Trazado libre",
  icon: "Spline",
  fields,
  sections: [
    { title: "Trazado" },
    { title: "Forma" },
    { title: "Relleno" },
    { title: "Trazo" },
    { title: "Brillo del trazo" },
    { title: "Sombra", open: false },
    { title: "Animación" },
  ],
  anims: PATH_ANIMS,
  draw: drawPath,
});
