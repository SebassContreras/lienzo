import { animState } from "../engine/anim.ts";
import { boxOf } from "../engine/geometry.ts";
import { type Ctx, withTransform } from "../engine/paint.ts";
import type { Element, GroupEl, Scene } from "../model/model.ts";

type DrawElements = (
  ctx: Ctx,
  elements: Element[],
  scene: Scene,
  t: number,
) => void;

/**
 * Draws a group's children inside its box: the group's own animation applies to all of them,
 * and the content space `cw × ch` is stretched onto `w × h`. `drawElements` comes from the
 * renderer so groups can hold any kind, other groups included.
 */
export function drawGroup(
  ctx: Ctx,
  el: GroupEl,
  scene: Scene,
  t: number,
  drawElements: DrawElements,
): void {
  const st = animState(el.anim, t, scene.duration);
  withTransform(ctx, boxOf(el), st, () => {
    ctx.translate(el.x, el.y);
    ctx.scale(el.w / (el.cw || 1), el.h / (el.ch || 1));
    drawElements(ctx, el.children, scene, t);
  });
}
