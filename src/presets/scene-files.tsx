import {
  Copy,
  Download,
  FolderOpen,
  Pencil,
  Save,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadSceneImages } from "../engine/images.ts";
import { drawScene } from "../engine/render.ts";
import type { Scene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import { downloadJson, freeSlug, oneLine, readJsonFile } from "./json-files.ts";
import { deleteStored, loadScenes, renameStored, saveScene } from "./store.ts";

type StoredScene = { name: string } & ({ scene: Scene } | { error: string });

/** Scene name, save-to-`scenes/` and the saved-scenes dialog of the top bar. */
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [scenes, setScenes] = useState<StoredScene[]>([]);
  const refresh = () =>
    loadScenes()
      .then((items) =>
        setScenes(
          items.map((item) => {
            const parsed = parseScene(item.data);
            return parsed.ok
              ? { name: item.name, scene: parsed.value }
              : { name: item.name, error: parsed.error };
          }),
        ),
      )
      .catch(() => setScenes([]));

  /** Runs a change to stored scenes, then reports it and reloads the list. */
  const change = (work: Promise<void>, done: string) =>
    work
      .then(() => {
        setStatus(done);
        return refresh();
      })
      .catch((error: unknown) =>
        setStatus(`Error: ${error instanceof Error ? error.message : error}`),
      );

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
          saveScene(target, parsed.value),
          `Escena «${target}» importada`,
        );
      })
      .catch((error: unknown) =>
        setStatus(`Error: ${error instanceof Error ? error.message : error}`),
      );

  const freeName = (base: string) => {
    const taken = new Set(scenes.map((s) => s.name));
    let n = 1;
    let candidate = `${base}-copia`;
    while (taken.has(candidate)) candidate = `${base}-copia-${++n}`;
    return candidate;
  };

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
      <button
        type="button"
        title="Escenas guardadas"
        onClick={() => {
          refresh();
          dialog.current?.showModal();
        }}
      >
        <FolderOpen size={16} />
      </button>
      <dialog ref={dialog} className="scenes-dialog">
        <header>
          <h2>Escenas guardadas</h2>
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
          <button
            type="button"
            title="Cerrar"
            onClick={() => dialog.current?.close()}
          >
            <X size={16} />
          </button>
        </header>
        {scenes.length === 0 && (
          <p className="hint">Aún no hay escenas guardadas en scenes/.</p>
        )}
        <div className="scenes-grid">
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
                    dialog.current?.close();
                  }}
                >
                  <SceneThumb scene={s.scene} />
                </button>
              ) : (
                <div className="broken-reason scene-broken" title={s.error}>
                  <TriangleAlert size={16} />
                  {s.error.split("\n")[0]}
                </div>
              )}
              <span className="scene-title">{s.name}</span>
              <div className="item-actions">
                <button
                  type="button"
                  title="Renombrar"
                  onClick={() => {
                    const to = window.prompt("Nuevo nombre", s.name)?.trim();
                    if (to && to !== s.name) {
                      change(
                        renameStored("scenes", s.name, to),
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
                    const copy = freeName(s.name);
                    change(saveScene(copy, s.scene), `Escena «${copy}» creada`);
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
                        deleteStored("scenes", s.name),
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
      </dialog>
    </>
  );
}

const THUMB_W = 160;
const THUMB_H = 120;

/**
 * The whole scene scaled into a small canvas, drawn once its images have decoded, at a
 * moment entry animations are over (1.5 s, or the loop's end if shorter).
 */
function SceneThumb({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const draw = () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!live || !canvas || !ctx) return;
      const k = Math.min(
        canvas.width / scene.width,
        canvas.height / scene.height,
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(
        k,
        0,
        0,
        k,
        (canvas.width - scene.width * k) / 2,
        (canvas.height - scene.height * k) / 2,
      );
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, scene.width, scene.height);
      ctx.clip();
      drawScene(ctx, scene, Math.min(1.5, scene.duration));
      ctx.restore();
    };
    Promise.all([loadSceneImages(scene), document.fonts.ready]).then(draw);
    return () => {
      live = false;
    };
  }, [scene]);
  const dpr = window.devicePixelRatio || 1;
  return (
    <canvas
      ref={ref}
      width={THUMB_W * dpr}
      height={THUMB_H * dpr}
      style={{ width: THUMB_W, height: THUMB_H }}
    />
  );
}
