import type { FlowKind } from "../model/model.ts";
import { defineTrait } from "./trait.ts";

/** Something travelling along a line: light pulses, marching ants or a comet. */
export const flow = defineTrait({
  id: "flow",
  label: "Flujo animado",
  params: {
    kind: "pulse",
    color: "#93c5fd",
    speed: 2,
    count: 2,
    size: 5,
    reverse: false,
  },
  apply: {
    line: (el, p) => {
      el.flow = { ...p, kind: p.kind as FlowKind };
    },
  },
});
