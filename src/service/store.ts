/**
 * The Node store the tools use (007/D2): the same folders and file operations as the Vite
 * middleware (`json-fs.ts`), so what the tools write opens in the editor and vice versa.
 */
import { join } from "node:path";
import {
  type JsonItem,
  listJson,
  readJson,
  writeJson,
} from "../presets/json-fs.ts";
import { loadBuiltIns } from "./built-in.ts";

export type PresetSource = "built-in" | "user";

/** A preset file as stored, unchecked: `file` is its name without `.json`. */
export type StoredPreset = {
  file: string;
  source: PresetSource;
  data: unknown;
};

export type Store = {
  /** Built-in presets, then the user's (`presets/*.json`). */
  presets(): Promise<StoredPreset[]>;
  /** Animation presets in `presets/animations/`, unchecked. */
  animPresets(): Promise<JsonItem[]>;
  scenes(): Promise<JsonItem[]>;
  /** The scene stored as `name`, or undefined. */
  readScene(name: string): Promise<unknown | undefined>;
  /** Writes `scenes/<slug>.json` and returns the slug. */
  writeScene(name: string, scene: unknown): Promise<string>;
};

export function createStore(root: string): Store {
  const presets = join(root, "presets");
  const scenes = join(root, "scenes");
  const tag = (source: PresetSource) => (items: JsonItem[]) =>
    items.map((i) => ({ file: i.name, source, data: i.data }));
  return {
    presets: async () => [
      ...tag("built-in")(await loadBuiltIns(root)),
      ...tag("user")(await listJson(presets)),
    ],
    animPresets: () => listJson(join(presets, "animations")),
    scenes: () => listJson(scenes),
    readScene: (name) => readJson(scenes, name),
    writeScene: (name, scene) => writeJson(scenes, name, scene),
  };
}
