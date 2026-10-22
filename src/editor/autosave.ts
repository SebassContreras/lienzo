import type { Scene } from "../model/model.ts";

/** The part of `localStorage` autosave uses, so tests pass a plain object. */
export type DraftStorage = Pick<Storage, "getItem" | "setItem">;

/** One autosaved draft per project workspace (041/D2). */
export function autosaveKey(slug = "mi-proyecto"): string {
  return `lienzo-scene:${slug}`;
}

/** The workspace's last autosaved scene, read only when the user asks for it (042/D3). */
export function readAutosave(
  slug: string | undefined,
  storage: DraftStorage = localStorage,
): Scene | undefined {
  try {
    const raw = storage.getItem(autosaveKey(slug));
    return raw ? (JSON.parse(raw) as Scene) : undefined;
  } catch {
    return undefined; // storage blocked or a broken draft: nothing to recover
  }
}

export function writeAutosave(
  slug: string | undefined,
  scene: Scene,
  storage: DraftStorage = localStorage,
): void {
  try {
    storage.setItem(autosaveKey(slug), JSON.stringify(scene));
  } catch {
    // storage unavailable: autosave is a convenience only
  }
}
