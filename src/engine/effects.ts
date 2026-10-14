import type { BlendMode } from "../components/fields/effects.ts";
import type { Ctx } from "./paint.ts";

export type ElementEffects = {
  blur?: number;
  blend?: BlendMode;
};

/**
 * Maps our BlendMode to Canvas 2D GlobalCompositeOperation.
 * "normal" maps to "source-over".
 */
export function compositeOperationOf(
  mode: BlendMode | undefined,
): GlobalCompositeOperation {
  if (!mode || mode === "normal") return "source-over";
  return mode as GlobalCompositeOperation;
}

/**
 * Wraps `draw` in the element's effects (025/D1): blur filter and blend mode.
 * Uses Canvas 2D `save()` / `restore()` to prevent leaking effects to subsequent draws.
 */
export function withEffects(
  ctx: Ctx,
  fx: ElementEffects | undefined,
  draw: () => void,
): void {
  const blur = fx?.blur ?? 0;
  const blend = fx?.blend ?? "normal";

  const hasBlur = blur > 0;
  const hasBlend = blend !== "normal";

  if (!hasBlur && !hasBlend) {
    draw();
    return;
  }

  ctx.save();
  if (hasBlend) {
    ctx.globalCompositeOperation = compositeOperationOf(blend);
  }
  if (hasBlur) {
    // If ctx supports filter, set blur filter
    ctx.filter = `blur(${blur}px)`;
  }
  draw();
  ctx.restore();
}
