import { describe, expect, it } from "vitest";
import { defaultScene } from "./model.ts";
import { parseScene } from "./schema.ts";

describe("scene audio schema validation", () => {
  it("validates a scene with a valid audio track (R1)", () => {
    const scene = {
      ...defaultScene(),
      audio: {
        assetId: "/assets/test.mp3",
        volume: 0.8,
        startOffset: 1.5,
        trimOffset: 0.5,
      },
    };
    const res = parseScene(scene);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.audio?.assetId).toBe("/assets/test.mp3");
      expect(res.value.audio?.volume).toBe(0.8);
      expect(res.value.audio?.startOffset).toBe(1.5);
      expect(res.value.audio?.trimOffset).toBe(0.5);
    }
  });

  it("allows audio with only assetId (defaults volume, startOffset, trimOffset)", () => {
    const scene = {
      ...defaultScene(),
      audio: {
        assetId: "/assets/minimal.wav",
      },
    };
    const res = parseScene(scene);
    expect(res.ok).toBe(true);
  });

  it("rejects invalid volume out of 0..1 range", () => {
    const scene = {
      ...defaultScene(),
      audio: {
        assetId: "/assets/test.mp3",
        volume: 1.5,
      },
    };
    const res = parseScene(scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.path).toBe("audio.volume");
    }
  });

  it("rejects negative startOffset", () => {
    const scene = {
      ...defaultScene(),
      audio: {
        assetId: "/assets/test.mp3",
        startOffset: -1,
      },
    };
    const res = parseScene(scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.path).toBe("audio.startOffset");
    }
  });

  it("rejects empty assetId", () => {
    const scene = {
      ...defaultScene(),
      audio: {
        assetId: "",
      },
    };
    const res = parseScene(scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.path).toBe("audio.assetId");
    }
  });
});
