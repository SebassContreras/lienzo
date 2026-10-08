import { defineComponent, type ElementOf } from "../descriptor.ts";
import { BOX_ANIMS } from "../fields/index.ts";
import { SHAPE_SECTIONS, shapeFields } from "../rect/descriptor.ts";
import { drawEllipse } from "./draw.ts";

/** An ellipse inside its box (a circle when `w` equals `h`); styled like a rectangle. */
const fields = shapeFields(200, 200);

export type EllipseEl = ElementOf<"ellipse", typeof fields>;

export const ellipse = defineComponent<EllipseEl>({
  kind: "ellipse",
  label: "Elipse",
  icon: "Circle",
  fields,
  sections: SHAPE_SECTIONS,
  anims: BOX_ANIMS,
  draw: drawEllipse,
});
