import type { Scene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";

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
    if (!raw) return undefined;
    // A draft from an older version may no longer be a valid scene: never open it broken.
    const parsed = parseScene(JSON.parse(raw));
    return parsed.ok ? parsed.value : undefined;
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

/**
 * Keeps the blank scene the editor shows by itself (on start, on a project switch, on
 * "En blanco") from being autosaved over the draft (042/D3), until the user edits it.
 */
export function createDraftGuard() {
  let pristine: Scene | undefined;
  return {
    /** `scene` was shown by the editor, not made by the user. */
    markPristine(scene: Scene) {
      pristine = scene;
    },
    /** `next` replaces `prev` without a user edit (the project's canvas defaults). */
    carry(prev: Scene, next: Scene) {
      if (prev === pristine) pristine = next;
    },
    /** Whether `scene` is the user's work and belongs in the draft. */
    shouldSave(scene: Scene): boolean {
      if (scene === pristine) return false;
      pristine = undefined;
      return true;
    },
  };
}
