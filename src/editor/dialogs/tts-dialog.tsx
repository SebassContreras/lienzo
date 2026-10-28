import { Edit3, List, Mic, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene } from "../../model/model.ts";
import type { VoicePreset } from "../../model/voice-preset.ts";
import { uploadAsset } from "../../presets/store.ts";
import {
  DEFAULT_LOCAL_TTS_MODEL,
  DEFAULT_LOCAL_TTS_VOICE,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
  resolveOpenRouterApiKey,
  TTS_PROXY_PATH,
  type TtsProviderType,
} from "../../service/speech/config.ts";
import { createTtsService } from "../../service/speech/factory.ts";
import { POPULAR_LOCAL_TTS_MODELS } from "../../service/speech/local-adapter.ts";
import {
  loadTtsPreferences,
  saveTtsPreferences,
} from "../../service/speech/preferences.ts";
import { attachSpeechToScene } from "../../service/speech/scene-audio.ts";
import { alignScriptToCues } from "../../service/speech/speech-alignment.ts";
import {
  POPULAR_TTS_MODELS,
  type TtsModel,
  type TtsService,
} from "../../service/speech/types.ts";

export interface TtsDialogProps {
  scene: Scene;
  onUpdateScene: (updatedScene: Scene) => void;
  setStatus: (msg: string) => void;
  ttsService?: TtsService;
  isOpen?: boolean;
  onClose?: () => void;
  initialVoicePreset?: Partial<VoicePreset> | null;
}

