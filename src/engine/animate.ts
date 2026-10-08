import type { Element, Scene } from "../model/model.ts";
import { type AnimState, animState } from "./anim.ts";

/** An element as it stands at one moment, and the transform to draw it with. */
export type Animated<E extends Element = Element> = {
  el: E;
  transform: AnimState;
};

/**
 * Applies time to an element before it is drawn (A24): its preset animation becomes a
 * transform (offset, scale, alpha, glow, entry progress). Components draw what this returns
 * and never animate from `t` themselves, so every kind gets every animation.
 */
export function animate<E extends Element>(
  el: E,
  t: number,
  scene: Scene,
): Animated<E> {
  return { el, transform: animState(el.anim, t, scene.duration) };
}
