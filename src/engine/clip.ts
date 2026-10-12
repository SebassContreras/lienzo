import type { Ctx } from "./paint.ts";

/**
 * Runs `draw` with everything it paints clipped to `path` (017/D4): a window's body clips its
 * children; 025's mask clips an element to another shape.
 */
export function withClip(ctx: Ctx, path: Path2D, draw: () => void): void {
  ctx.save();
  ctx.clip(path);
  draw();
  ctx.restore();
}
