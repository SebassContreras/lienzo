import { defineComponent, type ElementOf } from "../descriptor.ts";
import { BOX_ANIMS, num, select } from "../fields/index.ts";
import { SHAPE_SECTIONS, shapeFields } from "../rect/descriptor.ts";
import { drawArrow } from "./draw.ts";

export type ArrowDir = "right" | "left" | "up" | "down";

const DIRS = [
  ["right", "Derecha"],
  ["left", "Izquierda"],
  ["up", "Arriba"],
  ["down", "Abajo"],
] as const satisfies readonly (readonly [ArrowDir, string])[];

const F = { section: "Forma" };

/** A block arrow filling its box, pointing one way; styled like a rectangle. */
const fields = {
  ...shapeFields(320, 160),
  direction: select(DIRS, "right", { label: "Dirección", ...F }),
  /** The head's length, as a fraction of the arrow's length. */
  head: num(0.4, {
    label: "Punta",
    min: 0.1,
    max: 0.9,
    step: 0.01,
    bounds: [0, 1],
    ...F,
  }),
  /** The shaft's thickness, as a fraction of the arrow's width. */
  shaft: num(0.45, {
    label: "Grosor del cuerpo",
    min: 0.1,
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...F,
  }),
};

export type ArrowEl = ElementOf<"arrow", typeof fields>;

export const arrow = defineComponent<ArrowEl>({
  kind: "arrow",
  label: "Flecha",
  icon: "ArrowBigRight",
  fields,
  sections: SHAPE_SECTIONS,
  anims: BOX_ANIMS,
  draw: drawArrow,
});
