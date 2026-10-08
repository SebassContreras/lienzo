/**
 * Zod schemas for the JSON files Lienzo reads from outside: scenes and preset recipes.
 * Imports are checked here before anything is written (D4).
 */
import { z } from "zod";
import { KINDS } from "../components/index.ts";
import { resolvePreset } from "../presets/resolve.ts";
import { ElementSchema } from "./element-schema.ts";
import type { Scene } from "./model.ts";
import type { PresetRecipe } from "./preset.ts";

export { ElementSchema };

const color = z.string();

export const BackgroundSchema = z.object({
  color,
  color2: color,
  gradient: z.boolean(),
  angle: z.number(),
  dots: z.boolean(),
  dotColor: color,
  dotGap: z.number(),
  spotlight: z.number(),
  spotlightColor: color,
});

export const SceneSchema: z.ZodType<Scene> = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  duration: z.number().positive(),
  fps: z.number().positive(),
  background: BackgroundSchema,
  elements: z.array(ElementSchema),
});

const traitParam = z.union([z.string(), z.number(), z.boolean()]);

const traitUse = z.union([
  z.string(),
  z.object({ use: z.string() }).catchall(traitParam),
]);

/**
 * A recipe's shape; `set` (group children in their compact form included) is left loose
 * here and checked by resolving the recipe, which must succeed.
 */
export const PresetRecipeSchema: z.ZodType<PresetRecipe> = z
  .object({
    name: z.string().min(1),
    category: z.string().optional(),
    kind: z.lazy(() => z.enum([...KINDS, "background"])),
    traits: z.array(traitUse),
    set: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((recipe, ctx) => {
    const r = resolvePreset(recipe as PresetRecipe);
    if ("error" in r) ctx.addIssue({ code: "custom", message: r.error });
  }) as z.ZodType<PresetRecipe>;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** "elements.2.fill.color: …" — each issue with the path that failed. */
function describe(error: z.ZodError): string {
  return error.issues
    .map((i) => {
      const path = i.path.map(String).join(".");
      return path ? `${path}: ${i.message}` : i.message;
    })
    .join("\n");
}

function parseWith<T>(schema: z.ZodType<T>, data: unknown): Parsed<T> {
  const r = schema.safeParse(data);
  return r.success
    ? { ok: true, value: r.data }
    : { ok: false, error: describe(r.error) };
}

export const parseScene = (data: unknown) => parseWith(SceneSchema, data);
export const parsePresetRecipe = (data: unknown) =>
  parseWith(PresetRecipeSchema, data);
