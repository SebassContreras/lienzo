import { type LucideIcon, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { boxOf, centerOn } from "../engine/geometry.ts";
import { drawScene } from "../engine/render.ts";
import { defaultScene, type Element, type Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { resolveElement } from "../presets/resolve.ts";
import { PRESET_MIME } from "./stage.tsx";

/**
 * Anything the library can list: a name and the element dropped on the canvas, or, for a
 * recipe that cannot be built, the reason why.
 */
export type LibraryItem =
  | { name: string; element: Element }
  | { name: string; error: string };

/** Library entries for recipes, each resolved once; dropping one adds a copy. */
export function recipeItems(recipes: PresetRecipe[]): LibraryItem[] {
  return recipes.map((recipe) => ({
    name: recipe.name,
    ...resolveElement(recipe),
  }));
}

export function Library({
  title,
  items,
  icons,
  background,
  onAdd,
  empty,
}: {
  title: string;
  items: LibraryItem[];
  /** Shows an icon per item instead of a canvas thumbnail. */
  icons?: LucideIcon[];
  background: Scene["background"];
  onAdd: (element: Element) => void;
  empty?: string;
}) {
  return (
    <section>
      <h3>{title}</h3>
      {items.length === 0 && empty && <p className="hint">{empty}</p>}
      <div className={icons ? "basics" : "grid"}>
        {items.map((item, i) => {
          const Icon = icons?.[i];
          if ("error" in item) {
            return (
              <button
                type="button"
                key={item.name}
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
            );
          }
          const { element } = item;
          return (
            <button
              type="button"
              key={item.name}
              className="item"
              draggable
              title="Arrastra al lienzo o haz clic para añadir al centro"
              onDragStart={(e) => {
                e.dataTransfer.setData(PRESET_MIME, JSON.stringify(element));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAdd(element)}
            >
              {Icon ? (
                <Icon size={18} />
              ) : (
                <Thumb element={element} background={background} />
              )}
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const THUMB_W = 116;
const THUMB_H = 72;

/** The element drawn alone, fitted into a small canvas, at a moment its entry animation is over. */
function Thumb({
  element,
  background,
}: {
  element: Element;
  background: Scene["background"];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const box = boxOf(element);
      const pad = 40;
      const w = Math.max(box.w, 40) + pad * 2;
      const h = Math.max(box.h, 40) + pad * 2;
      const mini: Scene = {
        ...defaultScene(),
        width: w,
        height: h,
        background: { ...background, dots: false, spotlight: 0 },
        elements: [centerOn(element, w / 2, h / 2)],
      };
      const k = Math.min(canvas.width / w, canvas.height / h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = background.color2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(
        k,
        0,
        0,
        k,
        (canvas.width - w * k) / 2,
        (canvas.height - h * k) / 2,
      );
      drawScene(ctx, mini, 1.5);
    };
    draw();
    document.fonts.ready.then(draw);
  }, [element, background]);
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
