/**
 * The one WebGL renderer every 3D element shares (016/D1): each renders in turn into its
 * offscreen canvas and is copied out with `drawImage` before the next one, so the number of
 * elements is not bound by the browser's cap on live WebGL contexts (A25).
 */
import { type Camera, type Scene, WebGLRenderer } from "three";

let shared: WebGLRenderer | null | undefined;

/** The shared renderer, or null where WebGL is not available (tests, old browsers). */
function renderer(): WebGLRenderer | null {
  if (shared === undefined) {
    try {
      shared = new WebGLRenderer({
        canvas: new OffscreenCanvas(1, 1),
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      shared.setClearColor(0x000000, 0);
    } catch {
      shared = null;
    }
  }
  return shared;
}

/**
 * Renders `scene` through `camera` at `width` × `height` pixels on a transparent background;
 * the canvas holds the picture until the next call. Null without WebGL.
 */
export function renderOffscreen(
  scene: Scene,
  camera: Camera,
  width: number,
  height: number,
): OffscreenCanvas | null {
  const r = renderer();
  if (!r) return null;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = r.domElement;
  if (canvas.width !== w || canvas.height !== h) r.setSize(w, h, false);
  r.clear();
  r.render(scene, camera);
  return r.domElement as unknown as OffscreenCanvas;
}
