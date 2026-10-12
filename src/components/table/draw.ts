import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import { linesOf, rowAlpha } from "../../engine/reveal.ts";
import type { TableEl } from "./descriptor.ts";

/** The rows of `cells`, each split into trimmed cells at `|`. */
export const rowsOf = (cells: string): string[][] =>
  linesOf(cells).map((row) => row.split("|").map((c) => c.trim()));

export function drawTable(ctx: Ctx, el: TableEl, st: AnimState): void {
  const rows = rowsOf(el.cells);
  if (rows.length === 0) return;
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const rh = el.h / rows.length;
  const cw = el.w / cols;
  const pad = el.size * 0.7;
  const outline = new Path2D();
  outline.roundRect(el.x, el.y, el.w, el.h, Math.min(el.radius, el.h / 2));
  withTransform(ctx, boxOf(el), st, () => {
    ctx.save();
    ctx.clip(outline);
    ctx.font = fontString({ ...el, text: "" });
    ctx.letterSpacing = "0px";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    rows.forEach((row, i) => {
      const a = rowAlpha(el.reveal, i, rows.length);
      if (a <= 0) return;
      const head = el.header && i === 0;
      const y = el.y + rh * i;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.fillStyle = head
        ? el.headerColor
        : i % 2 === 1
          ? el.rowColor
          : el.stripeColor;
      ctx.fillRect(el.x, y, el.w, rh);
      ctx.fillStyle = head ? el.headerTextColor : el.color;
      for (let j = 0; j < cols; j++) {
        ctx.fillText(
          row[j] ?? "",
          el.x + cw * j + pad,
          y + rh / 2,
          cw - pad * 2,
        );
      }
      ctx.strokeStyle = el.borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(el.x, y + rh);
      ctx.lineTo(el.x + el.w, y + rh);
      for (let j = 1; j < cols; j++) {
        ctx.moveTo(el.x + cw * j, y);
        ctx.lineTo(el.x + cw * j, y + rh);
      }
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    ctx.strokeStyle = el.borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke(outline);
  });
}
