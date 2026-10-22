/**
 * Anchors and layout resolution for compact scenes (011/D3, T004).
 * Resolves `at` placement and `fit: canvas` using element boxes and scene dimensions.
 */
import { boxOf } from "../../engine/geometry.ts";
import type { AnchorName, AtPlacement } from "../../model/compact.ts";
import type { Element, Scene } from "../../model/model.ts";

export function resolveFitCanvas(
  el: Element,
  scene: Pick<Scene, "width" | "height">,
): void {
  const mutable = el as unknown as Record<string, unknown>;
  mutable.x = 0;
  mutable.y = 0;
  mutable.w = scene.width;
  mutable.h = scene.height;
}

function resolveAnchorPosition(
  anchor: AnchorName,
  box: { w: number; h: number },
  scene: Pick<Scene, "width" | "height">,
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  switch (anchor) {
    case "top-left":
      x = 0;
      y = 0;
      break;
    case "top":
      x = (scene.width - box.w) / 2;
      y = 0;
      break;
    case "top-right":
      x = scene.width - box.w;
      y = 0;
      break;
    case "left":
      x = 0;
      y = (scene.height - box.h) / 2;
      break;
    case "center":
      x = (scene.width - box.w) / 2;
      y = (scene.height - box.h) / 2;
      break;
    case "right":
      x = scene.width - box.w;
      y = (scene.height - box.h) / 2;
      break;
    case "bottom-left":
      x = 0;
      y = scene.height - box.h;
      break;
    case "bottom":
      x = (scene.width - box.w) / 2;
      y = scene.height - box.h;
      break;
    case "bottom-right":
      x = scene.width - box.w;
      y = scene.height - box.h;
      break;
  }

  return { x: Math.round(x), y: Math.round(y) };
}

export function resolveAtPlacement(
  el: Element,
  at: AtPlacement,
  scene: Pick<Scene, "width" | "height">,
): void {
  const anchor: AnchorName = typeof at === "string" ? at : at.anchor;
  const offset = typeof at === "object" && at.offset ? at.offset : [0, 0];

  const box = boxOf(el);
  const pos = resolveAnchorPosition(anchor, box, scene);

  const mutable = el as unknown as Record<string, unknown>;
  mutable.x = pos.x + offset[0];
  mutable.y = pos.y + offset[1];
}
