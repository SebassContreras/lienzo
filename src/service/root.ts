/**
 * Resolves the workspace/repo root directory (029/D2).
 * Works both when running from source (`src/cli/main.ts` -> 2 levels up)
 * and when running from compiled distribution (`dist/cli.js` -> 1 level up,
 * or searching upward for presets/package.json).
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export function findAppRoot(fromDir: string = import.meta.dirname): string {
  let curr = resolve(fromDir);
  while (true) {
    if (existsSync(join(curr, "presets", "built-in")) || existsSync(join(curr, "package.json"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(fromDir, "..");
}
