import { Save, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type AnimPreset, parseAnimPreset } from "../model/anim-preset.ts";
import type { Element, Scene } from "../model/model.ts";
import { applyToSelection, capturePreset } from "../presets/anim-presets.ts";
import { groupByCategory } from "../presets/categories.ts";
import {
  downloadJson,
  freeSlug,
  oneLine,
  readJsonFile,
} from "../presets/json-files.ts";
import {
  deleteStored,
  loadAnimPresetFiles,
  renameStored,
  saveAnimPreset,
} from "../presets/store.ts";
import { ItemActions, type StoredRef } from "./library.tsx";

type Stored = { file: string; preset: AnimPreset };

/** `data` as a preset, or an error naming `what` (019/D11: nothing invalid is written). */
function validated(data: unknown, what: string): AnimPreset {
  const parsed = parseAnimPreset(data);
  if (!parsed.ok)
    throw new Error(
      `${what} no es una animación válida: ${oneLine(parsed.error)}`,
    );
  return parsed.value;
}

/** Validates, then writes; an invalid preset rejects without writing. */
const save = async (data: unknown, file?: string) =>
  saveAnimPreset(validated(data, `«${file ?? "la animación"}»`), file);

const withCategory = (preset: AnimPreset, category?: string): AnimPreset => {
  const { category: _old, ...rest } = preset;
  return category ? { ...rest, category } : rest;
};

/**
 * The "Animaciones" library section (019/D11): saves the selected element's animation,
 * applies a preset to the selection with a start and a stagger, and manages stored ones.
 */
export function AnimLibrary({
  scene,
  selection,
  filter,
  onApply,
  setStatus,
}: {
  scene: Scene;
  selection: readonly string[];
  filter: <T extends { name: string }>(items: T[]) => T[];
  /** Replaces the scene as one undoable change. */
  onApply: (scene: Scene) => void;
  setStatus: (message: string) => void;
}) {
  const [stored, setStored] = useState<Stored[]>([]);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(0);

  const fail = useCallback(
    (error: unknown) =>
      setStatus(`Error: ${error instanceof Error ? error.message : error}`),
    [setStatus],
  );
  const reload = useCallback(() => {
    loadAnimPresetFiles().then(setStored).catch(fail);
  }, [fail]);
  useEffect(reload, [reload]);

  /** Runs a change to stored presets, then reports it and reloads the list. */
  const change = (work: Promise<void>, done: string) =>
    work
      .then(() => {
        setStatus(done);
        reload();
      })
      .catch(fail);

  const selected: Element | undefined =
    selection.length === 1
      ? scene.elements.find((el) => el.id === selection[0])
      : undefined;

  const find = (item: StoredRef) => {
    const found = stored.find((s) => s.file === item.file);
    if (!found) throw new Error(`«${item.name}» ya no existe`);
    return found.preset;
  };

  const saveSelected = () => {
    if (!selected) return;
    const name = window.prompt("Nombre de la animación")?.trim();
    if (!name) return;
    const file = freeSlug(
      name,
      stored.map((s) => s.file),
    );
    change(
      save({ name, ...capturePreset(selected) }, file),
      `Animación «${name}» guardada`,
    );
  };

  const apply = (preset: AnimPreset) => {
    if (selection.length === 0) {
      setStatus("Selecciona uno o más elementos para aplicar la animación");
      return;
    }
    const r = applyToSelection(scene, selection, preset, start, step);
    onApply(r.scene);
    setStatus(
      r.skipped.length
        ? `«${preset.name}» aplicada; omitido: ${r.skipped.join(" · ")}`
        : `«${preset.name}» aplicada`,
    );
  };

  const importFile = (file: File) =>
    change(
      readJsonFile(file).then((data) => {
        const preset = validated(data, `«${file.name}»`);
        return saveAnimPreset(
          preset,
          freeSlug(
            preset.name,
            stored.map((s) => s.file),
          ),
        );
      }),
      `Animación «${file.name}» importada`,
    );

  const items = filter(
    stored.map((s) => ({
      file: s.file,
      name: s.preset.name,
      category: s.preset.category,
      preset: s.preset,
    })),
  );

  return (
    <section>
      <h3>Animaciones</h3>
      <div className="anim-apply">
        <label>
          Inicio (s)
          <input
            type="number"
            min={0}
            step={0.1}
            value={start}
            onChange={(e) => setStart(Math.max(0, Number(e.target.value)))}
          />
        </label>
        <label>
          Escalonado (s)
          <input
            type="number"
            min={0}
            step={0.1}
            value={step}
            onChange={(e) => setStep(Math.max(0, Number(e.target.value)))}
          />
        </label>
      </div>
      <div className="anim-tools">
        <button
          type="button"
          disabled={!selected}
          title={
            selected
              ? "Guardar la animación del elemento seleccionado"
              : "Selecciona un elemento"
          }
          onClick={saveSelected}
        >
          <Save size={14} /> Guardar animación
        </button>
        <label
          className="file-button"
          title="Importar una animación desde un archivo .json"
        >
          <Upload size={14} /> Importar
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importFile(file);
            }}
          />
        </label>
      </div>
      {items.length === 0 && (
        <p className="hint">
          Selecciona un elemento animado y usa «Guardar animación».
        </p>
      )}
      {groupByCategory(items).map((group) => (
        <div key={group.category} className="category">
          {group.category && <h4>{group.category}</h4>}
          <div className="grid">
            {group.items.map((item) => (
              <div className="item-wrap" key={item.file}>
                <button
                  type="button"
                  className="item"
                  title="Clic para aplicarla a la selección"
                  onClick={() => apply(item.preset)}
                >
                  <span>{item.name}</span>
                </button>
                <ItemActions
                  item={item}
                  actions={{
                    rename: (ref, to) =>
                      change(
                        renameStored("animations", ref.file, to),
                        `Renombrada a «${to}»`,
                      ),
                    setCategory: (ref, category) =>
                      change(
                        Promise.resolve().then(() =>
                          save(withCategory(find(ref), category), ref.file),
                        ),
                        category
                          ? `«${ref.name}» en «${category}»`
                          : `«${ref.name}» sin categoría`,
                      ),
                    overwrite: selected
                      ? (ref) =>
                          change(
                            save(
                              {
                                name: ref.name,
                                category: ref.category,
                                ...capturePreset(selected),
                              },
                              ref.file,
                            ),
                            `«${ref.name}» sobrescrita`,
                          )
                      : undefined,
                    overwriteHint: selected
                      ? "Sobrescribir con la animación del seleccionado"
                      : "Selecciona un elemento para sobrescribir",
                    remove: (ref) =>
                      change(
                        deleteStored("animations", ref.file),
                        `«${ref.name}» borrada`,
                      ),
                    exportJson: (ref) => {
                      try {
                        downloadJson(ref.file, find(ref));
                      } catch (error) {
                        fail(error);
                      }
                    },
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
