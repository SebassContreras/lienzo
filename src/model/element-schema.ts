/**
 * The element schema, generated from the component descriptors (D2). It imports no
 * component, so a group's descriptor can refer to it for its children; the registry hands
 * it the descriptors with `registerElementKinds`.
 */
import { z } from "zod";
import { effects } from "../components/fields/effects.ts";
import { type Fields, shapeOf } from "../components/fields/index.ts";
import type { Element } from "./model.ts";
import { TracksSchema } from "./track.ts";

/** A preset name alone starts it at 0 (019/D10); the library is not checked here. */
const AnimPresetRefSchema = z.preprocess(
  (v) => (typeof v === "string" ? { name: v, start: 0 } : v),
  z.object({ name: z.string().min(1), start: z.number().min(0) }),
);

const EffectsSchema = effects().schema.optional();

/** Transform pivot in box fractions (0 to 1, default { x: 0.5, y: 0.5 }) (053/D1). */
export const OriginSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export type Origin = z.infer<typeof OriginSchema>;

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
      tracks: TracksSchema.optional(),
      animPreset: AnimPresetRefSchema.optional(),
      effects: EffectsSchema,
      origin: OriginSchema.optional(),
      hidden: z.boolean().optional(),
      locked: z.boolean().optional(),
      ...shapeOf(d.fields),
    }),
  );
  if (!first) throw new Error("no components registered");
  return z.discriminatedUnion("kind", [
    first,
    ...rest,
  ]) as unknown as z.ZodType<Element>;
}

/**
 * Any element, checked against its kind's descriptor fields. It delegates on every parse
 * (zod 4's `z.lazy` keeps its first schema), so a kind registered later is accepted (007/R6).
 */
export const ElementSchema: z.ZodType<Element> = z
  .unknown()
  .transform((value, ctx) => {
    union ??= elementUnion();
    const r = union.safeParse(value);
    if (r.success) return r.data;
    for (const issue of r.error.issues) ctx.issues.push(issue as never);
    return z.NEVER;
  }) as unknown as z.ZodType<Element>;
