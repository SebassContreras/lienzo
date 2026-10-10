/**
 * Field groups of a 3D scene (016/D3): material, lights and camera. Plain numbers and
 * colors, so keyframes can drive every one of them.
 */
import { check, color, num, obj } from "./field.ts";

/** A coordinate in scene units, either side of the origin. */
const coord = (value: number, label: string, reach = 10) =>
  num(value, { label, min: -reach, max: reach, step: 0.05 });

const unit = (value: number, label: string) =>
  num(value, { label, max: 1, step: 0.01, bounds: [0, 1] });

const intensity = (value: number) =>
  num(value, {
    label: "Intensidad",
    max: 10,
    step: 0.05,
    bounds: [0, Infinity],
  });

export type MaterialDefaults = {
  color: string;
  metalness: number;
  roughness: number;
  wireframe: boolean;
  emissive: string;
  emissiveIntensity: number;
};

export function material(d: MaterialDefaults, section = "Material") {
  return obj(
    {
      color: color(d.color, { label: "Color" }),
      metalness: unit(d.metalness, "Metal"),
      roughness: unit(d.roughness, "Rugosidad"),
      wireframe: check(d.wireframe, { label: "Malla de alambre" }),
      emissive: color(d.emissive, { label: "Emisión" }),
      emissiveIntensity: num(d.emissiveIntensity, {
        label: "Intensidad de emisión",
        max: 5,
        step: 0.05,
        bounds: [0, Infinity],
      }),
    },
    { section },
  );
}

/** Light that reaches every face alike. */
export function ambientLight(d: { color: string; intensity: number }) {
  return obj(
    {
      color: color(d.color, { label: "Color" }),
      intensity: intensity(d.intensity),
    },
    { section: "Luz ambiente" },
  );
}

type Vec = { x: number; y: number; z: number };

/** Light from a direction, as the sun: it shines from `x, y, z` towards the origin. */
export function directionalLight(
  d: { color: string; intensity: number } & Vec,
) {
  return obj(
    {
      color: color(d.color, { label: "Color" }),
      intensity: intensity(d.intensity),
      x: coord(d.x, "X"),
      y: coord(d.y, "Y"),
      z: coord(d.z, "Z"),
    },
    { section: "Luz direccional" },
  );
}

/** A perspective camera at `x, y, z` looking at the target. */
export function camera(d: { fov: number; target: Vec } & Vec) {
  return obj(
    {
      fov: num(d.fov, {
        label: "Campo de visión",
        min: 10,
        max: 120,
        bounds: [1, 179],
      }),
      x: coord(d.x, "X", 20),
      y: coord(d.y, "Y", 20),
      z: coord(d.z, "Z", 20),
      targetX: coord(d.target.x, "Mira a X"),
      targetY: coord(d.target.y, "Mira a Y"),
      targetZ: coord(d.target.z, "Mira a Z"),
    },
    { section: "Cámara" },
  );
}
