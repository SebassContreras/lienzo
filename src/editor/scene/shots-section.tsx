/** The scene inspector's "Tomas" section: add, retime, rename and remove shots (062/D2). */
import { Diamond, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { resolveShotCamera } from "../../engine/shots.ts";
import { keyframeAt } from "../../engine/tracks.ts";
import type { Scene, Shot, ShotTransition } from "../../model/model.ts";
import {
  type CameraAxis,
  cameraValuePatch,
  removeShot,
  type ShotPatch,
  type ShotsResult,
  setShot,
  toggleCameraKey,
} from "../../model/shots.ts";
import { trackKeys } from "../../model/track.ts";
import { Num, Section, Select } from "../controls.tsx";

const TRANSITIONS: [ShotTransition["kind"], string][] = [
  ["cut", "Corte"],
  ["fade", "Fundido"],
  ["slide", "Deslizar"],
  ["zoom", "Zoom"],
];

/** The next free `shot-N` id. */
export function nextShotId(shots: readonly Shot[]): string {
  let n = shots.length + 1;
  while (shots.some((sh) => sh.id === `shot-${n}`)) n++;
  return `shot-${n}`;
}

/** Each camera axis: label, range in the scene and step. */
const CAMERA: [
  CameraAxis,
  string,
  (s: Scene) => number,
  (s: Scene) => number,
  number,
][] = [
  ["x", "Cámara X", (s) => -s.width, (s) => s.width, 1],
  ["y", "Cámara Y", (s) => -s.height, (s) => s.height, 1],
  ["zoom", "Zoom", () => 0.1, () => 5, 0.05],
];

/** One camera axis: its value at the playhead and a key button (062/D9). */
function CameraField({
  shot,
  axis,
  label,
  min,
  max,
  step,
  time,
  patch,
}: {
  shot: Shot;
  axis: CameraAxis;
  label: string;
  min: number;
  max: number;
  step: number;
  time: number;
  patch: (p: ShotPatch) => void;
}) {
  const keys = trackKeys(shot.camera?.tracks?.[axis]);
  const state =
    keys.length === 0 ? "" : keyframeAt(keys, time) >= 0 ? "on" : "track";
  return (
    <div className="keyed">
      <Num
        label={label}
        value={resolveShotCamera(shot, time)[axis]}
        min={min}
        max={max}
        step={step}
        onChange={(v) =>
          patch({ id: shot.id, camera: cameraValuePatch(shot, axis, time, v) })
        }
      />
      <button
        type="button"
        className={`key-button ${state}`}
        title={state === "on" ? "Quitar keyframe" : "Keyframe aquí"}
        onClick={() =>
          patch({
            id: shot.id,
            camera: { tracks: toggleCameraKey(shot, axis, time) },
          })
        }
      >
        <Diamond size={12} fill={state ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export function ShotsSection({
  scene,
  onChange,
  time = 0,
}: {
  scene: Scene;
  onChange: (s: Scene) => void;
  /** The playhead (s), where camera keyframes are set. */
  time?: number;
}) {
  const [error, setError] = useState("");
  const shots = scene.shots ?? [];
  const apply = (result: ShotsResult) => {
    if ("error" in result) {
      setError(result.error.message);
      return;
    }
    setError("");
    onChange({
      ...scene,
      shots: result.shots.length > 0 ? result.shots : undefined,
    });
  };
  const patch = (p: ShotPatch) => apply(setShot(shots, p));
  const add = () => {
    const start = Math.min(shots.at(-1)?.end ?? 0, scene.duration);
    const end = Math.min(scene.duration, start + 2);
    patch({ id: nextShotId(shots), start, end });
  };

  return (
    <Section title="Tomas" open={shots.length > 0}>
      {shots.map((shot) => (
        <div key={shot.id} className="shot-item">
          <div className="preset-save">
            <input
              aria-label="Nombre de la toma"
              value={shot.name}
              onChange={(e) => patch({ id: shot.id, name: e.target.value })}
            />
            <button
              type="button"
              title="Eliminar toma"
              onClick={() => apply(removeShot(shots, shot.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Num
            label="Inicio (s)"
            value={shot.start}
            max={scene.duration}
            step={0.1}
            onChange={(v) => patch({ id: shot.id, start: v })}
          />
          <Num
            label="Fin (s)"
            value={shot.end}
            max={scene.duration}
            step={0.1}
            onChange={(v) => patch({ id: shot.id, end: v })}
          />
          <Select
            label="Transición"
            value={shot.transition?.kind ?? "cut"}
            options={TRANSITIONS}
            onChange={(kind) =>
              patch({
                id: shot.id,
                transition: {
                  kind,
                  duration: shot.transition?.duration ?? 0.5,
                },
              })
            }
          />
          {shot.transition && shot.transition.kind !== "cut" && (
            <Num
              label="Duración transición"
              value={shot.transition.duration}
              max={2}
              step={0.1}
              onChange={(duration) =>
                patch({
                  id: shot.id,
                  transition: {
                    kind: shot.transition?.kind ?? "fade",
                    duration,
                  },
                })
              }
            />
          )}
          {CAMERA.map(([axis, label, min, max, step]) => (
            <CameraField
              key={axis}
              shot={shot}
              axis={axis}
              label={label}
              min={min(scene)}
              max={max(scene)}
              step={step}
              time={time}
              patch={patch}
            />
          ))}
        </div>
      ))}
      {error && <div className="hint">{error}</div>}
      <button type="button" onClick={add}>
        <Plus size={15} /> Añadir toma
      </button>
    </Section>
  );
}
