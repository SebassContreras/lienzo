/**
 * The free path's shape list (024/D1): paste a `d` string per shape, add or remove shapes,
 * or import an `.svg` file. Only valid shapes reach the element; an invalid one shows the
 * error naming it and the element keeps its last valid shapes (R10).
 */
import { FileUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PathEl, PathShape } from "../components/path/descriptor.ts";
import { shapeName } from "../components/path/draw.ts";
import { checkedShapes, svgFileShape } from "../components/path/shapes.ts";
import { TextArea } from "./controls.tsx";
import type { Change } from "./field-editor.tsx";

export function PathShapes({ el, change }: { el: PathEl; change: Change }) {
  // what is typed, which may not be valid yet; undefined = the element's own shapes
  const [typed, setTyped] = useState<string[] | undefined>();
  const [error, setError] = useState("");
  const ds = typed ?? el.shapes.map((s) => s.d);

  const commit = (shapes: PathShape[], view?: PathEl["view"]) => {
    const checked = checkedShapes(shapes);
    if ("error" in checked) {
      setError(checked.error);
      return;
    }
    setError("");
    setTyped(undefined);
    change((draft) => {
      const d = draft as PathEl;
      d.shapes = checked.shapes;
      d.view = view ?? checked.view;
      d.morph = Math.min(d.morph, checked.shapes.length - 1);
    });
  };

  const edit = (i: number, d: string) => {
    const next = ds.map((v, j) => (j === i ? d : v));
    setTyped(next);
    const shapes = next.map((v, j) => ({ ...el.shapes[j], d: v }));
    const checked = checkedShapes(shapes);
    if ("error" in checked) setError(checked.error);
    else commit(shapes);
  };

  return (
    <>
      {ds.map((d, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: shapes are identified by their place
        <div key={i}>
          <TextArea
            label={shapeName(i)}
            value={d}
            onChange={(v) => edit(i, v)}
          />
          {el.shapes.length > 1 && (
            <button
              type="button"
              onClick={() => commit(el.shapes.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} /> Quitar {shapeName(i).toLowerCase()}
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          commit([...el.shapes, { ...(el.shapes.at(-1) as PathShape) }])
        }
      >
        <Plus size={15} /> Añadir forma
      </button>
      <label className="file-pick">
        <FileUp size={15} />
        Importar .svg
        <input
          type="file"
          accept=".svg,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            file.text().then((text) => {
              const shape = svgFileShape(text);
              if ("error" in shape) setError(shape.error);
              else commit([{ d: shape.d }], shape.view);
            });
          }}
        />
      </label>
      {error && <div className="hint error">{error}</div>}
    </>
  );
}
