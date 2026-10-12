/**
 * A component descriptor: everything about one element kind, declared once (A23). The
 * scene schema, default elements, inspector and library are derived from it.
 */
import type { AnimState } from "../engine/anim.ts";
import type { Ctx } from "../engine/paint.ts";
import type { Element, Scene } from "../model/model.ts";
import { CHANNELS, type Tracks } from "../model/track.ts";
import {
  type AnimOffer,
  type DataField,
  dataFields,
  type Fields,
  type ValueOf,
} from "./fields/index.ts";

/** What a component's draw function gets besides its own element. */
export type DrawContext = {
  scene: Scene;
  /** Seconds within the loop, for motion that is part of the component (flows, drift). */
  t: number;
  /** Resolves line attachments in the coordinate space of the elements being drawn. */
  byId: Map<string, Element>;
  /** Draws nested elements (a group's children). */
  drawElements: (
    ctx: Ctx,
    elements: Element[],
    scene: Scene,
    t: number,
    byId?: Map<string, Element>,
  ) => void;
};

/** The element a kind and its fields describe. */
export type ElementOf<K extends string, F extends Fields> = {
  id: string;
  kind: K;
  name: string;
  /** Keyframe tracks by path (015); absent when the element has none. */
  tracks?: Tracks;
  /** The animation preset last applied, as information only: nothing reads it to draw (019/D9). */
  animPreset?: AnimPresetRef;
} & ValueOf<F>;

/** Which animation preset an element's animation was copied from, and where it started. */
export type AnimPresetRef = { name: string; start: number };

export type Section = { title: string; open?: boolean };

export type Descriptor<E extends { kind: string } = Element> = {
  kind: E["kind"];
  /** Name in the library and of new elements, in Spanish. */
  label: string;
  fields: Fields;
  /** Inspector sections, in order; a field names its own in `section`. */
  sections: readonly Section[];
  /** Preset animations the inspector offers for this kind. */
  anims: AnimOffer;
  /** Field paths ("x", "fill.opacity") that keyframes may animate. */
  animatable: readonly string[];
  /** Lucide icon (PascalCase name) shown for the kind in the library. */
  icon: string;
  /** Offered among the basic components in the library. */
  basic: boolean;
  /** URLs of the files drawing `el` needs (images, models), awaited before an export. */
  assets?: (el: E) => string[];
  /** Draws `el` as `animate` left it, with `transform` (A24). */
  draw(ctx: Ctx, el: E, transform: AnimState, dc: DrawContext): void;
};

/** Number and color field paths, the ones keyframes can drive (whole numbers step). */
export function interpolatable(fields: Fields, prefix = ""): string[] {
  return dataFields(fields).flatMap(([key, f]: [string, DataField]) => {
    const path = prefix + key;
    if (f.type === "object") return interpolatable(f.fields, `${path}.`);
    if (f.type === "color") return [path];
    if (f.type === "number") return [path];
    return [];
  });
}

/**
 * Fills in what a descriptor may leave out: every interpolatable field is animatable and a
 * kind is offered in the library unless it says otherwise.
 */
export function defineComponent<E extends { kind: string }>(
  d: Omit<Descriptor<E>, "animatable" | "basic"> &
    Partial<Pick<Descriptor<E>, "animatable" | "basic">>,
): Descriptor<E> {
  return {
    ...d,
    animatable: d.animatable ?? interpolatable(d.fields),
    basic: d.basic ?? true,
  };
}

/** Every path a track of an element of `d`'s kind may have: its fields, then the channels. */
export const trackPaths = (d: { animatable: readonly string[] }): string[] => [
  ...d.animatable,
  ...Object.keys(CHANNELS),
];
