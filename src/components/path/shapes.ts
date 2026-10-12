/**
 * Editing a free path's shapes (024/D1), pure: checking pasted `d` strings, the view box
 * that holds them all, and reading the shape out of an `.svg` file.
 */
import { flatten } from "../../engine/path/morph-prep.ts";
import { parsePath } from "../../engine/path/parse.ts";
import type { PathShape, ViewBox } from "./descriptor.ts";
import { shapeName } from "./draw.ts";

/** The box around every point of `ds`; a flat or empty one gets a size of 1. */
export function boundsOf(ds: readonly string[]): ViewBox {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  ds.forEach((d, i) => {
    for (const sub of parsePath(d, shapeName(i))) {
      const pts = flatten(sub);
      for (let j = 0; j < pts.length; j += 2) {
        x0 = Math.min(x0, pts[j] as number);
        x1 = Math.max(x1, pts[j] as number);
        y0 = Math.min(y0, pts[j + 1] as number);
        y1 = Math.max(y1, pts[j + 1] as number);
      }
    }
  });
  if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}

/**
 * `shapes` and the view box that fits them, or the error naming the first invalid shape;
 * the element keeps its last valid shapes until every one parses (024/R10).
 */
export function checkedShapes(
  shapes: readonly PathShape[],
): { shapes: PathShape[]; view: ViewBox } | { error: string } {
  try {
    return { shapes: [...shapes], view: boundsOf(shapes.map((s) => s.d)) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const attr = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`)
    .exec(tag)
    ?.slice(2, 4)
    .find((v) => v !== undefined);

/**
 * The shape an `.svg` file draws: every `<path>`'s `d` joined into one shape, in the file's
 * `viewBox` (or the paths' bounds without one). Transforms and other elements are ignored.
 */
export function svgFileShape(
  text: string,
): { d: string; view: ViewBox } | { error: string } {
  const ds = [...text.matchAll(/<path\b[^>]*>/g)]
    .map((m) => attr(m[0], "d"))
    .filter((d): d is string => !!d?.trim());
  if (ds.length === 0) return { error: "El archivo no tiene ningún <path>" };
  const d = ds.join(" ");
  const checked = checkedShapes([{ d }]);
  if ("error" in checked) return checked;
  const svg = /<svg\b[^>]*>/.exec(text)?.[0];
  const vb =
    svg &&
    attr(svg, "viewBox")
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
  const [x = 0, y = 0, w = 0, h = 0] = vb || [];
  const view =
    vb && vb.length === 4 && vb.every(Number.isFinite) && w > 0 && h > 0
      ? { x, y, w, h }
      : checked.view;
  return { d, view };
}
