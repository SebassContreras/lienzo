import type { Background, Element, ElementKind } from "./model.ts";

/** Optional at every depth: the values a recipe sets on top of its traits. */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/** A trait by id, or a trait with parameters: `{ "use": "glow", "color": "#22d3ee" }`. */
export type TraitUse =
  | string
  | ({ use: string } & Record<string, string | number | boolean>);

/** What a recipe builds: an element of some kind, or a scene background. */
export type PresetKind = ElementKind | "background";

/**
 * A preset as stored in JSON: which kind of element (or background) it builds, the traits applied in order
 * on top of that kind's default, and the few values that are its own. It never holds a full
 * element; `resolvePreset` builds one.
 */
export type PresetRecipe = {
  name: string;
  kind: PresetKind;
  traits: TraitUse[];
  set?: DeepPartial<Element> | DeepPartial<Background>;
};
