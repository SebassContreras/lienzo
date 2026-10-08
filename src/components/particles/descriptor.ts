import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  type AnimKind,
  anim,
  box,
  color,
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
const opacity = (value: number) =>
  num(value, { label: "Opacidad", max: 1, step: 0.05 });

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
  dot: obj(
    {
      size: num(2.5, { label: "Tamaño", max: 20, step: 0.5 }),
      color: color("#93c5fd", { label: "Color" }),
      opacity: opacity(0.9),
    },
    { section: "Puntos" },
  ),
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

export type ParticlesEl = ElementOf<"particles", typeof fields>;

export const particles = defineComponent<ParticlesEl>({
  kind: "particles",
  label: "Partículas",
  fields,
  sections: [
    { title: "Partículas" },
    { title: "Puntos" },
    { title: "Líneas" },
    { title: "Brillo" },
    { title: "Animación" },
  ],
  anims: PARTICLE_ANIMS,
  draw: drawParticles,
});
