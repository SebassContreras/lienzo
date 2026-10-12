import { z } from "zod";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  ambientLight,
  anim,
  BOX_ANIMS,
  box,
  camera,
  custom,
  directionalLight,
  material,
  num,
  obj,
  type Parent,
  select,
  text,
} from "../fields/index.ts";
import { drawThree } from "./draw.ts";
import { SHAPES, TEXT_FONT } from "./geometry.ts";

const O = { section: "Objeto" };

const deg = (label: string) => num(0, { label, min: -180, max: 180 });

const shapeIs = (s: string) => (p: Parent) => p.shape === s;

/**
 * A 3D object rendered with three.js (016): a primitive, extruded text or a GLTF model, lit
 * and seen through a camera, on a transparent background inside its box.
 */
const fields = {
  ...box(400, 400, { section: "Forma", min: 20, max: 2000 }),
  shape: select(SHAPES, "cube", { label: "Forma", ...O }),
  text: text("3D", { label: "Texto", ...O, visible: shapeIs("text") }),
  /** Extrusion depth of the text, relative to its height. */
  depth: num(0.3, {
    label: "Profundidad",
    max: 2,
    step: 0.05,
    bounds: [0, Infinity],
    ...O,
    visible: shapeIs("text"),
  }),
  /** URL path of a `.glb` in `assets/`; empty until a file is chosen. */
  model: custom("model", "", z.string(), {
    label: "Modelo",
    ...O,
    visible: shapeIs("model"),
  }),
  object: obj(
    {
      rotX: deg("Giro X"),
      rotY: deg("Giro Y"),
      rotZ: deg("Giro Z"),
      x: num(0, { label: "X", min: -5, max: 5, step: 0.05 }),
      y: num(0, { label: "Y", min: -5, max: 5, step: 0.05 }),
      z: num(0, { label: "Z", min: -5, max: 5, step: 0.05 }),
      scale: num(1, {
        label: "Escala",
        max: 4,
        step: 0.05,
        bounds: [0, Infinity],
      }),
    },
    O,
  ),
  /** Whole turns around the vertical axis per loop, so the loop closes (A6). */
  spin: num(0, {
    label: "Vueltas por ciclo",
    min: -6,
    max: 6,
    int: true,
    ...O,
  }),
  material: material({
    color: "#60a5fa",
    metalness: 0.2,
    roughness: 0.4,
    wireframe: false,
    emissive: "#000000",
    emissiveIntensity: 1,
  }),
  ambient: ambientLight({ color: "#ffffff", intensity: 0.6 }),
  light: directionalLight({
    color: "#ffffff",
    intensity: 2.5,
    x: 3,
    y: 4,
    z: 5,
  }),
  camera: camera({ fov: 45, x: 0, y: 0, z: 5, target: { x: 0, y: 0, z: 0 } }),
  anim: anim(BOX_ANIMS),
};

export type ThreeEl = ElementOf<"three", typeof fields>;

export const three = defineComponent<ThreeEl>({
  kind: "three",
  label: "Objeto 3D",
  icon: "Box",
  fields,
  sections: [
    { title: "Objeto" },
    { title: "Forma" },
    { title: "Material" },
    { title: "Luz ambiente", open: false },
    { title: "Luz direccional", open: false },
    { title: "Cámara", open: false },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  assets: (el) =>
    el.shape === "model" ? [el.model] : el.shape === "text" ? [TEXT_FONT] : [],
  draw: drawThree,
});
