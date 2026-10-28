/**
 * The Node store the tools use (007/D2): the same folders and file operations as the Vite
 * middleware (`json-fs.ts`), so what the tools write opens in the editor and vice versa.
 */
import { join } from "node:path";
import { type JsonItem, listJson } from "../presets/json-fs.ts";
import { loadBuiltIns } from "./presets/built-in.ts";

export type PresetSource = "built-in" | "user";

/** A preset file as stored, unchecked: `file` is its name without `.json`. */
type StoredPreset = {
  file: string;
  source: PresetSource;
  data: unknown;
};

/** The presets every tool can read; scenes live only in a project (046/D1). */
export type PresetStore = {
  /** Built-in presets, then the user's (`presets/*.json`). */
  presets(): Promise<StoredPreset[]>;
  /** Animation presets in `presets/animations/`, unchecked. */
  animPresets(): Promise<JsonItem[]>;
};

/** A project's store: its presets and its `scenes/`. */
export type Store = PresetStore & {
  scenes(): Promise<JsonItem[]>;
  /** The scene stored as `name`, or undefined. */
  readScene(name: string): Promise<unknown | undefined>;
  /** Writes `scenes/<slug>.json` and returns the slug. */
  writeScene(name: string, scene: unknown): Promise<string>;
};

export function createStore(root: string): PresetStore {
  const presets = join(root, "presets");
  const tag = (source: PresetSource) => (items: JsonItem[]) =>
    items.map((i) => ({ file: i.name, source, data: i.data }));
  return {
    presets: async () => [
      ...tag("built-in")(await loadBuiltIns(root)),
      ...tag("user")(await listJson(presets)),
    ],
    animPresets: () => listJson(join(presets, "animations")),
  };
}
