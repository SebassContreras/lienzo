import { defaulted, num } from "./field.ts";

/** Where an element sits; moved by dragging it on the stage. */
export function position() {
  return {
    x: num(0, { label: "X", inspector: false, relative: true }),
    y: num(0, { label: "Y", inspector: false, relative: true }),
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
    w: num(w, { label: "Ancho", ...size, bounds: [0, Infinity] }),
    h: num(h, { label: "Alto", ...size, bounds: [0, Infinity] }),
  };
}

/**
 * Common animatable opacity field (0 to 1, default `value`) with `.default(value)` on its schema
 * so historical scenes and presets lacking top-level opacity parse cleanly.
 */
export function elementOpacity(section: string, value = 1) {
  return defaulted(
    num(value, {
      label: "Opacidad",
      section,
      max: 1,
      step: 0.01,
      bounds: [0, 1],
    }),
  );
}
