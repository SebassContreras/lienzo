import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { drawScene } from "../engine/render.ts";
import { type Background, defaultScene, type Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { resolveBackground } from "../presets/resolve.ts";

/**
 * A background preset as the library lists it, or the reason its recipe cannot be built.
 * `key` is unique across built-in and user presets, which may share a name.
 */
export type BackgroundItem = { key: string; name: string } & (
  | { background: Background }
  | { error: string }
);

export function backgroundItems(
  recipes: PresetRecipe[],
  source: "built-in" | "user",
): BackgroundItem[] {
  return recipes.map((recipe) => ({
    key: `${source}:${recipe.name}`,
    name: recipe.name,
    ...resolveBackground(recipe),
  }));
}

/** The "Fondos" library section: clicking a background applies a copy of it to the scene. */
export function BackgroundLibrary({
  items,
  onApply,
}: {
  items: BackgroundItem[];
  onApply: (background: Background) => void;
}) {
  return (
    <section>
      <h3>Fondos</h3>
      <div className="grid">
        {items.map((item) =>
          "error" in item ? (
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
          ),
        )}
      </div>
    </section>
  );
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
