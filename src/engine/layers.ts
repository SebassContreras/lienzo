/**
 * Pure functions for layer tree hierarchy, ordering, visibility, and locking.
 * Canvas elements are stored in array order (index 0 is backmost, index N-1 is frontmost).
 * In UI layers panels, visual order is displayed front-to-back (index N-1 at top).
 */

import type { Element, GroupEl } from "../model/model.ts";

export type LayerDirection = "up" | "down" | "top" | "bottom";

/**
 * Reorders elements by moving an element from `fromIndex` to `toIndex`.
 * Pure and non-mutating. Clamps indices within bounds.
 */
export function reorderElements<T>(list: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    fromIndex >= list.length ||
    toIndex < 0 ||
    toIndex >= list.length ||
    fromIndex === toIndex
  ) {
    return [...list];
  }
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item as T);
  return next;
}

/**
 * Moves an element identified by `id` along the canvas stacking order.
 * - 'up': brings forward (+1 index towards front)
 * - 'down': sends backward (-1 index towards back)
 * - 'top': brings to front (last array index)
 * - 'bottom': sends to back (index 0)
 *
 * If the element is nested within a group, it moves inside that group's children array.
 */
export function moveElementLayer(
  elements: readonly Element[],
  id: string,
  direction: LayerDirection,
): Element[] {
  // Check top-level elements first
  const index = elements.findIndex((el) => el.id === id);
  if (index !== -1) {
    let targetIndex = index;
    if (direction === "up") targetIndex = Math.min(elements.length - 1, index + 1);
    else if (direction === "down") targetIndex = Math.max(0, index - 1);
    else if (direction === "top") targetIndex = elements.length - 1;
    else if (direction === "bottom") targetIndex = 0;

    return reorderElements(elements, index, targetIndex);
  }

  // Otherwise search nested group children recursively
  return elements.map((el) => {
    if (el.kind !== "group") return el;
    const group = el as GroupEl;
    const children = (group.children ?? []) as Element[];
    const childIndex = children.findIndex((c) => c.id === id);
    if (childIndex !== -1) {
      let targetIndex = childIndex;
      if (direction === "up") targetIndex = Math.min(children.length - 1, childIndex + 1);
      else if (direction === "down") targetIndex = Math.max(0, childIndex - 1);
      else if (direction === "top") targetIndex = children.length - 1;
      else if (direction === "bottom") targetIndex = 0;

      return {
        ...group,
        children: reorderElements(children, childIndex, targetIndex),
      } as unknown as Element;
    }

    // Deeper recursion if groups are nested
    const updatedChildren = moveElementLayer(children, id, direction);
    if (updatedChildren !== children) {
      return {
        ...group,
        children: updatedChildren,
      } as unknown as Element;
    }
    return el;
  });
}

/**
 * Toggles or explicitly sets visibility (`hidden` property) of an element by `id`.
 * Pure and recursively searches nested group children.
 */
export function toggleElementVisibility(
  elements: readonly Element[],
  id: string,
  forceHidden?: boolean,
): Element[] {
  return elements.map((el) => {
    const raw = el as Record<string, unknown>;
    if (el.id === id) {
      const nextHidden = forceHidden !== undefined ? forceHidden : !raw.hidden;
      const clone = { ...raw };
      if (nextHidden) {
        clone.hidden = true;
      } else {
        delete clone.hidden;
      }
      return clone as unknown as Element;
    }
    if (el.kind === "group") {
      const group = el as GroupEl;
      const children = (group.children ?? []) as Element[];
      const updatedChildren = toggleElementVisibility(children, id, forceHidden);
      if (updatedChildren !== children) {
        return {
          ...group,
          children: updatedChildren,
        } as unknown as Element;
      }
    }
    return el;
  });
}

/**
 * Toggles or explicitly sets lock status (`locked` property) of an element by `id`.
 * Pure and recursively searches nested group children.
 */
export function toggleElementLock(
  elements: readonly Element[],
  id: string,
  forceLocked?: boolean,
): Element[] {
  return elements.map((el) => {
    const raw = el as Record<string, unknown>;
    if (el.id === id) {
      const nextLocked = forceLocked !== undefined ? forceLocked : !raw.locked;
      const clone = { ...raw };
      if (nextLocked) {
        clone.locked = true;
      } else {
        delete clone.locked;
      }
      return clone as unknown as Element;
    }
    if (el.kind === "group") {
      const group = el as GroupEl;
      const children = (group.children ?? []) as Element[];
      const updatedChildren = toggleElementLock(children, id, forceLocked);
      if (updatedChildren !== children) {
        return {
          ...group,
          children: updatedChildren,
        } as unknown as Element;
      }
    }
    return el;
  });
}

/**
 * Returns elements in visual layer order (topmost/front z-index first).
 */
export function visualLayerOrder<T>(elements: readonly T[]): T[] {
  return [...elements].reverse();
}

/**
 * Maps visual layer index back to canvas array index.
 */
export function visualIndexToArrayIndex(visualIndex: number, length: number): number {
  return length - 1 - visualIndex;
}