export function TtsDialog({
  scene,
  onUpdateScene,
  setStatus,
  ttsService: injectedService,
  isOpen,
  onClose,
  initialVoicePreset,
}: TtsDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [provider, setProvider] = useState<TtsProviderType>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [script, setScript] = useState("");
  const [models, setModels] = useState<TtsModel[]>(POPULAR_TTS_MODELS);

  // Dynamic model and voice selection (D4, R3, R4)
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isCustomVoice, setIsCustomVoice] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_TTS_MODEL);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_TTS_VOICE);
  const [speed, setSpeed] = useState(1.0);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [adjustDuration, setAdjustDuration] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeService =
    injectedService ??
    createTtsService({
      provider,
      apiKey: apiKey.trim() || undefined,
      // Without a typed key, OpenRouter goes through the dev server's proxy (046/D4).
      baseUrl: apiKey.trim() ? undefined : TTS_PROXY_PATH,
    });

  // Load preferences from localStorage on mount (D3, R5)
  useEffect(() => {
    const prefs = loadTtsPreferences();
    const savedProvider = (prefs.provider as TtsProviderType) || "openrouter";
    setProvider(savedProvider);
    setApiKey(resolveOpenRouterApiKey(prefs.apiKey));
    setSelectedModel(prefs.model);
    setSelectedVoice(prefs.voice);
    setSpeed(prefs.speed);
    setGenerateSubtitles(prefs.generateSubtitles);
    setAdjustDuration(prefs.adjustDuration);
    setIsCustomModel(Boolean(prefs.isCustomModel));
    setIsCustomVoice(Boolean(prefs.isCustomVoice));

    if (savedProvider === "local" || savedProvider === "kokoro") {
      setModels(POPULAR_LOCAL_TTS_MODELS);
    } else {
      setModels(POPULAR_TTS_MODELS);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setErrorMsg("");
    const prefs = loadTtsPreferences();
    setApiKey(resolveOpenRouterApiKey(prefs.apiKey));
    dialog.current?.showModal();
  }, []);

  const handleClose = useCallback(() => {
    dialog.current?.close();
    onClose?.();
  }, [onClose]);

  const updatePreferences = useCallback(
    (updates: Parameters<typeof saveTtsPreferences>[0]) => {
      saveTtsPreferences(updates);
    },
    [],
  );

  const handleProviderChange = useCallback(
    (newProvider: TtsProviderType) => {
      setProvider(newProvider);
      updatePreferences({ provider: newProvider });

      if (newProvider === "local" || newProvider === "kokoro") {
        setModels(POPULAR_LOCAL_TTS_MODELS);
        setSelectedModel(DEFAULT_LOCAL_TTS_MODEL);
        setSelectedVoice(DEFAULT_LOCAL_TTS_VOICE);
        setIsCustomModel(false);
        setIsCustomVoice(false);
        updatePreferences({
          model: DEFAULT_LOCAL_TTS_MODEL,
          voice: DEFAULT_LOCAL_TTS_VOICE,
          isCustomModel: false,
          isCustomVoice: false,
        });
      } else {
        setModels(POPULAR_TTS_MODELS);
        setSelectedModel(DEFAULT_TTS_MODEL);
        setSelectedVoice(DEFAULT_TTS_VOICE);
        setIsCustomModel(false);
        setIsCustomVoice(false);
        updatePreferences({
          model: DEFAULT_TTS_MODEL,
          voice: DEFAULT_TTS_VOICE,
          isCustomModel: false,
          isCustomVoice: false,
        });
      }
    },
    [updatePreferences],
  );

  // Sync external isOpen prop
  useEffect(() => {
    if (isOpen !== undefined) {
      if (isOpen) {
        handleOpen();
      } else {
        dialog.current?.close();
      }
    }
  }, [isOpen, handleOpen]);

  // Apply initialVoicePreset when provided
  useEffect(() => {
    if (initialVoicePreset) {
      if (initialVoicePreset.provider) {
        handleProviderChange(initialVoicePreset.provider as TtsProviderType);
      }
      if (initialVoicePreset.model) {
        setSelectedModel(initialVoicePreset.model);
        setIsCustomModel(Boolean(initialVoicePreset.isCustomModel));
      }
      if (initialVoicePreset.voice) {
        setSelectedVoice(initialVoicePreset.voice);
        setIsCustomVoice(Boolean(initialVoicePreset.isCustomVoice));
      }
      if (typeof initialVoicePreset.speed === "number") {
        setSpeed(initialVoicePreset.speed);
      }
      if (initialVoicePreset.sampleScript) {
        setScript(initialVoicePreset.sampleScript);
      }
      if (typeof initialVoicePreset.generateSubtitles === "boolean") {
        setGenerateSubtitles(initialVoicePreset.generateSubtitles);
      }
      if (typeof initialVoicePreset.adjustDuration === "boolean") {
        setAdjustDuration(initialVoicePreset.adjustDuration);
      }
    }
  }, [initialVoicePreset, handleProviderChange]);

  const currentModel = models.find((m) => m.id === selectedModel);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    updatePreferences({ apiKey: key });
  };

  const handleModelChange = (model: string, custom = false) => {
    setSelectedModel(model);
    setIsCustomModel(custom);
    updatePreferences({ model, isCustomModel: custom });

    if (!custom) {
      const target = models.find((m) => m.id === model);
      if (target && target.voices.length > 0) {
        if (!target.voices.some((v) => v.id === selectedVoice)) {
          setSelectedVoice(target.voices[0].id);
          setIsCustomVoice(false);
          updatePreferences({
            voice: target.voices[0].id,
            isCustomVoice: false,
          });
        }
      }
    }
  };

  const handleVoiceChange = (voice: string, custom = false) => {
    setSelectedVoice(voice);
    setIsCustomVoice(custom);
    updatePreferences({ voice, isCustomVoice: custom });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    updatePreferences({ speed: val });
  };

  const handleSubtitlesChange = (checked: boolean) => {
    setGenerateSubtitles(checked);
    updatePreferences({ generateSubtitles: checked });
  };

  const handleAdjustDurationChange = (checked: boolean) => {
    setAdjustDuration(checked);
    updatePreferences({ adjustDuration: checked });
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      setErrorMsg("Escribe un guión para generar el audio.");
      return;
    }

    const isLocal =
      provider === "local" || provider === "kokoro" || provider === "custom";
    const resolvedKey = isLocal
      ? undefined
      : resolveOpenRouterApiKey(apiKey) || undefined;

    if (!selectedModel.trim()) {
      setErrorMsg("Especifica un modelo de voz.");
      return;
    }

    if (!selectedVoice.trim()) {
      setErrorMsg("Especifica una voz.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");

    try {
      const result = await activeService.synthesizeSpeech({
        text: script.trim(),
        model: selectedModel.trim(),
        voice: selectedVoice.trim(),
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

      <dialog ref={dialog} className="panel-dialog tts-dialog">
        <div className="title">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mic size={20} />
            <span>Generar voz y locución (TTS)</span>
          </div>
          <button type="button" title="Cerrar" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "8px 0",
          }}
        >
          {/* Provider Selector (OpenRouter vs Local) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              Proveedor de voz (TTS):
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => handleProviderChange("openrouter")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border:
                    provider === "openrouter"
                      ? "2px solid var(--primary, #3b82f6)"
                      : "1px solid var(--border)",
                  background:
                    provider === "openrouter"
                      ? "rgba(59, 130, 246, 0.1)"
                      : "var(--bg-card)",
                  color: "var(--fg)",
                  fontWeight: provider === "openrouter" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                OpenRouter (Nube)
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("local")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border:
                    provider === "local" || provider === "kokoro"
                      ? "2px solid var(--primary, #3b82f6)"
                      : "1px solid var(--border)",
                  background:
                    provider === "local" || provider === "kokoro"
                      ? "rgba(59, 130, 246, 0.1)"
                      : "var(--bg-card)",
                  color: "var(--fg)",
                  fontWeight:
                    provider === "local" || provider === "kokoro" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                Local / Kokoro (Offline)
              </button>
            </div>
          </div>

          {/* Only show API Key field when OpenRouter is selected */}
          {provider === "openrouter" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                OpenRouter API Key:
              </span>
              <input
                type="password"
                placeholder="sk-or-v1-... (o desde .env)"
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
          )}

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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {/* Dynamic Model selection (Presets vs Custom) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                  Modelo:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomModel(!isCustomModel)}
                  title={
                    isCustomModel
                      ? "Elegir de la lista predefinida"
                      : "Escribir modelo personalizado"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--primary, #3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {isCustomModel ? (
                    <>
                      <List size={12} /> Predefinido
                    </>
                  ) : (
                    <>
                      <Edit3 size={12} /> Personalizado
                    </>
                  )}
                </button>
              </div>

              {isCustomModel ? (
                <input
                  type="text"
                  placeholder="ej: openai/tts-1, mistralai/..."
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value, true)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--fg)",
                  }}
                />
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value, false)}
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
              )}
            </div>

            {/* Dynamic Voice selection (Presets vs Custom) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                  Voz:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomVoice(!isCustomVoice)}
                  title={
                    isCustomVoice
                      ? "Elegir de la lista predefinida"
                      : "Escribir voz personalizada"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--primary, #3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {isCustomVoice ? (
                    <>
                      <List size={12} /> Predefinida
                    </>
                  ) : (
                    <>
                      <Edit3 size={12} /> Personalizada
                    </>
                  )}
                </button>
              </div>

              {isCustomVoice || !currentModel ? (
                <input
                  type="text"
                  placeholder="ej: alloy, rachel, nombre-voz"
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value, true)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--fg)",
                  }}
                />
              ) : (
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value, false)}
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
              )}
            </div>
          </div>

          {/* Speed slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--fg-muted)",
              }}
            >
              <span>Velocidad:</span>
              <span>{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary, #3b82f6)" }}
            />
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={generateSubtitles}
                onChange={(e) => handleSubtitlesChange(e.target.checked)}
              />
              Crear subtítulos automáticos
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={adjustDuration}
                onChange={(e) => handleAdjustDurationChange(e.target.checked)}
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

        <div
          className="actions"
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
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
        </div>
      </dialog>
    </>
  );
}
