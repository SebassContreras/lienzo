import { join } from "node:path";
import { listJson } from "../presets/json-fs.ts";

/**
 * The built-in recipes in `<root>/presets/built-in/`, read from disk in file-name order (the
 * library's order) — the Node counterpart of `import.meta.glob` in `recipes.ts` (007/D2).
 * Items are unchecked JSON; the preset tools validate them.
 */
export const loadBuiltIns = (root: string) =>
  listJson(join(root, "presets", "built-in"));
