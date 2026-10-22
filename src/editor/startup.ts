import { defaultScene, type Scene } from "../model/model.ts";

/**
 * What the editor shows when it opens or switches project (042): a blank scene, paused at
 * t = 0, named after the default project. The autosaved draft is not read here (042/D3).
 */
export function startupState(): { scene: Scene; playing: false; name: string } {
  return { scene: defaultScene(), playing: false, name: "Mi proyecto" };
}
