import { defineComponent, type ElementOf } from "../descriptor.ts";
import { BOX_ANIMS, defaulted, num, select } from "../fields/index.ts";
import { SHAPE_SECTIONS, shapeFields } from "../rect/descriptor.ts";
import { drawPolygon } from "./draw.ts";

/**
 * A regular polygon inscribed in its box, a corner up, or stretched to fill the box
 * (`fit: "box"`, 059/D1); styled like a rectangle.
 */
const fields = {
  ...shapeFields(220, 220),
  sides: num(6, {
    label: "Lados",
    section: "Forma",
    min: 3,
    max: 12,
    int: true,
    bounds: [3, 12],
  }),
  /** Scenes from before 059 lack it: parsed as `circle`, so they draw as they did. */
  fit: defaulted(
    select(
      [
        ["circle", "Círculo"],
        ["box", "Caja"],
      ] as const,
      "circle",
      { label: "Ajuste", section: "Forma" },
    ),
  ),
};

export type PolygonEl = ElementOf<"polygon", typeof fields>;

export const polygon = defineComponent<PolygonEl>({
  kind: "polygon",
  label: "Polígono",
  icon: "Hexagon",
  fields,
  sections: SHAPE_SECTIONS,
  anims: BOX_ANIMS,
  draw: drawPolygon,
});
