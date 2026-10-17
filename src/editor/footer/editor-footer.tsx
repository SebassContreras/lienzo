import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Music,
  Pause,
  Play,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createAudioTrack,
  getSceneAudioTracks,
} from "../../engine/audio/audio-tracks.ts";
import type { AudioTrackItem, Scene, SceneAudio } from "../../model/model.ts";
import { AUDIO_FILES, uploadAsset } from "../../presets/store.ts";
import type { Clock } from "../stage.tsx";

export type EditorFooterProps = {
  clock: MutableRefObject<Clock>;
  duration: number;
  playing: boolean;
  togglePlay: () => void;
  onScrub: (t: number) => void;
  scene: Scene;
  onAudioChange: (audio: SceneAudio | undefined) => void;
  onTracksChange?: (audioTracks: AudioTrackItem[]) => void;
  setStatus?: (status: string) => void;
};

export function EditorFooter({
  clock,
  duration,
  playing,
  togglePlay,
  onScrub,
  scene,
  onAudioChange,
  onTracksChange,
  setStatus,
}: EditorFooterProps) {
  const range = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);
  const [tracksCollapsed, setTracksCollapsed] = useState(false);

  const tracks = getSceneAudioTracks(scene);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (range.current && document.activeElement !== range.current) {
        range.current.value = String(clock.current.t);
      }
      if (readout.current) {
        readout.current.textContent = `${clock.current.t.toFixed(2)}s / ${duration.toFixed(1)}s`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, duration]);

  const updateTracks = useCallback(
    (newTracks: AudioTrackItem[]) => {
      if (onTracksChange) {
        onTracksChange(newTracks);
      } else if (onAudioChange) {
        if (newTracks.length > 0) {
          const first = newTracks[0]!;
          onAudioChange({
            assetId: first.assetId,
            volume: first.muted ? 0 : first.volume,
            startOffset: first.startOffset,
            trimOffset: first.trimOffset,
          });
        } else {
          onAudioChange(undefined);
        }
      }
    },
    [onAudioChange, onTracksChange],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const path = await uploadAsset(file, AUDIO_FILES);
        const targetId = replaceTargetRef.current;
        replaceTargetRef.current = null;

        if (targetId) {
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
    <footer className="editor-footer">
      {/* Hidden file input for uploading audio */}
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

      {/* Row 1: Playback bar with play/pause, scrub slider, time readout, and tracks toggle */}
      <div className="playback-bar">
        <button
          type="button"
          className="play-toggle-btn"
          title="Reproducir / pausar (Espacio)"
          onClick={togglePlay}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <input
          ref={range}
          type="range"
          min={0}
          max={duration}
          step={0.01}
          defaultValue={0}
          onInput={(e) => onScrub(Number((e.target as HTMLInputElement).value))}
          className="scrub-slider"
        />
        <span ref={readout} className="readout" />
        <button
          type="button"
          className="tracks-toggle-btn"
          title={
            tracksCollapsed
              ? "Mostrar pistas de audio"
              : "Ocultar pistas de audio"
          }
          onClick={() => setTracksCollapsed((v) => !v)}
        >
          <Music size={14} />
          <span>
            {tracks.length} {tracks.length === 1 ? "pista" : "pistas"}
          </span>
          {tracksCollapsed ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {/* Row 2+: Audio tracks rendered as clean horizontal rows underneath */}
      {!tracksCollapsed && (
        <div className="audio-tracks-rows">
          {tracks.map((track, idx) => {
            const fileName =
              track.name ||
              (track.assetId ? track.assetId.split("/").pop() : "Audio");
            const isMuted = track.muted || (track.volume ?? 1) <= 0;

            return (
              <div key={track.id} className="audio-track-row">
                {/* Reorder buttons */}
                <div className="track-order-btns">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveTrack(idx, -1)}
                    title="Mover pista arriba"
                    className="order-btn"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tracks.length - 1}
                    onClick={() => moveTrack(idx, 1)}
                    title="Mover pista abajo"
                    className="order-btn"
                  >
                    <ArrowDown size={11} />
                  </button>
                </div>

                {/* Track icon and title */}
                <div className="track-title" title={fileName}>
                  <Music size={13} className="track-icon" />
                  <span className="track-name">{fileName}</span>
                </div>

                {/* Replace asset button */}
                <button
                  type="button"
                  title="Reemplazar archivo de audio"
                  onClick={() => triggerReplace(track.id)}
                  className="row-action-btn"
                >
                  Cambiar
                </button>

                {/* Mute button */}
                <button
                  type="button"
                  title={isMuted ? "Activar sonido" : "Silenciar audio"}
                  onClick={() => toggleMute(track.id)}
                  className={`mute-btn ${isMuted ? "muted" : ""}`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                {/* Volume slider */}
                <div
                  className="track-control-group"
                  title="Volumen de la pista"
                >
                  <span className="control-label">Vol:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume ?? 1}
                    onChange={(e) =>
                      updateVolume(track.id, Number(e.target.value))
                    }
                    className="volume-slider"
                  />
                  <span className="control-val">
                    {Math.round((track.volume ?? 1) * 100)}%
                  </span>
                </div>

                {/* Start offset in scene */}
                <div
                  className="track-control-group"
                  title="Inicio en la escena (segundos)"
                >
                  <span className="control-label">Inicio:</span>
                  <input
                    type="number"
                    min={0}
                    max={scene.duration}
                    step={0.1}
                    value={track.startOffset ?? 0}
                    onChange={(e) =>
                      updateStartOffset(track.id, Number(e.target.value))
                    }
                    className="offset-input"
                  />
                  <span className="control-unit">s</span>
                </div>

                {/* Trim offset from file */}
                <div
                  className="track-control-group"
                  title="Recorte inicial del archivo (segundos)"
                >
                  <span className="control-label">Recorte:</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={track.trimOffset ?? 0}
                    onChange={(e) =>
                      updateTrimOffset(track.id, Number(e.target.value))
                    }
                    className="offset-input"
                  />
                  <span className="control-unit">s</span>
                </div>

                {/* Remove track button */}
                <button
                  type="button"
                  title="Eliminar pista de audio"
                  onClick={() => removeTrack(track.id)}
                  className="remove-btn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {/* Add track button */}
          <div className="add-track-row">
            <button
              type="button"
              className="add-track-btn"
              title="Añadir una nueva pista de audio a la escena"
              onClick={triggerUploadNew}
            >
              <Plus size={14} />
              <span>Añadir pista de audio</span>
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
