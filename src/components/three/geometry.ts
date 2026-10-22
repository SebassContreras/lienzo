/**
 * The shapes a 3D element shows: primitives and extruded text, each fitted into about
 * `SIZE` scene units around the origin and cached. Models live in `model.ts`.
 */
import {
  type Box3,
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  PlaneGeometry,
  ShapePath,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { type OutlineCommand, textOutline } from "./font.ts";

/** Largest side of a primitive, text or model, in scene units. */
export const SIZE = 2;

export const SHAPES = [
  ["cube", "Cubo"],
  ["sphere", "Esfera"],
  ["torus", "Toro"],
  ["cylinder", "Cilindro"],
  ["cone", "Cono"],
  ["plane", "Plano"],
  ["text", "Texto 3D"],
  ["model", "Modelo (.glb)"],
] as const;

type Shape = (typeof SHAPES)[number][0];

export type Primitive = Exclude<Shape, "text" | "model">;

const PRIMITIVES: Record<Primitive, () => BufferGeometry> = {
  cube: () => new BoxGeometry(1.4, 1.4, 1.4),
  sphere: () => new SphereGeometry(1, 48, 32),
  torus: () => new TorusGeometry(0.7, 0.3, 32, 96),
  cylinder: () => new CylinderGeometry(0.8, 0.8, 1.6, 48),
  cone: () => new ConeGeometry(0.9, 1.6, 48),
  plane: () => new PlaneGeometry(SIZE, SIZE),
};

/** Cached geometries by shape (and text), so each frame does not rebuild them. */
const geometries = new Map<string, BufferGeometry>();
const MAX_CACHED = 64;

function cached(key: string, build: () => BufferGeometry): BufferGeometry {
  let g = geometries.get(key);
  if (!g) {
    if (geometries.size >= MAX_CACHED) {
      for (const old of geometries.values()) old.dispose();
      geometries.clear();
    }
    g = build();
    geometries.set(key, g);
  }
  return g;
}

export function primitive(shape: Primitive): BufferGeometry {
  return cached(shape, PRIMITIVES[shape]);
}

/** `text` extruded `depth` deep (relative to its height), or undefined while the font loads. */
export function textGeometry(
  text: string,
  depth: number,
): BufferGeometry | undefined {
  const outline = text.trim() ? textOutline(text) : undefined;
  if (!outline) return undefined;
  return cached(`text:${depth}:${text}`, () => {
    const g = new ExtrudeGeometry(shapesOf(outline), {
      depth,
      bevelEnabled: false,
      curveSegments: 8,
    });
    g.computeBoundingBox();
    const box = g.boundingBox as Box3;
    const size = box.getSize(new Vector3());
    g.center();
    const s = SIZE / Math.max(size.x, size.y, 1e-6);
    return g.scale(s, s, s);
  });
}

/** An outline as three.js shapes, y flipped up. */
function shapesOf(outline: readonly OutlineCommand[]) {
  const path = new ShapePath();
  for (const c of outline) {
    if (c.type === "M") path.moveTo(c.x, -c.y);
    else if (c.type === "L") path.lineTo(c.x, -c.y);
    else if (c.type === "Q") path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === "C")
      path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
    else path.currentPath?.closePath();
  }
  return path.toShapes();
}
