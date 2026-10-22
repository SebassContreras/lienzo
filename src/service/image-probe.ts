import type { Crop } from "../components/image/descriptor.ts";
import { lazyRenderPage } from "./renderer.ts";

/**
 * Reads what tools need from a picture (049/D1). Tools depend on this port, not on the
 * browser that decodes the file, so tests pass a fake.
 */
export type ImageProbe = {
  /**
   * The fractional rectangle of the visible pixels of the image at `src` (as a scene stores
   * it), undefined when it has none; rejects when the image cannot be decoded.
   */
  opaqueBounds(src: string): Promise<Crop | undefined>;
  /** Releases what the probe started; safe to call twice. */
  dispose(): Promise<void>;
};

/**
 * The probe over the app's `?render` page in a headless browser (049/D2): the page decodes
 * the picture and runs the editor's `alphaBounds`. The page opens on first use.
 */
export function createBrowserImageProbe(appRoot: string): ImageProbe {
  const app = lazyRenderPage(appRoot);
  return {
    async opaqueBounds(src) {
      const page = await app.page();
      return page.evaluate((s) => {
        if (!window.lienzoOpaqueBounds)
          throw new Error("render route not loaded");
        return window.lienzoOpaqueBounds(s);
      }, src);
    },
    dispose: app.dispose,
  };
}
