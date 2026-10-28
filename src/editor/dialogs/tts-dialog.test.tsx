// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { defaultScene, type Scene } from "../../model/model.ts";
import { loadTtsPreferences } from "../../service/speech/preferences.ts";
import type { TtsService } from "../../service/speech/types.ts";
import { TtsDialog } from "./tts-dialog.tsx";

const uploadAsset = vi.fn(async () => "assets/speech.mp3");
vi.mock("../../presets/store.ts", () => ({
  uploadAsset: (...a: unknown[]) => uploadAsset(...(a as [])),
}));

/** A speech service that answers with `bytes` of audio lasting `seconds` (0 = not reported). */
function service(bytes: number, seconds: number) {
  const synthesizeSpeech = vi.fn(async () => ({
    audioBuffer: new Uint8Array(bytes),
    durationSeconds: seconds,
    mimeType: "audio/mpeg",
  }));
  return {
    synthesizeSpeech,
    listModels: async () => [],
  } as unknown as TtsService & { synthesizeSpeech: typeof synthesizeSpeech };
}

function dialog(
  tts: TtsService,
  extra: Partial<Parameters<typeof TtsDialog>[0]> = {},
) {
  const props = {
    onUpdateScene: vi.fn(),
    setStatus: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <TtsDialog
      scene={{ ...defaultScene(), duration: 3 }}
      ttsService={tts}
      isOpen
      {...props}
      {...extra}
    />,
  );
  return props;
}

const script = () =>
  screen.getByPlaceholderText(/Escribe aquí el texto/) as HTMLTextAreaElement;
const generate = () => fireEvent.click(screen.getByText("Generar y Aplicar"));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
beforeEach(() => {
  localStorage.clear();
  uploadAsset.mockClear();
});
afterEach(cleanup);

describe("TtsDialog", () => {
  it("asks for a script before calling the service", async () => {
    const tts = service(100, 1);
    dialog(tts);
    generate();
    await screen.findByText("Escribe un guión para generar el audio.");
    expect(tts.synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("speaks the script, uploads the audio and attaches it with subtitles, lengthening the scene", async () => {
    const tts = service(100, 5);
    const { onUpdateScene, setStatus, onClose } = dialog(tts);
    fireEvent.change(script(), { target: { value: "  Hola a todos  " } });
    generate();
    await vi.waitFor(() => expect(onUpdateScene).toHaveBeenCalled());

    expect(tts.synthesizeSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Hola a todos",
        model: "openai/tts-1",
        voice: "alloy",
        speed: 1,
        format: "mp3",
      }),
    );
    expect(uploadAsset).toHaveBeenCalledOnce();
    const scene = onUpdateScene.mock.calls[0][0] as Scene;
    expect(scene.audio?.assetId).toBe("assets/speech.mp3");
    expect(scene.duration).toBe(5.2);
    expect(scene.elements.some((e) => e.kind === "subtitles")).toBe(true);
    expect(setStatus).toHaveBeenCalledWith(
      "Voz generada y vinculada a la escena",
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("without a reported length, estimates it from the size; options can skip subtitles and the duration", async () => {
    const tts = service(64000, 0);
    const { onUpdateScene } = dialog(tts);
    fireEvent.change(script(), { target: { value: "Hola" } });
    fireEvent.click(screen.getByLabelText("Crear subtítulos automáticos"));
    fireEvent.click(screen.getByLabelText("Ajustar duración de escena"));
    generate();
    await vi.waitFor(() => expect(onUpdateScene).toHaveBeenCalled());
    const scene = onUpdateScene.mock.calls[0][0] as Scene;
    expect(scene.duration).toBe(3);
    expect(scene.elements.some((e) => e.kind === "subtitles")).toBe(false);
    // the choices are remembered
    expect(loadTtsPreferences()).toMatchObject({
      generateSubtitles: false,
      adjustDuration: false,
    });
  });

  it("a local provider resets model and voice to its defaults and hides the API key", () => {
    dialog(service(1, 1));
    expect(screen.getByPlaceholderText(/sk-or-v1/)).toBeTruthy();
    fireEvent.click(screen.getByText("Local / Kokoro (Offline)"));
    expect(screen.queryByPlaceholderText(/sk-or-v1/)).toBeNull();
    expect(loadTtsPreferences()).toMatchObject({
      provider: "local",
      model: "kokoro-es",
      voice: "ef_dora",
    });
  });

  it("shows a failure of the service and keeps the dialog open", async () => {
    const tts = service(1, 1);
    tts.synthesizeSpeech.mockImplementation(async () => {
      throw new Error("Cuota agotada");
    });
    const { onClose, onUpdateScene } = dialog(tts);
    fireEvent.change(script(), { target: { value: "Hola" } });
    generate();
    await screen.findByText("Cuota agotada");
    expect(onClose).not.toHaveBeenCalled();
    expect(onUpdateScene).not.toHaveBeenCalled();
  });

  it("a voice preset fills the script, voice and speed", async () => {
    const tts = service(100, 1);
    const { onUpdateScene } = dialog(tts, {
      initialVoicePreset: {
        sampleScript: "Bienvenidos",
        voice: "nova",
        speed: 1.25,
      },
    });
    expect(script().value).toBe("Bienvenidos");
    generate();
    await vi.waitFor(() => expect(onUpdateScene).toHaveBeenCalled());
    expect(tts.synthesizeSpeech).toHaveBeenCalledWith(
      expect.objectContaining({ voice: "nova", speed: 1.25 }),
    );
  });
});
