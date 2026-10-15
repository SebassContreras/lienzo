import { z } from "zod";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";
import { saveAudioAsset } from "../tts/asset-store.ts";
import { OpenRouterTtsAdapter } from "../tts/openrouter-adapter.ts";
import { attachSpeechToScene } from "../tts/scene-audio.ts";
import { alignScriptToCues } from "../tts/speech-alignment.ts";
import type { TtsService } from "../tts/types.ts";

export interface SceneGenerateSpeechOptions {
  ttsService?: TtsService;
}

/**
 * Creates the `scene_generate_speech` tool with an optional injected TtsService (D5, R6).
 * Follows Principle 3 (Dependency Inversion / anti-corruption) and Principle 2 (Composition).
 */
export function createSceneGenerateSpeechTool(
  options: SceneGenerateSpeechOptions = {},
) {
  const ttsService = options.ttsService ?? new OpenRouterTtsAdapter();

  return defineTool({
    name: "scene_generate_speech",
    description:
      "Generate synthetic voiceover narration from a text script using OpenRouter TTS " +
      "and attach the resulting audio and synchronized subtitle cues to a scene.",
    input: z.object({
      scene: z.string().min(1),
      script: z.string().min(1),
      voice: z.string().default("alloy"),
      model: z.string().default("openai/tts-1"),
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
      // 1. Synthesize speech using the injected TTS service
      let speechResult;
      try {
        speechResult = await ttsService.synthesizeSpeech({
          text: input.script,
          voice: input.voice,
          model: input.model,
          speed: input.speed,
          format: "mp3",
          apiKey: input.apiKey,
        });
      } catch (err) {
        return fail(
          "tts_generation_failed",
          err instanceof Error ? err.message : String(err),
          "script",
        );
      }

      // 2. Estimate or calculate duration
      // An MP3 audio buffer average ~16-24 KB per second (128kbps = 16,000 bytes/sec)
      // When durationSeconds is not directly returned by the service, estimate duration from byte size or speech length
      const estimatedDuration =
        speechResult.durationSeconds && speechResult.durationSeconds > 0
          ? speechResult.durationSeconds
          : Math.max(
              1,
              Math.round((speechResult.audioBuffer.length / 16000) * 10) / 10,
            );

      // 3. Save audio buffer into assets/
      let assetId: string;
      try {
        assetId = await saveAudioAsset(
          ctx.root,
          speechResult.audioBuffer,
          speechResult.format,
        );
      } catch (err) {
        return fail(
          "asset_save_failed",
          `No se pudo guardar el archivo de audio: ${err instanceof Error ? err.message : String(err)}`,
          "scene",
        );
      }

      // 4. Generate subtitle cues if requested
      const cues = input.subtitles
        ? alignScriptToCues(input.script, {
            totalDuration: estimatedDuration,
            startOffset: input.startOffset,
          })
        : undefined;

      // 5. Attach audio and subtitles to scene
      const editResult = await editScene(ctx, input.scene, (scene) =>
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
