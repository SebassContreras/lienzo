import { describe, expect, it } from "vitest";
import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import { defaultElement, defaultScene } from "../../model/model.ts";
import { expandScene } from "./expand.ts";
import { keepAudio } from "./keep-audio.ts";

const voice = { id: "track-1", assetId: "voice", startOffset: 2 };

describe("compact audioTracks", () => {
  it("expands an entry to a full track with id track-1", async () => {
    const { scene } = await expandScene({
      elements: [],
      audioTracks: [{ assetId: "voice", startOffset: 2 }],
    });

    expect(scene.audioTracks).toEqual([voice]);
  });
});

describe("keepAudio", () => {
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

describe("keepAudio keeps the subtitle cues", () => {
  const cues = [{ start: 0, end: 1, text: "hola" }];
  const subtitles = { ...(defaultElement("subtitles") as SubtitlesEl), cues };
  const previous = {
    ...defaultScene(),
    audioTracks: [voice],
    elements: [subtitles],
  };

  it("adds the stored subtitles when the build has none", () => {
    const kept = keepAudio(defaultScene(), previous, { elements: [] });

    expect(kept.scene.elements).toEqual([subtitles]);
    expect(kept.notice).toContain("1 subtítulo(s)");
  });

  it("fills a built subtitles element given no cues", () => {
    const built = {
      ...defaultScene(),
      elements: [defaultElement("subtitles")],
    };

    const kept = keepAudio(built, previous, {
      elements: [{ kind: "subtitles" }],
    });

    expect((kept.scene.elements[0] as SubtitlesEl).cues).toEqual(cues);
  });

  it("leaves the cues the input gives untouched", () => {
    const own = [{ start: 0, end: 2, text: "nuevo" }];
    const built = {
      ...defaultScene(),
      elements: [
        { ...(defaultElement("subtitles") as SubtitlesEl), cues: own },
      ],
    };

    const kept = keepAudio(built, previous, {
      elements: [{ kind: "subtitles", cues: own }],
    });

    expect((kept.scene.elements[0] as SubtitlesEl).cues).toEqual(own);
    expect(kept.notice).not.toContain("subtítulo");
  });

  it("drops the stored cues along with the audio when audioTracks: [] is given", () => {
    const kept = keepAudio(defaultScene(), previous, {
      audioTracks: [],
      elements: [],
    });

    expect(kept.scene.elements).toEqual([]);
  });
});
