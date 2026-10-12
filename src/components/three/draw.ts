import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  Scene,
} from "three";
import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import type { ThreeEl } from "./descriptor.ts";
import { type Primitive, primitive, textGeometry } from "./geometry.ts";
import { modelFor } from "./model.ts";
import { poseAt } from "./pose.ts";
import { renderOffscreen } from "./renderer.ts";

export function drawThree(
  ctx: Ctx,
  el: ThreeEl,
  st: AnimState,
  dc: DrawContext,
): void {
  withTransform(ctx, boxOf(el), st, () => {
    const picture = render(el, dc.t, dc.scene.duration);
    if (picture) ctx.drawImage(picture, el.x, el.y, el.w, el.h);
    else drawPlaceholder(ctx, el);
  });
}

/** `el`'s picture at `t`, or null while what it shows loads or without WebGL. */
function render(el: ThreeEl, t: number, duration: number) {
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

/** Shown while the model or font loads, or where WebGL is missing: a soft box. */
function drawPlaceholder(ctx: Ctx, el: ThreeEl): void {
  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
  ctx.fillRect(el.x, el.y, el.w, el.h);
  ctx.strokeStyle = "rgba(203, 213, 225, 0.5)";
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(el.x, el.y, el.w, el.h);
  ctx.restore();
}
