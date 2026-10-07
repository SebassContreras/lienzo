import {
  type Background,
  cloneElement,
  defaultBackground,
  defaultElement,
  type Element,
  newId,
} from "../model/model.ts";
import type { PresetRecipe, TraitUse } from "../model/preset.ts";
import { applierFor, TRAITS, type TraitParams } from "../traits/index.ts";

export type Resolved =
  | { element: Element }
  | { background: Background }
  | { error: string };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Merges `patch` into `target` in place: objects merge key by key, anything else replaces. */
export function deepMerge(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      deepMerge(current, value);
    } else {
      target[key] = structuredClone(value);
    }
  }
}

function splitUse(use: TraitUse): { id: string; params: TraitParams } {
  if (typeof use === "string") return { id: use, params: {} };
  const { use: id, ...params } = use;
  return { id, params };
}

/**
 * Builds what a recipe describes: the kind's default (an element, or the default scene
 * background), then each trait in order, then the recipe's own values; an element also gets
 * the recipe's name and a fresh id. The result is plain data with no link back to the recipe,
 * so later changes to traits or recipes never reach it.
 */
export function resolvePreset(recipe: PresetRecipe): Resolved {
  let target: Element | Background;
  try {
    target =
      recipe.kind === "background"
        ? defaultBackground()
        : defaultElement(recipe.kind);
  } catch {
    return { error: `Tipo de elemento desconocido «${recipe.kind}»` };
  }
  if ("kind" in target) target.name = recipe.name;
  for (const use of recipe.traits ?? []) {
    const { id, params } = splitUse(use);
    const trait = TRAITS.get(id);
    if (!trait) return { error: `Trait desconocido «${id}»` };
    const apply = applierFor(trait, recipe.kind);
    if (!apply) {
      return { error: `El trait «${id}» no se aplica a «${recipe.kind}»` };
    }
    const unknown = Object.keys(params).find((k) => !(k in trait.params));
    if (unknown) {
      return { error: `El trait «${id}» no tiene el parámetro «${unknown}»` };
    }
    apply(target, { ...trait.params, ...params });
  }
  if (recipe.set) {
    deepMerge(
      target as unknown as Record<string, unknown>,
      recipe.set as Record<string, unknown>,
    );
  }
  if (!("kind" in target)) return { background: target };
  if (target.kind === "group") {
    const children = expandChildren(target.children as unknown[]);
    if ("error" in children) return children;
    // fresh ids for the whole tree, with lines inside re-attached to the new ids
    target = cloneElement({ ...target, children: children.elements });
  }
  target.id = newId();
  return { element: target };
}

/**
 * A group recipe's children, each built from its kind's default plus the values it stores;
 * groups inside are built the same way.
 */
function expandChildren(
  raw: unknown[],
): { elements: Element[] } | { error: string } {
  const elements: Element[] = [];
  for (const item of raw) {
    if (!isPlainObject(item) || typeof item.kind !== "string") {
      return { error: "Un hijo del grupo no tiene tipo" };
    }
    let el: Element;
    try {
      el = defaultElement(item.kind as Element["kind"]);
    } catch {
      return { error: `Tipo de elemento desconocido «${item.kind}»` };
    }
    const { children, ...fields } = item;
    deepMerge(el as unknown as Record<string, unknown>, fields);
    if (el.kind === "group") {
      const inner = expandChildren(Array.isArray(children) ? children : []);
      if ("error" in inner) return inner;
      el.children = inner.elements;
    }
    elements.push(el);
  }
  return { elements };
}

/** Resolves a recipe that must build an element. */
export function resolveElement(
  recipe: PresetRecipe,
): { element: Element } | { error: string } {
  const r = resolvePreset(recipe);
  return "background" in r ? { error: "Es un fondo, no un elemento" } : r;
}

/** Resolves a recipe that must build a scene background. */
export function resolveBackground(
  recipe: PresetRecipe,
): { background: Background } | { error: string } {
  const r = resolvePreset(recipe);
  return "element" in r ? { error: "Es un elemento, no un fondo" } : r;
}
