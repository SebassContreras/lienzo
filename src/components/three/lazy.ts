/**
 * Loads three.js on demand (066/D1): the 3D runtime and `.glb` models are dynamic imports, so
 * the editor and the `?render` route start without them. Drawing asks `threeRuntime.get()`
 * and shows the placeholder until it is there; exports await `threeRuntime.load` through the
 * descriptor's `load` (066/D2).
 */
import { registerAssetLoader } from "../../engine/assets.ts";
import { lazyModule } from "../../engine/lazy-module.ts";

export const threeRuntime = lazyModule(() => import("./runtime.ts"));

registerAssetLoader("glb", async (src) =>
  (await import("./model.ts")).loadModel(src),
);
