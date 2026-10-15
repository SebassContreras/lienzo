import { Mic, Play, Sparkles, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Scene } from "../../model/model.ts";
import { uploadAsset } from "../../presets/store.ts";
import {
  persistOpenRouterApiKey,
  resolveOpenRouterApiKey,
} from "../../service/tts/config.ts";
import { OpenRouterTtsAdapter } from "../../service/tts/openrouter-adapter.ts";
import { attachSpeechToScene } from "../../service/tts/scene-audio.ts";
import { alignScriptToCues } from "../../service/tts/speech-alignment.ts";
import {
  POPULAR_TTS_MODELS,
  type TtsModel,
  type TtsService,
} from "../../service/tts/types.ts";

export interface TtsDialogProps {
  scene: Scene;
  onUpdateScene: (updatedScene: Scene) => void;
  setStatus: (msg: string) => void;
  ttsService?: TtsService;
}

export function TtsDialog({
  scene,
  onUpdateScene,
  setStatus,
  ttsService = new OpenRouterTtsAdapter(),
}: TtsDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [apiKey, setApiKey] = useState("");
  const [script, setScript] = useState("");
  const [models, setModels] = useState<TtsModel[]>(POPULAR_TTS_MODELS);
  const [selectedModel, setSelectedModel] = useState("openai/tts-1");
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [speed, setSpeed] = useState(1.0);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [adjustDuration, setAdjustDuration] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setApiKey(resolveOpenRouterApiKey());
    ttsService
      .listModels()
      .then((m) => {
        if (m.length > 0) setModels(m);
      })
      .catch(() => {});
  }, [ttsService]);

  const currentModel =
    models.find((m) => m.id === selectedModel) ?? models[0];

  const handleOpen = () => {
    setErrorMsg("");
    setApiKey(resolveOpenRouterApiKey());
    dialog.current?.showModal();
  };

  const handleClose = () => {
    dialog.current?.close();
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    persistOpenRouterApiKey(key);
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      setErrorMsg("Escribe un guión para generar el audio.");
      return;
    }
    const resolvedKey = resolveOpenRouterApiKey(apiKey);
    if (!resolvedKey) {
      setErrorMsg("Se requiere una API Key de OpenRouter.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");

    try {
      const result = await ttsService.synthesizeSpeech({
        text: script.trim(),
        model: selectedModel,
        voice: selectedVoice,
        speed,
        apiKey: resolvedKey,
        format: "mp3",
      });

      // Calculate audio duration
      let durationSeconds = result.durationSeconds;
      if (!durationSeconds || durationSeconds <= 0) {
        // Estimate: 128kbps MP3 ≈ 16KB/s
        durationSeconds = Math.max(
          1,
          Math.round((result.audioBuffer.length / 16000) * 10) / 10,
        );
      }

      // Convert Uint8Array to File and upload to assets/
      const audioBlob = new Blob([result.audioBuffer as unknown as BlobPart], {
        type: result.mimeType || "audio/mpeg",
      });
      const audioFile = new File([audioBlob], `speech-${Date.now()}.mp3`, {
        type: "audio/mpeg",
      });

      const assetPath = await uploadAsset(audioFile, {
        exts: ["mp3"],
        error: "Formato de audio no compatible",
      });

      // Generate subtitle cues if enabled
      const cues = generateSubtitles
        ? alignScriptToCues(script.trim(), {
            totalDuration: durationSeconds,
            startOffset: 0,
          })
        : undefined;

      // Update scene with audio track and subtitles
      const updatedScene = attachSpeechToScene(scene, {
        assetId: assetPath,
        audioDuration: durationSeconds,
        adjustSceneDuration: adjustDuration,
        cues,
      });

      onUpdateScene(updatedScene);
      setStatus("Voz generada y vinculada a la escena");
      handleClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        title="Generar locución con IA (OpenRouter TTS)"
        onClick={handleOpen}
      >
        <Mic size={16} /> Voz IA
      </button>

      <dialog ref={dialog} className="scenes-dialog tts-dialog">
        <div className="title">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mic size={20} />
            <span>Generar voz y locución (TTS)</span>
          </div>
          <button type="button" title="Cerrar" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              OpenRouter API Key:
            </span>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--fg)",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              Guión / Texto a narrar:
            </span>
            <textarea
              rows={4}
              placeholder="Escribe aquí el texto que dirá la voz en off..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--fg)",
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Modelo:</span>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  const m = models.find((x) => x.id === e.target.value);
                  if (m && m.voices.length > 0) {
                    setSelectedVoice(m.voices[0].id);
                  }
                }}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--fg)",
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Voz:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--fg)",
                }}
              >
                {currentModel?.voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.gender ? `(${v.gender})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={generateSubtitles}
                onChange={(e) => setGenerateSubtitles(e.target.checked)}
              />
              Crear subtítulos automáticos
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={adjustDuration}
                onChange={(e) => setAdjustDuration(e.target.checked)}
              />
              Ajustar duración de escena
            </label>
          </div>

          {errorMsg && (
            <div
              style={{
                color: "var(--danger, #ef4444)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button type="button" onClick={handleClose} disabled={isGenerating}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Sparkles size={16} />
            {isGenerating ? "Generando voz..." : "Generar y Aplicar"}
          </button>
        </div>
      </dialog>
    </>
  );
}
