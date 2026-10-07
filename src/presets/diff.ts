import {
  type Background,
  defaultBackground,
  defaultElement,
  type Element,
} from "../model/model.ts";
import type { DeepPartial, PresetRecipe } from "../model/preset.ts";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The parts of `value` that differ from `base`: objects are compared key by key and only
 * the differing keys are kept; anything else is kept whole when it is not equal.
 * Returns `undefined` when nothing differs.
 */
export function deepDiff(value: unknown, base: unknown): unknown {
  if (isPlainObject(value) && isPlainObject(base)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      const d = deepDiff(v, base[key]);
      if (d !== undefined) out[key] = d;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return JSON.stringify(value) === JSON.stringify(base)
    ? undefined
    : structuredClone(value);
}

/**
 * A group's child as a recipe stores it: its kind, a short local id (lines inside the group
 * attach by these), and only what differs from its kind's default.
 */
function compactChild(
  el: Element,
  local: Map<string, string>,
): Record<string, unknown> {
  const own = structuredClone(el) as Element;
  if (own.kind === "line") {
    for (const end of [own.a, own.b]) {
      if (end.attach) end.attach = local.get(end.attach);
      if (!end.attach) delete end.attach;
    }
  }
  const { id, kind, ...rest } = own;
  const { id: _did, kind: _dkind, ...base } = defaultElement(kind);
  if ("children" in rest) {
    const { children, ...fields } = rest;
    const diff = deepDiff(fields, base) ?? {};
    return {
      id: local.get(id),
      kind,
      ...(diff as object),
      children: children.map((c) => compactChild(c, local)),
    };
  }
  const diff = deepDiff(rest, base) ?? {};
  return { id: local.get(id), kind, ...(diff as object) };
}

/** Short local ids (`c1`, `c2`…) for everything inside a group, in drawing order. */
function localIds(children: Element[]): Map<string, string> {
  const local = new Map<string, string>();
  const walk = (el: Element) => {
    local.set(el.id, `c${local.size + 1}`);
    if (el.kind === "group") el.children.forEach(walk);
  };
  children.forEach(walk);
  return local;
}

/**
 * A recipe that rebuilds `el` from its kind's default: no traits, only what differs. A
 * group keeps its children, each stored the same compact way.
 */
export function recipeFromElement(name: string, el: Element): PresetRecipe {
  const { id: _id, name: _name, ...own } = el;
  const { id: _did, name: _dname, ...base } = defaultElement(el.kind);
  if (el.kind === "group") {
    const { children: _c, ...fields } = own as typeof own & {
      children: Element[];
    };
    const { children: _dc, ...baseFields } = base as typeof base & {
      children: Element[];
    };
    const local = localIds(el.children);
    const set = {
      ...((deepDiff(fields, baseFields) as object | undefined) ?? {}),
      children: el.children.map((c) => compactChild(c, local)),
    } as DeepPartial<Element>;
    return { name, kind: "group", traits: [], set };
  }
  const set = deepDiff(own, base) as DeepPartial<Element> | undefined;
  return { name, kind: el.kind, traits: [], ...(set ? { set } : {}) };
}

/** A background recipe: no traits, only what differs from the default background. */
export function recipeFromBackground(
  name: string,
  background: Background,
): PresetRecipe {
  const set = deepDiff(background, defaultBackground()) as
    | DeepPartial<Background>
    | undefined;
  return { name, kind: "background", traits: [], ...(set ? { set } : {}) };
}
