/** The scene inspector's "Tomas" section: add, retime, rename and remove shots (062/D2). */
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Scene, Shot, ShotTransition } from "../../model/model.ts";
import {
  removeShot,
  type ShotPatch,
  type ShotsResult,
  setShot,
} from "../../model/shots.ts";
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

export function ShotsSection({
  scene,
  onChange,
}: {
  scene: Scene;
  onChange: (s: Scene) => void;
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
          <Num
            label="Cámara X"
            value={shot.camera?.x ?? 0}
            min={-scene.width}
            max={scene.width}
            onChange={(x) => patch({ id: shot.id, camera: { x } })}
          />
          <Num
            label="Cámara Y"
            value={shot.camera?.y ?? 0}
            min={-scene.height}
            max={scene.height}
            onChange={(y) => patch({ id: shot.id, camera: { y } })}
          />
          <Num
            label="Zoom"
            value={shot.camera?.zoom ?? 1}
            min={0.1}
            max={5}
            step={0.05}
            onChange={(zoom) => patch({ id: shot.id, camera: { zoom } })}
          />
        </div>
      ))}
      {error && <div className="hint">{error}</div>}
      <button type="button" onClick={add}>
        <Plus size={15} /> Añadir toma
      </button>
    </Section>
  );
}
