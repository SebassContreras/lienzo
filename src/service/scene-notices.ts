/**
 * What `scene_validate` warns about beyond validity (063/D7): fields the schema ignored,
 * fonts that are not installed and text widths that are estimated (064/D3). Pure and free of Node imports, so the tool and the editor's
 * "Revisión" section build the very same list.
 */
import { idPath } from "../model/id-path.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Element, Scene } from "../model/model.ts";
import {
  estimatedFonts,
  estimatedWidthNotices,
  type Face,
  missingFonts,
  missingFontNotice,
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
    ...byFamily(
      estimatedFonts(scene).map((family, i) => ({
        family,
        message: estimatedWidthNotices(scene)[i] as string,
      })),
    ),
  ];
}
