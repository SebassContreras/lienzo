import { ellipse } from "../components/ellipse/descriptor.ts";
import { drawGroup } from "../components/group.ts";
import { icon } from "../components/icon/descriptor.ts";
import { image } from "../components/image/descriptor.ts";
import { line } from "../components/line/descriptor.ts";
import { drawParticles } from "../components/particles.ts";
import { rect } from "../components/rect/descriptor.ts";
import { text } from "../components/text/descriptor.ts";
import type { Background, Element, Scene } from "../model/model.ts";
import { indexById, indexElements } from "./geometry.ts";
import { type Ctx, linearGradient, rgba } from "./paint.ts";

/**
 * Draws one frame of a scene. Pure function of (scene, t): the editor, PNG, GIF and MP4 export
 * all call this, so what you see while editing is exactly what gets exported.
 */
export function drawScene(ctx: Ctx, scene: Scene, t: number): void {
  drawBackground(ctx, scene);
  drawElements(ctx, scene.elements, scene, t, indexById(scene));
}

/**
 * Draws elements in order. `byId` resolves line attachments in the same coordinate space as
 * `elements` (the scene's, or a group's content space).
 */
export function drawElements(
  ctx: Ctx,
  elements: Element[],
  scene: Scene,
  t: number,
  byId: Map<string, Element> = indexElements(elements),
): void {
  const dc = { scene, t, byId, drawElements };
  for (const el of elements) {
    if (el.kind === "rect") rect.draw(ctx, el, dc);
    else if (el.kind === "ellipse") ellipse.draw(ctx, el, dc);
    else if (el.kind === "icon") icon.draw(ctx, el, dc);
    else if (el.kind === "image") image.draw(ctx, el, dc);
    else if (el.kind === "group") drawGroup(ctx, el, scene, t, drawElements);
    else if (el.kind === "text") text.draw(ctx, el, dc);
    else if (el.kind === "line") line.draw(ctx, el, dc);
    else drawParticles(ctx, el, scene, t);
  }
}

function drawBackground(ctx: Ctx, scene: Scene): void {
  const bg: Background = scene.background;
  const box = { x: 0, y: 0, w: scene.width, h: scene.height };
  ctx.fillStyle = bg.gradient
    ? linearGradient(ctx, box, bg.angle, bg.color, bg.color2)
    : bg.color;
  ctx.fillRect(0, 0, scene.width, scene.height);

  if (bg.spotlight > 0) {
    const r = Math.max(scene.width, scene.height) * 0.6;
    const g = ctx.createRadialGradient(
      scene.width / 2,
      scene.height * 0.4,
      0,
      scene.width / 2,
      scene.height * 0.4,
      r,
    );
    g.addColorStop(0, rgba(bg.spotlightColor, bg.spotlight));
    g.addColorStop(1, rgba(bg.spotlightColor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, scene.width, scene.height);
  }

  if (bg.dots && bg.dotGap >= 6) {
    ctx.fillStyle = bg.dotColor;
    for (let y = bg.dotGap / 2; y < scene.height; y += bg.dotGap) {
      for (let x = bg.dotGap / 2; x < scene.width; x += bg.dotGap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
