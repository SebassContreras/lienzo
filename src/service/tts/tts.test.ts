import { describe, expect, it } from "vitest";
import { defaultScene } from "../../model/model.ts";
import { resolveOpenRouterApiKey, TTS_PROXY_PATH } from "./config.ts";
import { OpenRouterTtsAdapter } from "./openrouter-adapter.ts";
import { attachSpeechToScene } from "./scene-audio.ts";
import { alignScriptToCues, splitIntoSentences } from "./speech-alignment.ts";

describe("OpenRouter configuration and key resolution (R1, D1)", () => {
  it("resolves explicit API key with top priority", () => {
    const key = resolveOpenRouterApiKey("sk-explicit-test-key");
    expect(key).toBe("sk-explicit-test-key");
  });

  it("trims whitespace from resolved key", () => {
    const key = resolveOpenRouterApiKey("  sk-whitespace-key   ");
    expect(key).toBe("sk-whitespace-key");
  });

  it("returns empty string when no key is found", () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      expect(resolveOpenRouterApiKey("")).toBe("");
    } finally {
      if (original) process.env.OPENROUTER_API_KEY = original;
    }
  });
});

describe("OpenRouter TTS Adapter (R2, R3, D2)", () => {
  it("lists popular models and voices", async () => {
    const adapter = new OpenRouterTtsAdapter();
    const models = await adapter.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.id.includes("openai"))).toBe(true);
    expect(models.some((m) => m.id.includes("elevenlabs"))).toBe(true);
  });

  it("throws error when API key is missing", async () => {
    const origEnv = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const adapter = new OpenRouterTtsAdapter("", "https://example.com");
      await expect(
        adapter.synthesizeSpeech({ text: "Hello", voice: "alloy", apiKey: "" }),
      ).rejects.toThrow(/Clave de API/);
    } finally {
      if (origEnv) process.env.OPENROUTER_API_KEY = origEnv;
    }
  });

  it("goes through the dev-server proxy without a key or Authorization (046/R4)", async () => {
    const origEnv = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    let seen: { url: string; headers: Record<string, string> } | undefined;
    const fakeFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      seen = {
        url: String(url),
        headers: init?.headers as Record<string, string>,
      };
      return new Response(new Uint8Array([1]), { status: 200 });
    };
    try {
      const adapter = new OpenRouterTtsAdapter(
        undefined,
        TTS_PROXY_PATH,
        fakeFetch as unknown as typeof fetch,
      );
      await adapter.synthesizeSpeech({ text: "Hola", voice: "alloy" });
      expect(seen?.url).toBe(TTS_PROXY_PATH);
      expect(seen?.headers.Authorization).toBeUndefined();
    } finally {
      if (origEnv) process.env.OPENROUTER_API_KEY = origEnv;
    }
  });

  it("synthesizes speech with mocked fetch", async () => {
    const fakeAudioData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const mockFetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      expect(body.input).toBe("Test speech");
      expect(body.voice).toBe("alloy");
      return new Response(fakeAudioData.buffer, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      });
    };

    const adapter = new OpenRouterTtsAdapter(
      "test-key",
      "https://fake.openrouter/speech",
      mockFetch as unknown as typeof fetch,
    );

    const result = await adapter.synthesizeSpeech({
      text: "Test speech",
      voice: "alloy",
      apiKey: "test-key",
    });

    expect(result.format).toBe("mp3");
    expect(result.audioBuffer.length).toBe(8);
  });
});

describe("Pure Speech Alignment (R5, D4)", () => {
  it("splits text into sentences properly", () => {
    const text = "Hola mundo. Esto es una prueba! Funciona genial?";
    const sentences = splitIntoSentences(text);
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toBe("Hola mundo.");
    expect(sentences[1]).toBe("Esto es una prueba!");
    expect(sentences[2]).toBe("Funciona genial?");
  });

  it("generates proportional subtitle cues with word breakdowns", () => {
    const script =
      "Primera frase corta. Segunda frase un poco más extendida y completa.";
    const cues = alignScriptToCues(script, {
      totalDuration: 6.0,
      startOffset: 0.5,
      gap: 0.1,
    });

    expect(cues.length).toBe(2);
    expect(cues[0].start).toBe(0.5);
    expect(cues[0].end).toBeLessThan(cues[1].start);
    expect(cues[1].end).toBeLessThanOrEqual(6.0);

    // Verify word timing
    expect(cues[0].words).toBeDefined();
    expect(cues[0].words?.length).toBe(3);
    expect(cues[0].words?.[0].word).toBe("Primera");
    expect(cues[0].words?.[0].start).toBe(cues[0].start);
  });
});

describe("Scene Audio Attachment and Duration Adjustment (R4, D3)", () => {
  it("attaches audio asset and extends scene duration to match speech length", () => {
    const scene = defaultScene();
    scene.duration = 4.0;

    const cues = alignScriptToCues("Frase de prueba.", { totalDuration: 5.0 });
    const updated = attachSpeechToScene(scene, {
      assetId: "/assets/audio-123.mp3",
      audioDuration: 7.5,
      startOffset: 0.5,
      adjustSceneDuration: true,
      cues,
    });

    expect(updated.audio?.assetId).toBe("/assets/audio-123.mp3");
    expect(updated.duration).toBeGreaterThanOrEqual(8.0);

    // Verify subtitles element added
    const sub = updated.elements.find((e) => e.kind === "subtitles");
    expect(sub).toBeDefined();
    expect((sub as unknown as { cues: unknown[] }).cues.length).toBe(
      cues.length,
    );
  });

  it("does not shrink scene duration if scene is already longer than speech", () => {
    const scene = defaultScene();
    scene.duration = 15.0;

    const updated = attachSpeechToScene(scene, {
      assetId: "/assets/audio-123.mp3",
      audioDuration: 4.0,
      adjustSceneDuration: true,
    });

    expect(updated.duration).toBe(15.0);
  });
});
