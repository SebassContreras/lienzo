import { describe, expect, it } from "vitest";
import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import { getSceneAudioTracks } from "../../engine/audio/audio-tracks.ts";
import { defaultScene, type Scene } from "../../model/model.ts";
import { attachSpeechToScene } from "./scene-audio.ts";

const cue = (start: number, end: number, text: string) => ({
  start,
  end,
  text,
});

const subtitlesOf = (scene: Scene) =>
  scene.elements.find((el) => el.kind === "subtitles") as SubtitlesEl;

describe("attachSpeechToScene with asTrack", () => {
  it("keeps one voice track per call with its startOffset", () => {
    const first = attachSpeechToScene(defaultScene(), {
      assetId: "voice-1",
      audioDuration: 2,
      startOffset: 0,
      asTrack: true,
    });

    const second = attachSpeechToScene(first, {
      assetId: "voice-2",
      audioDuration: 3,
      startOffset: 4,
      asTrack: true,
    });

    expect(second.audioTracks?.map((t) => [t.assetId, t.startOffset])).toEqual([
      ["voice-1", 0],
      ["voice-2", 4],
    ]);
  });

  it("keeps scene.audio and plays it once among the tracks", () => {
    const music = { assetId: "music", volume: 0.4, startOffset: 0 };
    const scene = { ...defaultScene(), audio: music };

    const updated = attachSpeechToScene(scene, {
      assetId: "voice",
      audioDuration: 2,
      asTrack: true,
    });

    expect(updated.audio).toEqual(music);
    expect(getSceneAudioTracks(updated).map((t) => t.assetId)).toEqual([
      "music",
      "voice",
    ]);
  });

  it("replaces scene.audio without asTrack, as before", () => {
    const scene = { ...defaultScene(), audio: { assetId: "music" } };

    const updated = attachSpeechToScene(scene, {
      assetId: "voice",
      audioDuration: 2,
    });

    expect(updated.audio?.assetId).toBe("voice");
    expect(updated.audioTracks).toBeUndefined();
  });

  it("appends each clip's cues in start order", () => {
    const first = attachSpeechToScene(defaultScene(), {
      assetId: "voice-2",
      audioDuration: 2,
      startOffset: 4,
      asTrack: true,
      cues: [cue(4, 6, "Segunda")],
    });

    const second = attachSpeechToScene(first, {
      assetId: "voice-1",
      audioDuration: 2,
      startOffset: 0,
      asTrack: true,
      cues: [cue(0, 2, "Primera")],
    });

    expect(subtitlesOf(second).cues.map((c) => c.text)).toEqual([
      "Primera",
      "Segunda",
    ]);
  });

  it("replaces the cues of a re-generated clip's window instead of duplicating them", () => {
    const first = attachSpeechToScene(defaultScene(), {
      assetId: "voice-a",
      audioDuration: 2,
      startOffset: 4,
      asTrack: true,
      cues: [cue(4, 6, "Antes")],
    });

    const again = attachSpeechToScene(first, {
      assetId: "voice-b",
      audioDuration: 2,
      startOffset: 4,
      asTrack: true,
      cues: [cue(4, 6, "Después")],
    });

    expect(subtitlesOf(again).cues.map((c) => c.text)).toEqual(["Después"]);
  });
});

describe("attachSpeechToScene cue ids", () => {
  it("numbers the merged cues so every id is unique", () => {
    const first = attachSpeechToScene(defaultScene(), {
      assetId: "voice-1",
      audioDuration: 2,
      asTrack: true,
      cues: [{ id: "cue-1", start: 0, end: 2, text: "uno" }],
    });
    const second = attachSpeechToScene(first, {
      assetId: "voice-2",
      audioDuration: 2,
      startOffset: 4,
      asTrack: true,
      cues: [{ id: "cue-1", start: 4, end: 6, text: "dos" }],
    });

    expect(subtitlesOf(second).cues?.map((c) => c.id)).toEqual([
      "cue-1",
      "cue-2",
    ]);
  });
});
