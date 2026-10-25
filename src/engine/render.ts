import { descriptorOf } from "../components/index.ts";
import type { Background, Element, Scene } from "../model/model.ts";
import { animate } from "./animate.ts";
import { withMask } from "./clip.ts";
import { withEffects } from "./effects.ts";
import { indexById, indexElements } from "./geometry.ts";
import { type Ctx, linearGradient, rgba } from "./paint.ts";
import { isElementActiveInShot, type ShotView, withShotView } from "./shots.ts";

const OWN_OPACITY_KINDS = new Set<string>(["icon", "image", "text", "line"]);

/**
 * Draws one frame of a scene. Pure function of (scene, t): the editor, PNG, GIF and MP4 export
 * all call this, so what you see while editing is exactly what gets exported.
 */
export function drawScene(ctx: Ctx, scene: Scene, t: number): void {
  drawBackground(ctx, scene);
  drawElements(ctx, scene.elements, scene, t, indexById(scene), withShotView);
}

/**
 * Draws elements in order. `byId` resolves line attachments in the same coordinate space as
 * `elements` (the scene's, or a group's content space).
 * A mask clips an element (or group) and the mask element itself is not drawn (025/D2).
 * `view` wraps each element's draw; only the top level passes the shot view, so a group's
 * children are never transformed by the camera a second time (063/D1).
 */
export function drawElements(
  ctx: Ctx,
  elements: Element[],
  scene: Scene,
  t: number,
  byId: Map<string, Element> = indexElements(elements),
  view: ShotView = (_ctx, _el, _scene, _t, draw) => draw(),
): void {
  // Find all elements that act as a mask for any element in this scope
  const maskIds = new Set<string>();
  for (const el of elements) {
    const mask = (el as unknown as { effects?: { mask?: string } }).effects
      ?.mask;
    if (mask) maskIds.add(mask);
  }

  const dc = { scene, t, byId, drawElements };
  for (const el of elements) {
    // A hidden element is skipped from drawing (034/D4)
    if (el.hidden) continue;
    // An element bound to a shot is active only within the shot's window (055/D2)
    if (!isElementActiveInShot(el, t, scene.shots)) continue;
    // A mask element itself is skipped instead of being drawn directly (025/D2)
    if (maskIds.has(el.id)) continue;

    const now = animate(el, t, scene);
    const elOpacity = (now.el as unknown as { opacity?: number }).opacity ?? 1;
    if (elOpacity <= 0) continue;

    if (!OWN_OPACITY_KINDS.has(el.kind) && elOpacity < 1) {
      now.transform.alpha *= elOpacity;
    }

    const fx = (
      now.el as unknown as {
        effects?: {
          blur?: number;
          blend?: import("../components/fields/effects.ts").BlendMode;
          mask?: string;
        };
      }
    ).effects;

    const drawItem = () => {
      withEffects(ctx, fx, () => {
        descriptorOf(el.kind)?.draw(ctx, now.el as never, now.transform, dc);
      });
    };

    const maskTarget = fx?.mask ? byId.get(fx.mask) : undefined;
    view(ctx, el, scene, t, () => {
      if (maskTarget) {
        const maskNow = animate(maskTarget, t, scene);
        withMask(ctx, maskNow.el, maskNow.transform, drawItem);
      } else {
        drawItem();
      }
    });
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
