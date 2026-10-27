/**
 * A new counter counts (071/D5): `progress` defaults to 1 in the schema, so stored scenes keep
 * their value, but one added by a tool with no `progress` of its own gets a count-up track.
 */
import type { Element, Scene } from "../../model/model.ts";

/** How long the default count-up runs, capped by the counter's shot and the scene. */
export const COUNT_UP_SECONDS = 1.5;

/** What the count-up is fitted to: the scene's length and its shot windows (072/D3). */
export type CountUpScene = {
  duration: number;
  shots?: readonly Pick<
    NonNullable<Scene["shots"]>[number],
    "id" | "start" | "end"
  >[];
};

/**
 * `el` with a 0→1 `progress` track when it is a counter and `given` names no `progress`. The
 * track starts when the counter's shot starts (scene time), so it counts while it is seen.
 */
export function withCountUp(
  el: Element,
  given: Record<string, unknown>,
  scene: CountUpScene,
): Element {
  const tracks = given.tracks as Record<string, unknown> | undefined;
  if (el.kind !== "counter" || "progress" in given || tracks?.progress)
    return el;
  const shot = scene.shots?.find((sh) => sh.id === el.shot);
  const start = Math.min(shot?.start ?? 0, scene.duration);
  const end = Math.min(
    start + COUNT_UP_SECONDS,
    shot?.end ?? scene.duration,
    scene.duration,
  );
  return {
    ...el,
    tracks: {
      ...el.tracks,
      progress: [
        { t: start, value: 0, easing: "auto" },
        { t: end, value: 1, easing: "auto" },
      ],
    },
  };
}
