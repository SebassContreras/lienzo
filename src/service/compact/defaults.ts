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
  borderGlow: { enabled: false },
};

/** Shapes and paths: `flat` paths drop their stroke too, which lives in `border` (063/D4). */
export const FLAT_KINDS: readonly string[] = [...SHAPE_KINDS, "path", "icon"];

/** An icon's look lives in its tile (080/D18). */
const FLAT_ICON_PATCH = { tile: { gradient: false } };

export function applySceneDefaults(
  el: Element,
  defaults: SceneDefaults | undefined,
): void {
  if (defaults !== "flat" || !FLAT_KINDS.includes(el.kind)) return;
  deepMerge(
    el as unknown as Record<string, unknown>,
    el.kind === "icon" ? FLAT_ICON_PATCH : FLAT_SHAPE_PATCH,
  );
}
