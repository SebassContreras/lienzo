import {
  Copy,
  Download,
  FilePlus2,
  History,
  Pencil,
  Save,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Scene } from "../../model/model.ts";
import { parseScene } from "../../model/schema.ts";
import {
  downloadJson,
  freeSlug,
  oneLine,
  readJsonFile,
} from "../../presets/json-files.ts";
import {
  copyName,
  type StoredScene,
  toStoredScenes,
} from "../../presets/scene-list.ts";
import {
  deleteProjectItem,
  loadScenes,
  renameProjectItem,
  saveScene,
} from "../../presets/store.ts";
import { SceneThumb } from "./scene-thumb.tsx";

export type ProjectScenesTabProps = {
  projectSlug?: string;
  scene: Scene;
  name: string;
  setName: (name: string) => void;
  onOpen: (scene: Scene) => void;
  /** A blank scene, keeping the current mode (043/D2). */
  onBlank: () => void;
  /** The workspace's autosaved draft, if any (042/D3). */
  onRecoverDraft: () => void;
  setStatus: (s: string) => void;
};

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** The scenes of the active project, in the sidebar (043/D1). */
export function ProjectScenesTab({
  projectSlug = "mi-proyecto",
  scene,
  name,
  setName,
  onOpen,
  onBlank,
  onRecoverDraft,
  setStatus,
}: ProjectScenesTabProps) {
  const [scenes, setScenes] = useState<StoredScene[]>([]);

  const refresh = useCallback(
    () =>
      loadScenes(projectSlug)
        .then((items) => setScenes(toStoredScenes(items)))
        .catch(() => setScenes([])),
    [projectSlug],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Runs a change to stored scenes, then reports it and reloads the list. */
  const change = (work: Promise<void>, done: string) =>
    work
      .then(() => {
        setStatus(done);
        return refresh();
      })
      .catch((e: unknown) => setStatus(`Error: ${errorText(e)}`));

  /** Validates a chosen file and, only if it is a scene, saves it under a free name. */
  const importScene = (file: File) =>
    readJsonFile(file)
      .then((data) => {
        const parsed = parseScene(data);
        if (!parsed.ok) {
          setStatus(
            `«${file.name}» no es una escena válida: ${oneLine(parsed.error)}`,
          );
          return;
        }
        const target = freeSlug(
          file.name.replace(/\.json$/i, ""),
          scenes.map((s) => s.name),
        );
        return change(
          saveScene(target, parsed.value, projectSlug),
          `Escena «${target}» importada`,
        );
      })
      .catch((e: unknown) => setStatus(`Error: ${errorText(e)}`));

  return (
    <div className="scenes-tab">
      <div className="scenes-tab-actions">
        <button type="button" title="Escena en blanco" onClick={onBlank}>
          <FilePlus2 size={14} /> En blanco
        </button>
        <button
          type="button"
          title="Abrir el último borrador autoguardado de este proyecto"
          onClick={onRecoverDraft}
        >
          <History size={14} /> Recuperar borrador
        </button>
        <label
          className="file-button"
          title="Importar una escena desde un archivo .json"
        >
          <Upload size={14} /> Importar
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importScene(file);
            }}
          />
        </label>
      </div>

      <div className="scenes-tab-save">
        <input
          className="scene-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nombre de la escena"
          title="Nombre de la escena"
        />
        <button
          type="button"
          title={`Guardar la escena actual en ${projectSlug}/scenes/`}
          onClick={() =>
            change(
              saveScene(name, scene, projectSlug),
              `Escena «${name}» guardada en ${projectSlug}/scenes/`,
            )
          }
        >
          <Save size={14} /> Guardar
        </button>
      </div>

      {scenes.length === 0 && (
        <p className="hint">Aún no hay escenas guardadas en este proyecto.</p>
      )}
      <div className="scenes-list">
        {scenes.map((s) => (
          <div key={s.name} className="scene-card">
            {"scene" in s ? (
              <button
                type="button"
                className="scene-open"
                title="Abrir esta escena"
                onClick={() => {
                  setName(s.name);
                  onOpen(structuredClone(s.scene));
                }}
              >
                <SceneThumb scene={s.scene} />
              </button>
            ) : (
              <div className="scene-broken" title={s.error}>
                <TriangleAlert size={16} />
                {s.error.split("\n")[0]}
              </div>
            )}
            <span className="scene-title" title={s.name}>
              {s.name}
              {"scene" in s && (
                <span className={`scene-mode ${s.scene.mode ?? "video"}`}>
                  {s.scene.mode === "static" ? "Estático" : "Video"}
                </span>
              )}
            </span>
            <div className="item-actions">
              <button
                type="button"
                title="Renombrar"
                onClick={() => {
                  const to = window.prompt("Nuevo nombre", s.name)?.trim();
                  if (to && to !== s.name) {
                    change(
                      renameProjectItem("scenes", s.name, to, projectSlug),
                      `Escena renombrada a «${to}»`,
                    );
                  }
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                title="Duplicar"
                disabled={!("scene" in s)}
                onClick={() => {
                  if (!("scene" in s)) return;
                  const copy = copyName(
                    s.name,
                    scenes.map((x) => x.name),
                  );
                  change(
                    saveScene(copy, s.scene, projectSlug),
                    `Escena «${copy}» creada`,
                  );
                }}
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                title="Exportar como .json"
                disabled={!("scene" in s)}
                onClick={() => {
                  if ("scene" in s) downloadJson(s.name, s.scene);
                }}
              >
                <Download size={12} />
              </button>
              <button
                type="button"
                title="Borrar"
                onClick={() => {
                  if (window.confirm(`¿Borrar la escena «${s.name}»?`)) {
                    change(
                      deleteProjectItem("scenes", s.name, projectSlug),
                      `Escena «${s.name}» borrada`,
                    );
                  }
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
