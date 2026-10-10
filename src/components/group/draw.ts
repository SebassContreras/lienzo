import type { AnimState } from "../../engine/anim.ts";
import { animState } from "../../engine/anim.ts";
import { boxOf, indexElements } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import type { Anim } from "../../model/model.ts";
import type { DrawContext } from "../descriptor.ts";
import type { GroupEl } from "./descriptor.ts";

const NONE = { kind: "none" } as const;

/**
 * Draws a group's children inside its box: the group's own animation applies to all of them,
 * and the content space `cw × ch` is stretched onto `w × h`. `drawElements` comes from the
 * renderer so groups can hold any kind, other groups included. With a stagger, the group's
 * entry and exit play on child `i` at `t − i·stagger` instead (018/D9).
 */
export function drawGroup(
  ctx: Ctx,
  el: GroupEl,
  st: AnimState,
  { scene, t, drawElements }: DrawContext,
): void {
  const staggered =
    el.stagger > 0 &&
    (el.anim.in.kind !== "none" || el.anim.out.kind !== "none");
  const own = staggered
    ? animState(withSlots(el.anim, { in: NONE, out: NONE }), t, scene.duration)
    : st;
  withTransform(ctx, boxOf(el), own, () => {
    ctx.translate(el.x, el.y);
    ctx.scale(el.w / (el.cw || 1), el.h / (el.ch || 1));
    if (!staggered) {
      drawElements(ctx, el.children, scene, t);
      return;
    }
    const byId = indexElements(el.children);
    const motion = withSlots(el.anim, { loop: NONE });
    el.children.forEach((child, i) => {
      const cst = animState(motion, t - i * el.stagger, scene.duration);
      withTransform(ctx, boxOf(child), cst, () =>
        drawElements(ctx, [child], scene, t, byId),
      );
    });
  });
}

/** `anim` with some slots switched off. */
function withSlots(
  anim: Anim,
  off: Partial<Record<"in" | "loop" | "out", typeof NONE>>,
): Anim {
  return {
    in: off.in ? { ...anim.in, ...off.in } : anim.in,
    loop: off.loop ? { ...anim.loop, ...off.loop } : anim.loop,
    out: off.out ? { ...anim.out, ...off.out } : anim.out,
  };
}
