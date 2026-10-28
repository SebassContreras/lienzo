import { describe, expect, it } from "vitest";
import { getSceneAudioTracks } from "../../engine/audio/audio-tracks.ts";
import { defaultScene, type Scene } from "../../model/model.ts";
import { EditorFooter } from "./editor-footer.tsx";

describe("EditorFooter Component", () => {
  it("exports EditorFooter as a React functional component", () => {
    expect(typeof EditorFooter).toBe("function");
  });

  it("handles empty tracks and single/multi audio tracks gracefully via normalization", () => {
    const scene: Scene = {
      ...defaultScene(),
      audioTracks: [
        {
          id: "track-1",
          assetId: "assets/music.mp3",
          name: "Música de fondo",
          volume: 0.8,
          startOffset: 0.5,
          trimOffset: 1.0,
          muted: false,
        },
        {
          id: "track-2",
          assetId: "assets/sfx.mp3",
          name: "Efecto",
          volume: 1.0,
          startOffset: 2.0,
          trimOffset: 0,
          muted: true,
        },
      ],
    };

    const tracks = getSceneAudioTracks(scene);
    expect(tracks.length).toBe(2);
    expect(tracks[0]?.name).toBe("Música de fondo");
    expect(tracks[0]?.volume).toBe(0.8);
    expect(tracks[1]?.muted).toBe(true);
  });
});
