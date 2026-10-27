/**
 * The three.js side of the 3D element (066/D1): builds the object, lights and camera of a
 * frame and renders it offscreen. Imported only through `lazy.ts`, so three.js is downloaded
 * once a scene draws a 3D element.
 */
import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  Scene,
} from "three";
import type { ThreeEl } from "./descriptor.ts";
import { primitive, textGeometry } from "./geometry.ts";
import { modelFor } from "./model.ts";
import { poseAt } from "./pose.ts";
import { renderOffscreen } from "./renderer.ts";
import type { Primitive } from "./shapes.ts";

/** `el`'s picture at `t`, or null while what it shows loads or without WebGL. */
export function renderThree(
  el: ThreeEl,
  t: number,
  duration: number,
): OffscreenCanvas | null {
  const material = new MeshStandardMaterial({
    color: el.material.color,
    metalness: el.material.metalness,
    roughness: el.material.roughness,
    wireframe: el.material.wireframe,
    emissive: el.material.emissive,
    emissiveIntensity: el.material.emissiveIntensity,
  });
  try {
    const object = objectOf(el, material);
    if (!object) return null;
    const pose = poseAt(el, t, duration);
    object.rotation.set(...pose.rotation);
    object.position.set(...pose.position);
    object.scale.setScalar(pose.scale);

    const scene = new Scene();
    scene.add(object);
    scene.add(new AmbientLight(el.ambient.color, el.ambient.intensity));
    const sun = new DirectionalLight(el.light.color, el.light.intensity);
    sun.position.set(el.light.x, el.light.y, el.light.z);
    scene.add(sun);

    const cam = new PerspectiveCamera(pose.camera.fov, el.w / el.h, 0.1, 200);
    cam.position.set(...pose.camera.position);
    cam.lookAt(...pose.camera.target);
    const picture = renderOffscreen(scene, cam, el.w, el.h);
    // a shared model must not stay attached to this frame's scene
    scene.remove(object);
    return picture;
  } finally {
    material.dispose();
  }
}

/** What `el` shows: a mesh of its primitive or text, or its model (with its own materials). */
function objectOf(
  el: ThreeEl,
  material: MeshStandardMaterial,
): Object3D | undefined {
  if (el.shape === "model") return modelFor(el.model);
  const geometry =
    el.shape === "text"
      ? textGeometry(el.text, el.depth)
      : primitive(el.shape as Primitive);
  return geometry && new Mesh(geometry, material);
}
