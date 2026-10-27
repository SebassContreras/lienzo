/**
 * Loads three.js on demand (066/D1): the 3D runtime and `.glb` models are dynamic imports, so
 * the editor and the `?render` route start without them. Drawing asks `threeRuntime()` and
 * shows the placeholder until it is there; exports await `loadThree` through the
 * descriptor's `load` (066/D2).
 */
import { registerAssetLoader } from "../../engine/assets.ts";

type Runtime = typeof import("./runtime.ts");

let runtime: Runtime | undefined;
let loading: Promise<void> | undefined;

/** Starts loading the 3D runtime once; resolves when it is ready. */
export function loadThree(): Promise<void> {
  loading ??= import("./runtime.ts").then(
    (m) => {
      runtime = m;
    },
    (error: unknown) => {
      // a failed download is tried again on the next draw or export
      loading = undefined;
      throw error;
    },
  );
  return loading;
}

/** The 3D runtime, or undefined while it loads (asking starts the load). */
export function threeRuntime(): Runtime | undefined {
  if (!runtime) loadThree().catch(() => {});
  return runtime;
}

registerAssetLoader("glb", async (src) =>
  (await import("./model.ts")).loadModel(src),
);
