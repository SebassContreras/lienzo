import { z } from "zod";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";
import { saveAudioAsset } from "../tts/asset-store.ts";
import {
  resolveDefaultTtsModel,
  resolveDefaultTtsVoice,
  resolveOpenRouterApiKey,
  resolveOpenRouterBaseUrl,
} from "../tts/config.ts";
import { createTtsService } from "../tts/factory.ts";
import { OpenRouterTtsAdapter } from "../tts/openrouter-adapter.ts";
import { attachSpeechToScene } from "../tts/scene-audio.ts";
import { alignScriptToCues } from "../tts/speech-alignment.ts";
import type { TtsService } from "../tts/types.ts";

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
    description:
      "Generate synthetic voiceover narration from a text script using OpenRouter or local/Kokoro TTS " +
      "and attach the resulting audio and synchronized subtitle cues to a scene.",
    input: z.object({
      scene: z.string().min(1),
      project: z.string().optional(),
      script: z.string().min(1),
      provider: z.enum(["openrouter", "local", "kokoro", "custom"]).optional(),
      voice: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      speed: z.number().min(0.25).max(4.0).default(1.0),
      apiKey: z.string().optional(),
      volume: z.number().min(0).max(1).default(1.0),
      startOffset: z.number().min(0).default(0),
      adjustSceneDuration: z.boolean().default(true),
      subtitles: z.boolean().default(true),
    }),
    output: SceneResult.extend({
      assetId: z.string(),
      audioDuration: z.number(),
      cuesCount: z.number(),
    }),
    async run(input, ctx) {
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
      let speechResult: import("../tts/types.ts").SynthesizeSpeechResult;
      try {
        speechResult = await service.synthesizeSpeech({
          text: input.script,
          voice,
          model,
          speed: input.speed,
          format: "mp3",
          apiKey,
          baseUrl,
        });
      } catch (err) {
        return fail(
          "tts_generation_failed",
          err instanceof Error ? err.message : String(err),
          "script",
        );
      }

      // 3. Estimate or calculate duration
      // An MP3 audio buffer average ~16-24 KB per second (128kbps = 16,000 bytes/sec)
      // When durationSeconds is not directly returned by the service, estimate duration from byte size or speech length
      const estimatedDuration =
        speechResult.durationSeconds && speechResult.durationSeconds > 0
          ? speechResult.durationSeconds
          : Math.max(
              1,
              Math.round((speechResult.audioBuffer.length / 16000) * 10) / 10,
            );

      // 4. Resolve project scope (defaults to mi-proyecto)
      const { resolveProjectScope } = await import("../project-scope.ts");
      const { slug: projectSlug, effectiveCtx } = await resolveProjectScope(
        ctx,
        input.project,
      );

      // 5. Save audio buffer into projects/<projectSlug>/assets/
      let assetId: string;
      try {
        assetId = await saveAudioAsset(
          ctx.root,
          speechResult.audioBuffer,
          speechResult.format,
          projectSlug,
        );
      } catch (err) {
        return fail(
          "asset_save_failed",
          `No se pudo guardar el archivo de audio: ${err instanceof Error ? err.message : String(err)}`,
          "scene",
        );
      }

      // 6. Generate subtitle cues if requested
      const cues = input.subtitles
        ? alignScriptToCues(input.script, {
            totalDuration: estimatedDuration,
            startOffset: input.startOffset,
          })
        : undefined;

      // 7. Attach audio and subtitles to scene within effective project context
      const editResult = await editScene(effectiveCtx, input.scene, (scene) =>
        attachSpeechToScene(scene, {
          assetId,
          audioDuration: estimatedDuration,
          volume: input.volume,
          startOffset: input.startOffset,
          adjustSceneDuration: input.adjustSceneDuration,
          cues,
        }),
      );

      return {
        ...editResult,
        assetId,
        audioDuration: estimatedDuration,
        cuesCount: cues ? cues.length : 0,
      };
    },
  });
}

export const sceneGenerateSpeech = createSceneGenerateSpeechTool();
