import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import { linesOf, rowAlpha } from "../../engine/reveal.ts";
import type { ListEl } from "./descriptor.ts";

export function drawList(ctx: Ctx, el: ListEl, st: AnimState): void {
  const items = linesOf(el.items);
  const line = el.size * el.spacing;
  const indent = el.size * 1.4;
  withTransform(ctx, boxOf(el), st, () => {
    ctx.font = fontString({ ...el, text: "" });
    ctx.letterSpacing = "0px";
    ctx.textBaseline = "middle";
    items.forEach((item, i) => {
      const a = rowAlpha(el.reveal, i, items.length);
      if (a <= 0) return;
      const y = el.y + line * (i + 0.5);
      ctx.save();
      ctx.globalAlpha *= a;
      // each row slides in a little as it appears
      ctx.translate((1 - a) * -el.size * 0.6, 0);
      drawBullet(ctx, el, i, el.x + el.size * 0.45, y);
      ctx.fillStyle = el.color;
      ctx.textAlign = "left";
      ctx.fillText(item, el.x + indent, y);
      ctx.restore();
    });
  });
}

function drawBullet(ctx: Ctx, el: ListEl, i: number, x: number, y: number) {
  const s = el.size;
  ctx.fillStyle = el.bulletColor;
  ctx.strokeStyle = el.bulletColor;
  ctx.lineWidth = Math.max(1.5, s * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (el.bullet === "number") {
    ctx.textAlign = "center";
    ctx.fillText(`${i + 1}.`, x, y);
  } else if (el.bullet === "dot") {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (el.bullet === "dash") {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y);
    ctx.lineTo(x + s * 0.25, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.28, y);
    ctx.lineTo(x - s * 0.08, y + s * 0.2);
    ctx.lineTo(x + s * 0.3, y - s * 0.22);
    ctx.stroke();
  }
}
