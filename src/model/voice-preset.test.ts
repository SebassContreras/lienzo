import { describe, expect, it } from "vitest";
import { parseVoicePreset, type VoicePreset } from "./voice-preset.ts";

describe("VoicePreset schema and parser (037/T002)", () => {
  it("parses valid voice preset data with defaults", () => {
    const raw = {
      name: "Locutor Español",
      model: "openai/tts-1",
      voice: "alloy",
    };

    const parsed = parseVoicePreset(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.name).toBe("Locutor Español");
    expect(parsed.value.category).toBe("Voces");
    expect(parsed.value.provider).toBe("openrouter");
    expect(parsed.value.model).toBe("openai/tts-1");
    expect(parsed.value.voice).toBe("alloy");
    expect(parsed.value.speed).toBe(1.0);
  });

  it("preserves explicit provider, speed, and sample script without storing binary audio", () => {
    const data: VoicePreset = {
      name: "Voz Narrativa",
      category: "Voces",
      provider: "kokoro",
      model: "kokoro-es",
      voice: "ef_dora",
      speed: 1.15,
      isCustomModel: false,
      isCustomVoice: false,
      sampleScript: "Bienvenidos a nuestro nuevo video.",
      generateSubtitles: true,
      adjustDuration: true,
    };

    const parsed = parseVoicePreset(data);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value).toEqual(data);
    // Explicitly verify no binary audio field
    expect(
      (parsed.value as unknown as Record<string, unknown>).audioBuffer,
    ).toBeUndefined();
    expect(
      (parsed.value as unknown as Record<string, unknown>).audioBlob,
    ).toBeUndefined();
  });

  it("fails parsing when required fields are missing or invalid", () => {
    const invalid1 = { name: "" };
    expect(parseVoicePreset(invalid1).ok).toBe(false);

    const invalid2 = {
      name: "Test",
      model: "openai/tts-1",
      voice: "",
      speed: 10,
    };
    expect(parseVoicePreset(invalid2).ok).toBe(false);
  });
});
