/**
 * Pure tree lookup and immutable transformation helpers over `Element[]` (051/D1).
 * Supports both bare unique element IDs (`s1-car`) and slash-separated group paths
 * (`shot-1/s1-car`) across nested groups of any depth.
 */
import type { Element, GroupEl } from "../model/model.ts";
import { fail } from "./registry.ts";

/** Locates an element in `elements` by unique `id` or slash-separated path (`group/child`). */
function resolvePath(
  elements: readonly Element[],
  target: string,
  errorPath: string,
): number[] {
  if (target.includes("/")) {
    const segments = target.split("/");
    if (segments.some((s) => s.length === 0)) {
      fail("not_found", `No existe el elemento «${target}»`, errorPath);
    }
    const indices: number[] = [];
    let current: readonly Element[] = elements;
    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s] as string;
      const idx = current.findIndex((el) => el.id === seg);
      if (idx < 0) {
        fail("not_found", `No existe el elemento «${target}»`, errorPath);
      }
      indices.push(idx);
      if (s < segments.length - 1) {
        const el = current[idx] as Element;
        if (el.kind !== "group") {
          fail("not_a_group", `El elemento «${seg}» no es un grupo`, errorPath);
        }
        current = el.children;
      }
    }
    return indices;
  }

  const matches: number[][] = [];
  const walk = (list: readonly Element[], prefix: number[]) => {
    for (let i = 0; i < list.length; i++) {
      const el = list[i] as Element;
      const here = [...prefix, i];
      if (el.id === target) matches.push(here);
      if (el.kind === "group") walk(el.children, here);
    }
  };
  walk(elements, []);

  if (matches.length === 0) {
    fail("not_found", `No existe el elemento «${target}»`, errorPath);
  }
  if (matches.length > 1) {
    fail(
      "ambiguous_id",
      `El id «${target}» aparece más de una vez; usa la ruta con «/»`,
      errorPath,
    );
  }
  return matches[0] as number[];
}

function getAt(
  elements: readonly Element[],
  indices: readonly number[],
): Element {
  let current: readonly Element[] = elements;
  for (let d = 0; d < indices.length - 1; d++) {
    const group = current[indices[d] as number] as GroupEl;
    current = group.children;
  }
  return current[indices[indices.length - 1] as number] as Element;
}

function mapListAt(
  elements: readonly Element[],
  parentIndices: readonly number[],
  fn: (siblings: readonly Element[]) => Element[],
): Element[] {
  if (parentIndices.length === 0) {
    return fn(elements);
  }
  const [head, ...rest] = parentIndices as [number, ...number[]];
  return elements.map((el, i) => {
    if (i !== head) return el;
    const group = el as GroupEl;
    return {
      ...group,
      children: mapListAt(group.children, rest, fn),
    };
  });
}

/** Finds an element by `id` or slash path across the full group tree, or fails on `path`. */
export function findElement(
  elements: readonly Element[],
  target: string,
  path = "id",
): Element {
  return getAt(elements, resolvePath(elements, target, path));
}

/** Immutably updates the element at `target` (`id` or slash path), cloning only its ancestor chain. */
export function updateElement(
  elements: readonly Element[],
  target: string,
  fn: (el: Element) => Element,
  path = "id",
): Element[] {
  const indices = resolvePath(elements, target, path);
  const leafIndex = indices[indices.length - 1] as number;
  return mapListAt(elements, indices.slice(0, -1), (siblings) =>
    siblings.map((el, i) => (i === leafIndex ? fn(el) : el)),
  );
}

/**
 * Immutably transforms the sibling array containing `target` (`id` or slash path),
 * passing the sibling array and the target's index within it.
 */
export function updateSiblings(
  elements: readonly Element[],
  target: string,
  fn: (siblings: readonly Element[], index: number) => Element[],
  path = "id",
): Element[] {
  const indices = resolvePath(elements, target, path);
  const leafIndex = indices[indices.length - 1] as number;
  return mapListAt(elements, indices.slice(0, -1), (siblings) =>
    fn(siblings, leafIndex),
  );
}

/**
 * Appends `child` to the `group` element resolved by `parentTarget` (`id` or slash path).
 * Fails on `"parent"` if `parentTarget` is not found or is not a `group`.
 */
export function insertChild(
  elements: readonly Element[],
  parentTarget: string,
  child: Element,
  path = "parent",
): Element[] {
  const indices = resolvePath(elements, parentTarget, path);
  const targetEl = getAt(elements, indices);
  if (targetEl.kind !== "group") {
    fail("not_a_group", `El elemento «${parentTarget}» no es un grupo`, path);
  }
  const leafIndex = indices[indices.length - 1] as number;
  return mapListAt(elements, indices.slice(0, -1), (siblings) =>
    siblings.map((el, i) =>
      i === leafIndex
        ? { ...(el as GroupEl), children: [...(el as GroupEl).children, child] }
        : el,
    ),
  );
}
