import { beforeEach, describe, expect, it } from "vitest";
import { defaultScene } from "../../model/model.ts";
import type { Ctx } from "../ctx.ts";
import { createSceneGenerateSpeechTool } from "../tools/scene-generate-speech.ts";
import {
  DEFAULT_LOCAL_TTS_URL,
  resolveLocalTtsBaseUrl,
  resolveTtsProvider,
} from "./config.ts";
import { createTtsService } from "./factory.ts";
import { LocalTtsAdapter, POPULAR_LOCAL_TTS_MODELS } from "./local-adapter.ts";
import { OpenRouterTtsAdapter } from "./openrouter-adapter.ts";
import { loadTtsPreferences, saveTtsPreferences } from "./preferences.ts";
import type { SynthesizeSpeechRequest, TtsService } from "./types.ts";

describe("Pluggable TTS Providers & Local Adapter (Spec 032)", () => {
  beforeEach(() => {
    delete process.env.TTS_PROVIDER;
    delete process.env.KOKORO_PROVIDER;
    delete process.env.TTS_LOCAL_URL;
    delete process.env.KOKORO_TTS_URL;
    delete process.env.LOCAL_TTS_URL;
    delete process.env.KOKORO_TTS_VOICE;
    delete process.env.KOKORO_TTS_MODEL;
    delete process.env.OPENROUTER_API_KEY;
  });

  describe("Config & Provider Resolution (R1, R2, D2)", () => {
    it("resolves default provider to openrouter when unspecified", () => {
      expect(resolveTtsProvider()).toBe("openrouter");
    });

    it("resolves provider from explicit parameter", () => {
      expect(resolveTtsProvider("local")).toBe("local");
      expect(resolveTtsProvider("kokoro")).toBe("kokoro");
      expect(resolveTtsProvider("custom")).toBe("custom");
      expect(resolveTtsProvider("openrouter")).toBe("openrouter");
    });

    it("resolves provider from TTS_PROVIDER and ignores undocumented aliases (046/R5)", () => {
      process.env.TTS_PROVIDER = "local";
      expect(resolveTtsProvider()).toBe("local");

      delete process.env.TTS_PROVIDER;
      process.env.KOKORO_PROVIDER = "kokoro";
      process.env.LOCAL_TTS_URL = "http://alias:1/speech";
      expect(resolveTtsProvider()).toBe("openrouter");
      expect(resolveLocalTtsBaseUrl()).toBe(DEFAULT_LOCAL_TTS_URL);
      delete process.env.KOKORO_PROVIDER;
    });

    it("takes the local voice and model from KOKORO_TTS_VOICE/MODEL (046/R5)", async () => {
      let body: Record<string, unknown> = {};
      const fakeFetch = async (_: RequestInfo | URL, init?: RequestInit) => {
        body = JSON.parse(String(init?.body));
        return new Response(new Uint8Array([0]), { status: 200 });
      };
      const adapter = new LocalTtsAdapter(
        undefined,
        fakeFetch as unknown as typeof fetch,
      );
      await adapter.synthesizeSpeech({ text: "Hola", voice: "" });
      expect(body).toMatchObject({ model: "kokoro-es", voice: "ef_dora" });

      process.env.KOKORO_TTS_VOICE = "em_alex";
      process.env.KOKORO_TTS_MODEL = "kokoro";
      await adapter.synthesizeSpeech({ text: "Hola", voice: "" });
      expect(body).toMatchObject({ model: "kokoro", voice: "em_alex" });
    });

    it("resolves local base URL with fallback to default or environment override", () => {
      expect(resolveLocalTtsBaseUrl()).toBe(DEFAULT_LOCAL_TTS_URL);

      process.env.TTS_LOCAL_URL = "http://localhost:5000/v1/audio/speech";
      expect(resolveLocalTtsBaseUrl()).toBe(
        "http://localhost:5000/v1/audio/speech",
      );

      expect(resolveLocalTtsBaseUrl("http://custom:9999/speech")).toBe(
        "http://custom:9999/speech",
      );
    });
  });

  describe("LocalTtsAdapter (R3, R6, D3)", () => {
    it("lists available Kokoro local models and voices", async () => {
      const adapter = new LocalTtsAdapter();
      const models = await adapter.listModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toBe("kokoro");
      expect(models[0].voices.some((v) => v.id === "af_heart")).toBe(true);
    });

    it("synthesizes speech without requiring an API key", async () => {
      let capturedUrl = "";
      let capturedBody: Record<string, unknown> | null = null;
      let capturedHeaders: Record<string, string> = {};

      const fakeFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        capturedUrl = String(input);
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        capturedBody = JSON.parse(String(init?.body));

        const dummyBytes = new Uint8Array([0, 1, 2, 3]);
        return new Response(dummyBytes, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        });
      };

      const adapter = new LocalTtsAdapter(
        undefined,
        fakeFetch as unknown as typeof fetch,
      );
      const result = await adapter.synthesizeSpeech({
        text: "Hola desde síntesis local",
        voice: "af_heart",
        model: "kokoro",
      });

      expect(capturedUrl).toBe(DEFAULT_LOCAL_TTS_URL);
      expect(capturedHeaders.Authorization).toBeUndefined();
      expect(capturedBody).toEqual({
        model: "kokoro",
        input: "Hola desde síntesis local",
        voice: "af_heart",
        response_format: "mp3",
        speed: 1.0,
      });
      expect(result.audioBuffer.length).toBe(4);
    });

    it("throws helpful error when text is empty", async () => {
      const adapter = new LocalTtsAdapter();
      await expect(
        adapter.synthesizeSpeech({ text: "", voice: "af_heart" }),
      ).rejects.toThrow("El texto a sintetizar no puede estar vacío");
    });
  });

  describe("TTS Provider Factory (R1, R3, D1)", () => {
    it("creates LocalTtsAdapter when provider is local or kokoro", () => {
      const service = createTtsService({ provider: "local" });
      expect(service).toBeInstanceOf(LocalTtsAdapter);

      const kokoroService = createTtsService({ provider: "kokoro" });
      expect(kokoroService).toBeInstanceOf(LocalTtsAdapter);
    });

    it("creates OpenRouterTtsAdapter by default or when provider is openrouter", () => {
      const defaultService = createTtsService();
      expect(defaultService).toBeInstanceOf(OpenRouterTtsAdapter);

      const openrouterService = createTtsService({ provider: "openrouter" });
      expect(openrouterService).toBeInstanceOf(OpenRouterTtsAdapter);
    });
  });

  describe("scene_generate_speech Tool Integration (R4, D4)", () => {
    it("routes speech generation through injected service or factory", async () => {
      let callCount = 0;
      let receivedRequest: SynthesizeSpeechRequest | undefined;

      const mockTtsService: TtsService = {
        async synthesizeSpeech(req) {
          callCount++;
          receivedRequest = req;
          return {
            audioBuffer: new Uint8Array(32000), // ~2 seconds
            mimeType: "audio/mpeg",
            format: "mp3",
            durationSeconds: 2.0,
          };
        },
        async listModels() {
          return POPULAR_LOCAL_TTS_MODELS;
        },
      };

      const tool = createSceneGenerateSpeechTool({
        ttsService: mockTtsService,
      });

      const fakeCtx = {
        root: "/tmp",
        store: {
          animPresets: async () => [],
          readScene: async () => defaultScene(),
          writeScene: async () => "test-scene",
        },
        projects: {
          get: async () => ({}),
          projectStore: async () => ({
            animPresets: async () => [],
            readScene: async () => defaultScene(),
            writeScene: async () => "test-scene",
          }),
        },
      };

      const res = await tool.run(
        {
          scene: "test-scene",
          project: "test",
          script: "Prueba de narración local",
          provider: "local",
          model: "kokoro",
          voice: "af_heart",
          speed: 1.0,
          volume: 1.0,
          startOffset: 0,
          adjustSceneDuration: true,
          subtitles: true,
        },
        fakeCtx as unknown as Ctx,
      );

      expect(callCount).toBe(1);
      expect(receivedRequest?.text).toBe("Prueba de narración local");
      expect(receivedRequest?.model).toBe("kokoro");
      expect(receivedRequest?.voice).toBe("af_heart");
      expect(res.scene).toBe("test-scene");
      expect(res.assetId).toBeDefined();
    });

    it("consumes TtsService injected via Ctx (039/R5, D5)", async () => {
      let callCount = 0;
      const mockTtsService: TtsService = {
        async synthesizeSpeech() {
          callCount++;
          return {
            audioBuffer: new Uint8Array(16000),
            mimeType: "audio/mpeg",
            format: "mp3",
            durationSeconds: 1.0,
          };
        },
        async listModels() {
          return [];
        },
      };

      const tool = createSceneGenerateSpeechTool();
      const fakeCtx = {
        root: "/tmp",
        tts: mockTtsService,
        store: {
          animPresets: async () => [],
          readScene: async () => defaultScene(),
          writeScene: async () => "test-scene",
        },
        projects: {
          get: async () => ({}),
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
          script: "Hello from Ctx",
          speed: 1.0,
          volume: 1.0,
          startOffset: 0,
          adjustSceneDuration: true,
          subtitles: true,
        },
        fakeCtx as unknown as Ctx,
      );

      expect(callCount).toBe(1);
      expect(result.assetId).toBeDefined();
    });
  });

  describe("Preferences Persistence for Providers (R5, D5)", () => {
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
      // @ts-expect-error Mocking window in Node test
      globalThis.window = { localStorage: fakeLocalStorage };
    });

    it("persists provider selection in localStorage preferences", () => {
      saveTtsPreferences({
        provider: "local",
        model: "kokoro",
        voice: "af_heart",
      });

      const loaded = loadTtsPreferences();
      expect(loaded.provider).toBe("local");
      expect(loaded.model).toBe("kokoro");
      expect(loaded.voice).toBe("af_heart");
    });
  });
});

