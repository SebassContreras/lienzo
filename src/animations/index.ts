/**
 * The animation registry (018/D6): every kind a slot can play, one file per family. Entry and
 * exit slots play `MOTIONS`; the loop slot plays `LOOPS`.
 */
import { ATTENTION } from "./attention.ts";
import { EMPHASIS } from "./emphasis.ts";
import type { KindDef } from "./kind.ts";
import { ENTRANCES } from "./motion.ts";
import { TEXT } from "./text.ts";

export * from "./kind.ts";

export type MotionId = keyof typeof ENTRANCES | keyof typeof TEXT;
export type TextMotionId = keyof typeof TEXT;
export type LoopId = keyof typeof ATTENTION | keyof typeof EMPHASIS;

export const MOTIONS: Record<MotionId, KindDef> = { ...ENTRANCES, ...TEXT };
export const TEXT_MOTION_IDS = Object.keys(TEXT) as TextMotionId[];
export const LOOPS: Record<LoopId, KindDef> = { ...ATTENTION, ...EMPHASIS };

export const MOTION_IDS = Object.keys(MOTIONS) as MotionId[];
export const LOOP_IDS = Object.keys(LOOPS) as LoopId[];
