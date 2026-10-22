import { join } from "node:path";
import { createFontStore, type FontStore } from "./font-store.ts";
import { createProjectStore, type ProjectStore } from "./project-store.ts";
import { createRenderer, type Renderer } from "./renderer.ts";
import { createStore, type Store } from "./store.ts";

/** The repo, where the app the renderer serves lives (A21). */
const APP_ROOT = join(import.meta.dirname, "..", "..");

import type { TtsService } from "./tts/types.ts";

/**
 * What every tool runs against (007/D1): the repo root and the store over its files, the
 * project store over projects/ (031/D2), and the renderer (010/D2). Tests pass a temp dir
 * as the root; the app is always the repo's.
 */
export type Ctx = {
  root: string;
  store: Store;
  projects: ProjectStore;
  /** User fonts on disk (045/D5). */
  fonts: FontStore;
  /** The network, for the Google Fonts adapter (045/D6); tests pass a fake. */
  fetch: typeof fetch;
  renderer: Renderer;
  tts?: TtsService;
  /** Releases what the ctx started (the renderer's browser and dev server, 010/D4). */
  dispose(): Promise<void>;
};

export function createCtx(
  root: string,
  renderer: Renderer = createRenderer(APP_ROOT),
  tts?: TtsService,
): Ctx {
  return {
    root,
    store: createStore(root),
    projects: createProjectStore(root),
    fonts: createFontStore(root),
    fetch: globalThis.fetch,
    renderer,
    tts,
    dispose: () => renderer.dispose(),
  };
}
