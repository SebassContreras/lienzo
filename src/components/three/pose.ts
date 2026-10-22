/**
 * Where the object and the camera are at a moment, as plain numbers: no three.js here, so
 * it is tested on its own (016/D5).
 */
import { frac } from "../../engine/anim.ts";

const RAD = Math.PI / 180;

type Vec3 = [number, number, number];

export type Pose = {
  rotation: Vec3;
  position: Vec3;
  scale: number;
  camera: { position: Vec3; target: Vec3; fov: number };
};

type Posed = {
  object: {
    rotX: number;
    rotY: number;
    rotZ: number;
    x: number;
    y: number;
    z: number;
    scale: number;
  };
  /** Whole turns around the vertical axis per loop (A6). */
  spin: number;
  camera: {
    fov: number;
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
};

/**
 * The pose of `el` at `t` (seconds within a loop of `duration`). The spin is a whole number
 * of turns over the loop, so the end of the loop is its start again.
 */
export function poseAt(el: Posed, t: number, duration: number): Pose {
  const o = el.object;
  const turn = duration > 0 ? frac(t / duration) * Math.round(el.spin) : 0;
  const c = el.camera;
  return {
    rotation: [o.rotX * RAD, o.rotY * RAD + turn * 2 * Math.PI, o.rotZ * RAD],
    position: [o.x, o.y, o.z],
    scale: o.scale,
    camera: {
      position: [c.x, c.y, c.z],
      target: [c.targetX, c.targetY, c.targetZ],
      fov: c.fov,
    },
  };
}
