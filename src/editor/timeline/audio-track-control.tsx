import { Music, Trash2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useRef } from "react";
import type { Scene, SceneAudio } from "../../model/model.ts";
import { AUDIO_FILES, uploadAsset } from "../../presets/store.ts";

export type AudioTrackControlProps = {
  scene: Scene;
  onChange: (audio: SceneAudio | undefined) => void;
  setStatus?: (status: string) => void;
};

export function AudioTrackControl({
  scene,
  onChange,
  setStatus,
}: AudioTrackControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audio = scene.audio;

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const path = await uploadAsset(file, AUDIO_FILES);
        onChange({
          assetId: path,
          volume: audio?.volume ?? 1,
          startOffset: audio?.startOffset ?? 0,
          trimOffset: audio?.trimOffset ?? 0,
        });
        setStatus?.(`Audio cargado: ${file.name}`);
      } catch (err) {
        setStatus?.(
          `Error al cargar audio: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [audio, onChange, setStatus],
  );

  const toggleMute = useCallback(() => {
    if (!audio) return;
    const currentVol = audio.volume ?? 1;
    onChange({
      ...audio,
      volume: currentVol > 0 ? 0 : 1,
    });
  }, [audio, onChange]);

  const updateVolume = useCallback(
    (vol: number) => {
      if (!audio) return;
      onChange({
        ...audio,
        volume: vol,
      });
    },
    [audio, onChange],
  );

  const updateStartOffset = useCallback(
    (offset: number) => {
      if (!audio) return;
      onChange({
        ...audio,
        startOffset: Math.max(0, offset),
      });
    },
    [audio, onChange],
  );

  const removeAudio = useCallback(() => {
    onChange(undefined);
    setStatus?.("Pista de audio eliminada");
  }, [onChange, setStatus]);

  const fileName = audio?.assetId ? audio.assetId.split("/").pop() : "";

  return (
    <div
      className="audio-track-control"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        padding: "4px 8px",
        background: "rgba(0,0,0,0.25)",
        borderRadius: "4px",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.aac,.ogg,audio/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUpload(file);
        }}
      />

      {!audio ? (
        <button
          type="button"
          className="audio-add-btn"
          title="Añadir pista de audio a la escena"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "transparent",
            border: "1px dashed rgba(255,255,255,0.3)",
            color: "inherit",
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          <Music size={14} /> + Audio
        </button>
      ) : (
        <>
          <span
            title={fileName}
            style={{
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Music size={14} />
            {fileName}
          </span>

          <button
            type="button"
            title="Reemplazar audio"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            Cambiar
          </button>

          <button
            type="button"
            title={
              (audio.volume ?? 1) > 0 ? "Silenciar audio" : "Activar sonido"
            }
            onClick={toggleMute}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            {(audio.volume ?? 1) > 0 ? (
              <Volume2 size={14} />
            ) : (
              <VolumeX size={14} />
            )}
          </button>

          <label
            style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
            title="Volumen"
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.volume ?? 1}
              onChange={(e) => updateVolume(Number(e.target.value))}
              style={{ width: "50px" }}
            />
          </label>

          <label
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            title="Inicio en escena (segundos)"
          >
            Inicio:
            <input
              type="number"
              min={0}
              max={scene.duration}
              step={0.1}
              value={audio.startOffset ?? 0}
              onChange={(e) => updateStartOffset(Number(e.target.value))}
              style={{
                width: "45px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "inherit",
                borderRadius: "2px",
                padding: "1px 2px",
              }}
            />
            s
          </label>

          <button
            type="button"
            title="Eliminar pista de audio"
            onClick={removeAudio}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}
