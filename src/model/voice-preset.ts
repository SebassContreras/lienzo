import { z } from "zod";
import { type Parsed, parseWith } from "./schema.ts";

/**
 * Reusable voiceover configuration (037/D3, R4).
 * Holds TTS provider, model, voice ID, speech settings, and optional script sample.
 * Saved as a recipe under category "Voces" without embedding binary audio.
 */
export interface VoicePreset {
  name: string;
  category: "Voces" | string;
  provider: "openrouter" | "local" | "kokoro" | "custom" | string;
  model: string;
  voice: string;
  speed?: number;
  isCustomModel?: boolean;
  isCustomVoice?: boolean;
  sampleScript?: string;
  generateSubtitles?: boolean;
  adjustDuration?: boolean;
}

const VoicePresetSchema: z.ZodType<VoicePreset> = z.object({
  name: z.string().min(1),
  category: z.string().default("Voces"),
  provider: z.string().default("openrouter"),
  model: z.string().min(1),
  voice: z.string().min(1),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0),
  isCustomModel: z.boolean().optional(),
  isCustomVoice: z.boolean().optional(),
  sampleScript: z.string().optional(),
  generateSubtitles: z.boolean().optional(),
  adjustDuration: z.boolean().optional(),
});

export const parseVoicePreset = (data: unknown): Parsed<VoicePreset> =>
  parseWith(VoicePresetSchema, data);
