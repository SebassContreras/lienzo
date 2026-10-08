import { num } from "./field.ts";

/** Where an element sits; moved by dragging it on the stage. */
export function position() {
  return {
    x: num(0, { label: "X", inspector: false }),
    y: num(0, { label: "Y", inspector: false }),
  };
}

type BoxOpts = {
  section: string;
  min: number;
  max: number;
};

/**
 * Position and size. With `o`, width and height are edited in section `o.section`;
 * without it they are only resized on the stage.
 */
export function box(w: number, h: number, o?: BoxOpts) {
  const size = o
    ? { section: o.section, min: o.min, max: o.max }
    : { inspector: false as const };
  return {
    ...position(),
    w: num(w, { label: "Ancho", ...size }),
    h: num(h, { label: "Alto", ...size }),
  };
}
