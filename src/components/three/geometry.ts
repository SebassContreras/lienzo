/**
 * The shapes a 3D element shows: primitives and extruded text, each fitted into about
 * `SIZE` scene units around the origin, and GLTF models loaded through the asset cache.
 */

import fontUrl from "@fontsource/inter/files/inter-latin-700-normal.woff?url";
import opentype from "opentype.js";
import {
  Box3,
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  type Object3D,
  PlaneGeometry,
  ShapePath,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assetFor, registerAssetLoader } from "../../engine/assets.ts";

/** Largest side of a primitive, text or model, in scene units. */
const SIZE = 2;

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

export type Shape = (typeof SHAPES)[number][0];

export type Primitive = Exclude<Shape, "text" | "model">;

const PRIMITIVES: Record<Primitive, () => BufferGeometry> = {
  cube: () => new BoxGeometry(1.4, 1.4, 1.4),
  sphere: () => new SphereGeometry(1, 48, 32),
  torus: () => new TorusGeometry(0.7, 0.3, 32, 96),
  cylinder: () => new CylinderGeometry(0.8, 0.8, 1.6, 48),
  cone: () => new ConeGeometry(0.9, 1.6, 48),
  plane: () => new PlaneGeometry(SIZE, SIZE),
};

/** The font 3D text is extruded from; drawing waits for it like for any asset. */
export const TEXT_FONT = fontUrl;

registerAssetLoader("woff", async (src) => {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: ${res.status}`);
  return opentype.parse(await res.arrayBuffer());
});

/** GLTF binaries become one object centred on the origin and fitted into `SIZE`. */
registerAssetLoader("glb", async (src) => {
  const gltf = await new GLTFLoader().loadAsync(src);
  return fitted(gltf.scene);
});

function fitted(object: Object3D): Group {
  const box = new Box3().setFromObject(object);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const scale = SIZE / Math.max(size.x, size.y, size.z, 1e-6);
  object.position.sub(centre).multiplyScalar(scale);
  object.scale.multiplyScalar(scale);
  const group = new Group();
  group.add(object);
  return group;
}

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
  const font = assetFor<opentype.Font>(TEXT_FONT);
  if (!font || !text.trim()) return undefined;
  return cached(`text:${depth}:${text}`, () => {
    const g = new ExtrudeGeometry(glyphShapes(font, text), {
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

/** The outlines of `text` as three.js shapes, y up. */
export function glyphShapes(font: opentype.Font, text: string) {
  const path = new ShapePath();
  for (const c of font.getPath(text, 0, 0, 1).commands) {
    if (c.type === "M") path.moveTo(c.x, -c.y);
    else if (c.type === "L") path.lineTo(c.x, -c.y);
    else if (c.type === "Q") path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === "C")
      path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return path.toShapes();
}

/** The loaded model at `src`, or undefined while it loads (or with no file chosen). */
export function modelFor(src: string): Group | undefined {
  return assetFor<Group>(src);
}
