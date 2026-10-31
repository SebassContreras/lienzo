import { beforeEach, describe, expect, it } from "vitest";
import { defaultScene } from "../../model/model.ts";
import type { Ctx } from "../core/ctx.ts";
import {
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
  loadEnvSafely,
  OPENROUTER_API_URL,
  resolveDefaultTtsModel,
  resolveDefaultTtsVoice,
  resolveOpenRouterApiKey,
  resolveOpenRouterBaseUrl,
  STORAGE_KEY_OPENROUTER_API_KEY,
} from "./config.ts";
import { OpenRouterTtsAdapter } from "./openrouter-adapter.ts";
import {
  DEFAULT_TTS_PREFERENCES,
  loadTtsPreferences,
  saveTtsPreferences,
} from "./preferences.ts";
import { createSceneGenerateSpeechTool } from "./tools/scene-generate-speech.ts";
import type { SynthesizeSpeechRequest, TtsService } from "./types.ts";

describe("Runtime environment loading and resolution", () => {
  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_BASE_URL;
    delete process.env.OPENROUTER_TTS_MODEL;
    delete process.env.OPENROUTER_TTS_VOICE;
  });

  it("loadEnvSafely runs without error even if .env file does not exist", () => {
    expect(() => loadEnvSafely("/non/existent/path/.env")).not.toThrow();
  });

  it("resolves API key from process.env", () => {
    process.env.OPENROUTER_API_KEY = "sk-env-key-123";
    expect(resolveOpenRouterApiKey()).toBe("sk-env-key-123");
  });

  it("resolves base URL with fallback to default and env override", () => {
    expect(resolveOpenRouterBaseUrl()).toBe(OPENROUTER_API_URL);

    process.env.OPENROUTER_API_BASE_URL = "https://custom.proxy/api/speech";
    expect(resolveOpenRouterBaseUrl()).toBe("https://custom.proxy/api/speech");

    // Explicit override takes precedence
    expect(resolveOpenRouterBaseUrl("https://explicit.proxy/api/speech")).toBe(
      "https://explicit.proxy/api/speech",
    );
  });

  it("resolves default model from env or falls back to standard model", () => {
    expect(resolveDefaultTtsModel()).toBe(DEFAULT_TTS_MODEL);

    process.env.OPENROUTER_TTS_MODEL = "elevenlabs/eleven_multilingual_v2";
    expect(resolveDefaultTtsModel()).toBe("elevenlabs/eleven_multilingual_v2");

    expect(resolveDefaultTtsModel("custom/model-id")).toBe("custom/model-id");
  });

  it("resolves default voice from env or falls back to standard voice", () => {
    expect(resolveDefaultTtsVoice()).toBe(DEFAULT_TTS_VOICE);

    process.env.OPENROUTER_TTS_VOICE = "rachel";
    expect(resolveDefaultTtsVoice()).toBe("rachel");

    expect(resolveDefaultTtsVoice("custom-voice")).toBe("custom-voice");
  });
});

describe("Dynamic base URL support in OpenRouter adapter", () => {
  it("uses custom baseUrl passed to synthesizeSpeech", async () => {
    let requestedUrl = "";
    const fakeAudioData = new Uint8Array([10, 20, 30]);

    const mockFetch = async (url: RequestInfo | URL) => {
      requestedUrl = String(url);
      return new Response(fakeAudioData.buffer, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      });
    };

    const adapter = new OpenRouterTtsAdapter(
      "test-key",
      "https://default-endpoint.com/speech",
      mockFetch as unknown as typeof fetch,
    );

    const result = await adapter.synthesizeSpeech({
      text: "Testing custom base URL",
      voice: "alloy",
      baseUrl: "https://per-request.endpoint/v1/speech",
    });

    expect(requestedUrl).toBe("https://per-request.endpoint/v1/speech");
    expect(result.audioBuffer.length).toBe(3);
  });
});

describe("Browser UI preferences persistence", () => {
  // Simple mock storage for Node vitest environment
  const mockStorage: Record<string, string> = {};
  const fakeLocalStorage = {
    getItem: (k: string) => mockStorage[k] ?? null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };

  beforeEach(() => {
    fakeLocalStorage.clear();
    // @ts-expect-error
    globalThis.window = { localStorage: fakeLocalStorage };
  });

  it("loads default preferences when localStorage is empty", () => {
    const prefs = loadTtsPreferences();
    expect(prefs.model).toBe(DEFAULT_TTS_PREFERENCES.model);
    expect(prefs.voice).toBe(DEFAULT_TTS_PREFERENCES.voice);
    expect(prefs.speed).toBe(1.0);
    expect(prefs.generateSubtitles).toBe(true);
    expect(prefs.adjustDuration).toBe(true);
  });

  it("saves and reloads updated preferences", () => {
    saveTtsPreferences({
      model: "mistralai/mistral-speech",
      voice: "custom-speaker",
      speed: 1.25,
      generateSubtitles: false,
      adjustDuration: false,
      isCustomModel: true,
      isCustomVoice: true,
    });

    const loaded = loadTtsPreferences();
    expect(loaded.model).toBe("mistralai/mistral-speech");
    expect(loaded.voice).toBe("custom-speaker");
    expect(loaded.speed).toBe(1.25);
    expect(loaded.generateSubtitles).toBe(false);
    expect(loaded.adjustDuration).toBe(false);
    expect(loaded.isCustomModel).toBe(true);
    expect(loaded.isCustomVoice).toBe(true);
  });

  it("moves a key from the old slot into the preferences and removes the slot", () => {
    fakeLocalStorage.setItem(STORAGE_KEY_OPENROUTER_API_KEY, " sk-legacy ");

    expect(loadTtsPreferences().apiKey).toBe("sk-legacy");
    expect(fakeLocalStorage.getItem(STORAGE_KEY_OPENROUTER_API_KEY)).toBeNull();
    expect(loadTtsPreferences().apiKey).toBe("sk-legacy");

    saveTtsPreferences({ apiKey: "sk-new" });
    expect(fakeLocalStorage.getItem(STORAGE_KEY_OPENROUTER_API_KEY)).toBeNull();
  });
});

