import { SCENE_CHANGED, type SceneChanged } from "../../model/scene-changed.ts";

/** Scene files written on disk, as the dev server reports them (050/D2). */
export type SceneEvents = {
  /** Calls `cb` on every written scene file; returns the unsubscribe. */
  on(cb: (change: SceneChanged) => void): () => void;
};

/**
 * The dev server's scene events, the only place that touches `import.meta.hot`; undefined
 * without a dev server (a built bundle), where joint mode cannot run.
 */
export function sceneEvents(): SceneEvents | undefined {
  const hot = import.meta.hot;
  if (!hot) return undefined;
  return {
    on(cb) {
      const listener = (data: SceneChanged) => cb(data);
      hot.on(SCENE_CHANGED, listener);
      return () => hot.off(SCENE_CHANGED, listener);
    },
  };
}