describe("local voice check (071/D6)", () => {
  it("fails an unknown voice with the server's voices and never posts", async () => {
    const methods: string[] = [];
    const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      methods.push(init?.method ?? "GET");
      return Response.json({ voices: ["ef_dora", "em_alex"] });
    };
    const adapter = new LocalTtsAdapter(
      undefined,
      fakeFetch as unknown as typeof fetch,
    );

    const said = adapter.synthesizeSpeech({ text: "Hola", voice: "zz_nadie" });

    await expect(said).rejects.toThrow(
      "La voz «zz_nadie» no está en la lista; voces: ef_dora, em_alex",
    );
    expect(methods).toEqual(["GET"]);
  });

  it("leaves the server's raw text out when it rejects an unknown voice", async () => {
    const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "POST"
        ? Response.json(
            { detail: "Request ID: Root=1-abc; https://huggingface.co/x" },
            { status: 400 },
          )
        : new Response("", { status: 404 });
    const adapter = new LocalTtsAdapter(
      undefined,
      fakeFetch as unknown as typeof fetch,
    );

    const said = adapter.synthesizeSpeech({ text: "Hola", voice: "zz_nadie" });

    await expect(said).rejects.toThrow(
      /^Error del servicio local TTS \(400\): La voz «zz_nadie»/,
    );
    await expect(said).rejects.not.toThrow("Request ID");
  });
});
