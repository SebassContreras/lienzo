import { join } from "node:path";
import { z } from "zod";
import { slugify } from "../../../presets/slug.ts";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { round2 } from "../../core/round.ts";
import { editScene, openScene, SceneResult } from "../../scenes/scenes.ts";
import { saveAudioAsset } from "../asset-store.ts";
import { audioDuration, detectAudioFormat } from "../audio-duration.ts";
import {
  resolveDefaultTtsModel,
  resolveDefaultTtsVoice,
  resolveOpenRouterApiKey,
} from "../config.ts";
import { createTtsService } from "../factory.ts";
import { attachSpeechToScene } from "../scene-audio.ts";
import { alignScriptToCues } from "../speech-alignment.ts";
import type { TtsService } from "../types.ts";
import { voicedSpan } from "../voiced-span.ts";
import { readWavSamples } from "../wav-samples.ts";

export interface SceneGenerateSpeechOptions {
  ttsService?: TtsService;
}

/**
 * Creates the `scene_generate_speech` tool with an optional injected TtsService (D5, R6, 032/D4).
 * Follows Principle 3 (Dependency Inversion / anti-corruption) and Principle 2 (Composition).
 */
export function createSceneGenerateSpeechTool(
  options: SceneGenerateSpeechOptions = {},
) {
  return defineTool({
    name: "scene_generate_speech",
    effects: ["scene", "asset"],
    description:
      "Generate synthetic voiceover narration from a text script using OpenRouter, local/Kokoro TTS, or custom endpoint " +
      "and attach the resulting audio and synchronized subtitle cues to a scene. `provider: \"custom\"` requires `baseUrl`. " +
      "By default it " +
      "replaces `scene.audio`; with `asTrack: true` it appends a new `audioTracks` entry at " +
      "`startOffset` (keeping `scene.audio` and other tracks) and appends its cues, so a " +
      "voice-over with one clip per shot is one call per clip. Cues fill the clip, from " +
      "`startOffset` to `startOffset` plus the audio's length, and keep unique ids when clips are " +
      "appended. The clip is saved in assets/voice/<scene>/ (the scene's stored name, e.g. " +
      "voice/caja-ambar/) named by its content hash; `assetId` is its `src`, with the project " +
      "prefix. `audioDuration` is measured " +
      "from the MP3/WAV frames. Returns `speechStart` and `speechEnd` for the detected voiced span. " +
      "With `trimSilence: true`, `trimOffset` is set to skip leading silence, and subtitle cues align to audible speech.",
    input: z.object({
      scene: z.string().min(1),
      project: PROJECT,
      script: z.string().min(1),
      provider: z.enum(["openrouter", "local", "kokoro", "custom"]).optional(),
      voice: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      speed: z.number().min(0.25).max(4.0).default(1.0),
      apiKey: z.string().optional(),
      volume: z.number().min(0).max(1).default(1.0),
      startOffset: z.number().min(0).default(0),
      trimSilence: z.boolean().optional(),
      adjustSceneDuration: z.boolean().default(true),
      subtitles: z.boolean().default(true),
      asTrack: z.boolean().optional(),
    }).superRefine((val, ctx) => {
      if (val.provider === "custom" && !val.baseUrl?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["baseUrl"],
          message: "Indica baseUrl para el proveedor «custom»",
        });
      }
    }),
    output: SceneResult.extend({
      assetId: z.string(),
      audioDuration: z.number(),
      speechStart: z.number().nullable(),
      speechEnd: z.number().nullable(),
      cuesCount: z.number(),
    }),
    async run(input, ctx) {
      // 0. The scene has to exist before anything is synthesized (081/D13)
      const effectiveCtx = await inProject(ctx, input.project);
      await openScene(effectiveCtx, input.scene);

      // 1. Resolve active TTS service instance (ctx -> options -> factory)
      const service =
        ctx.tts ??
        options.ttsService ??
        createTtsService({
          provider: input.provider,
          apiKey: input.apiKey,
          baseUrl: input.baseUrl,
        });

      // 2. Resolve model, voice, apiKey, baseUrl with environment fallbacks
      const isLocal =
        input.provider === "local" ||
        input.provider === "kokoro" ||
        input.provider === "custom";

      const model = input.model
        ? input.model
        : isLocal
          ? "kokoro"
          : resolveDefaultTtsModel(input.model);

      const voice = input.voice
        ? input.voice
        : isLocal
          ? "af_heart"
          : resolveDefaultTtsVoice(input.voice);

      const apiKey = input.apiKey
        ? input.apiKey
        : isLocal
          ? undefined
          : resolveOpenRouterApiKey(input.apiKey);

      const baseUrl = input.baseUrl;

      // 3. Synthesize speech using the resolved TTS service
      let speechResult: import("../types.ts").SynthesizeSpeechResult;
      try {
        speechResult = await service.synthesizeSpeech({
          text: input.script,
          voice,
          model,
          speed: input.speed,
          format: "wav",
          apiKey,
          baseUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // the path names the parameter at fault (081/D13)
        const path = /Clave de API/.test(message)
          ? "apiKey"
          : /No se pudo conectar/.test(message)
            ? "baseUrl"
            : "script";
        return fail(
          "tts_generation_failed",
          path === "baseUrl"
            ? `${message}. Arranca el servicio (p. ej. Kokoro en http://localhost:8880, ver el README) o pasa baseUrl`
            : message,
          path,
        );
      }

      // 3. Measure the audio itself; the provider's figure and a byte-rate estimate
      // (~16 KB/s at 128 kbps) are fallbacks for formats we can't parse (060/D2)
      // rounded to hundredths, as every computed number tools return (069/D14)
      const detectedFormat = detectAudioFormat(speechResult.audioBuffer);
      const estimatedDuration = round2(
        audioDuration(speechResult.audioBuffer, detectedFormat) ??
          (speechResult.durationSeconds && speechResult.durationSeconds > 0
            ? speechResult.durationSeconds
            : Math.max(
                1,
                Math.round((speechResult.audioBuffer.length / 16000) * 10) / 10,
              )),
      );

      // 4. Extract voiced span (speechStart / speechEnd) from PCM WAV samples if available (089/D1, D2)
      let speechStart: number | null = null;
      let speechEnd: number | null = null;
      const wav = readWavSamples(speechResult.audioBuffer);
      if (wav) {
        const span = voicedSpan(wav.samples, wav.sampleRate);
        if (span) {
          speechStart = span.start;
          speechEnd = span.end;
        }
      }

      // 5. Compute trimOffset if trimSilence is requested and speechStart is valid (089/R2, D3)
      const trimOffset =
        input.trimSilence && speechStart !== null
          ? Math.max(0, round2(speechStart - 0.05))
          : 0;

      // 6. Save the clip into assets/voice/<scene>/, the scene's stored name (086/D3)
      const folder = `voice/${slugify(input.scene)}`;
      let assetId: string;
      try {
        const file = await saveAudioAsset(
          join(ctx.projects.resolvePath(input.project, "assets"), folder),
          speechResult.audioBuffer,
          detectedFormat,
        );
        assetId = `/projects/${input.project}/assets/${folder}/${file}`;
      } catch (err) {
        return fail(
          "asset_save_failed",
          `No se pudo guardar el archivo de audio: ${err instanceof Error ? err.message : String(err)}`,
          "scene",
        );
      }

      // 7. Generate subtitle cues if requested (adjusted for trimOffset if trimSilence is true)
      const cuesDuration =
        trimOffset > 0
          ? Math.max(0.1, round2(estimatedDuration - trimOffset))
          : estimatedDuration;
      const cues = input.subtitles
        ? alignScriptToCues(input.script, {
            totalDuration: cuesDuration,
            startOffset: input.startOffset,
          })
        : undefined;

      // 8. Attach audio and subtitles to scene within effective project context
      const editResult = await editScene(effectiveCtx, input.scene, (scene) =>
        attachSpeechToScene(scene, {
          assetId,
          audioDuration: estimatedDuration,
          volume: input.volume,
          startOffset: input.startOffset,
          trimOffset,
          adjustSceneDuration: input.adjustSceneDuration,
          cues,
          asTrack: input.asTrack,
        }),
      );

      const notices = [...(editResult.notices ?? [])];
      if (input.trimSilence && speechStart === null) {
        notices.push(
          "No se pudo recortar silencio inicial: el audio no contiene muestras de voz identificables.",
        );
      }

      return {
        ...editResult,
        notices,
        assetId,
        audioDuration: estimatedDuration,
        speechStart,
        speechEnd,
        cuesCount: cues ? cues.length : 0,
      };
    },
  });
}

export const sceneGenerateSpeech = createSceneGenerateSpeechTool();
