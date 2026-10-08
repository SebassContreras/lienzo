import {
  Circle,
  FilePlus2,
  Image,
  PaintBucket,
  Pause,
  Play,
  Redo2,
  Shapes,
  Sparkles,
  Spline,
  Square,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import {
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { demoScene } from "../demo.ts";
import {
  centerOn,
  indexById,
  type Pt,
  resolveLine,
  translate,
} from "../engine/geometry.ts";
import {
  detachOutside,
  groupElements,
  idsWithin,
  ungroupElement,
} from "../engine/groups.ts";
import { ExportControls } from "../export/export-controls.tsx";
import {
  cloneElement,
  cloneElements,
  defaultEllipse,
  defaultIcon,
  defaultImage,
  defaultLine,
  defaultParticles,
  defaultRect,
  defaultScene,
  defaultText,
  type Element,
  type Scene,
} from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { parsePresetRecipe } from "../model/schema.ts";
import { filterByName } from "../presets/categories.ts";
import { recipeFromBackground, recipeFromElement } from "../presets/diff.ts";
import {
  downloadJson,
  freeSlug,
  oneLine,
  readJsonFile,
} from "../presets/json-files.ts";
import { BUILT_IN_BACKGROUNDS, BUILT_IN_RECIPES } from "../presets/recipes.ts";
import { SceneFiles } from "../presets/scene-files.tsx";
import {
  deleteStored,
  loadUserPresetFiles,
  renameStored,
  saveUserPreset,
} from "../presets/store.ts";
import {
  type BackgroundItem,
  BackgroundLibrary,
  backgroundItems,
} from "./backgrounds.tsx";
import {
  ElementInspector,
  MultiInspector,
  SceneInspector,
} from "./inspector.tsx";
import {
  Library,
  type LibraryItem,
  recipeItems,
  type StoredRef,
} from "./library.tsx";
import { type Clock, Stage } from "./stage.tsx";

/**
 * Removes `ids` (with everything inside removed groups) and leaves lines that were attached
 * to them where they were drawn.
 */
function removeElements(scene: Scene, removed: Set<string>): Element[] {
  const byId = indexById(scene);
  const ids = new Set(
    scene.elements.filter((el) => removed.has(el.id)).flatMap(idsWithin),
  );
  return scene.elements
    .filter((el) => !ids.has(el.id))
    .map((el) => {
      if (el.kind !== "line") return el;
      const hitsA = el.a.attach && ids.has(el.a.attach);
      const hitsB = el.b.attach && ids.has(el.b.attach);
      if (!hitsA && !hitsB) return el;
      const r = resolveLine(el, byId);
      return {
        ...el,
        a: hitsA ? { x: r.a.x, y: r.a.y } : el.a,
        b: hitsB ? { x: r.b.x, y: r.b.y } : el.b,
      };
    });
}

/**
 * Copies of `ids`, shifted by 30 px. A copied line attached to another copied element is
 * attached to that element's copy; other attached ends stay where they are drawn.
 */
function duplicateElements(scene: Scene, ids: string[]): Element[] {
  const originals = scene.elements.filter((el) => ids.includes(el.id));
  const byId = indexById(scene);
  const moving = new Set(originals.flatMap(idsWithin));
  return cloneElements(
    originals.map((el) => translate(el, 30, 30, byId, moving)),
  );
}

const AUTOSAVE_KEY = "lienzo-scene";

function loadInitialScene(): Scene {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) return JSON.parse(raw) as Scene;
  } catch {
    // no stored scene or storage blocked: start from the demo
  }
  return demoScene();
}

const BASICS: LibraryItem[] = [
  { name: "Rectángulo", element: defaultRect() },
  { name: "Elipse", element: defaultEllipse() },
  { name: "Icono", element: defaultIcon() },
  { name: "Imagen", element: defaultImage() },
  { name: "Texto", element: defaultText() },
  { name: "Línea", element: defaultLine() },
  { name: "Partículas", element: defaultParticles() },
];
const BASIC_ICONS = [Square, Circle, Shapes, Image, Type, Spline, Sparkles];

