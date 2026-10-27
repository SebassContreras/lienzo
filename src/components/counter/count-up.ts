/**
 * A new counter counts (071/D5): `progress` defaults to 1 in the schema, so stored scenes keep
 * their value, but one added by a tool with no `progress` of its own gets a count-up track.
 */
import type { Element } from "../../model/model.ts";

/** How long the default count-up runs, capped by the scene. */
export const COUNT_UP_SECONDS = 1.5;

/** `el` with a 0→1 `progress` track when it is a counter and `given` names no `progress`. */
export function withCountUp(
  el: Element,
  given: Record<string, unknown>,
  duration: number,
): Element {
  const tracks = given.tracks as Record<string, unknown> | undefined;
  if (el.kind !== "counter" || "progress" in given || tracks?.progress)
    return el;
  const end = Math.min(COUNT_UP_SECONDS, duration);
  return {
    ...el,
    tracks: {
      ...el.tracks,
      progress: [
        { t: 0, value: 0, easing: "auto" },
        { t: end, value: 1, easing: "auto" },
      ],
    },
  };
}
