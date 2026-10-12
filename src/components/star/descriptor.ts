import { defineComponent, type ElementOf } from "../descriptor.ts";
import { BOX_ANIMS, num } from "../fields/index.ts";
import { SHAPE_SECTIONS, shapeFields } from "../rect/descriptor.ts";
import { drawStar } from "./draw.ts";

const F = { section: "Forma" };

/** A star inscribed in its box, a point up; styled like a rectangle. */
const fields = {
  ...shapeFields(220, 220),
  points: num(5, {
    label: "Puntas",
    min: 3,
    max: 12,
    int: true,
    bounds: [3, 12],
    ...F,
  }),
  /** The inner corners' distance from the centre, as a fraction of the outer one. */
  inner: num(0.45, {
    label: "Radio interior",
    min: 0.1,
    max: 0.95,
    step: 0.01,
    bounds: [0.05, 1],
    ...F,
  }),
};

export type StarEl = ElementOf<"star", typeof fields>;

export const star = defineComponent<StarEl>({
  kind: "star",
  label: "Estrella",
  icon: "Star",
  fields,
  sections: SHAPE_SECTIONS,
  anims: BOX_ANIMS,
  draw: drawStar,
});
