/**
 * What `scene_validate` warns about beyond validity (063/D7): fields the schema ignored,
 * fonts that are not installed and text widths that are estimated (064/D3). Pure and free of Node imports, so the tool and the editor's
 * "Revisión" section build the very same list.
 */
import { boxOf } from "../../engine/geometry.ts";
import { idPath } from "../../model/id-path.ts";
import { ignoredFields, ignoredNotice } from "../../model/ignored.ts";
import type { Element, Scene, Shot } from "../../model/model.ts";
import { trackKeys } from "../../model/track.ts";
import {
  estimatedFonts,
  estimatedWidthNotices,
  type Face,
  missingFontNotice,
  missingFonts,
  missingWeightNotice,
  missingWeights,
} from "../fonts/font-check.ts";

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
  /** The top-level element it belongs to; none for a track inside a symbol. */
  topId?: string;
  path: string;
  t: number;
  easing: string;
};

/** The tracks of `scene` whose last keyframe carries an easing that does nothing (065/D4). Pure. */
export function deadEasings(scene: Scene): DeadEasing[] {
  const found: DeadEasing[] = [];
  const walk = (el: Element, topId?: string) => {
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
  for (const symbol of Object.values(scene.symbols ?? {}))
    for (const el of symbol.children) walk(el, undefined);
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

/**
 * A notice for each top-level element of `elements` that leaves the canvas (081/D8), except one
 * with a position track, which may enter from outside on purpose.
 */
function offCanvas(
  scene: Scene,
  elements: readonly Element[] = scene.elements,
): SceneNotice[] {
  const round = (n: number) => Math.round(n * 100) / 100;
  return elements.flatMap((el) => {
    if (el.tracks?.x || el.tracks?.y) return [];
    const b = boxOf(el);
    if (
      b.x >= 0 &&
      b.y >= 0 &&
      b.x + b.w <= scene.width &&
      b.y + b.h <= scene.height
    )
      return [];
    return [
      {
        elementId: el.id,
        message:
          `«${el.id}» se sale del lienzo (${scene.width}x${scene.height}): su caja es x ${round(b.x)}, y ${round(b.y)}, ` +
          `${round(b.w)}x${round(b.h)}` +
          (el.kind === "text"
            ? "; da `w` al texto para que haga salto de línea"
            : ""),
      },
    ];
  });
}

export function offCanvasNotices(
  scene: Scene,
  elements: readonly Element[] = scene.elements,
): string[] {
  return offCanvas(scene, elements).map((n) => n.message);
}

/**
 * A line with no shot of its own whose ends sit in different shots (or one in a shot and the
 * other in none): it is drawn all through the scene, with an end loose whenever its element is
 * away. Only lines the write changed, or whose ends it changed, are reported.
 */
function lineShotNotices(
  scene: Scene,
  changed: readonly Element[],
): SceneNotice[] {
  const touched = new Set(changed.map((el) => el.id));
  const byId = new Map(scene.elements.map((el) => [el.id, el]));
  return scene.elements.flatMap((el) => {
    if (el.kind !== "line" || el.shot !== undefined) return [];
    const ends = [el.a, el.b].map((end) => byId.get(end?.attach ?? ""));
    const [a, b] = ends;
    if (!a || !b || a.shot === b.shot) return [];
    if (![el, a, b].some((x) => touched.has(x.id))) return [];
    const where = (x: Element) =>
      x.shot ? `la toma «${x.shot}»` : "ninguna toma";
    return [
      {
        elementId: el.id,
        message: `La línea «${el.id}» une «${a.id}» (${where(a)}) con «${b.id}» (${where(b)}) y no tiene toma propia: se dibuja siempre, con un extremo suelto mientras uno de los dos no está; dale \`shot\``,
      },
    ];
  });
}

const CAMERA_CHANNELS = ["x", "y", "zoom"];

/**
 * What a shot says that cannot work (081/D4): a transition longer than the shot, a camera
 * track on a channel the camera does not have, an easing on a camera track's last keyframe.
 */
export function shotNotices(
  scene: Scene,
  shots: readonly Shot[] = scene.shots ?? [],
): SceneNotice[] {
  return shots.flatMap((shot) => {
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

/** The top-level elements, the symbols and the shots a write changed; no `shots` means all. */
export type Changed = {
  elements: readonly Element[];
  symbols?: Scene["symbols"];
  shots?: readonly Shot[];
};

/**
 * The notices every writer gives about scene content (082/D6): fonts and weights the project
 * lacks, elements off the canvas, easings that shape nothing, shot problems and text widths
 * that are estimated. `changed` limits each to what a write changed, so a call does not repeat
 * what an earlier one already said. One assembly for `saveScene`, `buildCompact` and
 * `sceneNotices`, so a writer cannot lack one the others give.
 */
export function contentNotices(
  scene: Scene,
  installed: readonly Face[],
  changed: Changed = { elements: scene.elements, symbols: scene.symbols },
): SceneNotice[] {
  const { elements } = changed;
  const part = {
    ...scene,
    elements: [...elements],
    symbols: changed.symbols,
  };
  const byFamily = (issues: { family: string; message: string }[]) =>
    issues.map(({ family, message }) => ({
      message,
      elementId: part.elements.find((el) => usesFont(el, family))?.id,
    }));
  return [
    ...byFamily(
      missingFonts(
        part,
        installed.map((f) => f.family),
      ).map((family) => ({ family, message: missingFontNotice(family) })),
    ),
    ...byFamily(
      missingWeights(part, installed).map((w) => ({
        family: w.family,
        message: missingWeightNotice(w),
      })),
    ),
    ...deadKeyframeEasingNotices(part),
    ...offCanvas(scene, elements),
    ...lineShotNotices(scene, elements),
    ...shotNotices(scene, changed.shots),
    ...byFamily(
      estimatedFonts(part).map((family, i) => ({
        family,
        message: estimatedWidthNotices(part)[i] as string,
      })),
    ),
  ];
}

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
  return [...ignored, ...contentNotices(scene, installed)];
}
