// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AudioTrackItem,
  defaultScene,
  type Scene,
} from "../../model/model.ts";
import type { Clock } from "../stage.tsx";
import { EditorFooter } from "./editor-footer.tsx";

const uploadAsset = vi.fn();
let uploadFails: Error | undefined;
vi.mock("../../presets/store.ts", () => ({
  AUDIO_FILES: "audio",
  uploadAsset: async (file: File) => {
    if (uploadFails) throw uploadFails;
    return uploadAsset(file);
  },
}));

const track = (id: string, over: Partial<AudioTrackItem> = {}) => ({
  id,
  assetId: `assets/${id}.mp3`,
  name: id,
  volume: 0.8,
  startOffset: 0,
  trimOffset: 0,
  muted: false,
  ...over,
});

function footer(scene: Partial<Scene> = {}) {
  const props = {
    onTracksChange: vi.fn(),
    onAudioChange: vi.fn(),
    onScrub: vi.fn(),
    togglePlay: vi.fn(),
    setStatus: vi.fn(),
  };
  render(
    <EditorFooter
      clock={{ current: { t: 0, playing: false } as Clock }}
      duration={10}
      playing={false}
      scene={{ ...defaultScene(), duration: 10, ...scene }}
      {...props}
    />,
  );
  return props;
}

/** The tracks the last change handed to the editor. */
const lastTracks = (onTracksChange: ReturnType<typeof vi.fn>) =>
  onTracksChange.mock.lastCall?.[0] as AudioTrackItem[];

const fileInput = () =>
  document.querySelector("input[type=file]") as HTMLInputElement;

beforeEach(() => {
  uploadAsset.mockReset();
  uploadFails = undefined;
});
afterEach(cleanup);

describe("EditorFooter", () => {
  it("plays and scrubs", () => {
    const { togglePlay, onScrub } = footer();
    fireEvent.click(screen.getByTitle(/Reproducir/));
    expect(togglePlay).toHaveBeenCalled();
    fireEvent.input(document.querySelector(".scrub-slider") as Element, {
      target: { value: "3.5" },
    });
    expect(onScrub).toHaveBeenCalledWith(3.5);
  });

  it("marks each shot on the scrub bar by its span", () => {
    footer({
      shots: [{ id: "a", name: "Intro", start: 0, end: 2.5 }],
    } as Partial<Scene>);
    const shot = document.querySelector(".shot-block-marker") as HTMLElement;
    expect(shot.textContent).toBe("Intro");
    expect(shot.style.width).toBe("25%");
  });

  it("uploads a first track named after the file", async () => {
    uploadAsset.mockResolvedValue("assets/voz.mp3");
    const { onTracksChange, onAudioChange, setStatus } = footer();
    fireEvent.change(fileInput(), {
      target: { files: [new File(["x"], "voz.mp3")] },
    });
    await vi.waitFor(() => expect(onTracksChange).toHaveBeenCalled());
    expect(lastTracks(onTracksChange)).toEqual([
      expect.objectContaining({ assetId: "assets/voz.mp3", name: "voz" }),
    ]);
    // the legacy single audio follows the first track
    expect(onAudioChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ assetId: "assets/voz.mp3" }),
    );
    expect(setStatus).toHaveBeenCalledWith("Pista de audio añadida: voz.mp3");
  });

  it("replaces the file of one track and keeps its settings", async () => {
    uploadAsset.mockResolvedValue("assets/nueva.mp3");
    const { onTracksChange } = footer({
      audioTracks: [track("a", { volume: 0.3 }), track("b")],
    });
    fireEvent.click(screen.getAllByText("Cambiar")[1]);
    fireEvent.change(fileInput(), {
      target: { files: [new File(["x"], "nueva.wav")] },
    });
    await vi.waitFor(() => expect(onTracksChange).toHaveBeenCalled());
    expect(lastTracks(onTracksChange)).toEqual([
      track("a", { volume: 0.3 }),
      track("b", { assetId: "assets/nueva.mp3", name: "nueva" }),
    ]);
  });

  it("an upload failure is reported, and nothing changes", async () => {
    uploadFails = new Error("muy grande");
    const { onTracksChange, setStatus } = footer();
    fireEvent.change(fileInput(), {
      target: { files: [new File(["x"], "voz.mp3")] },
    });
    await vi.waitFor(() =>
      expect(setStatus).toHaveBeenCalledWith(
        expect.stringMatching(/^Error al cargar audio: .*muy grande/),
      ),
    );
    expect(onTracksChange).not.toHaveBeenCalled();
  });

  it("mutes, sets volume, start and trim of one track; offsets are never negative", () => {
    const { onTracksChange, onAudioChange } = footer({
      audioTracks: [track("a")],
    });
    fireEvent.click(screen.getByTitle("Silenciar audio"));
    expect(lastTracks(onTracksChange)[0].muted).toBe(true);
    // a muted first track is silent in the legacy audio
    expect(onAudioChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ volume: 0 }),
    );

    fireEvent.change(document.querySelector(".volume-slider") as Element, {
      target: { value: "0.5" },
    });
    expect(lastTracks(onTracksChange)[0].volume).toBe(0.5);

    const [start, trim] = document.querySelectorAll(".offset-input");
    fireEvent.change(start, { target: { value: "-2" } });
    expect(lastTracks(onTracksChange)[0].startOffset).toBe(0);
    fireEvent.change(trim, { target: { value: "1.5" } });
    expect(lastTracks(onTracksChange)[0].trimOffset).toBe(1.5);
  });

  it("reorders and removes tracks", () => {
    const { onTracksChange, onAudioChange } = footer({
      audioTracks: [track("a"), track("b")],
    });
    const [upA, upB] = screen.getAllByTitle("Mover pista arriba");
    expect((upA as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(upB);
    expect(lastTracks(onTracksChange).map((t) => t.id)).toEqual(["b", "a"]);

    cleanup();
    const after = footer({ audioTracks: [track("a")] });
    fireEvent.click(screen.getByTitle("Eliminar pista de audio"));
    expect(lastTracks(after.onTracksChange)).toEqual([]);
    expect(after.onAudioChange).toHaveBeenLastCalledWith(undefined);
    expect(onAudioChange).toHaveBeenCalled();
  });

  it("hides and shows the track rows, counting them", () => {
    footer({ audioTracks: [track("a"), track("b")] });
    const toggle = screen.getByTitle("Ocultar pistas de audio");
    expect(toggle.textContent).toContain("2 pistas");
    fireEvent.click(toggle);
    expect(document.querySelector(".audio-tracks-rows")).toBeNull();
    fireEvent.click(screen.getByTitle("Mostrar pistas de audio"));
    expect(document.querySelectorAll(".audio-track-row")).toHaveLength(2);
  });
});
