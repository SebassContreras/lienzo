import { z } from "zod";
import { ElementSchema } from "../../model/element-schema.ts";
import type { Element } from "../../model/model.ts";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  type AnimKind,
  anim,
  box,
  color,
  custom,
  glow,
  noGlow,
  num,
  obj,
  widget,
} from "../fields/index.ts";
import { drawParticles } from "./draw.ts";

const PARTICLE_ANIMS: readonly AnimKind[] = [
  "none",
  "fade-in",
  "pop-in",
  "breathe",
];

const P = { section: "Partículas" };

/** True when `el` is, or holds, a particles element (a template may not nest one). */
function holdsParticles(el: { kind: string; children?: unknown }): boolean {
  if (el.kind === "particles") return true;
  return (
    Array.isArray(el.children) &&
    el.children.some((c) => holdsParticles(c as { kind: string }))
  );
}

/**
 * Any element but particles, or `null` for the default dot. Missing in scenes saved before
 * templates, so it defaults to `null`. Annotated so the element types do not depend on
 * themselves through the schema.
 */
export const templateSchema = z
  .lazy(() => ElementSchema)
  .refine((el) => !holdsParticles(el), "a particle cannot hold particles")
  .nullable()
  .default(null) as unknown as z.ZodType<unknown>;

const opacity = (value: number, label = "Opacidad") =>
  num(value, { label, max: 1, step: 0.05 });

/**
 * How points differ from each other, drawn from the seed. The defaults leave every point
 * alike, as particles were before 014; scenes saved then have no `variation` and read them.
 */
function variation() {
  const V = obj(
    {
      sizeMin: num(1, {
        label: "Tamaño mínimo",
        max: 4,
        step: 0.05,
        bounds: [0, Infinity],
      }),
      sizeMax: num(1, {
        label: "Tamaño máximo",
        max: 4,
        step: 0.05,
        bounds: [0, Infinity],
      }),
      /** Each point starts turned up to this many degrees either way. */
      rotation: num(0, { label: "Rotación", max: 180, bounds: [0, 180] }),
      /** Most whole turns per loop a point makes, either way (A6). */
      spin: num(0, {
        label: "Giros por ciclo",
        max: 6,
        int: true,
        bounds: [0, Infinity],
      }),
      opacityMin: opacity(1, "Opacidad mínima"),
      opacityMax: opacity(1, "Opacidad máxima"),
      /** Hues are turned up to this many degrees either way, in a few fixed steps. */
      hueShift: num(0, {
        label: "Variación de color",
        max: 180,
        bounds: [0, 180],
      }),
    },
    { section: "Variación" },
  );
  return { ...V, schema: V.schema.default(V.default) as typeof V.schema };
}

const variationField = variation();
export const variationSchema = variationField.schema;

/**
 * Points drifting inside the box, joined by lines when close ("constellation"). Paints no
 * background of its own. Motion is a closed loop derived from `seed` (see particle-field).
 */
const fields = {
  ...box(600, 400),
  count: num(60, {
    label: "Cantidad",
    min: 1,
    max: 300,
    int: true,
    bounds: [1, 300],
    ...P,
  }),
  /** Highest number of laps a point makes per loop. */
  speed: num(1, {
    label: "Velocidad",
    min: 1,
    max: 6,
    int: true,
    bounds: [1, Infinity],
    ...P,
  }),
  /** How far, px, a point wanders from its resting place. */
  drift: num(40, { label: "Recorrido", max: 300, bounds: [0, Infinity], ...P }),
  /** Changing it redistributes the points. */
  seed: num(1, {
    label: "Semilla",
    min: 1,
    max: 9999,
    set: (el: { seed: number }, v: number) => {
      el.seed = Math.round(v);
    },
    ...P,
  }),
  reseed: widget("reseed", P),
  fitCanvas: widget("fit-canvas", P),
  /**
   * What each point draws instead of the dot: a copy, drawn still and centred on the point.
   * Its ids are its own and never join the scene's index.
   */
  template: custom("particle-template", null as unknown, templateSchema, {
    label: "Partícula",
    inspector: false,
  }),
  dot: obj(
    {
      size: num(2.5, { label: "Tamaño", max: 20, step: 0.5 }),
      color: color("#93c5fd", { label: "Color" }),
      opacity: opacity(0.9),
    },
    { section: "Puntos" },
  ),
  variation: variationField,
  link: obj(
    {
      distance: num(120, { label: "Distancia de unión", max: 400 }),
      width: num(1, { label: "Grosor", max: 6, step: 0.25 }),
      color: color("#60a5fa", { label: "Color" }),
      opacity: opacity(0.5),
    },
    { section: "Líneas" },
  ),
  glow: glow(noGlow("#60a5fa"), "Brillo"),
  anim: anim(PARTICLE_ANIMS),
};

export type ParticlesEl = Omit<
  ElementOf<"particles", typeof fields>,
  "template"
> & { template: Element | null };

export const particles = defineComponent<ParticlesEl>({
  kind: "particles",
  label: "Partículas",
  icon: "Sparkles",
  fields,
  sections: [
    { title: "Partículas" },
    { title: "Puntos" },
    { title: "Variación" },
    { title: "Líneas" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: PARTICLE_ANIMS,
  draw: drawParticles,
});
