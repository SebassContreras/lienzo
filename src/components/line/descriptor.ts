import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  type AnimKind,
  anim,
  check,
  color,
  custom,
  glow,
  noGlow,
  num,
  obj,
  type Parent,
  select,
  strokeStyle,
  strokeWidth,
} from "../fields/index.ts";
import { drawLine } from "./draw.ts";

/** A line end: a free point, or attached to the element `attach`. */
export type Endpoint = { x: number; y: number; attach?: string };

export type FlowKind = "none" | "ants" | "pulse" | "comet";

const FLOWS = [
  ["none", "Ninguno"],
  ["pulse", "Pulsos de luz"],
  ["ants", "Camino de hormigas"],
  ["comet", "Cometa"],
] as const satisfies readonly (readonly [FlowKind, string])[];

const endpointSchema: z.ZodType<Endpoint> = z.object({
  x: z.number(),
  y: z.number(),
  attach: z.string().optional(),
});

/** Ends are dragged on the stage; the inspector shows what each is attached to. */
const end = (x: number, label: string) =>
  custom("connection", { x, y: 0 } as Endpoint, endpointSchema, {
    label,
    section: "Conexión",
  });

const LINE_ANIMS: readonly AnimKind[] = ["none", "fade-in", "draw"];

const C = { section: "Conexión" };
const S = { section: "Trazo" };
const flowing = (p: Parent) => p.kind !== "none";

/** A straight or curved connector between two points or elements. */
const fields = {
  a: end(0, "Inicio"),
  b: end(260, "Fin"),
  /** Perpendicular offset of the curve's control point, px. */
  bend: num(0, { label: "Curva", min: -400, max: 400, ...C }),
  width: { ...strokeWidth(3, 0.5, 30), ...S },
  color: color("#3b82f6", { label: "Color", ...S }),
  opacity: num(0.6, { label: "Opacidad", max: 1, step: 0.01, ...S }),
  style: { ...strokeStyle("solid"), ...S },
  arrowStart: check(false, { label: "Flecha inicio", ...C }),
  arrowEnd: check(true, { label: "Flecha fin", ...C }),
  glow: glow({ ...noGlow("#3b82f6"), enabled: true, blur: 12 }, "Brillo"),
  flow: obj(
    {
      kind: select(FLOWS, "pulse", { label: "Efecto" }),
      color: color("#93c5fd", { label: "Color", visible: flowing }),
      /** Laps (pulse/comet) or dash periods (ants) per loop. */
      speed: num(2, { label: "Velocidad", min: 1, max: 30, visible: flowing }),
      count: num(2, {
        label: "Cantidad",
        min: 1,
        max: 10,
        visible: (p: Parent) => flowing(p) && p.kind !== "ants",
      }),
      size: num(5, {
        label: "Tamaño",
        min: 1,
        max: 30,
        step: 0.5,
        visible: flowing,
      }),
      reverse: check(false, { label: "Invertir sentido", visible: flowing }),
    },
    { section: "Flujo animado" },
  ),
  anim: anim(LINE_ANIMS),
};

export type LineEl = ElementOf<"line", typeof fields>;

export const line = defineComponent<LineEl>({
  kind: "line",
  label: "Línea",
  fields,
  sections: [
    { title: "Conexión" },
    { title: "Trazo" },
    { title: "Brillo" },
    { title: "Flujo animado" },
    { title: "Animación" },
  ],
  anims: LINE_ANIMS,
  draw: drawLine,
});
