import type { StrokeStyle } from "../model/model.ts";
import { defineTrait } from "./trait.ts";

/** A rectangle's border; a dashed or dotted border with `flow` marches around the shape. */
export const border = defineTrait({
  id: "border",
  label: "Borde",
  params: {
    width: 2,
    color: "#3b82f6",
    opacity: 0.8,
    style: "solid",
    flow: 0,
  },
  apply: {
    shape: (el, p) => {
      el.border = { ...p, style: p.style as StrokeStyle };
    },
  },
});
