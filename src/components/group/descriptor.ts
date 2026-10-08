import { z } from "zod";
import type { Element } from "../../model/model.ts";
import { ElementSchema } from "../../model/schema.ts";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import { anim, BOX_ANIMS, box, custom, num, widget } from "../fields/index.ts";
import { drawGroup } from "./draw.ts";

const { x, y, w, h } = box(100, 100, {
  section: "Grupo",
  min: 10,
  max: 4000,
});

/**
 * Elements moved, resized, duplicated and animated as one. Children live in their own
 * coordinate space, `cw` × `ch`, which is stretched onto the group's box `x, y, w, h`.
 */
const fields = {
  x,
  y,
  info: widget("group-info", { section: "Grupo" }),
  w,
  h,
  ungroup: widget("ungroup", { section: "Grupo" }),
  cw: num(100, { label: "Ancho interior", inspector: false }),
  ch: num(100, { label: "Alto interior", inspector: false }),
  children: custom(
    "children",
    [] as unknown[],
    z.array(z.lazy(() => ElementSchema)),
    { label: "Elementos", inspector: false },
  ),
  anim: anim(BOX_ANIMS),
};

export type GroupEl = Omit<ElementOf<"group", typeof fields>, "children"> & {
  children: Element[];
};

export const group = defineComponent<GroupEl>({
  kind: "group",
  label: "Grupo",
  fields,
  sections: [{ title: "Grupo" }, { title: "Animación" }],
  anims: BOX_ANIMS,
  // a group is made from a selection (Ctrl+G), not dragged from the library
  basic: false,
  draw: drawGroup,
});
