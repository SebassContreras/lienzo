import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "../tools/index.ts";
import { audioDuration } from "./audio-duration.ts";
import type { TtsService } from "./types.ts";

/** MPEG-1 Layer III, 64 kbps, 44.1 kHz, no padding: 208 bytes, 1152 samples. */
const MPEG1_64K = [0xff, 0xfb, 0x50, 0x00];
/** MPEG-2 Layer III, 64 kbps, 22.05 kHz, no padding: 208 bytes, 576 samples. */
const MPEG2_64K = [0xff, 0xf3, 0x80, 0x00];
const FRAME_BYTES = 208;

function frames(count: number, header: number[]): Uint8Array {
  const out = new Uint8Array(count * FRAME_BYTES);
  for (let i = 0; i < count; i++) out.set(header, i * FRAME_BYTES);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** A first frame carrying a Xing header that claims `count` frames. */
function xingFrame(count: number): Uint8Array {
  const frame = frames(1, MPEG1_64K);
  frame.set([0x58, 0x69, 0x6e, 0x67, 0, 0, 0, 1], 36); // "Xing", flags: frames
  new DataView(frame.buffer).setUint32(44, count);
  return frame;
}

function wav(seconds: number, byteRate: number): Uint8Array {
  const dataSize = seconds * byteRate;
  const b = new Uint8Array(44 + dataSize);
  const v = new DataView(b.buffer);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  v.setUint32(4, 36 + dataSize, true);
  b.set([0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20], 8); // WAVEfmt
  v.setUint32(16, 16, true);
  v.setUint32(28, byteRate, true);
  b.set([0x64, 0x61, 0x74, 0x61], 36); // data
  v.setUint32(40, dataSize, true);
  return b;
}

describe("audioDuration (060/R2)", () => {
  it("measures MPEG-1 Layer III frames at 1152 samples each", () => {
    const seconds = audioDuration(frames(100, MPEG1_64K), "mp3");

    expect(seconds).toBeCloseTo((100 * 1152) / 44100, 6);
  });

  it("measures MPEG-2 Layer III frames at 576 samples each", () => {
    const seconds = audioDuration(frames(100, MPEG2_64K), "mp3");

    expect(seconds).toBeCloseTo((100 * 576) / 22050, 6);
  });

  it("skips a leading ID3v2 tag", () => {
    const id3 = new Uint8Array(10 + 300);
    id3.set([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0x02, 0x2c]); // size 300 (syncsafe)
    id3.fill(0xff, 10); // tag bytes that would look like sync if read as audio

    const seconds = audioDuration(concat(id3, frames(10, MPEG1_64K)), "mp3");

    expect(seconds).toBeCloseTo((10 * 1152) / 44100, 6);
  });

  it("resyncs past a junk byte between frames without losing a frame", () => {
    const bytes = concat(
      frames(5, MPEG1_64K),
      new Uint8Array([0x00]),
      frames(5, MPEG1_64K),
    );

    expect(audioDuration(bytes, "mp3")).toBeCloseTo((10 * 1152) / 44100, 6);
  });

  it("counts every frame of a merged clip whose Xing header claims fewer (issue #11)", () => {
    const merged = concat(xingFrame(50), frames(99, MPEG1_64K));

    expect(audioDuration(merged, "mp3")).toBeCloseTo((100 * 1152) / 44100, 6);
  });

  it("measures a WAV from its data chunk and byte rate", () => {
    expect(audioDuration(wav(2, 8000), "wav")).toBe(2);
  });

  it("returns undefined for bytes with no audio frame", () => {
    expect(audioDuration(new Uint8Array(500), "mp3")).toBeUndefined();
  });

  it("returns undefined for a format it can't parse", () => {
    expect(audioDuration(frames(10, MPEG1_64K), "opus")).toBeUndefined();
  });
});

describe("scene_generate_speech duration (060/R2)", () => {
  async function generate(audioBuffer: Uint8Array, format: string) {
    const root = await mkdtemp(join(tmpdir(), "lienzo-speech-"));
    const ctx = createCtx(root, fakeRenderer());
    const tts: TtsService = {
      synthesizeSpeech: async () => ({
        audioBuffer,
        format,
        mimeType: "audio/mpeg",
      }),
      listModels: async () => [],
    };
    ctx.tts = tts;
    await registry.call("project_create", { project: "p", name: "P" }, ctx);
    await registry.call("scene_create", { project: "p", scene: "s" }, ctx);
    const res = await registry.call(
      "scene_generate_speech",
      { project: "p", scene: "s", script: "Hola", provider: "local" },
      ctx,
    );
    if (!res.ok) throw new Error(JSON.stringify(res.error));
    return res.value as { audioDuration: number };
  }

  it("reports the frames' length, not the byte-rate estimate (issue #11)", async () => {
    const res = await generate(frames(100, MPEG1_64K), "mp3");

    expect(res.audioDuration).toBeCloseTo((100 * 1152) / 44100, 6);
  });

  it("falls back to the byte-rate estimate for a format it can't parse", async () => {
    const res = await generate(new Uint8Array(32000), "opus");

    expect(res.audioDuration).toBe(2);
  });
});
