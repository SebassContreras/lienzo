/**
 * What the inspector shows for an element, worked out from its descriptor: the sections in
 * order and, in each, the controls that are visible right now. Pure, so it is tested without
 * a browser; `FieldEditor` only renders it.
 */
import type { Descriptor } from "../components/descriptor.ts";
import type {
  DataField,
  Dyn,
  Fields,
  Parent,
  WidgetField,
} from "../components/fields/index.ts";
import type { Element } from "../model/model.ts";

export type LayoutItem = {
  /** Where the value lives, e.g. ["fill", "color"]; a widget's is its key. */
  path: string[];
  field: Exclude<DataField, { type: "object" }> | WidgetField;
  /** The object the field belongs to (the element, or e.g. its `fill`). */
  parent: Parent;
};

export type LayoutSection = {
  title: string;
  open: boolean;
  items: LayoutItem[];
};

export const resolve = <T>(v: Dyn<T>, parent: Parent): T =>
  typeof v === "function" ? (v as (p: Parent) => T)(parent) : v;

/** Every control of `fields` (objects opened into theirs), visible or not. */
function items(
  fields: Fields,
  parent: Parent,
  prefix: string[],
  all: boolean,
): (LayoutItem & { section?: string })[] {
  return Object.entries(fields).flatMap(([key, field]) => {
    if (field.type !== "widget" && field.inspector === false) return [];
    if (!all && field.visible && !field.visible(parent)) return [];
    const path = [...prefix, key];
    if (field.type === "object") {
      const value = (parent[key] ?? {}) as Parent;
      return items(field.fields, value, path, all).map((it) => ({
        ...it,
        section: field.section,
      }));
    }
    return [{ path, field, parent, section: field.section }];
  });
}

/**
 * The inspector for `el`: its descriptor's sections, each with its visible controls. With
 * `all`, controls hidden by the element's current state are listed too.
 */
export function inspectorLayout(
  d: Descriptor<Element>,
  el: Element,
  all = false,
): LayoutSection[] {
  const list = items(d.fields, el as unknown as Parent, [], all);
  return d.sections.map((s) => ({
    title: s.title,
    open: s.open ?? true,
    items: list.filter((it) => it.section === s.title),
  }));
}

/** The value at `path` inside `el`. */
export function valueAt(el: unknown, path: string[]): unknown {
  return path.reduce<unknown>((v, k) => (v as Parent)?.[k], el);
}

/**
 * Writes `value` into `draft` at `path` the way the field says: clamped and rounded for
 * numbers with bounds or `int`, through the field's own `set` when it has one (on the
 * object that holds it).
 */
export function writeField(
  draft: Element,
  path: string[],
  field: DataField,
  value: unknown,
): void {
  let v = value;
  if (field.type === "number" && typeof v === "number") {
    if (field.bounds) {
      v = Math.min(field.bounds[1], Math.max(field.bounds[0], v));
    }
    if (field.int) v = Math.round(v as number);
  }
  const holder = valueAt(draft, path.slice(0, -1)) as Parent;
  const key = path[path.length - 1] as string;
  if (field.set) field.set(holder, v);
  else holder[key] = v;
}
