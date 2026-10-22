/**
 * Rendering outside the editor (A21, 010/D2): the app's render-only route (`?render`, D1)
 * in headless Chromium through Playwright, served by an in-process Vite dev server. Both
 * start on the first render and stay up for the next ones in the same process (the MCP
 * server); `dispose()` closes them (D4). Vite and Playwright are imported only then, so
 * tools that never render start as fast as before.
 *
 * The browser is the installed Chrome when present (H.264 for MP4), else Edge, else
 * Playwright's own Chromium; without H.264 the editor's encoder writes WebM instead.
 */
import { join } from "node:path";
import type { Browser, Page } from "playwright-core";
import type { ViteDevServer } from "vite";
import type { ExportOptions } from "../export/export.ts";
import type { RenderedFile } from "../export/render-page.ts";
import type { Scene } from "../model/model.ts";
import { fail } from "./registry.ts";

/** An encoded frame or animation and its MIME type (`video/webm` when MP4 fell back). */
export type Rendered = { bytes: Buffer; type: string };

export type Renderer = {
  /** `project` picks the user fonts the page loads (045/D3). */
  render(
    scene: Scene,
    options: ExportOptions,
    project?: string,
  ): Promise<Rendered>;
  /** Closes the browser and the dev server, if they started; safe to call twice. */
  dispose(): Promise<void>;
};

/** Tried in order: installed Chrome, installed Edge, Playwright's downloaded Chromium. */
const CHANNELS = ["chrome", "msedge", undefined] as const;

/** The app served by Vite and open in a headless browser page. */
export type AppSession = { vite: ViteDevServer; browser: Browser; page: Page };

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  for (const channel of CHANNELS) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // not installed; try the next one
    }
  }
  return fail(
    "no_browser",
    "No se encontró Chrome, Edge ni Chromium para renderizar; instala Chrome o ejecuta `pnpm exec playwright-core install chromium`",
  );
}

/**
 * Serves the app at `appRoot` and opens `search` (`?render` for the render route, "" for the
 * editor) in a headless browser; the caller closes both.
 */
export async function openApp(
  appRoot: string,
  search: string,
): Promise<AppSession> {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: appRoot,
    configFile: join(appRoot, "vite.config.ts"),
    // stdout belongs to the CLI's JSON and the MCP protocol.
    logLevel: "silent",
    clearScreen: false,
    server: { port: 0, host: "127.0.0.1", hmr: false, watch: null },
  });
  let browser: Browser | undefined;
  try {
    await vite.listen();
    const url = vite.resolvedUrls?.local[0];
    if (!url) throw new Error("the Vite server has no local URL");
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(`${url}${search}`);
    return { vite, browser, page };
  } catch (error) {
    await closeApp({ vite, browser });
    throw error;
  }
}

/** Closes what `openApp` started. */
export async function closeApp(app: Partial<AppSession>): Promise<void> {
  await app.browser?.close().catch(() => {});
  await app.vite?.close();
}

async function openRenderRoute(appRoot: string): Promise<AppSession> {
  const app = await openApp(appRoot, "?render");
  try {
    await app.page.waitForFunction(() => window.lienzoExport !== undefined);
    return app;
  } catch (error) {
    await closeApp(app);
    throw error;
  }
}

/**
 * The `?render` page of the app at `appRoot`, opened on the first `page()` and reused; a
 * failed start is retried on the next call. Shared by the renderer and the image probe.
 */
export function lazyRenderPage(appRoot: string): {
  page(): Promise<Page>;
  dispose(): Promise<void>;
} {
  let session: Promise<AppSession> | undefined;
  return {
    async page() {
      session ??= openRenderRoute(appRoot).catch((error: unknown) => {
        session = undefined;
        throw error;
      });
      return (await session).page;
    },
    async dispose() {
      const current = session;
      session = undefined;
      if (!current) return;
      const s = await current.catch(() => undefined);
      if (s) await closeApp(s);
    },
  };
}

/** A renderer over the app at `appRoot` (the repo, not the scenes' root). */
export function createRenderer(appRoot: string): Renderer {
  const app = lazyRenderPage(appRoot);
  return {
    async render(scene, options, project) {
      const page = await app.page();
      const file: RenderedFile = await page.evaluate(
        ([s, o, p]) => {
          if (!window.lienzoExport) throw new Error("render route not loaded");
          return window.lienzoExport(s, o, p);
        },
        [scene, options, project] as const,
      );
      return { bytes: Buffer.from(file.base64, "base64"), type: file.type };
    },
    dispose: app.dispose,
  };
}
