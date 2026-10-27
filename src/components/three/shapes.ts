/** The shapes a 3D element offers, free of three.js so the descriptor stays light (066/D1). */

/** Largest side of a primitive, text or model, in scene units. */
export const SIZE = 2;

export const SHAPES = [
  ["cube", "Cubo"],
  ["sphere", "Esfera"],
  ["torus", "Toro"],
  ["cylinder", "Cilindro"],
  ["cone", "Cono"],
  ["plane", "Plano"],
  ["text", "Texto 3D"],
  ["model", "Modelo (.glb)"],
] as const;

type Shape = (typeof SHAPES)[number][0];

export type Primitive = Exclude<Shape, "text" | "model">;
