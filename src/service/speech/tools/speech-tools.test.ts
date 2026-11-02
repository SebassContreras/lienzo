import { describe, expect, it } from "vitest";
import { toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

const storedScene = async (scene: string) => {
  const got = (await call("scene_get", { scene, full: true })) as {
    value: {
      audio?: { assetId: string; trimOffset?: number };
      audioTracks?: { assetId: string; trimOffset?: number }[];
      elements?: { kind: string; cues?: { start: number; end: number; text: string }[] }[];
    };
  };
  return got.value;
};

/**
 * Builds a valid 16-bit PCM mono WAV buffer with RIFF and fmt chunks.
 */
function createWavBuffer(options: {
  sampleRate: number;
  leadingSilenceSec: number;
  voiceSec: number;
  trailingSilenceSec: number;
  amplitude?: number;
}): Uint8Array {
  const {
    sampleRate,
    leadingSilenceSec,
    voiceSec,
    trailingSilenceSec,
    amplitude = 10000,
  } = options;

  const totalSec = leadingSilenceSec + voiceSec + trailingSilenceSec;
  const numSamples = Math.floor(totalSec * sampleRate);
  const dataByteLength = numSamples * 2;
  const buffer = new Uint8Array(44 + dataByteLength);
  const view = new DataView(buffer.buffer);

  // RIFF header
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + dataByteLength, true);
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // fmt chunk
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data chunk
  buffer.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataByteLength, true);

  const startVoice = Math.floor(leadingSilenceSec * sampleRate);
  const endVoice = startVoice + Math.floor(voiceSec * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    let sampleVal = 0;
    if (i >= startVoice && i < endVoice) {
      sampleVal = Math.round(amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate));
    }
    view.setInt16(44 + i * 2, sampleVal, true);
  }

  return buffer;
}

it("scene_generate_speech stores its audio ref with the project prefix", async () => {
  suite.ctx().tts = {
    synthesizeSpeech: async () => ({
      audioBuffer: new Uint8Array(32000),
      format: "opus",
      mimeType: "audio/ogg",
    }),
    listModels: async () => [],
  };

  await call("scene_generate_speech", {
    scene: "s",
    script: "Hola",
    provider: "local",
    asTrack: true,
  });

  const sceneData = await storedScene("s");
  expect(
    sceneData.audioTracks?.every((t) =>
      t.assetId.startsWith("/projects/p/assets/"),
    ),
  ).toBe(true);
});

it("scene_generate_speech fails on a missing scene before it synthesizes", async () => {
  const r = await call("scene_generate_speech", {
    scene: "nada",
    script: "Hola",
    provider: "local",
    baseUrl: "http://127.0.0.1:9",
  });
  expect(r).toMatchObject({
    ok: false,
    error: { code: "not_found", path: "scene" },
  });
});

it("scene_generate_speech names baseUrl and how to start the service when the local one is down", async () => {
  const r = await call("scene_generate_speech", {
    scene: "s",
    script: "Hola",
    provider: "local",
    baseUrl: "http://127.0.0.1:9",
  });
  expect(r).toMatchObject({
    ok: false,
    error: {
      path: "baseUrl",
      message: expect.stringMatching(/127\.0\.0\.1:9.*Arranca el servicio/),
    },
  });
});

