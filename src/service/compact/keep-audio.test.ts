import { describe, expect, it } from "vitest";
import { defaultScene } from "../../model/model.ts";
import { expandScene } from "./expand.ts";
import { keepAudio } from "./keep-audio.ts";

const voice = { id: "track-1", assetId: "voice", startOffset: 2 };

describe("compact audioTracks (060/R3)", () => {
  it("expands an entry to a full track with id track-1", async () => {
    const { scene } = await expandScene({
      elements: [],
      audioTracks: [{ assetId: "voice", startOffset: 2 }],
    });

    expect(scene.audioTracks).toEqual([voice]);
  });
});

describe("keepAudio (060/R3)", () => {
  it("keeps the stored tracks when the compact scene has none, with a notice", () => {
    const previous = { ...defaultScene(), audioTracks: [voice] };

    const kept = keepAudio(defaultScene(), previous, {});

    expect(kept.scene.audioTracks).toEqual([voice]);
    expect(kept.notice).toContain("1 pista(s)");
  });

  it("replaces the stored tracks when the compact scene gives audioTracks: []", () => {
    const previous = { ...defaultScene(), audioTracks: [voice] };
    const built = { ...defaultScene(), audioTracks: [] };

    const kept = keepAudio(built, previous, { audioTracks: [] });

    expect(kept.scene.audioTracks).toEqual([]);
    expect(kept.notice).toBeUndefined();
  });

  it("changes nothing when there is no stored scene", () => {
    const built = defaultScene();

    expect(keepAudio(built, undefined, {})).toEqual({ scene: built });
  });
});
