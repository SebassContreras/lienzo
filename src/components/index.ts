/**
 * The component registry. A kind exists once its descriptor is imported here, listed in
 * `COMPONENTS` and its element type added to `RegisteredElement`; order is the library's.
 */
import { registerElementKinds } from "../model/element-schema.ts";
import { newId } from "../model/id.ts";
import type { Descriptor } from "./descriptor.ts";
import { type EllipseEl, ellipse } from "./ellipse/descriptor.ts";
import { defaultsOf } from "./fields/index.ts";
import { type GroupEl, group } from "./group/descriptor.ts";
import { type IconEl, icon } from "./icon/descriptor.ts";
import { type ImageEl, image } from "./image/descriptor.ts";
import { type LineEl, line } from "./line/descriptor.ts";
import { type ParticlesEl, particles } from "./particles/descriptor.ts";
import { type RectEl, rect } from "./rect/descriptor.ts";
import { type TextEl, text } from "./text/descriptor.ts";
import { type ThreeEl, three } from "./three/descriptor.ts";

/** Every element kind's type, as a union. */
export type RegisteredElement =
  | RectEl
  | EllipseEl
  | IconEl
  | ImageEl
  | GroupEl
  | TextEl
  | LineEl
  | ParticlesEl
  | ThreeEl;

export type RegisteredKind = RegisteredElement["kind"];

type DescriptorOf<E> = E extends RegisteredElement ? Descriptor<E> : never;

const LIST: DescriptorOf<RegisteredElement>[] = [
  rect,
  ellipse,
  icon,
  image,
  group,
  text,
  line,
  particles,
  three,
];

export const COMPONENTS: readonly DescriptorOf<RegisteredElement>[] = LIST;

registerElementKinds(COMPONENTS);

const BY_KIND = new Map<string, DescriptorOf<RegisteredElement>>(
  COMPONENTS.map((d) => [d.kind, d]),
);

export const KINDS: RegisteredKind[] = COMPONENTS.map((d) => d.kind);

/**
 * Adds a kind at run time, for tests that prove a new component works everywhere with no
 * other change (007/R6): it joins `COMPONENTS`, `KINDS` and the element schema.
 */
export function registerComponent(d: Descriptor<{ kind: string }>): void {
  if (BY_KIND.has(d.kind)) throw new Error(`kind ${d.kind} already registered`);
  const descriptor = d as unknown as DescriptorOf<RegisteredElement>;
  LIST.push(descriptor);
  KINDS.push(descriptor.kind);
  BY_KIND.set(d.kind, descriptor);
  registerElementKinds(COMPONENTS);
}

/** The descriptor of `kind`, or undefined for a kind that does not exist. */
export function descriptorOf<K extends RegisteredKind>(
  kind: K,
): Descriptor<Extract<RegisteredElement, { kind: K }>>;
export function descriptorOf(
  kind: string,
): DescriptorOf<RegisteredElement> | undefined;
export function descriptorOf(kind: string) {
  return BY_KIND.get(kind);
}

/** A fresh element of `kind`, every field at its default; throws for an unknown kind. */
export function createElement<K extends RegisteredKind>(
  kind: K,
): Extract<RegisteredElement, { kind: K }> {
  const d = BY_KIND.get(kind);
  if (!d) throw new Error(`unknown element kind ${kind}`);
  return {
    id: newId(),
    kind,
    name: d.label,
    ...defaultsOf(d.fields),
  } as Extract<RegisteredElement, { kind: K }>;
}
