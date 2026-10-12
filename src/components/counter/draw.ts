import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import { type Ctx, shadowOnly, withTransform } from "../../engine/paint.ts";
import type { CounterEl, Separator } from "./descriptor.ts";

/**
 * `n` with `decimals` places and thousands split by `sep`; the decimal mark is whichever of
 * "," and "." is not the separator.
 */
export function formatNumber(
  n: number,
  decimals: number,
  sep: Separator,
): string {
  const d = Math.max(0, Math.round(decimals));
  const [int = "0", frac] = Math.abs(n).toFixed(d).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const mark = sep === "," ? "." : ",";
  const sign = n < 0 && Number(Math.abs(n).toFixed(d)) !== 0 ? "-" : "";
  return sign + grouped + (frac ? mark + frac : "");
}

/** The text the counter shows at its current `progress`. */
export function counterText(el: CounterEl): string {
  const k = Math.min(1, Math.max(0, el.progress));
  const n = el.from + (el.to - el.from) * k;
  return el.prefix + formatNumber(n, el.decimals, el.separator) + el.suffix;
}

export function drawCounter(ctx: Ctx, el: CounterEl, st: AnimState): void {
  const box = boxOf(el);
  const shown = counterText(el);
  withTransform(ctx, box, st, () => {
    ctx.font = fontString({ ...el, text: shown });
    ctx.letterSpacing = "0px";
    ctx.textAlign = el.align;
    ctx.textBaseline = "middle";
    const x =
      el.align === "left"
        ? el.x
        : el.align === "center"
          ? el.x + el.w / 2
          : el.x + el.w;
    const paint = () => ctx.fillText(shown, x, el.y + el.h / 2);
    if (el.glow.enabled) {
      for (let i = 0; i < el.glow.strength; i++) {
        shadowOnly(ctx, paint, el.glow.color, el.glow.blur * st.glowMul);
      }
    }
    ctx.fillStyle = el.color;
    paint();
  });
}
