/**
 * The render-only route (`?render`, 010/D1): no editor, only the export functions, exposed
 * as `window.lienzoExport` for the headless renderer (`src/service/renderer.ts`). The scene
 * comes from the caller, already checked by the service, so the page and the tools always
 * render the same scene; the output is the editor's own `exportScene` (A3, R3).
 */
import type { Scene } from "../model/model.ts";
import { type ExportOptions, exportScene } from "./export.ts";

/** What the page hands back: the encoded file as base64 and its MIME type. */
export type RenderedFile = { base64: string; type: string };

export type LienzoExport = (
  scene: Scene,
  options: ExportOptions,
) => Promise<RenderedFile>;

declare global {
  interface Window {
    lienzoExport?: LienzoExport;
  }
}

/** `blob` as base64 (without the `data:` prefix), the one form `page.evaluate` returns cheaply. */
function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function mountRenderPage(): void {
  window.lienzoExport = async (scene, options) => {
    const blob = await exportScene(scene, options, () => {});
    return { base64: await toBase64(blob), type: blob.type };
  };
  document.title = "Lienzo — render";
}
