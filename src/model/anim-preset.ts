/**
 * Animation presets (019/D6): an element's `anim` slots and keyframe tracks saved under a
 * name, stored as JSON in `presets/animations/`. Times are relative to the preset's start
 * and `relative` fields hold offsets from the element, so one preset fits any element.
 */
import { z } from "zod";
import { ALL_ANIMS, anim } from "../components/fields/index.ts";
import type { Anim } from "./model.ts";
import { type Parsed, parseWith } from "./schema.ts";
import { type Tracks, TracksSchema } from "./track.ts";

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

const AnimSlotsSchema = z.object({
  in: slots.in.schema.optional(),
  loop: slots.loop.schema.optional(),
  out: slots.out.schema.optional(),
}) as unknown as z.ZodType<AnimSlots>;

export const AnimPresetSchema: z.ZodType<AnimPreset> = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  anim: AnimSlotsSchema.optional(),
  tracks: TracksSchema.optional(),
});

export const parseAnimPreset = (data: unknown): Parsed<AnimPreset> =>
  parseWith(AnimPresetSchema, data);
