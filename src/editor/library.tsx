import {
  Download,
  type LucideIcon,
  Pencil,
  Replace,
  Tag,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { boxOf, centerOn } from "../engine/geometry.ts";
import { drawScene } from "../engine/render.ts";
import { defaultScene, type Element, type Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { groupByCategory } from "../presets/categories.ts";
import { resolveElement } from "../presets/resolve.ts";
import { PRESET_MIME } from "./stage.tsx";

/**
 * Anything the library can list: a name and the element dropped on the canvas, or, for a
 * recipe that cannot be built, the reason why.
 */
export type LibraryItem = {
  name: string;
  category?: string;
  /** Stored file name, for user presets. */
  file?: string;
} & ({ element: Element } | { error: string });

/** A stored preset as its actions see it. */
export type StoredRef = { file: string; name: string; category?: string };

/** What can be done to a stored preset from the library. */
export type PresetActions = {
  rename: (item: StoredRef, to: string) => void;
  setCategory: (item: StoredRef, category: string) => void;
  /** Absent when there is nothing to overwrite with (e.g. no element selected). */
  overwrite?: (item: StoredRef) => void;
  overwriteHint: string;
  remove: (item: StoredRef) => void;
  /** Downloads the stored recipe as a `.json` file. */
  exportJson: (item: StoredRef) => void;
};

/** Rename, overwrite and delete buttons shown under a stored preset. */
export function ItemActions({
  item,
  actions,
}: {
  item: StoredRef;
  actions: PresetActions;
}) {
  const { overwrite } = actions;
  const { name } = item;
  return (
    <div className="item-actions">
      <button
        type="button"
        title="Renombrar"
        onClick={() => {
          const to = window.prompt("Nuevo nombre", name)?.trim();
          if (to && to !== name) actions.rename(item, to);
        }}
      >
        <Pencil size={12} />
      </button>
      <button
        type="button"
        title={`Categoría: ${item.category || "ninguna"}`}
        onClick={() => {
          const to = window.prompt(
            "Categoría (vacío = sin categoría)",
            item.category ?? "",
          );
          if (to !== null && to.trim() !== (item.category ?? "")) {
            actions.setCategory(item, to.trim());
          }
        }}
      >
        <Tag size={12} />
      </button>
      <button
        type="button"
        title={actions.overwriteHint}
        disabled={!overwrite}
        onClick={() => {
          if (overwrite && window.confirm(`¿Sobrescribir «${name}»?`)) {
            overwrite(item);
          }
        }}
      >
        <Replace size={12} />
      </button>
      <button
        type="button"
        title="Exportar como .json"
        onClick={() => actions.exportJson(item)}
      >
        <Download size={12} />
      </button>
      <button
        type="button"
        title="Borrar"
        onClick={() => {
          if (window.confirm(`¿Borrar «${name}»?`)) actions.remove(item);
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

/** Library entries for recipes, each resolved once; dropping one adds a copy. */
export function recipeItems(
  recipes: PresetRecipe[],
  files?: string[],
): LibraryItem[] {
  return recipes.map((recipe, i) => ({
    name: recipe.name,
    category: recipe.category,
    file: files?.[i],
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
  actions,
}: {
  title: string;
  items: LibraryItem[];
  /** Shows an icon per item instead of a canvas thumbnail. */
  icons?: LucideIcon[];
  background: Scene["background"];
  onAdd: (element: Element) => void;
  empty?: string;
  actions?: PresetActions;
}) {
  return (
    <section>
      <h3>{title}</h3>
      {items.length === 0 && empty && <p className="hint">{empty}</p>}
      {icons ? (
        <div className="basics">
          {items.map((item, i) => itemButton(item, icons[i]))}
        </div>
      ) : (
        groupByCategory(items).map((group) => (
          <div key={group.category} className="category">
            {group.category && <h4>{group.category}</h4>}
            <div className="grid">
              {group.items.map((item) => {
                const button = itemButton(item);
                if (!actions || item.file === undefined) return button;
                return (
                  <div className="item-wrap" key={item.file}>
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
        ))
      )}
    </section>
  );

  function itemButton(item: LibraryItem, Icon?: LucideIcon) {
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
  }
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
