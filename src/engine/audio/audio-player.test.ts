import { describe, expect, it } from "vitest";
import type { Scene } from "../../model/model.ts";
import { defaultScene } from "../../model/model.ts";
import { WebAudioPlayer } from "./audio-player.ts";

describe("WebAudioPlayer multi-audio playback synchronization", () => {
  it("initializes without errors in non-browser or mock environment", () => {
    const player = new WebAudioPlayer();
    expect(player).toBeDefined();

    // sync with empty tracks shouldn't throw
    player.sync(0, false, 5);
    player.pause();
    player.dispose();
  });

  it("syncScene delegates to multi-track sync logic gracefully", () => {
    const player = new WebAudioPlayer();
    const scene: Scene = {
      ...defaultScene(),
      audioTracks: [
        {
          id: "t1",
          assetId: "/assets/narration.mp3",
          volume: 0.9,
          startOffset: 0.5,
          trimOffset: 0,
          muted: false,
        },
        {
          id: "t2",
          assetId: "/assets/music.mp3",
          volume: 0.3,
          startOffset: 0,
          trimOffset: 1.0,
          muted: false,
        },
      ],
    };

    // Calling syncScene should execute without runtime crash
    expect(() => {
      player.syncScene(1.0, true, scene);
    }).not.toThrow();

    expect(() => {
      player.pause();
      player.dispose();
    }).not.toThrow();
  });

  it("handles muted tracks by skipping playback sources", () => {
    const player = new WebAudioPlayer();
    const scene: Scene = {
      ...defaultScene(),
      audioTracks: [
        {
          id: "t-muted",
          assetId: "/assets/test.mp3",
          volume: 1,
          startOffset: 0,
          trimOffset: 0,
          muted: true,
        },
      ],
    };

    expect(() => {
      player.syncScene(0.5, true, scene);
    }).not.toThrow();
    player.dispose();
  });
});
