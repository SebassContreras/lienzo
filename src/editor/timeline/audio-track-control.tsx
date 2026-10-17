import {
  ArrowDown,
  ArrowUp,
  Music,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useRef } from "react";
import {
  createAudioTrack,
  getSceneAudioTracks,
} from "../../engine/audio/audio-tracks.ts";
import type { AudioTrackItem, Scene, SceneAudio } from "../../model/model.ts";
import { AUDIO_FILES, uploadAsset } from "../../presets/store.ts";

export type AudioTrackControlProps = {
  scene: Scene;
  onChange?: (audio: SceneAudio | undefined) => void;
  onTracksChange?: (tracks: AudioTrackItem[]) => void;
  setStatus?: (status: string) => void;
};

export function AudioTrackControl({
  scene,
  onChange,
  onTracksChange,
  setStatus,
}: AudioTrackControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  const tracks = getSceneAudioTracks(scene);

  const updateTracks = useCallback(
    (newTracks: AudioTrackItem[]) => {
      if (onTracksChange) {
        onTracksChange(newTracks);
      } else if (onChange) {
        // Fallback for single track legacy prop
        if (newTracks.length > 0) {
          const first = newTracks[0]!;
          onChange({
            assetId: first.assetId,
            volume: first.muted ? 0 : first.volume,
            startOffset: first.startOffset,
            trimOffset: first.trimOffset,
          });
        } else {
          onChange(undefined);
        }
      }
    },
    [onChange, onTracksChange],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const path = await uploadAsset(file, AUDIO_FILES);
        const targetId = replaceTargetRef.current;
        replaceTargetRef.current = null;

        if (targetId) {
          // Replace existing track's asset
          const updated = tracks.map((t) =>
            t.id === targetId
              ? {
                  ...t,
                  assetId: path,
                  name: file.name.replace(/\.[^/.]+$/, ""),
                }
              : t,
          );
          updateTracks(updated);
          setStatus?.(`Audio reemplazado: ${file.name}`);
        } else {
          // Add new audio track
          const newTrack = createAudioTrack(path, {
            name: file.name.replace(/\.[^/.]+$/, ""),
          });
          updateTracks([...tracks, newTrack]);
          setStatus?.(`Pista de audio añadida: ${file.name}`);
        }
      } catch (err) {
        setStatus?.(
          `Error al cargar audio: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [tracks, updateTracks, setStatus],
  );

  const toggleMute = useCallback(
    (id: string) => {
      const updated = tracks.map((t) =>
        t.id === id ? { ...t, muted: !t.muted } : t,
      );
      updateTracks(updated);
    },
    [tracks, updateTracks],
  );

  const updateVolume = useCallback(
    (id: string, vol: number) => {
      const updated = tracks.map((t) =>
        t.id === id ? { ...t, volume: vol } : t,
      );
      updateTracks(updated);
    },
    [tracks, updateTracks],
  );

  const updateStartOffset = useCallback(
    (id: string, offset: number) => {
      const updated = tracks.map((t) =>
        t.id === id ? { ...t, startOffset: Math.max(0, offset) } : t,
      );
      updateTracks(updated);
    },
    [tracks, updateTracks],
  );

  const updateTrimOffset = useCallback(
    (id: string, offset: number) => {
      const updated = tracks.map((t) =>
        t.id === id ? { ...t, trimOffset: Math.max(0, offset) } : t,
      );
      updateTracks(updated);
    },
    [tracks, updateTracks],
  );

  const removeTrack = useCallback(
    (id: string) => {
      const updated = tracks.filter((t) => t.id !== id);
      updateTracks(updated);
      setStatus?.("Pista de audio eliminada");
    },
    [tracks, updateTracks, setStatus],
  );

  const moveTrack = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= tracks.length) return;
      const copy = [...tracks];
      const [item] = copy.splice(index, 1);
      if (!item) return;
      copy.splice(newIndex, 0, item);
      updateTracks(copy);
    },
    [tracks, updateTracks],
  );

  const triggerUploadNew = () => {
    replaceTargetRef.current = null;
    fileInputRef.current?.click();
  };

  const triggerReplace = (id: string) => {
    replaceTargetRef.current = id;
    fileInputRef.current?.click();
  };

  return (
    <div
      className="audio-tracks-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "12px",
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

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          className="audio-add-btn"
          title="Añadir pista de audio a la escena"
          onClick={triggerUploadNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.06)",
            border: "1px dashed rgba(255,255,255,0.3)",
            color: "inherit",
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          <Plus size={14} /> Añadir audio
        </button>
      </div>

      {tracks.length > 0 && (
        <div
          className="audio-tracks-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            marginTop: "2px",
          }}
        >
          {tracks.map((track, idx) => {
            const fileName =
              track.name ||
              (track.assetId ? track.assetId.split("/").pop() : "Audio");
            const isMuted = track.muted || (track.volume ?? 1) <= 0;

            return (
              <div
                key={track.id}
                className="audio-track-strip"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 6px",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: "4px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveTrack(idx, -1)}
                    title="Mover arriba"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: idx === 0 ? "rgba(255,255,255,0.2)" : "inherit",
                      cursor: idx === 0 ? "default" : "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <ArrowUp size={10} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tracks.length - 1}
                    onClick={() => moveTrack(idx, 1)}
                    title="Mover abajo"
                    style={{
                      background: "transparent",
                      border: "none",
                      color:
                        idx === tracks.length - 1
                          ? "rgba(255,255,255,0.2)"
                          : "inherit",
                      cursor: idx === tracks.length - 1 ? "default" : "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <ArrowDown size={10} />
                  </button>
                </div>

                <span
                  title={fileName}
                  style={{
                    maxWidth: "95px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Music size={12} />
                  {fileName}
                </span>

                <button
                  type="button"
                  title="Reemplazar audio"
                  onClick={() => triggerReplace(track.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: "2px",
                    fontSize: "11px",
                  }}
                >
                  Cambiar
                </button>

                <button
                  type="button"
                  title={isMuted ? "Activar sonido" : "Silenciar audio"}
                  onClick={() => toggleMute(track.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: isMuted ? "#f87171" : "inherit",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  title="Volumen"
                >
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume ?? 1}
                    onChange={(e) =>
                      updateVolume(track.id, Number(e.target.value))
                    }
                    style={{ width: "45px" }}
                  />
                </label>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  title="Inicio en escena (segundos)"
                >
                  Ini:
                  <input
                    type="number"
                    min={0}
                    max={scene.duration}
                    step={0.1}
                    value={track.startOffset ?? 0}
                    onChange={(e) =>
                      updateStartOffset(track.id, Number(e.target.value))
                    }
                    style={{
                      width: "38px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "inherit",
                      borderRadius: "2px",
                      padding: "1px 2px",
                    }}
                  />
                  s
                </label>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  title="Recorte inicial (segundos del archivo original)"
                >
                  Corte:
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={track.trimOffset ?? 0}
                    onChange={(e) =>
                      updateTrimOffset(track.id, Number(e.target.value))
                    }
                    style={{
                      width: "38px",
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
                  onClick={() => removeTrack(track.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
