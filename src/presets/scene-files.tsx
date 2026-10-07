import { FolderOpen, Save } from "lucide-react";
import { useState } from "react";
import type { Scene } from "../model/model.ts";
import { loadScenes, saveScene } from "./store.ts";

/** Scene name, save-to-`scenes/` and open-from-`scenes/` controls of the top bar. */
export function SceneFiles({
  scene,
  name,
  setName,
  onOpen,
  setStatus,
}: {
  scene: Scene;
  name: string;
  setName: (name: string) => void;
  onOpen: (scene: Scene) => void;
  setStatus: (s: string) => void;
}) {
  const [scenes, setScenes] = useState<{ name: string; data: Scene }[]>([]);
  const refresh = () =>
    loadScenes()
      .then(setScenes)
      .catch(() => setScenes([]));

  return (
    <>
      <input
        className="scene-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Nombre de la escena"
        title="Nombre de la escena"
      />
      <button
        type="button"
        title="Guardar escena como JSON"
        onClick={() =>
          saveScene(name, scene)
            .then(() => setStatus(`Escena «${name}» guardada en scenes/`))
            .catch((error: unknown) => setStatus(`Error: ${error}`))
        }
      >
        <Save size={16} />
      </button>
      <label className="open" title="Abrir escena guardada">
        <FolderOpen size={16} />
        <select
          value=""
          onFocus={refresh}
          onPointerDown={refresh}
          onChange={(e) => {
            const found = scenes.find((s) => s.name === e.target.value);
            if (found) {
              setName(found.name);
              onOpen(found.data);
            }
          }}
        >
          <option value="">Abrir…</option>
          {scenes.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
