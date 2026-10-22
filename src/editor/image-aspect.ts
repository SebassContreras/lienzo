import type { Element, Scene } from "../model/model.ts";

/** Every image `src` in `elements`, group children included. */
export function imageSources(elements: Element[]): string[] {
  return elements.flatMap((e) => {
    if (e.kind === "image") return e.src ? [e.src] : [];
    if (e.kind === "group") return imageSources(e.children);
    return [];
  });
}

/**
 * `scene` with each image's `aspect` set from `aspects` (by `src`), so a corner resize keeps
 * the picture's shape (047/D1). Layout is untouched; the same scene when nothing changes.
 */
export function withImageAspects(
  scene: Scene,
  aspects: ReadonlyMap<string, number>,
): Scene {
  const fix = (elements: Element[]): Element[] => {
    let changed = false;
    const next = elements.map((e) => {
      if (e.kind === "image") {
        const aspect = aspects.get(e.src);
        if (aspect === undefined || aspect === e.aspect) return e;
        changed = true;
        return { ...e, aspect };
      }
      if (e.kind === "group") {
        const children = fix(e.children);
        if (children === e.children) return e;
        changed = true;
        return { ...e, children };
      }
      return e;
    });
    return changed ? next : elements;
  };
  const elements = fix(scene.elements);
  return elements === scene.elements ? scene : { ...scene, elements };
}
