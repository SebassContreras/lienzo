import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import {
  type Ctx,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import { wrapLines } from "../../engine/wrap.ts";
import type { DrawContext } from "../descriptor.ts";
import type { BubbleEl } from "./descriptor.ts";

/** The author's initials: the first letter of up to two words. */
export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** How high each typing dot is lifted at `phase` (whole cycles per loop), 0–1. */
export function dotLift(phase: number, i: number): number {
  return Math.max(0, Math.sin(2 * Math.PI * phase - i * 0.9));
}

export function drawBubble(
  ctx: Ctx,
  el: BubbleEl,
  st: AnimState,
  { scene, t }: DrawContext,
): void {
  const box = boxOf(el);
  const avatar = el.showAvatar ? Math.min(el.h, el.size * 2.4) : 0;
  const gap = avatar ? el.size * 0.5 : 0;
  const right = el.side === "right";
  const bx = right ? el.x : el.x + avatar + gap;
  const bw = Math.max(1, el.w - avatar - gap);
  const pad = el.size * 0.8;
  const bubble = new Path2D();
  bubble.roundRect(bx, el.y, bw, el.h, Math.min(el.radius, el.h / 2, bw / 2));

  withTransform(ctx, box, st, () => {
    if (el.shadow.enabled) {
      shadowOnly(
        ctx,
        () => ctx.fill(bubble),
        rgba(el.shadow.color, el.shadow.opacity),
        el.shadow.blur,
        el.shadow.x,
        el.shadow.y,
      );
    }
    ctx.fillStyle = el.bubbleColor;
    ctx.fill(bubble);

    if (avatar) {
      const ax = right ? el.x + el.w - avatar / 2 : el.x + avatar / 2;
      const ay = el.y + el.h - avatar / 2;
      ctx.fillStyle = el.avatarColor;
      ctx.beginPath();
      ctx.arc(ax, ay, avatar / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = fontString({
        ...el,
        text: "",
        size: avatar * 0.4,
        weight: 700,
      });
      ctx.letterSpacing = "0px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(el.initials || initialsOf(el.author), ax, ay);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = el.y + pad * 0.8;
    if (el.author) {
      ctx.font = fontString({
        ...el,
        text: "",
        size: el.size * 0.8,
        weight: 700,
      });
      ctx.fillStyle = el.authorColor;
      ctx.fillText(el.author, bx + pad, y);
      y += el.size * 1.2;
    }
    ctx.fillStyle = el.color;
    if (el.typing) {
      const r = el.size * 0.18;
      const phase = (t / scene.duration) * Math.round(el.typingSpeed);
      for (let i = 0; i < 3; i++) {
        const lift = dotLift(phase, i) * r * 1.6;
        ctx.beginPath();
        ctx.arc(bx + pad + r + i * r * 3, y + el.size / 2 - lift, r, 0, 7);
        ctx.fill();
      }
      return;
    }
    ctx.font = fontString({ ...el, weight: 400 });
    const lines = wrapLines(
      el.text,
      bw - pad * 2,
      (s) => ctx.measureText(s).width,
    );
    for (const line of lines) {
      ctx.fillText(line, bx + pad, y);
      y += el.size * 1.3;
    }
  });
}
