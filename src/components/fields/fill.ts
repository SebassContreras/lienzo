import { check, color, type Fields, num, obj, type Parent } from "./field.ts";

export type FillDefaults = {
  color: string;
  gradient: boolean;
  color2: string;
  angle: number;
  opacity: number;
};

const always = () => true;

/**
 * A solid or two-color gradient fill. `shown` hides every field while it fails (an icon's
 * tile when it is off).
 */
export function fillFields(
  d: FillDefaults,
  shown: (p: Parent) => boolean = always,
) {
  const gradient = (p: Parent) => shown(p) && p.gradient === true;
  return {
    color: color(d.color, { label: "Color", visible: shown }),
    gradient: check(d.gradient, { label: "Degradado", visible: shown }),
    color2: color(d.color2, { label: "Color 2", visible: gradient }),
    angle: num(d.angle, { label: "Ángulo", max: 360, visible: gradient }),
    opacity: num(d.opacity, {
      label: "Opacidad",
      max: 1,
      step: 0.01,
      visible: shown,
    }),
  } satisfies Fields;
}

export function fill(d: FillDefaults, section: string) {
  return obj(fillFields(d), { section });
}
