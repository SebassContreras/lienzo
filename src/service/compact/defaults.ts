/**
 * Scene-level style defaults for compact scenes (058/D5). Applied to a kind's default
 * element before its own values are merged, so anything written on the element wins.
 */
import { SHAPE_KINDS } from "../../components/rect/descriptor.ts";
import type { SceneDefaults } from "../../model/compact.ts";
import type { Element } from "../../model/model.ts";
import { deepMerge } from "../../presets/resolve.ts";

export const FLAT_SHAPE_PATCH = {
  fill: { gradient: false },
  shadow: { enabled: false },
  border: { width: 0 },
};

/** Shapes and paths: `flat` paths drop their stroke too, which lives in `border` (063/D4). */
const FLAT_KINDS: readonly string[] = [...SHAPE_KINDS, "path"];

export function applySceneDefaults(
  el: Element,
  defaults: SceneDefaults | undefined,
): void {
  if (defaults !== "flat" || !FLAT_KINDS.includes(el.kind)) return;
  deepMerge(el as unknown as Record<string, unknown>, FLAT_SHAPE_PATCH);
}
