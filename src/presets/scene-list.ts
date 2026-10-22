import type { Scene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";

/** A stored scene file: the scene when it passes the schema, else why not (043/D3). */
export type StoredScene = { name: string } & (
  | { scene: Scene }
  | { error: string }
);

export function toStoredScenes(
  items: readonly { name: string; data: unknown }[],
): StoredScene[] {
  return items.map((item) => {
    const parsed = parseScene(item.data);
    return parsed.ok
      ? { name: item.name, scene: parsed.value }
      : { name: item.name, error: parsed.error };
  });
}

/** `<base>-copia`, or `<base>-copia-2`, … — the first one not in `taken`. */
export function copyName(base: string, taken: readonly string[]): string {
  const used = new Set(taken);
  let n = 1;
  let candidate = `${base}-copia`;
  while (used.has(candidate)) candidate = `${base}-copia-${++n}`;
  return candidate;
}