describe("Environment resolution in scene_generate_speech tool", () => {
  beforeEach(() => {
    delete process.env.OPENROUTER_TTS_MODEL;
    delete process.env.OPENROUTER_TTS_VOICE;
    delete process.env.OPENROUTER_API_KEY;
  });

  it("falls back to environment variables when model and voice are not specified", async () => {
    process.env.OPENROUTER_TTS_MODEL = "env-model-id";
    process.env.OPENROUTER_TTS_VOICE = "env-voice-id";
    process.env.OPENROUTER_API_KEY = "env-api-key";

    let capturedRequest: SynthesizeSpeechRequest | undefined;

    const fakeTtsService: TtsService = {
      listModels: async () => [],
      synthesizeSpeech: async (req) => {
        capturedRequest = req;
        return {
          audioBuffer: new Uint8Array(100),
          format: "mp3",
          mimeType: "audio/mpeg",
          durationSeconds: 2.0,
        };
      },
    };

    const tool = createSceneGenerateSpeechTool({ ttsService: fakeTtsService });

    // Mock context
    const fakeCtx = {
      root: "/tmp",
      fonts: { list: async () => [] },
      store: {
        animPresets: async () => [],
        readScene: async () => defaultScene(),
        writeScene: async () => "test-scene",
      },
      projects: {
        get: async () => ({}),
        resolvePath: () => "/tmp/test/assets",
        checkAsset: async () => ({ ok: true }),
        projectStore: async () => ({
          animPresets: async () => [],
          readScene: async () => defaultScene(),
          writeScene: async () => "test-scene",
        }),
      },
    };

    const result = await tool.run(
      {
        scene: "test-scene",
        project: "test",
        script: "Hello world script",
        speed: 1.0,
        volume: 1.0,
        startOffset: 0,
        adjustSceneDuration: true,
        subtitles: true,
      },
      fakeCtx as unknown as Ctx,
    );

    expect(capturedRequest).toBeDefined();
    expect(capturedRequest?.model).toBe("env-model-id");
    expect(capturedRequest?.voice).toBe("env-voice-id");
    expect(capturedRequest?.apiKey).toBe("env-api-key");
    expect((result as unknown as { assetId: string }).assetId).toBeDefined();
  });

  it("prefers explicit arguments over environment variables", async () => {
    process.env.OPENROUTER_TTS_MODEL = "env-model-id";
    process.env.OPENROUTER_TTS_VOICE = "env-voice-id";

    let capturedRequest: SynthesizeSpeechRequest | undefined;

    const fakeTtsService: TtsService = {
      listModels: async () => [],
      synthesizeSpeech: async (req) => {
        capturedRequest = req;
        return {
          audioBuffer: new Uint8Array(100),
          format: "mp3",
          mimeType: "audio/mpeg",
          durationSeconds: 2.0,
        };
      },
    };

    const tool = createSceneGenerateSpeechTool({ ttsService: fakeTtsService });

    const fakeCtx = {
      root: "/tmp",
      fonts: { list: async () => [] },
      store: {
        animPresets: async () => [],
        readScene: async () => defaultScene(),
        writeScene: async () => "test-scene",
      },
      projects: {
        get: async () => ({}),
        resolvePath: () => "/tmp/test/assets",
        checkAsset: async () => ({ ok: true }),
        projectStore: async () => ({
          animPresets: async () => [],
          readScene: async () => defaultScene(),
          writeScene: async () => "test-scene",
        }),
      },
    };

    await tool.run(
      {
        scene: "test-scene",
        project: "test",
        script: "Explicit script",
        model: "explicit-model",
        voice: "explicit-voice",
        apiKey: "explicit-key",
        speed: 1.0,
        volume: 1.0,
        startOffset: 0,
        adjustSceneDuration: true,
        subtitles: true,
      },
      fakeCtx as unknown as Ctx,
    );

    expect(capturedRequest?.model).toBe("explicit-model");
    expect(capturedRequest?.voice).toBe("explicit-voice");
    expect(capturedRequest?.apiKey).toBe("explicit-key");
  });
});
