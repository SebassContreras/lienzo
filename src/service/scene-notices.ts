/**
 * What `scene_validate` warns about beyond validity (063/D7): fields the schema ignored,
 * fonts that are not installed and text widths that are estimated (064/D3). Pure and free of Node imports, so the tool and the editor's
 * "Revisión" section build the very same list.
 */
import { idPath } from "../model/id-path.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Element, Scene } from "../model/model.ts";
import { trackKeys } from "../model/track.ts";
import {
  estimatedFonts,
  estimatedWidthNotices,
  type Face,
  missingFontNotice,
  missingFonts,
  missingWeightNotice,
  missingWeights,
} from "./font-check.ts";

/** One warning; `elementId` names the top-level element it is about, when there is one. */
export type SceneNotice = { message: string; elementId?: string };

/** Whether `el` or anything inside it is drawn with `family`. */
function usesFont(el: Element, family: string): boolean {
  if ((el as { font?: unknown }).font === family) return true;
  const children = (el as { children?: unknown }).children;
  return (
    Array.isArray(children) &&
    (children as Element[]).some((c) => usesFont(c, family))
  );
}

/** An easing that shapes nothing: the last keyframe of a track has no segment after it. */
export type DeadEasing = {
  /** The element holding the track, which may sit inside a group. */
  id: string;
  /** The top-level element it belongs to. */
  topId: string;
  path: string;
  t: number;
  easing: string;
};

/** The tracks of `scene` whose last keyframe carries an easing that does nothing (065/D4). Pure. */
export function deadEasings(scene: Scene): DeadEasing[] {
  const found: DeadEasing[] = [];
  const walk = (el: Element, topId: string) => {
    for (const [path, track] of Object.entries(el.tracks ?? {})) {
      const last = [...trackKeys(track)].sort((a, b) => a.t - b.t).at(-1);
      if (last && last.easing !== "auto" && last.easing !== "linear")
        found.push({ id: el.id, topId, path, t: last.t, easing: last.easing });
    }
    const children = (el as { children?: unknown }).children;
    if (Array.isArray(children))
      for (const child of children as Element[]) walk(child, topId);
  };
  for (const el of scene.elements) walk(el, el.id);
  return found;
}

/** The notice for a dead easing: what it would have shaped is the segment to the next keyframe. */
export const deadEasingNotice = (d: DeadEasing) =>
  `La pista «${d.path}» de «${d.id}» tiene easing «${d.easing}» en su último keyframe (t=${d.t}), que no hace nada: el easing da forma al tramo hasta el siguiente keyframe, y este no tiene siguiente`;

/** One notice per dead easing in `scene` (065/D4). */
export function deadKeyframeEasingNotices(scene: Scene): SceneNotice[] {
  return deadEasings(scene).map((d) => ({
    message: deadEasingNotice(d),
    elementId: d.topId,
  }));
}

const CAMERA_CHANNELS = ["x", "y", "zoom"];

/**
 * What a shot says that cannot work (081/D4): a transition longer than the shot, a camera
 * track on a channel the camera does not have, an easing on a camera track's last keyframe.
 */
export function shotNotices(scene: Scene): SceneNotice[] {
  return (scene.shots ?? []).flatMap((shot) => {
    const long =
      shot.transition && shot.transition.duration > shot.end - shot.start
        ? [
            {
              message: `La transición de la toma «${shot.id}» dura ${shot.transition.duration}s y la toma ${round(shot.end - shot.start)}s; se solapa con las tomas vecinas`,
            },
          ]
        : [];
    const tracks = Object.entries(shot.camera?.tracks ?? {});
    const unknown = tracks
      .filter(([path]) => !CAMERA_CHANNELS.includes(path))
      .map(([path]) => ({
        message: `La cámara de la toma «${shot.id}» no tiene la pista «${path}»; se ignora (tiene: ${CAMERA_CHANNELS.join(", ")})`,
      }));
    const dead = tracks.flatMap(([path, track]) => {
      const last = [...trackKeys(track)].sort((a, b) => a.t - b.t).at(-1);
      return last && last.easing !== "auto" && last.easing !== "linear"
        ? [
            {
              message: deadEasingNotice({
                id: `cámara de ${shot.id}`,
                topId: shot.id,
                path,
                t: last.t,
                easing: last.easing,
              }),
            },
          ]
        : [];
    });
    return [...long, ...unknown, ...dead];
  });
}

const round = (n: number) => Math.round(n * 100) / 100;

/** The notices for `scene`, parsed from `raw`; `installed` lists the usable font faces. */
export function sceneNotices(
  raw: unknown,
  scene: Scene,
  installed: readonly Face[],
): SceneNotice[] {
  const ignored = ignoredFields(raw, scene).map((field) => {
    const index = /^elements\.(\d+)/.exec(field.path)?.[1];
    return {
      // the element named as errors name it, by the id the input gave (080/D6)
      message: ignoredNotice({ ...field, path: idPath(raw, field.path) }),
      elementId:
        index === undefined ? undefined : scene.elements[Number(index)]?.id,
    };
  });
  const byFamily = (issues: { family: string; message: string }[]) =>
    issues.map(({ family, message }) => ({
      message,
      elementId: scene.elements.find((el) => usesFont(el, family))?.id,
    }));
  return [
    ...ignored,
    ...byFamily(
      missingFonts(
        scene,
        installed.map((f) => f.family),
      ).map((family) => ({ family, message: missingFontNotice(family) })),
    ),
    ...byFamily(
      missingWeights(scene, installed).map((w) => ({
        family: w.family,
        message: missingWeightNotice(w),
      })),
    ),
    ...deadKeyframeEasingNotices(scene),
    ...shotNotices(scene),
    ...byFamily(
      estimatedFonts(scene).map((family, i) => ({
        family,
        message: estimatedWidthNotices(scene)[i] as string,
      })),
    ),
  ];
}
