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
import { TrackRepeatSchema } from "./track.ts";

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

const CompactTrackObjectSchema = z.object({
  keys: z.array(CompactKeyframeSchema),
  repeat: TrackRepeatSchema.optional(),
  until: z.number().min(0).optional(),
});

export const CompactTracksSchema = z.record(
  z.string(),
  z.union([z.array(CompactKeyframeSchema), CompactTrackObjectSchema]),
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
function compactShapeOf(
  fields: Fields,
  forJsonSchema = false,
): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, field] of dataFields(fields)) {
    if (k === "anim") {
      shape[k] = CompactAnimSchema.optional();
    } else if (k === "children") {
      shape[k] = forJsonSchema
        ? z.array(z.record(z.string(), z.unknown())).optional()
        : z.lazy(() => z.array(CompactElementSchema)).optional();
    } else if (k === "template") {
      shape[k] = forJsonSchema
        ? z.record(z.string(), z.unknown()).nullable().optional()
        : z.lazy(() => CompactElementSchema.nullable()).optional();
    } else {
      shape[k] = makeCompactFieldSchema(field);
    }
  }
  return shape;
}

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

const { preset: _preset, ...otherSpecialFields } = baseSpecialFields;
const presetOnlySchema = z
  .object({
    preset: z.string().min(1),
    ...otherSpecialFields,
  })
  .passthrough();

let registeredComponents: readonly { kind: string; fields: Fields }[] = [];
let compactKindSchemas:
  | Map<string, z.ZodType<Record<string, unknown>>>
  | undefined;

/** Updates the registered components used to derive the compact element schema. */
export function registerCompactElementKinds(
  list: readonly { kind: string; fields: Fields }[],
): void {
  registeredComponents = list;
  compactKindSchemas = undefined;
}

function getKindSchemas(): Map<string, z.ZodType<Record<string, unknown>>> {
  if (!compactKindSchemas) {
    compactKindSchemas = new Map(
      registeredComponents.map((d) => [
        d.kind,
        z.object({
          kind: z.literal(d.kind),
          ...baseSpecialFields,
          ...compactShapeOf(d.fields),
        }) as unknown as z.ZodType<Record<string, unknown>>,
      ]),
    );
  }
  return compactKindSchemas;
}

function buildCompactElementUnion(): z.ZodType<unknown> {
  const schemas = registeredComponents.map((d) =>
    z.object({
      kind: z.literal(d.kind).optional(),
      ...baseSpecialFields,
      ...compactShapeOf(d.fields, true),
    }),
  );

  return z.union([presetOnlySchema, ...schemas] as unknown as [
    z.ZodType,
    z.ZodType,
    ...z.ZodType[],
  ]);
}

/**
 * Any compact element, validated by kind-directed dispatch (051/D4) so nested field errors
 * report their exact path instead of collapsing into a generic union error.
 */
export const CompactElementSchema: z.ZodType<Record<string, unknown>> = z
  .unknown()
  .transform((value, ctx) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      ctx.issues.push({
        code: "invalid_type",
        expected: "object",
        input: value,
        path: [],
        message: "Se esperaba un objeto para el elemento compacto",
      } as never);
      return z.NEVER;
    }

    const raw = value as Record<string, unknown>;
    const byKind = getKindSchemas();
    const rawKind = raw.kind;

    if (rawKind !== undefined) {
      if (typeof rawKind === "string") {
        const schema = byKind.get(rawKind);
        if (schema) {
          const r = schema.safeParse(raw);
          if (r.success) return r.data;
          for (const issue of r.error.issues) ctx.issues.push(issue as never);
          return z.NEVER;
        }
      }
      const known = [...byKind.keys()].join(", ");
      ctx.issues.push({
        code: "custom",
        input: rawKind,
        path: ["kind"],
        message: `Tipo de elemento desconocido «${String(rawKind)}» (hay: ${known})`,
      } as never);
      return z.NEVER;
    }

    if (typeof raw.preset === "string" && raw.preset.length > 0) {
      const r = presetOnlySchema.safeParse(raw);
      if (r.success) return r.data as Record<string, unknown>;
      for (const issue of r.error.issues) ctx.issues.push(issue as never);
      return z.NEVER;
    }

    const known = [...byKind.keys()].join(", ");
    ctx.issues.push({
      code: "custom",
      input: rawKind,
      path: ["kind"],
      message: `Falta 'kind' (o 'preset') en el elemento compacto (tipos: ${known})`,
    } as never);
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
