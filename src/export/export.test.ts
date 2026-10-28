import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultScene, type Scene } from "../model/model.ts";

const drawn: number[] = [];
const added: number[] = [];

vi.mock("../engine/render.ts", () => ({
  drawScene: (_ctx: unknown, _scene: unknown, t: number) => drawn.push(t),
}));
vi.mock("../engine/assets.ts", () => ({
  assetFor: (src: string) => (src === "cached.mp3" ? cached : undefined),
  loadAudioBuffer: async (src: string) => (src === "voz.mp3" ? loaded : null),
  loadSceneAssets: async () => {},
  registerAssetLoader: () => {},
}));
const cached = { id: "cached" } as unknown as AudioBuffer;
const loaded = { id: "loaded" } as unknown as AudioBuffer;
const mixed = { id: "mixed" } as unknown as AudioBuffer;
const mixInputs: unknown[][] = [];
vi.mock("../engine/audio/audio-export.ts", () => ({
  mixAudioTracksForExport: (inputs: unknown[]) => {
    mixInputs.push(inputs);
    return mixed;
  },
}));
const videoOptions: unknown[] = [];

const fakeEncoder = (type: string) => ({
  add: async (t: number) => {
    added.push(t);
  },
  finish: async () => new Blob([], { type }),
});
vi.mock("./gif-encoder.ts", () => ({
  createGifEncoder: () => fakeEncoder("image/gif"),
}));
vi.mock("./video-encoder.ts", () => ({
  createVideoEncoder: async (_c: unknown, _fps: number, o: unknown) => {
    videoOptions.push(o);
    return fakeEncoder("video/mp4");
  },
}));

/** The canvas sizes asked for, and what each frame's context was scaled by. */
const canvases: { width: number; height: number }[] = [];
const scales: [number, number][] = [];

class FakeOffscreenCanvas {
  constructor(
    public width: number,
    public height: number,
  ) {
    canvases.push({ width, height });
  }
  getContext() {
    return {
      setTransform() {},
      clearRect() {},
      scale: (x: number, y: number) => scales.push([x, y]),
    };
  }
  async convertToBlob({ type }: { type: string }) {
    return new Blob([], { type });
  }
}

const { exportScene } = await import("./export.ts");

function scene(over: Partial<Scene> = {}): Scene {
  return { ...defaultScene(), width: 1080, height: 1080, ...over };
}

beforeEach(() => {
  drawn.length = 0;
  added.length = 0;
  canvases.length = 0;
  scales.length = 0;
  mixInputs.length = 0;
  videoOptions.length = 0;
  vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
  vi.stubGlobal("document", { fonts: { ready: Promise.resolve() } });
});

describe("exportScene", () => {
  it("a PNG is the one frame at the asked time", async () => {
    const blob = await exportScene(
      scene({ duration: 4 }),
      { format: "png", scale: 1, fps: 30, time: 1.5 },
      () => {},
    );
    expect(blob.type).toBe("image/png");
    expect(drawn).toEqual([1.5]);
  });

  it("an animation is every frame of the duration at the fps, with progress per frame", async () => {
    const progress: [number, number][] = [];
    const blob = await exportScene(
      scene({ duration: 0.5 }),
      { format: "gif", scale: 1, fps: 10, time: 0 },
      (done, total) => progress.push([done, total]),
    );
    expect(blob.type).toBe("image/gif");
    const times = [0, 0.1, 0.2, 0.3, 0.4];
    expect(drawn).toEqual(times);
    expect(added).toEqual(times);
    expect(progress).toEqual([1, 2, 3, 4, 5].map((n) => [n, 5]));
  });

  it("a video goes through the video encoder", async () => {
    const blob = await exportScene(
      scene({ duration: 0.1 }),
      { format: "mp4", scale: 1, fps: 30, time: 0 },
      () => {},
    );
    expect(blob.type).toBe("video/mp4");
    expect(added).toHaveLength(3);
    expect(videoOptions).toEqual([{}]);
  });

  it("a video mixes the audio tracks it can load, cached or not, and skips the rest", async () => {
    const track = (assetId: string, volume: number) => ({
      id: assetId,
      assetId,
      name: assetId,
      volume,
      startOffset: 1,
      trimOffset: 0,
      muted: false,
    });
    await exportScene(
      scene({
        duration: 0.1,
        audioTracks: [
          track("cached.mp3", 0.5),
          track("voz.mp3", 1),
          track("missing.mp3", 1),
        ],
      }),
      { format: "mp4", scale: 1, fps: 30, time: 0 },
      () => {},
    );
    expect(mixInputs).toEqual([
      [
        expect.objectContaining({
          buffer: cached,
          volume: 0.5,
          startOffset: 1,
        }),
        expect.objectContaining({ buffer: loaded, volume: 1 }),
      ],
    ]);
    expect(videoOptions).toEqual([{ audioBuffer: mixed, audioStartOffset: 0 }]);
  });

  it("the output size is the scene size times the scale, rounded to even pixels", async () => {
    await exportScene(
      scene({ width: 1001, height: 333 }),
      { format: "png", scale: 0.25, fps: 30, time: 0 },
      () => {},
    );
    expect(canvases).toEqual([{ width: 250, height: 84 }]);
    expect(scales).toEqual([[250 / 1001, 84 / 333]]);
  });

  it("a tiny scale still gives a canvas of at least 2 by 2", async () => {
    await exportScene(
      scene({ width: 4, height: 4 }),
      { format: "png", scale: 0.01, fps: 30, time: 0 },
      () => {},
    );
    expect(canvases).toEqual([{ width: 2, height: 2 }]);
  });
});
