import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { drawScene } from "../engine/render.ts";
import { type Background, defaultScene, type Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { groupByCategory } from "../presets/categories.ts";
import { resolveBackground } from "../presets/resolve.ts";
import { ItemActions, type PresetActions } from "./library.tsx";

/**
 * A background preset as the library lists it, or the reason its recipe cannot be built.
 * `key` is unique across built-in and user presets, which may share a name.
 */
export type BackgroundItem = {
  key: string;
  name: string;
  category?: string;
  /** Stored file name, for user presets. */
  file?: string;
} & ({ background: Background } | { error: string });

export function backgroundItems(
  recipes: PresetRecipe[],
  source: "built-in" | "user",
  files?: string[],
): BackgroundItem[] {
  return recipes.map((recipe, i) => ({
    key: `${source}:${files?.[i] ?? recipe.name}`,
    name: recipe.name,
    category: recipe.category,
    file: files?.[i],
    ...resolveBackground(recipe),
  }));
}

/** The "Fondos" library section: clicking a background applies a copy of it to the scene. */
export function BackgroundLibrary({
  items,
  onApply,
  actions,
}: {
  items: BackgroundItem[];
  onApply: (background: Background) => void;
  actions?: PresetActions;
}) {
  return (
    <section>
      <h3>Fondos</h3>
      {groupByCategory(items).map((group) => (
        <div key={group.category} className="category">
          {group.category && <h4>{group.category}</h4>}
          <div className="grid">
            {group.items.map((item) => {
              const button = backgroundButton(item);
              if (!actions || item.file === undefined) return button;
              return (
                <div className="item-wrap" key={item.key}>
                  {button}
                  <ItemActions
                    item={{ ...item, file: item.file }}
                    actions={actions}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );

  function backgroundButton(item: BackgroundItem) {
    return "error" in item ? (
      <button
        type="button"
        key={item.key}
        className="item broken"
        disabled
        title={item.error}
      >
        <div className="broken-reason">
          <TriangleAlert size={16} />
          {item.error}
        </div>
        <span>{item.name}</span>
      </button>
    ) : (
      <button
        type="button"
        key={item.key}
        className="item background-item"
        title="Clic para usar este fondo"
        onClick={() => onApply(structuredClone(item.background))}
      >
        <BackgroundThumb background={item.background} />
        <span>{item.name}</span>
      </button>
    );
  }
}

const THUMB_W = 116;
const THUMB_H = 72;

/** The background alone on an empty scene, scaled into a small canvas. */
function BackgroundThumb({ background }: { background: Background }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scene: Scene = {
      ...defaultScene(),
      width: THUMB_W * 5,
      height: THUMB_H * 5,
      background,
    };
    const k = canvas.width / scene.width;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawScene(ctx, scene, 0);
  }, [background]);
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
