/**
 * Compact scene model and schema (011/D1). Derived from the descriptor registry so every
 * component, field and animation is accepted with every field optional, plus placement
 * shortcuts (`at`, `fit`), line connections (`from`, `to`) and short keyframe tracks.
 */
import { z } from "zod";
import { effects } from "../components/fields/effects.ts";
import {
  type DataField,
  dataFields,
  type Fields,
} from "../components/fields/index.ts";
import type { Easing } from "../engine/easing.ts";
import { OriginSchema } from "./element-schema.ts";
import { TrackRepeatSchema } from "./track.ts";

// any string here: the scene schema checks the easing at its own path, listing the names
// (074/D13), where a union would only say "Invalid input"
const KeyEasingSchema = z.string() as unknown as z.ZodType<Easing>;

const ShortKeyframeTupleSchema = z.tuple([
  z.number().min(0),
  z.union([z.number(), z.string()]),
  KeyEasingSchema.optional(),
]);

const CanonicalKeyframeSchema = z.object({
  t: z.number().min(0),
  value: z.union([z.number(), z.string()]),
  easing: KeyEasingSchema.optional(),
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

export const AnchorNameSchema = z.enum([
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

export const CompactOriginSchema = z.union([
  AnchorNameSchema,
  z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  OriginSchema,
]);

export type CompactOrigin = z.infer<typeof CompactOriginSchema>;

/** `at` in every tool (064/D12): an anchor, an anchor with an offset, or a point to centre on. */
export const AtPlacementSchema = z.union(
  [
    AnchorNameSchema,
    z.object({
      anchor: AnchorNameSchema,
      offset: z.tuple([z.number(), z.number()]).optional(),
    }),
    z.object({ x: z.number(), y: z.number() }),
  ],
  {
    error: `\`at\` es un ancla (${AnchorNameSchema.options.join(", ")}), { anchor, offset: [dx, dy] } o un punto { x, y } en el que se centra`,
  },
);

/** What `at` accepts, for every tool description that takes it (064/D12). */
export const AT_RULES =
  '`at` places the element: an anchor name (`"center"`, `"top-left"`, …), ' +
  "`{ anchor, offset: [dx, dy] }`, or a point `{ x, y }` the element is centred on. Edge " +
  "anchors keep a safe margin of 5% of the shorter side from the edges they touch (54 px on " +
  "1080); `offset` moves from there. ";

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
  // a multiline text (list items) also takes its lines as an array (069/D12)
  if (field.type === "text" && field.multiline)
    return z
      .union([field.schema, z.array(z.string())], {
        error:
          "Se esperaba un texto (una línea por item, separadas por \n) o un array de textos",
      })
      .optional();
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

/**
 * Partial `effects` (058/D1): `effects` is common to every kind, so no descriptor declares
 * it. Known keys are type-checked; unknown ones pass through so expansion can report them.
 */
const CompactEffectsSchema = z.looseObject(
  Object.fromEntries(
    dataFields(effects().fields).map(([k, f]) => [k, f.schema.optional()]),
  ),
);

/** Scene-level style defaults (058/D4); `flat` turns off shape gradients, shadows, borders and border glows. */
const SceneDefaultsSchema = z.enum(["flat"]);

export type SceneDefaults = z.infer<typeof SceneDefaultsSchema>;

const baseSpecialFields = {
  id: z.string().optional(),
  name: z.string().optional(),
  preset: z.string().optional(),
  at: AtPlacementSchema.optional(),
  fit: FitPlacementSchema.optional(),
  origin: CompactOriginSchema.optional(),
  w: z.number().min(0).optional(),
  shot: z.string().optional(),
  // a line's targets (ids); a kind with its own `from`/`to` (counter) declares numbers (074/D7)
  from: z.union([z.string(), z.number()]).optional(),
  to: z.union([z.string(), z.number()]).optional(),
  tracks: CompactTracksSchema.optional(),
  effects: CompactEffectsSchema.optional(),
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

export const CompactShotTransitionSchema = z.object({
  kind: z.enum(["cut", "fade", "slide", "zoom"]),
  duration: z.number().min(0),
});

export const CompactShotCameraSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  zoom: z.number().positive().optional(),
  tracks: CompactTracksSchema.optional(),
});

export const CompactShotSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  start: z.number().min(0),
  end: z.number().min(0),
  transition: CompactShotTransitionSchema.optional(),
  camera: CompactShotCameraSchema.optional(),
});

export type CompactShot = z.infer<typeof CompactShotSchema>;

/** An audio track in compact form; `id` defaults to `track-<n>` (060/D3). */
export const CompactAudioTrackSchema = z.object({
  assetId: z.string().min(1),
  id: z.string().min(1).optional(),
  name: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
  startOffset: z.number().min(0).optional(),
  trimOffset: z.number().min(0).optional(),
  muted: z.boolean().optional(),
});

export const CompactSymbolSchema = z.object({
  w: z.number().positive(),
  h: z.number().positive(),
  children: z.array(CompactElementSchema),
});

export type CompactSymbol = z.infer<typeof CompactSymbolSchema>;

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
    defaults: SceneDefaultsSchema.optional(),
    symbols: z
      .record(
        z.string(),
        z.object({
          w: z.number().positive(),
          h: z.number().positive(),
          children: z.array(elementUnion),
        }),
      )
      .optional(),
    elements: z.array(elementUnion).default([]),
    shots: z.array(CompactShotSchema).optional(),
    audioTracks: z.array(CompactAudioTrackSchema).optional(),
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
  defaults: SceneDefaultsSchema.optional(),
  symbols: z.record(z.string(), CompactSymbolSchema).optional(),
  elements: z.array(CompactElementSchema).default([]),
  shots: z.array(CompactShotSchema).optional(),
  audioTracks: z.array(CompactAudioTrackSchema).optional(),
});

export type CompactScene = z.infer<typeof CompactSceneSchema>;
export type CompactElement = z.infer<typeof CompactElementSchema>;
