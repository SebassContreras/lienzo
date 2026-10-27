import { describe, expect, it } from "vitest";
import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import { defaultElement, defaultScene } from "../../model/model.ts";
import { expandScene } from "./expand.ts";
import { keepAudio } from "./keep-audio.ts";

describe("compact fit and use sizing", () => {
  it("keeps a polygon's fit: box as its own field, with no notice", async () => {
    const { scene, notices } = await expandScene({
      elements: [{ kind: "polygon", sides: 3, w: 300, h: 200, fit: "box" }],
    });

    expect(scene.elements[0]).toMatchObject({ fit: "box" });
    expect(notices.join()).not.toContain("__fit");
  });

  it("sizes a use from its symbol unless w/h are given", async () => {
    const { scene } = await expandScene({
      symbols: { chip: { w: 200, h: 80, children: [] } },
      elements: [
        { kind: "use", symbol: "chip" },
        { kind: "use", symbol: "chip", w: 50 },
      ],
    });

    expect(scene.elements[0]).toMatchObject({ w: 200, h: 80 });
    expect(scene.elements[1]).toMatchObject({ w: 50, h: 80 });
  });
});

describe("keepAudio keeps the subtitle cues", () => {
  const cues = [{ start: 0, end: 1, text: "hola" }];
  const subtitles = { ...(defaultElement("subtitles") as SubtitlesEl), cues };
  const previous = {
    ...defaultScene(),
    audioTracks: [{ id: "track-1", assetId: "voice", startOffset: 0 }],
    elements: [subtitles],
  };

  it("adds the stored subtitles when the build has none", () => {
    const kept = keepAudio(defaultScene(), previous, {});

    expect(kept.scene.elements).toEqual([subtitles]);
    expect(kept.notice).toContain("1 subtítulo(s)");
  });

  it("fills a built subtitles element that only has the sample cues", () => {
    const built = {
      ...defaultScene(),
      elements: [defaultElement("subtitles")],
    };

    const kept = keepAudio(built, previous, {});

    expect((kept.scene.elements[0] as SubtitlesEl).cues).toEqual(cues);
  });
});
