import { icons } from "lucide";

/** One drawable piece of a lucide icon, on its 24×24 grid. */
export type IconShape =
  | { type: "path"; d: string }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "rect"; x: number; y: number; w: number; h: number; r: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "poly"; points: number[]; closed: boolean };

/** Lucide's icon data: SVG tag names with their attributes. */
export type IconNode = [string, Record<string, string | number | undefined>][];

/** Every lucide icon name, PascalCase, sorted. */
export const ICON_NAMES: string[] = Object.keys(icons).sort();

export function iconNode(name: string): IconNode | undefined {
  return Object.hasOwn(icons, name)
    ? (icons[name as keyof typeof icons] as unknown as IconNode)
    : undefined;
}

const num = (v: string | number | undefined) => Number(v ?? 0) || 0;

/** Turns lucide's icon node data into shapes; unknown tags are skipped. */
export function iconShapes(node: IconNode): IconShape[] {
  const out: IconShape[] = [];
  for (const [tag, a] of node) {
    if (tag === "path" && a.d) {
      out.push({ type: "path", d: String(a.d) });
    } else if (tag === "circle") {
      out.push({ type: "circle", cx: num(a.cx), cy: num(a.cy), r: num(a.r) });
    } else if (tag === "ellipse") {
      out.push({
        type: "ellipse",
        cx: num(a.cx),
        cy: num(a.cy),
        rx: num(a.rx),
        ry: num(a.ry),
      });
    } else if (tag === "rect") {
      out.push({
        type: "rect",
        x: num(a.x),
        y: num(a.y),
        w: num(a.width),
        h: num(a.height),
        r: num(a.rx ?? a.ry),
      });
    } else if (tag === "line") {
      out.push({
        type: "line",
        x1: num(a.x1),
        y1: num(a.y1),
        x2: num(a.x2),
        y2: num(a.y2),
      });
    } else if (tag === "polyline" || tag === "polygon") {
      const points = String(a.points ?? "")
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      out.push({ type: "poly", points, closed: tag === "polygon" });
    }
  }
  return out;
}

function toPath(shape: IconShape): Path2D {
  if (shape.type === "path") return new Path2D(shape.d);
  const p = new Path2D();
  switch (shape.type) {
    case "circle":
      p.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      break;
    case "ellipse":
      p.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
      break;
    case "rect":
      p.roundRect(shape.x, shape.y, shape.w, shape.h, shape.r);
      break;
    case "line":
      p.moveTo(shape.x1, shape.y1);
      p.lineTo(shape.x2, shape.y2);
      break;
    case "poly":
      for (let i = 0; i + 1 < shape.points.length; i += 2) {
        const x = shape.points[i] as number;
        const y = shape.points[i + 1] as number;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      if (shape.closed) p.closePath();
      break;
  }
  return p;
}

const pathCache = new Map<string, Path2D[]>();

/** The icon's outline as Path2D objects on the 24×24 grid, cached per name. */
export function iconPaths(name: string): Path2D[] {
  let paths = pathCache.get(name);
  if (!paths) {
    const node = iconNode(name);
    paths = node ? iconShapes(node).map(toPath) : [];
    pathCache.set(name, paths);
  }
  return paths;
}