describe("scene_generate_speech voiced span and trimSilence (R1, R2, D1, D3)", () => {
  const testMatrix = [
    {
      name: "WAV with leading silence returns speechStart and speechEnd, trimSilence: true sets trimOffset on audioTracks",
      asTrack: true,
      trimSilence: true,
      leadingSilenceSec: 0.4,
      voiceSec: 1.0,
      trailingSilenceSec: 0.6,
      expectedStartApprox: 0.4,
      expectedEndApprox: 1.4,
      expectedTrimOffsetApprox: 0.35, // 0.4 - 0.05
    },
    {
      name: "trimSilence: false leaves trimOffset unset/0 while still returning speechStart and speechEnd",
      asTrack: true,
      trimSilence: false,
      leadingSilenceSec: 0.4,
      voiceSec: 1.0,
      trailingSilenceSec: 0.6,
      expectedStartApprox: 0.4,
      expectedEndApprox: 1.4,
      expectedTrimOffsetApprox: 0,
    },
    {
      name: "trimSilence: true sets trimOffset on scene.audio when asTrack: false",
      asTrack: false,
      trimSilence: true,
      leadingSilenceSec: 0.3,
      voiceSec: 1.2,
      trailingSilenceSec: 0.5,
      expectedStartApprox: 0.3,
      expectedEndApprox: 1.5,
      expectedTrimOffsetApprox: 0.25, // 0.3 - 0.05
    },
  ];

  it.each(testMatrix)(
    "$name",
    async ({
      asTrack,
      trimSilence,
      leadingSilenceSec,
      voiceSec,
      trailingSilenceSec,
      expectedStartApprox,
      expectedEndApprox,
      expectedTrimOffsetApprox,
    }) => {
      const wavBuffer = createWavBuffer({
        sampleRate: 24000,
        leadingSilenceSec,
        voiceSec,
        trailingSilenceSec,
      });

      suite.ctx().tts = {
        synthesizeSpeech: async (req) => {
          expect(req.format).toBe("wav");
          return {
            audioBuffer: wavBuffer,
            format: "wav",
            mimeType: "audio/wav",
          };
        },
        listModels: async () => [],
      };

      const res = (await call("scene_generate_speech", {
        scene: "s",
        script: "Una frase de prueba con audio sintetizado",
        provider: "local",
        asTrack,
        trimSilence,
      })) as {
        ok: boolean;
        value: {
          speechStart: number | null;
          speechEnd: number | null;
          audioDuration: number;
        };
      };

      expect(res.ok).toBe(true);
      expect(res.value.speechStart).not.toBeNull();
      expect(res.value.speechEnd).not.toBeNull();
      expect(Math.abs((res.value.speechStart ?? 0) - expectedStartApprox)).toBeLessThanOrEqual(0.05);
      expect(Math.abs((res.value.speechEnd ?? 0) - expectedEndApprox)).toBeLessThanOrEqual(0.05);

      const sceneData = await storedScene("s");
      if (asTrack) {
        const lastTrack = sceneData.audioTracks?.[sceneData.audioTracks.length - 1];
        expect(Math.abs((lastTrack?.trimOffset ?? 0) - expectedTrimOffsetApprox)).toBeLessThanOrEqual(0.05);
      } else {
        expect(Math.abs((sceneData.audio?.trimOffset ?? 0) - expectedTrimOffsetApprox)).toBeLessThanOrEqual(0.05);
      }
    },
  );

  it("all-silent WAV returns null speechStart/speechEnd and leaves trimOffset unset", async () => {
    const silentWav = createWavBuffer({
      sampleRate: 24000,
      leadingSilenceSec: 1.0,
      voiceSec: 0,
      trailingSilenceSec: 0,
    });

    suite.ctx().tts = {
      synthesizeSpeech: async () => ({
        audioBuffer: silentWav,
        format: "wav",
        mimeType: "audio/wav",
      }),
      listModels: async () => [],
    };

    const res = (await call("scene_generate_speech", {
      scene: "s",
      script: "Silencio total",
      provider: "local",
      asTrack: true,
      trimSilence: true,
    })) as {
      ok: boolean;
      value: {
        speechStart: number | null;
        speechEnd: number | null;
        notices?: string[];
      };
    };

    expect(res.ok).toBe(true);
    expect(res.value.speechStart).toBeNull();
    expect(res.value.speechEnd).toBeNull();
  });

  it("non-WAV buffer returns null speechStart/speechEnd and emits notice without crashing", async () => {
    suite.ctx().tts = {
      synthesizeSpeech: async () => ({
        audioBuffer: new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]), // fake mp3/id3
        format: "mp3",
        mimeType: "audio/mpeg",
      }),
      listModels: async () => [],
    };

    const res = (await call("scene_generate_speech", {
      scene: "s",
      script: "Prueba mp3 fallback",
      provider: "local",
      asTrack: true,
      trimSilence: true,
    })) as {
      ok: boolean;
      value: {
        speechStart: number | null;
        speechEnd: number | null;
        notices?: string[];
      };
    };

    expect(res.ok).toBe(true);
    expect(res.value.speechStart).toBeNull();
    expect(res.value.speechEnd).toBeNull();
  });
});
