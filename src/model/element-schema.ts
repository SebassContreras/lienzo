/**
 * The element schema, generated from the component descriptors (D2). It imports no
 * component, so a group's descriptor can refer to it for its children; the registry hands
 * it the descriptors with `registerElementKinds`.
 */
import { z } from "zod";
import { type Fields, shapeOf } from "../components/fields/index.ts";
import type { Element } from "./model.ts";

let components: readonly { kind: string; fields: Fields }[] = [];
let union: z.ZodType<Element> | undefined;

/** Called once by the registry with every descriptor. */
export function registerElementKinds(
  list: readonly { kind: string; fields: Fields }[],
): void {
  components = list;
  union = undefined;
}

function elementUnion(): z.ZodType<Element> {
  const [first, ...rest] = components.map((d) =>
    z.object({
      id: z.string(),
      kind: z.literal(d.kind),
      name: z.string(),
      ...shapeOf(d.fields),
    }),
  );
  if (!first) throw new Error("no components registered");
  return z.discriminatedUnion("kind", [
    first,
    ...rest,
  ]) as unknown as z.ZodType<Element>;
}

/** Any element, checked against its kind's descriptor fields. */
export const ElementSchema: z.ZodType<Element> = z.lazy(() => {
  union ??= elementUnion();
  return union;
});
