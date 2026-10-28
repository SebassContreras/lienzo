/**
 * Animation presets (019/D6): an element's `anim` slots and keyframe tracks saved under a
 * name, stored as JSON in `presets/animations/`. Times are relative to the preset's start
 * and `relative` fields hold offsets from the element, so one preset fits any element.
 */
import { z } from "zod";
import { ALL_ANIMS, anim } from "../components/fields/index.ts";
import type { Anim } from "./model.ts";
import { type Parsed, parseWith } from "./schema.ts";
import { type Tracks, TracksSchema, trackKeys } from "./track.ts";

/** Only the slots a preset sets; applying replaces those and keeps the element's others. */
export type AnimSlots = Partial<Pick<Anim, "in" | "loop" | "out">>;

export type AnimPreset = {
  name: string;
  /** Library section it is listed under. */
  category?: string;
  anim?: AnimSlots;
  tracks?: Tracks;
};

/** Every kind is accepted, as in scenes: what an element cannot play is skipped on apply. */
const slots = anim(ALL_ANIMS).fields;

/** A slot given in part takes the field defaults for the rest (069/D6). */
const slot = (f: (typeof slots)["in" | "loop" | "out"]) =>
  z
    .preprocess(
      (v) =>
        v && typeof v === "object" && !Array.isArray(v)
          ? { ...structuredClone(f.default), ...v }
          : v,
      f.schema,
    )
    .optional();

const AnimSlotsSchema = z.object({
  in: slot(slots.in),
  loop: slot(slots.loop),
  out: slot(slots.out),
}) as unknown as z.ZodType<AnimSlots>;

/** Strict on its keys, as a preset recipe (074/D14): a misplaced key fails (080/D8). */
const AnimPresetSchema: z.ZodType<AnimPreset> = z
  .object({
    name: z.string().min(1),
    category: z.string().optional(),
    anim: AnimSlotsSchema.optional(),
    tracks: TracksSchema.optional(),
  })
  .strict()
  .superRefine((preset, ctx) => {
    if (!preset.anim && !preset.tracks)
      ctx.addIssue({
        code: "custom",
        message: "Una animación necesita `anim` o `tracks`",
        path: [],
      });
    for (const [path, track] of Object.entries(preset.tracks ?? {})) {
      const times = trackKeys(track).map((k) => k.t);
      const repeated = times.find((t, i) => times.indexOf(t) < i);
      if (repeated !== undefined)
        ctx.addIssue({
          code: "custom",
          message: `La pista «${path}» tiene dos keyframes en t=${repeated}`,
          path: ["tracks", path],
        });
    }
  });

export const parseAnimPreset = (data: unknown): Parsed<AnimPreset> =>
  parseWith(AnimPresetSchema, data);
