/**
 * The component registry. A kind exists once its descriptor is listed here; order is the
 * library's.
 */
import { newId } from "../model/id.ts";
import type { Descriptor } from "./descriptor.ts";
import { defaultsOf } from "./fields/index.ts";
import { rect } from "./rect/descriptor.ts";

export const COMPONENTS = [rect] as const satisfies readonly Descriptor<{
  kind: string;
}>[];

type Described<D> = D extends Descriptor<infer E> ? E : never;

/** The element type each registered descriptor describes, as a union. */
export type RegisteredElement = Described<(typeof COMPONENTS)[number]>;

export type RegisteredKind = RegisteredElement["kind"];

const BY_KIND = new Map<string, Descriptor<RegisteredElement>>(
  (COMPONENTS as readonly Descriptor<RegisteredElement>[]).map((d) => [
    d.kind,
    d,
  ]),
);

export const KINDS = [...BY_KIND.keys()] as RegisteredKind[];

/** The descriptor of `kind`, or undefined for a kind that does not exist. */
export function descriptorOf<K extends RegisteredKind>(
  kind: K,
): Descriptor<Extract<RegisteredElement, { kind: K }>>;
export function descriptorOf(
  kind: string,
): Descriptor<RegisteredElement> | undefined;
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
