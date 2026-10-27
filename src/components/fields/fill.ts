import { z } from "zod";
import {
  check,
  color,
  custom,
  defaulted,
  type Fields,
  num,
  obj,
  type Parent,
  select,
} from "./field.ts";

/**
 * A gradient's own color stops (059/D4): at least two, each at a fraction 0–1 of the way,
 * applied in order so two stops at the same place give a hard edge.
 */
export const StopsSchema = z
  .array(z.object({ at: z.number().min(0).max(1), color: z.string() }))
  .min(2)
  .refine(
    (stops) => stops.every((s, i) => i === 0 || s.at >= stops[i - 1].at),
    {
      message: "Las paradas deben ir en orden de `at` (de 0 a 1)",
    },
  );

export type GradientStop = z.infer<typeof StopsSchema>[number];

export type FillDefaults = {
  color: string;
  gradient: boolean;
  color2: string;
  angle: number;
  opacity: number;
};

const always = () => true;

/**
 * A solid fill or a linear or radial gradient, from `color` to `color2` unless `stops` is set. `shown` hides every field while it fails (an icon's
 * tile when it is off).
 */
export function fillFields(
  d: FillDefaults,
  shown: (p: Parent) => boolean = always,
) {
  const gradient = (p: Parent) => shown(p) && p.gradient === true;
  const linear = (p: Parent) => gradient(p) && p.type !== "radial";
  return {
    color: color(d.color, { label: "Color", visible: shown }),
    gradient: check(d.gradient, { label: "Degradado", visible: shown }),
    /** Fills from before 059 lack it: parsed as `linear`, so they paint as they did. */
    type: defaulted(
      select(
        [
          ["linear", "Lineal"],
          ["radial", "Radial"],
        ] as const,
        "linear",
        { label: "Tipo", visible: gradient },
      ),
    ),
    color2: color(d.color2, { label: "Color 2", visible: gradient }),
    angle: num(d.angle, { label: "Ángulo", max: 360, visible: linear }),
    /** JSON only for now: the inspector edits `color` and `color2`. */
    stops: custom(
      "gradient-stops",
      undefined as GradientStop[] | undefined,
      StopsSchema.optional(),
      { label: "Paradas", inspector: false },
    ),
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
