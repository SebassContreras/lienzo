/**
 * Compact scene model and schema (011/D1). Derived from the descriptor registry so every
 * component, field and animation is accepted with every field optional, plus placement
 * shortcuts (`at`, `fit`), line connections (`from`, `to`) and short keyframe tracks.
 */
import { z } from "zod";
import {
  type DataField,
  dataFields,
  type Fields,
} from "../components/fields/index.ts";
import { EASING_NAMES, type Easing } from "../engine/easing.ts";

const ShortKeyframeTupleSchema = z.tuple([
  z.number().min(0),
  z.union([z.number(), z.string()]),
  z.enum(["auto", ...EASING_NAMES] as [Easing, ...Easing[]]).optional(),
]);

const CanonicalKeyframeSchema = z.object({
  t: z.number().min(0),
  value: z.union([z.number(), z.string()]),
  easing: z.enum(["auto", ...EASING_NAMES] as [Easing, ...Easing[]]).optional(),
});

const CompactKeyframeSchema = z.union([
  ShortKeyframeTupleSchema,
  CanonicalKeyframeSchema,
]);

export const CompactTracksSchema = z.record(
  z.string(),
  z.array(CompactKeyframeSchema),
);

/** Short animation: kind name as a string, or an object with slots. */
const CompactAnimSchema = z.union([
  z.string().min(1),
  z.record(z.string(), z.unknown()),
]);

const AnchorNameSchema = z.enum([
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
]);

export type AnchorName = z.infer<typeof AnchorNameSchema>;

const AtPlacementSchema = z.union([
  AnchorNameSchema,
  z.object({
    anchor: AnchorNameSchema,
    offset: z.tuple([z.number(), z.number()]).optional(),
  }),
]);

export type AtPlacement = z.infer<typeof AtPlacementSchema>;

const FitPlacementSchema = z.literal("canvas");

/** Partial background schema or preset name. */
const CompactBackgroundSchema = z.union([
  z.string().min(1),
  z.object({
    color: z.string().optional(),
    color2: z.string().optional(),
    gradient: z.boolean().optional(),
    angle: z.number().optional(),
    dots: z.boolean().optional(),
    dotColor: z.string().optional(),
    dotGap: z.number().optional(),
    spotlight: z.number().optional(),
    spotlightColor: z.string().optional(),
  }),
]);

/** Makes a data field's schema deeply optional for compact representation. */
function makeCompactFieldSchema(field: DataField): z.ZodType {
  if (field.type === "object") {
    const shape: Record<string, z.ZodType> = {};
    for (const [k, subField] of dataFields(field.fields)) {
      shape[k] = makeCompactFieldSchema(subField);
    }
    return z.object(shape).partial().optional();
  }
  return field.schema.optional();
}

/** Builds the compact schema shape for a set of descriptor fields. */
function compactShapeOf(fields: Fields): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, field] of dataFields(fields)) {
    if (k === "anim") {
      shape[k] = CompactAnimSchema.optional();
    } else if (k === "children") {
      shape[k] = z.lazy(() => z.array(CompactElementSchema)).optional();
    } else {
      shape[k] = makeCompactFieldSchema(field);
    }
  }
  return shape;
}

let registeredComponents: readonly { kind: string; fields: Fields }[] = [];
let compactElementUnion: z.ZodType<unknown> | undefined;

/** Updates the registered components used to derive the compact element schema. */
export function registerCompactElementKinds(
  list: readonly { kind: string; fields: Fields }[],
): void {
  registeredComponents = list;
  compactElementUnion = undefined;
}

function buildCompactElementUnion(): z.ZodType<unknown> {
  const baseSpecialFields = {
    id: z.string().optional(),
    name: z.string().optional(),
    preset: z.string().optional(),
    at: AtPlacementSchema.optional(),
    fit: FitPlacementSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    tracks: CompactTracksSchema.optional(),
    animPreset: z
      .union([
        z.string().min(1),
        z.object({
          name: z.string().min(1),
          start: z.number().min(0).optional(),
        }),
      ])
      .optional(),
  };

  const schemas = registeredComponents.map((d) => {
    const compactShape = compactShapeOf(d.fields);
    return z.object({
      kind: z.literal(d.kind).optional(),
      ...baseSpecialFields,
      ...compactShape,
    });
  });

  const { preset: _preset, ...otherSpecialFields } = baseSpecialFields;
  const presetOnlySchema = z
    .object({
      preset: z.string().min(1),
      ...otherSpecialFields,
    })
    .passthrough();

  return z.union([presetOnlySchema, ...schemas] as unknown as [
    z.ZodType,
    z.ZodType,
    ...z.ZodType[],
  ]);
}

/** Any compact element, validated against registered kinds or preset. */
export const CompactElementSchema: z.ZodType<Record<string, unknown>> = z
  .unknown()
  .transform((value, ctx) => {
    compactElementUnion ??= buildCompactElementUnion();
    const r = compactElementUnion.safeParse(value);
    if (r.success) return r.data as Record<string, unknown>;
    for (const issue of r.error.issues) ctx.issues.push(issue as never);
    return z.NEVER;
  }) as unknown as z.ZodType<Record<string, unknown>>;

export function generateCompactJsonSchema(): Record<string, unknown> {
  const elementUnion = buildCompactElementUnion();
  const staticSceneSchema = z.object({
    size: z
      .union([
        z.string().min(1),
        z.tuple([z.number().positive(), z.number().positive()]),
      ])
      .optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    fps: z.number().positive().optional(),
    background: CompactBackgroundSchema.optional(),
    elements: z.array(elementUnion).default([]),
  });
  return z.toJSONSchema(staticSceneSchema) as Record<string, unknown>;
}

export const CompactSceneSchema = z.object({
  size: z
    .union([
      z.string().min(1),
      z.tuple([z.number().positive(), z.number().positive()]),
    ])
    .optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  fps: z.number().positive().optional(),
  background: CompactBackgroundSchema.optional(),
  elements: z.array(CompactElementSchema).default([]),
});

export type CompactScene = z.infer<typeof CompactSceneSchema>;
export type CompactElement = z.infer<typeof CompactElementSchema>;
