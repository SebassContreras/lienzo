import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { indexById } from "../../engine/geometry.ts";
import { detachOutside } from "../../engine/groups.ts";
import { resolveLine } from "../../engine/lines.ts";
import type { Element, Scene } from "../../model/model.ts";
import type { ColorPalette } from "../../model/project.ts";
import { recipeFromElement } from "../../presets/diff.ts";
import { downloadJson } from "../../presets/json-files.ts";
import {
  deleteProjectPreset,
  loadProjectPresetFiles,
  renameProjectPreset,
  saveProjectPreset,
} from "../../presets/store.ts";
import {
  Library,
  type LibraryItem,
  recipeItems,
  type StoredRef,
} from "../library.tsx";

export type ProjectPresetsTabProps = {
  projectSlug?: string;
  palette?: ColorPalette;
  scene: Scene;
  selectedElement?: Element;
  onAddElement: (element: Element) => void;
  setStatus: (s: string) => void;
  refreshKey?: number;
};

export function ProjectPresetsTab({
  projectSlug = "mi-proyecto",
  palette,
  scene,
  selectedElement,
  onAddElement,
  setStatus,
  refreshKey = 0,
}: ProjectPresetsTabProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [newPresetName, setNewPresetName] = useState("");

  const refresh = useCallback(async () => {
    if (!projectSlug) {
      setItems([]);
      return;
    }
    try {
      const stored = await loadProjectPresetFiles(projectSlug);
      setItems(
        recipeItems(
          stored.map((s) => s.recipe),
          stored.map((s) => s.file),
        ),
      );
    } catch {
      setItems([]);
    }
  }, [projectSlug]);

  useEffect(() => {
    if (refreshKey >= 0) {
      refresh();
    }
  }, [refresh, refreshKey]);

  const saveSelectedAsProjectPreset = async (
    name: string,
    over?: StoredRef,
  ) => {
    if (!selectedElement) {
      setStatus(
        "Selecciona primero un elemento en el lienzo para guardar como preset.",
      );
      return;
    }
    const targetName = name.trim() || selectedElement.name || "Nuevo Preset";
    const el =
      selectedElement.kind === "group"
        ? detachOutside(selectedElement)
        : structuredClone(selectedElement);
    el.name = targetName;

    if (el.kind === "line") {
      const r = resolveLine(el, indexById(scene));
      el.a = { x: r.a.x, y: r.a.y };
      el.b = { x: r.b.x, y: r.b.y };
    }

    const recipe = recipeFromElement(targetName, el);
    if (over?.category) {
      recipe.category = over.category;
    }

    try {
      await saveProjectPreset(recipe, over?.file ?? targetName, projectSlug);
      setStatus(
        `Preset «${targetName}» guardado en el proyecto «${projectSlug}»`,
      );
      setNewPresetName("");
      refresh();
    } catch (e: unknown) {
      setStatus(
        `Error al guardar preset: ${e instanceof Error ? e.message : e}`,
      );
    }
  };

  const removePreset = async (item: StoredRef) => {
    try {
      await deleteProjectPreset(item.file, projectSlug);
      setStatus(`Preset «${item.name}» eliminado del proyecto`);
      refresh();
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const renamePreset = async (item: StoredRef, to: string) => {
    try {
      await renameProjectPreset(item.file, to, projectSlug);
      setStatus(`Preset renombrado a «${to}»`);
      refresh();
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const exportPreset = async (item: StoredRef) => {
    try {
      const stored = await loadProjectPresetFiles(projectSlug);
      const found = stored.find((s) => s.file === item.file);
      if (!found) throw new Error(`«${item.name}» ya no existe`);
      downloadJson(item.file, found.recipe);
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const setPresetCategory = async (item: StoredRef, category: string) => {
    try {
      const stored = await loadProjectPresetFiles(projectSlug);
      const found = stored.find((s) => s.file === item.file);
      if (!found) throw new Error(`«${item.name}» ya no existe`);
      const { category: _old, ...recipe } = found.recipe;
      await saveProjectPreset(
        category ? { ...recipe, category } : recipe,
        item.file,
        projectSlug,
      );
      setStatus(
        category
          ? `«${item.name}» en «${category}»`
          : `«${item.name}» sin categoría`,
      );
      refresh();
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div
      className="project-presets-tab"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "4px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Presets de «{projectSlug}»
        </span>
        {palette && (
          <span
            title={`Paleta activa del proyecto: ${palette.primary}`}
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: palette.primary,
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          />
        )}
      </div>

      {selectedElement && (
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            placeholder="Nombre del preset…"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "12px",
              color: "inherit",
            }}
          />
          <button
            type="button"
            className="file-button"
            onClick={() => saveSelectedAsProjectPreset(newPresetName)}
            title="Guardar elemento seleccionado en el proyecto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            <Plus size={12} /> Guardar
          </button>
        </div>
      )}

      <input
        className="preset-filter"
        type="search"
        placeholder="Filtrar presets del proyecto…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <Library
        title="Componentes del Proyecto"
        items={filteredItems}
        background={scene.background}
        onAdd={onAddElement}
        empty="No hay presets guardados en este proyecto. Selecciona un elemento y haz clic en Guardar."
        actions={{
          rename: renamePreset,
          remove: removePreset,
          setCategory: setPresetCategory,
          exportJson: exportPreset,
          overwrite: selectedElement
            ? (item) => saveSelectedAsProjectPreset(item.name, item)
            : undefined,
          overwriteHint: selectedElement
            ? "Sobrescribir con el elemento seleccionado"
            : "Selecciona un elemento para sobrescribir",
        }}
      />
    </div>
  );
}
