import { z } from "zod";
import { ElementSchema } from "../../model/element-schema.ts";
import type { Element } from "../../model/model.ts";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  type AnimOffer,
  anim,
  box,
  color,
  custom,
  defaulted,
  elementOpacity,
  fraction,
  glow,
  noGlow,
  num,
  obj,
  type Parent,
  select,
  widget,
} from "../fields/index.ts";
import { drawParticles } from "./draw.ts";

const PARTICLE_ANIMS: AnimOffer = {
  motions: ["none", "fade", "pop"],
  loops: ["none", "breathe"],
};

const P = { section: "Partículas" };

export type ParticleMotion = "drift" | "fall" | "static";

const moves = (p: Parent) => p.motion !== "static";
const falls = (p: Parent) => p.motion === "fall";

/** The dot's controls only matter while no template replaces it. */
const dotShown = (p: Parent) => p.template == null;

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
  fraction(value, { label, step: 0.05 });

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
  return defaulted(V);
}

const variationField = variation();
export const variationSchema = variationField.schema;

/**
 * Points drifting inside the box, joined by lines when close ("constellation"). Paints no
 * background of its own. Motion is a closed loop derived from `seed` (see particle-field).
 */
const fields = {
  ...box(600, 400),
  opacity: elementOpacity("Partículas"),
  count: num(60, {
    label: "Cantidad",
    min: 1,
    max: 300,
    int: true,
    bounds: [1, 300],
    ...P,
  }),
  /**
   * "drift" wanders around a resting place, "fall" travels along `direction` across the box
   * and "static" stays at the resting place (057/D3).
   */
  motion: defaulted(
    select<ParticleMotion>(
      [
        ["drift", "Flotar"],
        ["fall", "Caer"],
        ["static", "Quietas"],
      ],
      "drift",
      { label: "Movimiento", ...P },
    ),
  ),
  /**
   * In "drift", the highest number of laps a point makes per loop (below 1 it also wanders
   * less). In "fall", the mean whole crossings of the field per loop, at least 1 (A6).
   * 0 keeps the points still.
   */
  speed: num(1, {
    label: "Velocidad",
    min: 0,
    max: 6,
    step: 0.1,
    bounds: [0, Infinity],
    visible: moves,
    ...P,
  }),
  /** Degrees the points fall towards: 0 = right, 90 = down, 180 = left, 270 = up. */
  direction: defaulted(
    num(90, {
      label: "Dirección",
      max: 360,
      bounds: [0, 360],
      visible: falls,
      ...P,
    }),
  ),
  /** 0 falls at an even pace; higher values start each crossing slower and speed it up. */
  gravity: defaulted(
    num(0, {
      label: "Gravedad",
      max: 4,
      step: 0.1,
      bounds: [0, Infinity],
      visible: falls,
      ...P,
    }),
  ),
  /** How deep each point's opacity pulses over the loop, 0 (off) to 1. */
  twinkle: defaulted(
    num(0, {
      label: "Parpadeo",
      max: 1,
      step: 0.05,
      bounds: [0, 1],
      ...P,
    }),
  ),
  /** How far, px, a point wanders from its resting place. */
  drift: num(40, {
    label: "Recorrido",
    max: 300,
    bounds: [0, Infinity],
    visible: (p: Parent) => (p.motion ?? "drift") === "drift",
    ...P,
  }),
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
    { section: "Puntos", visible: dotShown },
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
  glow: { ...glow(noGlow("#60a5fa"), "Brillo"), visible: dotShown },
  particle: widget("particle-template", { section: "Partícula" }),
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
    { title: "Partícula" },
    { title: "Puntos" },
    { title: "Variación" },
    { title: "Líneas" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: PARTICLE_ANIMS,
  draw: drawParticles,
});
