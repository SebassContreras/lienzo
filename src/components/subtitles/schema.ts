import { z } from "zod";
import type { SubtitleCue } from "../../engine/subtitles/types.ts";

export const subtitleWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const subtitleCueSchema = z.object({
  id: z.string().optional(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  words: z.array(subtitleWordSchema).optional(),
});

export const subtitleCuesSchema: z.ZodType<SubtitleCue[]> =
  z.array(subtitleCueSchema);
