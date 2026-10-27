/**
 * Zod schemas for the JSON files Lienzo reads from outside: scenes and preset recipes.
 * Imports are checked here before anything is written (D4).
 */
import { z } from "zod";
import { KINDS } from "../components/index.ts";
import { keyframeError } from "../engine/tracks.ts";
import { resolvePreset } from "../presets/resolve.ts";
import { ColorSchema } from "./color.ts";
import { ElementSchema } from "./element-schema.ts";
import type { Element, Scene } from "./model.ts";
import type { PresetRecipe } from "./preset.ts";

export { ElementSchema };

const color = ColorSchema;

export const BackgroundSchema = z.object({
  color,
  color2: color,
  gradient: z.boolean(),
  angle: z.number(),
  dots: z.boolean(),
  dotColor: color,
  dotGap: z.number().min(1),
  spotlight: z.number(),
  spotlightColor: color,
});

const SceneAudioSchema = z.object({
  assetId: z.string().min(1),
  volume: z.number().min(0).max(1).optional(),
  startOffset: z.number().min(0).optional(),
  trimOffset: z.number().min(0).optional(),
});

const AudioTrackItemSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  name: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
  startOffset: z.number().min(0).optional(),
  trimOffset: z.number().min(0).optional(),
  muted: z.boolean().optional(),
});

import { TracksSchema, trackKeys } from "./track.ts";

export const ShotTransitionSchema = z.object({
  kind: z.enum(["cut", "fade", "slide", "zoom"]),
  duration: z.number().min(0),
});

export const ShotCameraSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  zoom: z.number().positive().optional(),
  tracks: TracksSchema.optional(),
});

export const ShotSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
  transition: ShotTransitionSchema.optional(),
  camera: ShotCameraSchema.optional(),
});

export const SymbolDefinitionSchema = z.object({
  w: z.number().positive(),
  h: z.number().positive(),
  children: z.array(ElementSchema),
});

export const SceneSchema: z.ZodType<Scene> = z
  .object({
    width: z.number().positive(),
    height: z.number().positive(),
    duration: z.number().positive(),
    fps: z.number().positive(),
    background: BackgroundSchema,
    elements: z.array(ElementSchema),
    symbols: z.record(z.string(), SymbolDefinitionSchema).optional(),
    audio: SceneAudioSchema.optional(),
    audioTracks: z.array(AudioTrackItemSchema).optional(),
    shots: z.array(ShotSchema).optional(),
    mode: z.enum(["static", "video"]).optional(),
  })
  .superRefine((scene, ctx) => {
    // keyframe values pass their field's schema, at any depth (069/D2)
    const walk = (elements: readonly Element[], path: (string | number)[]) => {
      for (const [i, el] of elements.entries()) {
        for (const [track, entry] of Object.entries(el.tracks ?? {})) {
          for (const [k, key] of trackKeys(entry).entries()) {
            const message = keyframeError(el.kind, track, key.value);
            if (message)
              ctx.addIssue({
                code: "custom",
                message,
                path: [...path, i, "tracks", track, k, "value"],
              });
          }
        }
        if (el.kind === "group") walk(el.children, [...path, i, "children"]);
      }
    };
    walk(scene.elements, ["elements"]);
  }) as z.ZodType<Scene>;

const traitParam = z.union([z.string(), z.number(), z.boolean()]);

const traitUse = z.union([
  z.string(),
  z.object({ use: z.string() }).catchall(traitParam),
]);

/**
 * A recipe's shape; `set` (group children in their compact form included) is left loose
 * here and checked by resolving the recipe, which must succeed.
 */
const PresetRecipeSchema: z.ZodType<PresetRecipe> = z
  .object({
    name: z.string().min(1),
    category: z.string().optional(),
    kind: z.lazy(() => z.enum([...KINDS, "background"])),
    traits: z.array(traitUse).default([]),
    set: z.record(z.string(), z.unknown()).optional(),
  })
  // a key a recipe does not have (`values`) is an error, not a silent no-op (074/D14)
  .strict()
  .superRefine((recipe, ctx) => {
    const r = resolvePreset(recipe as PresetRecipe);
    if (!("error" in r)) {
      // what it builds is checked like any element or background, at `set.<field>`
      const built =
        "element" in r
          ? ElementSchema.safeParse(r.element)
          : BackgroundSchema.safeParse(r.background);
      for (const issue of built.success ? [] : built.error.issues)
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: ["set", ...issue.path.map(String)],
        });
      return;
    }
    // point at the trait the error names, if it names one (069/D12)
    const i = recipe.traits.findIndex((u) =>
      r.error.includes(`«${typeof u === "string" ? u : u.use}»`),
    );
    ctx.addIssue({
      code: "custom",
      message: r.error,
      ...(i >= 0 ? { path: ["traits", i] } : {}),
    });
  }) as z.ZodType<PresetRecipe>;

/** A failure's `path` is the first failing issue's ("elements.2.fill.color"; "" at the root). */
export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; path: string };

/** "elements.2.fill.color: …" — each issue with the path that failed. */
function describe(error: z.ZodError): string {
  return error.issues
    .map((i) => {
      const path = i.path.map(String).join(".");
      return path ? `${path}: ${i.message}` : i.message;
    })
    .join("\n");
}

export function parseWith<T>(schema: z.ZodType<T>, data: unknown): Parsed<T> {
  const r = schema.safeParse(data);
  return r.success
    ? { ok: true, value: r.data }
    : {
        ok: false,
        error: describe(r.error),
        path: r.error.issues[0]?.path.map(String).join(".") ?? "",
      };
}

export const parseScene = (data: unknown) => parseWith(SceneSchema, data);
export const parsePresetRecipe = (data: unknown) =>
  parseWith(PresetRecipeSchema, data);
