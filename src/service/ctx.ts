import {
  createBrowserImageProbe,
  type ImageProbe,
} from "./assets/image-probe.ts";
import { createFontStore, type FontStore } from "./fonts/font-store.ts";
import {
  createProjectStore,
  type ProjectStore,
} from "./projects/project-store.ts";
import { findAppRoot } from "./projects/root.ts";
import { createRenderer, type Renderer } from "./renderer.ts";
import { createStore, type PresetStore, type Store } from "./store.ts";

/**
 * The repo, where the app the renderer serves lives (A21): found going up from this file, so
 * it is the same from `src/service/` and from the one-file bundle `dist/cli.js` (076/D1).
 */
export const APP_ROOT = findAppRoot(import.meta.dirname);

import type { TtsService } from "./speech/types.ts";

/**
 * What every tool runs against (007/D1): the repo root and the store over its files, the
 * project store over projects/ (031/D2), and the renderer (010/D2). Tests pass a temp dir
 * as the root; the app is always the repo's.
 */
export type Ctx = {
  root: string;
  store: PresetStore;
  projects: ProjectStore;
  /** User fonts on disk (045/D5). */
  fonts: FontStore;
  /** The network, for the Google Fonts adapter (045/D6); tests pass a fake. */
  fetch: typeof fetch;
  renderer: Renderer;
  /** Decodes pictures for `image_trim` (049/D1); tests pass a fake. */
  images: ImageProbe;
  tts?: TtsService;
  /** Releases what the ctx started: the renderer's and the probe's browsers (010/D4, 049/D2). */
  dispose(): Promise<void>;
};

/** A ctx scoped to one project (046/D1): the only kind that reaches scenes. */
export type ProjectCtx = Ctx & { store: Store; project: string };

export function createCtx(
  root: string,
  renderer: Renderer = createRenderer(APP_ROOT),
  tts?: TtsService,
  images: ImageProbe = createBrowserImageProbe(APP_ROOT),
): Ctx {
  return {
    root,
    store: createStore(root),
    projects: createProjectStore(root),
    fonts: createFontStore(root),
    fetch: globalThis.fetch,
    renderer,
    images,
    tts,
    dispose: async () => {
      await Promise.all([renderer.dispose(), images.dispose()]);
    },
  };
}
