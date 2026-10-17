/**
 * Project modes: differentiates between static image compositions and animated videos (R1, D1).
 */

export type SceneMode = "static" | "video";

/**
 * Pure helper to test if a scene or mode configuration is in static mode.
 * Defaults to false ('video' mode) when undefined or unrecognized for backwards compatibility.
 */
export function isStaticMode(target?: { mode?: string } | string | null): boolean {
  if (!target) return false;
  if (typeof target === "string") return target === "static";
  return target.mode === "static";
}
