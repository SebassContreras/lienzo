/**
 * A scene given with partial elements, made whole (074/D9): each element over its kind's
 * default (group children too), so a sparse `scene_get` result or a hand-written element goes
 * back into `scene_create` or `scene_validate`. Pure; what is not an element is left as given.
 */
import { descriptorOf } from "../components/index.ts";
import { deepMerge } from "../presets/resolve.ts";
import { defaultElement, type ElementKind } from "./model.ts";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** `raw` over its kind's default; anything not an element of a known kind as given. */
function filled(raw: unknown): unknown {
  if (!isObject(raw) || typeof raw.kind !== "string" || !descriptorOf(raw.kind))
    return raw;
  const out = defaultElement(raw.kind as ElementKind) as unknown as Record<
    string,
    unknown
  >;
  const { children, ...rest } = raw;
  deepMerge(out, rest);
  if (Array.isArray(children)) out.children = children.map(filled);
  return out;
}

/** `data` with every element (top level and in groups) filled from its kind's default. */
export function withElementDefaults(data: unknown): unknown {
  if (!isObject(data) || !Array.isArray(data.elements)) return data;
  return { ...data, elements: data.elements.map(filled) };
}
