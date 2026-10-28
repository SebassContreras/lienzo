import { beforeEach, describe, expect, it, vi } from "vitest";

/** What the browser can encode, set per test. */
const can = { video: true, audio: true };
const made: { format?: string; codec?: string; audio?: string } = {};
const aacRegistered = vi.fn();
let finalBuffer: ArrayBuffer | null = new ArrayBuffer(8);

vi.mock("mediabunny", () => ({
  QUALITY_HIGH: "high",
  canEncodeVideo: async () => can.video,
  canEncodeAudio: async () => can.audio,
  Mp4OutputFormat: class {
    name = "mp4";
  },
  WebMOutputFormat: class {
    name = "webm";
  },
  BufferTarget: class {
    get buffer() {
      return finalBuffer;
    }
  },
  CanvasSource: class {
    constructor(_c: unknown, o: { codec: string }) {
      made.codec = o.codec;
    }
    async add() {}
  },
  AudioBufferSource: class {
    constructor(o: { codec: string }) {
      made.audio = o.codec;
    }
    async add() {}
  },
  Output: class {
    target: unknown;
    constructor(o: { format: { name: string }; target: unknown }) {
      made.format = o.format.name;
      this.target = o.target;
    }
    addVideoTrack() {}
    addAudioTrack() {}
    async start() {}
    async finalize() {}
  },
}));
vi.mock("@mediabunny/aac-encoder", () => ({
  registerAacEncoder: aacRegistered,
}));

const { createVideoEncoder } = await import("./video-encoder.ts");
const canvas = { width: 640, height: 360 } as OffscreenCanvas;
const audioBuffer = { numberOfChannels: 2, sampleRate: 48000 } as AudioBuffer;

beforeEach(() => {
  can.video = true;
  can.audio = true;
  finalBuffer = new ArrayBuffer(8);
  for (const k of Object.keys(made)) delete made[k as keyof typeof made];
  aacRegistered.mockClear();
});

describe("createVideoEncoder", () => {
  it("is an H.264 MP4 when the browser can encode it", async () => {
    const blob = await (await createVideoEncoder(canvas, 30)).finish();
    expect(made).toEqual({ format: "mp4", codec: "avc" });
    expect(blob.type).toBe("video/mp4");
  });

  it("falls back to a VP9 WebM with Opus audio when it cannot", async () => {
    can.video = false;
    const blob = await (
      await createVideoEncoder(canvas, 30, { audioBuffer })
    ).finish();
    expect(made).toEqual({ format: "webm", codec: "vp9", audio: "opus" });
    expect(blob.type).toBe("video/webm");
  });

  it("an MP4 with audio uses the WASM AAC encoder when the browser has none", async () => {
    can.audio = false;
    await createVideoEncoder(canvas, 30, { audioBuffer });
    expect(made.audio).toBe("aac");
    expect(aacRegistered).toHaveBeenCalledOnce();
  });

  it("an MP4 with audio uses the browser's AAC encoder when it has one", async () => {
    await createVideoEncoder(canvas, 30, { audioBuffer });
    expect(aacRegistered).not.toHaveBeenCalled();
  });

  it("fails when the encoder produced no output", async () => {
    finalBuffer = null;
    const encoder = await createVideoEncoder(canvas, 30);
    await expect(encoder.finish()).rejects.toThrow(/no output/);
  });
});
