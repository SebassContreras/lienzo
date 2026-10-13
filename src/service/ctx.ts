import { join } from "node:path";
import { createRenderer, type Renderer } from "./renderer.ts";
import { createStore, type Store } from "./store.ts";

/** The repo, where the app the renderer serves lives (A21). */
const APP_ROOT = join(import.meta.dirname, "..", "..");

/**
 * What every tool runs against (007/D1): the repo root and the store over its files, and
 * the renderer (010/D2). Tests pass a temp dir as the root; the app is always the repo's.
 */
export type Ctx = {
  root: string;
  store: Store;
  renderer: Renderer;
  /** Releases what the ctx started (the renderer's browser and dev server, 010/D4). */
  dispose(): Promise<void>;
};

export function createCtx(
  root: string,
  renderer: Renderer = createRenderer(APP_ROOT),
): Ctx {
  return {
    root,
    store: createStore(root),
    renderer,
    dispose: () => renderer.dispose(),
  };
}
