/**
 * Scene model. A scene is plain JSON: everything the renderer needs to draw any frame.
 * Elements are drawn in array order (last = on top). Element types come from the component
 * descriptors in `src/components/` (A23); this module re-exports them under their usual names.
 */

import type { AnimKind } from "../components/fields/index.ts";
import {
  COMPONENTS,
  createElement,
  descriptorOf,
  type RegisteredElement,
  type RegisteredKind,
} from "../components/index.ts";
import type { RectEl } from "../components/rect/descriptor.ts";
import { newId } from "./id.ts";

export type { EllipseEl } from "../components/ellipse/descriptor.ts";
export type { AnimKind, StrokeStyle } from "../components/fields/index.ts";
export { ANIM_LABELS } from "../components/fields/index.ts";
export type { GroupEl } from "../components/group/descriptor.ts";
export type { IconEl } from "../components/icon/descriptor.ts";
export type { ImageEl } from "../components/image/descriptor.ts";
export type {
  Endpoint,
  FlowKind,
  LineEl,
} from "../components/line/descriptor.ts";
export type { ParticlesEl } from "../components/particles/descriptor.ts";
export type { RectEl, ShapeEl } from "../components/rect/descriptor.ts";
export type { TextEl } from "../components/text/descriptor.ts";

export type Element = RegisteredElement;
export type ElementKind = RegisteredKind;

export type Anim = RectEl["anim"];
export type Glow = RectEl["borderGlow"];
export type Shadow = RectEl["shadow"];
export type Fill = RectEl["fill"];

export type Background = {
  color: string;
  color2: string;
  gradient: boolean;
  angle: number;
  dots: boolean;
  dotColor: string;
  dotGap: number;
  /** Soft radial light in the middle, 0 = off. */
  spotlight: number;
  spotlightColor: string;
};

export type Scene = {
  width: number;
  height: number;
  /** Loop length, seconds. */
  duration: number;
  fps: number;
  background: Background;
  elements: Element[];
};

export { FONTS } from "./fonts.ts";

export const SIZE_PRESETS = [
  { label: "Cuadrado 1080×1080", width: 1080, height: 1080 },
  { label: "Vertical 1080×1350", width: 1080, height: 1350 },
  { label: "Story 1080×1920", width: 1080, height: 1920 },
  { label: "Horizontal 1920×1080", width: 1920, height: 1080 },
  { label: "LinkedIn 1200×627", width: 1200, height: 627 },
];

export const ANIMS_BY_KIND = Object.fromEntries(
  COMPONENTS.map((d) => [d.kind, d.anims]),
) as Record<ElementKind, readonly AnimKind[]>;

export { newId };

export const defaultRect = () => createElement("rect");
export const defaultEllipse = () => createElement("ellipse");
export const defaultIcon = () => createElement("icon");
export const defaultImage = () => createElement("image");
export const defaultGroup = () => createElement("group");
export const defaultText = () => createElement("text");
export const defaultLine = () => createElement("line");
export const defaultParticles = () => createElement("particles");

/** A fresh default element of `kind`; throws for a kind that does not exist. */
export function defaultElement(kind: ElementKind): Element {
  if (!descriptorOf(kind as string)) {
    throw new Error(`unknown element kind ${kind}`);
  }
  return createElement(kind);
}

/** The background of a new scene ("Azul noche"). */
export function defaultBackground(): Background {
  return {
    color: "#0a1430",
    color2: "#030712",
    gradient: true,
    angle: 120,
    dots: true,
    dotColor: "#1e3a8a",
    dotGap: 36,
    spotlight: 0.35,
    spotlightColor: "#1d4ed8",
  };
}

export function defaultScene(): Scene {
  return {
    width: 1080,
    height: 1080,
    duration: 4,
    fps: 30,
    background: defaultBackground(),
    elements: [],
  };
}

/**
 * Deep copies with fresh ids, for groups' children too. A copied line attached to another
 * copied element (or to something inside a copied group) is attached to that copy; other
 * attachments are kept.
 */
export function cloneElements(elements: Element[]): Element[] {
  const copies = structuredClone(elements);
  const ids = new Map<string, string>();
  const renew = (e: Element) => {
    const id = newId();
    ids.set(e.id, id);
    e.id = id;
    if (e.kind === "group") e.children.forEach(renew);
  };
  const relink = (e: Element) => {
    if (e.kind === "line") {
      for (const end of [e.a, e.b]) {
        if (end.attach) end.attach = ids.get(end.attach) ?? end.attach;
      }
    }
    if (e.kind === "group") e.children.forEach(relink);
  };
  copies.forEach(renew);
  copies.forEach(relink);
  return copies;
}

/** Deep copy with fresh ids (see `cloneElements`). */
export function cloneElement<T extends Element>(el: T): T {
  return cloneElements([el])[0] as T;
}