const BUILT_INS = recipeItems(BUILT_IN_RECIPES);
const BUILT_IN_BACKGROUND_ITEMS = backgroundItems(
  BUILT_IN_BACKGROUNDS,
  "built-in",
);

export function App() {
  const [scene, setSceneState] = useState<Scene>(loadInitialScene);
  const sceneRef = useRef(scene);
  const [selection, setSelection] = useState<string[]>([]);
  const clock = useRef<Clock>({ t: 0, playing: true });
  const [playing, setPlaying] = useState(true);
  const undoStack = useRef<Scene[]>([]);
  const redoStack = useRef<Scene[]>([]);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [status, setStatus] = useState("");
  const [sceneName, setSceneName] = useState("mi-publicacion");
  const [userPresets, setUserPresets] = useState<LibraryItem[]>([]);
  const [userBackgrounds, setUserBackgrounds] = useState<BackgroundItem[]>([]);
  const [backgroundFocus, setBackgroundFocus] = useState(0);
  const [presetFilter, setPresetFilter] = useState("");

  const setScene = useCallback((s: Scene) => {
    sceneRef.current = s;
    setSceneState(s);
  }, []);

  /** Records the current scene as an undo step (call before a change starts). */
  const checkpoint = useCallback(() => {
    const current = sceneRef.current;
    const top = undoStack.current.at(-1);
    if (top && JSON.stringify(top) === JSON.stringify(current)) return;
    undoStack.current.push(structuredClone(current));
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
    rerender();
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(sceneRef.current);
    setScene(prev);
    rerender();
  }, [setScene]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(sceneRef.current);
    setScene(next);
    rerender();
  }, [setScene]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(scene));
    } catch {
      // storage unavailable: autosave is a convenience only
    }
  }, [scene]);

  const refreshPresets = useCallback(() => {
    loadUserPresetFiles()
      .then((stored) => {
        const elements = stored.filter((s) => s.recipe.kind !== "background");
        const backgrounds = stored.filter(
          (s) => s.recipe.kind === "background",
        );
        setUserPresets(
          recipeItems(
            elements.map((s) => s.recipe),
            elements.map((s) => s.file),
          ),
        );
        setUserBackgrounds(
          backgroundItems(
            backgrounds.map((s) => s.recipe),
            "user",
            backgrounds.map((s) => s.file),
          ),
        );
      })
      .catch(() => {
        setUserPresets([]);
        setUserBackgrounds([]);
      });
  }, []);
  useEffect(refreshPresets, [refreshPresets]);

  /** Runs a change to stored presets, then reports it and reloads the library. */
  const presetChange = useCallback(
    (work: Promise<void>, done: string) => {
      work
        .then(() => {
          setStatus(done);
          refreshPresets();
        })
        .catch((error: unknown) =>
          setStatus(`Error: ${error instanceof Error ? error.message : error}`),
        );
    },
    [refreshPresets],
  );

  const savePreset = useCallback(
    /** `over` is the stored preset being overwritten; its file and category are kept. */
    (el: Element, name: string, over?: StoredRef) => {
      const element =
        el.kind === "group" ? detachOutside(el) : structuredClone(el);
      element.name = name;
      if (element.kind === "line") {
        // a preset carries no attachments: keep the ends where they are drawn
        const r = resolveLine(element, indexById(sceneRef.current));
        element.a = { x: r.a.x, y: r.a.y };
        element.b = { x: r.b.x, y: r.b.y };
      }
      presetChange(
        saveUserPreset(
          over?.category
            ? { ...recipeFromElement(name, element), category: over.category }
            : recipeFromElement(name, element),
          over?.file,
        ),
        `Preset «${name}» guardado`,
      );
    },
    [presetChange],
  );

  /** Replaces the whole scene as one undoable step. */
  const loadScene = useCallback(
    (s: Scene) => {
      checkpoint();
      setScene(s);
      setSelection([]);
    },
    [checkpoint, setScene],
  );

  const addElement = useCallback(
    (template: Element, at?: Pt) => {
      checkpoint();
      const s = sceneRef.current;
      const el = centerOn(
        cloneElement(template),
        at?.x ?? s.width / 2,
        at?.y ?? s.height / 2,
      );
      setScene({ ...s, elements: [...s.elements, el] });
      setSelection([el.id]);
    },
    [checkpoint, setScene],
  );

  const removeSelected = useCallback(() => {
    if (selection.length === 0) return;
    checkpoint();
    const s = sceneRef.current;
    setScene({ ...s, elements: removeElements(s, new Set(selection)) });
    setSelection([]);
  }, [checkpoint, selection, setScene]);

  const duplicateSelected = useCallback(() => {
    const s = sceneRef.current;
    if (selection.length === 0) return;
    checkpoint();
    const copies = duplicateElements(s, selection);
    setScene({ ...s, elements: [...s.elements, ...copies] });
    setSelection(copies.map((el) => el.id));
  }, [checkpoint, selection, setScene]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const s = sceneRef.current;
      if (selection.length === 0) return;
      checkpoint();
      const moving = new Set(selection);
      const byId = indexById(s);
      setScene({
        ...s,
        elements: s.elements.map((e) =>
          moving.has(e.id) ? translate(e, dx, dy, byId, moving) : e,
        ),
      });
    },
    [checkpoint, selection, setScene],
  );

  const groupSelected = useCallback(() => {
    const s = sceneRef.current;
    const { scene: grouped, group } = groupElements(s, selection);
    if (!group) return;
    checkpoint();
    setScene(grouped);
    setSelection([group.id]);
  }, [checkpoint, selection, setScene]);

  const ungroupSelected = useCallback(() => {
    const s = sceneRef.current;
    const target = s.elements.find(
      (el) => selection.length === 1 && el.id === selection[0],
    );
    if (target?.kind !== "group") return;
    checkpoint();
    const { scene: flat, ids } = ungroupElement(s, target.id);
    setScene(flat);
    setSelection(ids);
  }, [checkpoint, selection, setScene]);

  const moveLayer = useCallback(
    (id: string, dir: 1 | -1) => {
      const s = sceneRef.current;
      const i = s.elements.findIndex((e) => e.id === id);
      const j = Math.max(0, Math.min(s.elements.length - 1, i + dir));
      if (i < 0 || i === j) return;
      const elements = [...s.elements];
      const [moved] = elements.splice(i, 1);
      elements.splice(j, 0, moved as Element);
      setScene({ ...s, elements });
    },
    [setScene],
  );

  const togglePlay = useCallback(() => {
    clock.current.playing = !clock.current.playing;
    setPlaying(clock.current.playing);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      const mod = e.ctrlKey || e.metaKey;
      const step = e.shiftKey ? 10 : 1;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        removeSelected();
      } else if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) ungroupSelected();
        else groupSelected();
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(sceneRef.current.elements.map((el) => el.id));
      } else if (e.key === "Escape") {
        setSelection([]);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") nudge(-step, 0);
      else if (e.key === "ArrowRight") nudge(step, 0);
      else if (e.key === "ArrowUp") nudge(0, -step);
      else if (e.key === "ArrowDown") nudge(0, step);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    duplicateSelected,
    groupSelected,
    nudge,
    redo,
    removeSelected,
    togglePlay,
    undo,
    ungroupSelected,
  ]);

  const selected =
    selection.length === 1
      ? scene.elements.find((el) => el.id === selection[0])
      : undefined;

  const renamePreset = (item: StoredRef, to: string) =>
    presetChange(
      renameStored("presets", item.file, to),
      `Renombrado a «${to}»`,
    );
  const removePreset = (item: StoredRef) =>
    presetChange(deleteStored("presets", item.file), `«${item.name}» borrado`);
  /** Rewrites a stored preset with a new category (none when empty). */
  const setPresetCategory = (item: StoredRef, category: string) =>
    presetChange(
      loadUserPresetFiles().then(async (stored) => {
        const found = stored.find((s) => s.file === item.file);
        if (!found) throw new Error(`«${item.name}» ya no existe`);
        const { category: _old, ...recipe } = found.recipe;
        await saveUserPreset(
          category ? { ...recipe, category } : recipe,
          item.file,
        );
      }),
      category
        ? `«${item.name}» en «${category}»`
        : `«${item.name}» sin categoría`,
    );
  const exportPreset = (item: StoredRef) =>
    loadUserPresetFiles()
      .then((stored) => {
        const found = stored.find((s) => s.file === item.file);
        if (!found) throw new Error(`«${item.name}» ya no existe`);
        downloadJson(item.file, found.recipe);
      })
      .catch((error: unknown) =>
        setStatus(`Error: ${error instanceof Error ? error.message : error}`),
      );
  /** Validates a chosen file and, only if it is a preset recipe, saves it under a free name. */
  const importPreset = (file: File) =>
    presetChange(
      readJsonFile(file).then(async (data) => {
        const parsed = parsePresetRecipe(data);
        if (!parsed.ok) {
          throw new Error(
            `«${file.name}» no es un preset válido: ${oneLine(parsed.error)}`,
          );
        }
        const stored = await loadUserPresetFiles();
        await saveUserPreset(
          parsed.value,
          freeSlug(
            parsed.value.name,
            stored.map((s) => s.file),
          ),
        );
      }),
      `Preset «${file.name}» importado`,
    );
  const withCategory = (recipe: PresetRecipe, category?: string) =>
    category ? { ...recipe, category } : recipe;
  const matching = <T extends { name: string }>(items: T[]) =>
    filterByName(items, presetFilter);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Sparkles size={16} /> Lienzo
        </div>
        <div className="group">
          <button
            type="button"
            title="Deshacer (Ctrl+Z)"
            disabled={undoStack.current.length === 0}
            onClick={undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            title="Rehacer (Ctrl+Shift+Z)"
            disabled={redoStack.current.length === 0}
            onClick={redo}
          >
            <Redo2 size={16} />
          </button>
        </div>
        <div className="group">
          <button
            type="button"
            title="Escena en blanco"
            onClick={() => loadScene(defaultScene())}
          >
            <FilePlus2 size={16} />
          </button>
          <button
            type="button"
            title="Cargar la demo de MCP"
            onClick={() => loadScene(demoScene())}
          >
            Demo
          </button>
          <button
            type="button"
            title="Editar el fondo de la publicación"
            onClick={() => {
              setSelection([]);
              setBackgroundFocus((n) => n + 1);
            }}
          >
            <PaintBucket size={16} /> Fondo
          </button>
          <SceneFiles
            scene={scene}
            name={sceneName}
            setName={setSceneName}
            onOpen={loadScene}
            setStatus={setStatus}
          />
        </div>
        <div className="status">{status}</div>
        <ExportControls
          scene={scene}
          time={() => clock.current.t}
          fileName={sceneName}
          setStatus={setStatus}
        />
      </header>
      <aside className="library">
        <input
          className="preset-filter"
          type="search"
          placeholder="Filtrar por nombre…"
          aria-label="Filtrar presets por nombre"
          value={presetFilter}
          onChange={(e) => setPresetFilter(e.target.value)}
        />
        <label
          className="file-button"
          title="Importar un preset desde un archivo .json"
        >
          <Upload size={14} /> Importar preset
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importPreset(file);
            }}
          />
        </label>
        <Library
          title="Básicos"
          items={BASICS}
          icons={BASIC_ICONS}
          background={scene.background}
          onAdd={(element) => addElement(element)}
        />
        <Library
          title="Prediseñados"
          items={matching(BUILT_INS)}
          background={scene.background}
          onAdd={(element) => addElement(element)}
        />
        <Library
          title="Mis presets"
          items={matching(userPresets)}
          background={scene.background}
          onAdd={(element) => addElement(element)}
          empty="Selecciona un elemento y usa «Guardar como preset»."
          actions={{
            rename: renamePreset,
            remove: removePreset,
            setCategory: setPresetCategory,
            exportJson: exportPreset,
            overwrite: selected
              ? (item) => savePreset(selected, item.name, item)
              : undefined,
            overwriteHint: selected
              ? "Sobrescribir con el elemento seleccionado"
              : "Selecciona un elemento para sobrescribir",
          }}
        />
        <BackgroundLibrary
          items={matching([...BUILT_IN_BACKGROUND_ITEMS, ...userBackgrounds])}
          actions={{
            rename: renamePreset,
            remove: removePreset,
            setCategory: setPresetCategory,
            exportJson: exportPreset,
            overwrite: (item) =>
              presetChange(
                saveUserPreset(
                  withCategory(
                    recipeFromBackground(
                      item.name,
                      sceneRef.current.background,
                    ),
                    item.category,
                  ),
                  item.file,
                ),
                `Fondo «${item.name}» sobrescrito`,
              ),
            overwriteHint: "Sobrescribir con el fondo actual",
          }}
          onApply={(background) => {
            checkpoint();
            setScene({ ...sceneRef.current, background });
          }}
        />
      </aside>
      <main className="center">
        <Stage
          scene={scene}
          sceneRef={sceneRef}
          setScene={setScene}
          selection={selection}
          setSelection={setSelection}
          clock={clock}
          checkpoint={checkpoint}
          onDropElement={addElement}
          hint={
            selection.length > 0
              ? undefined
              : "Clic en un área vacía para editar el fondo"
          }
        />
        <Timeline
          clock={clock}
          duration={scene.duration}
          playing={playing}
          togglePlay={togglePlay}
          onScrub={() => {
            clock.current.playing = false;
            setPlaying(false);
          }}
        />
      </main>
      <Panel checkpoint={checkpoint}>
        {selected ? (
          <ElementInspector
            key={selected.id}
            el={selected}
            nameOf={(id) =>
              scene.elements.find((e) => e.id === id)?.name ?? "?"
            }
            onChange={(el) =>
              setScene({
                ...sceneRef.current,
                elements: sceneRef.current.elements.map((e) =>
                  e.id === el.id ? el : e,
                ),
              })
            }
            onDelete={removeSelected}
            onDuplicate={duplicateSelected}
            onLayer={(dir) => moveLayer(selected.id, dir)}
            onSavePreset={(name) => savePreset(selected, name)}
            onUngroup={ungroupSelected}
            canvas={scene}
          />
        ) : selection.length > 1 ? (
          <MultiInspector
            count={selection.length}
            onDelete={removeSelected}
            onDuplicate={duplicateSelected}
            onGroup={groupSelected}
          />
        ) : (
          <SceneInspector
            scene={scene}
            onChange={setScene}
            focusBackground={backgroundFocus}
            onSaveBackground={(name) =>
              presetChange(
                saveUserPreset(recipeFromBackground(name, scene.background)),
                `Fondo «${name}» guardado`,
              )
            }
          />
        )}
      </Panel>
    </div>
  );
}

/** Right-hand panel; any interaction inside it starts an undo step. */
function Panel({
  checkpoint,
  children,
}: {
  checkpoint: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      className="panel"
      onPointerDownCapture={checkpoint}
      onFocusCapture={checkpoint}
    >
      {children}
    </aside>
  );
}

function Timeline({
  clock,
  duration,
  playing,
  togglePlay,
  onScrub,
}: {
  clock: MutableRefObject<Clock>;
  duration: number;
  playing: boolean;
  togglePlay: () => void;
  onScrub: () => void;
}) {
  const range = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
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
  return (
    <div className="timeline">
      <button
        type="button"
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
        onInput={(e) => {
          onScrub();
          clock.current.t = Number((e.target as HTMLInputElement).value);
        }}
      />
      <span ref={readout} className="readout" />
    </div>
  );
}
