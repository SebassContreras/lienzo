/**
 * Keyframe tracks (015/D5): per element, a list of keyframes for each animated path. A path
 * is an animatable field path from the element's descriptor ("x", "fill.color") or a
 * transform channel, which has no field.
 */
import { z } from "zod";
import { type Easing, EasingSchema } from "../engine/easing.ts";

/** A value at a moment; `easing` shapes the segment from this keyframe to the next one. */
export type Keyframe = { t: number; value: number | string; easing: Easing };

export type Tracks = Record<string, Keyframe[]>;

/** Transform channels and the value each has when nothing animates it. */
export const CHANNELS = { "@rotate": 0, "@scale": 1 } as const;

export type Channel = keyof typeof CHANNELS;

export const isChannel = (path: string): path is Channel => path in CHANNELS;

const KeyframeSchema: z.ZodType<Keyframe> = z.object({
  t: z.number().min(0),
  value: z.union([z.number(), z.string()]),
  easing: EasingSchema,
});

/** Optional on every element: scenes written before 015 have none. */
export const TracksSchema = z.record(z.string(), z.array(KeyframeSchema));
