import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  custom,
  elementOpacity,
  text,
} from "../fields/index.ts";
import { drawUse } from "./draw.ts";

const { x, y, w, h } = box(100, 100, {
  section: "Símbolo",
  min: 10,
  max: 4000,
});

const overridesSchema = z
  .record(z.string(), z.record(z.string(), z.unknown()))
  .default({});

const fields = {
  x,
  y,
  w,
  h,
  symbol: text("", { label: "Símbolo", section: "Símbolo" }),
  opacity: elementOpacity("Símbolo"),
  overrides: custom<Record<string, Record<string, unknown>>>(
    "overrides",
    {},
    overridesSchema,
    {
      label: "Sobrescrituras",
      inspector: false,
    },
  ),
  anim: anim(BOX_ANIMS),
};

export const use = defineComponent({
  kind: "use",
  label: "Símbolo",
  icon: "Boxes",
  fields,
  draw: drawUse,
  anims: BOX_ANIMS,
  sections: [{ title: "Símbolo" }, { title: "Animación" }],
  basic: false,
});

export type UseEl = ElementOf<"use", typeof fields>;
