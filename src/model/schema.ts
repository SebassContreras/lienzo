/**
 * Zod schemas for the JSON files Lienzo reads from outside: scenes and preset recipes.
 * Imports are checked here before anything is written (D4).
 */
import { z } from "zod";
import { resolvePreset } from "../presets/resolve.ts";
import type { Element, Scene } from "./model.ts";
import type { PresetRecipe } from "./preset.ts";

const color = z.string();
const align = z.enum(["left", "center", "right"]);
const strokeStyle = z.enum(["solid", "dashed", "dotted"]);

const anim = z.object({
  kind: z.enum([
    "none",
    "float",
    "pulse",
    "breathe",
    "fade-in",
    "pop-in",
    "slide-up",
    "draw",
  ]),
  amount: z.number(),
  cycles: z.number(),
  delay: z.number(),
});

const glow = z.object({
  enabled: z.boolean(),
  color,
  blur: z.number(),
  strength: z.number(),
});

const shadow = z.object({
  enabled: z.boolean(),
  color,
  opacity: z.number(),
  blur: z.number(),
  x: z.number(),
  y: z.number(),
});

const box = {
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
};

const shapeFields = {
  ...box,
  fill: z.object({
    color,
    color2: color,
    gradient: z.boolean(),
    angle: z.number(),
    opacity: z.number(),
  }),
  border: z.object({
    width: z.number(),
    color,
    opacity: z.number(),
    style: strokeStyle,
    flow: z.number(),
  }),
  borderGlow: glow,
  bgGlow: glow,
  shadow,
  label: z.object({
    text: z.string(),
    font: z.string(),
    size: z.number(),
    weight: z.number(),
    color,
    align,
    padding: z.number(),
  }),
  anim,
};

const rect = z.object({
  ...shapeFields,
  kind: z.literal("rect"),
  radius: z.number(),
});

const ellipse = z.object({ ...shapeFields, kind: z.literal("ellipse") });

const icon = z.object({
  ...box,
  kind: z.literal("icon"),
  icon: z.string(),
  stroke: z.number(),
  color,
  opacity: z.number(),
  tile: z.object({
    enabled: z.boolean(),
    color,
    color2: color,
    gradient: z.boolean(),
    angle: z.number(),
    opacity: z.number(),
    radius: z.number(),
    padding: z.number(),
  }),
  glow,
  anim,
});

const image = z.object({
  ...box,
  kind: z.literal("image"),
  src: z.string(),
  aspect: z.number(),
  keepAspect: z.boolean(),
  radius: z.number(),
  opacity: z.number(),
  border: z.object({ width: z.number(), color, opacity: z.number() }),
  shadow,
  anim,
});

const text = z.object({
  id: z.string(),
  kind: z.literal("text"),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  font: z.string(),
  size: z.number(),
  weight: z.number(),
  italic: z.boolean(),
  color,
  color2: color,
  gradient: z.boolean(),
  align,
  lineHeight: z.number(),
  letterSpacing: z.number(),
  opacity: z.number(),
  glow,
  anim,
});

const endpoint = z.object({
  x: z.number(),
  y: z.number(),
  attach: z.string().optional(),
});

const line = z.object({
  id: z.string(),
  kind: z.literal("line"),
  name: z.string(),
  a: endpoint,
  b: endpoint,
  bend: z.number(),
  width: z.number(),
  color,
  opacity: z.number(),
  style: strokeStyle,
  arrowStart: z.boolean(),
  arrowEnd: z.boolean(),
  glow,
  flow: z.object({
    kind: z.enum(["none", "ants", "pulse", "comet"]),
    color,
    speed: z.number(),
    count: z.number(),
    size: z.number(),
    reverse: z.boolean(),
  }),
  anim,
});

const particles = z.object({
  ...box,
  kind: z.literal("particles"),
  count: z.number().int().min(1).max(300),
  seed: z.number(),
  speed: z.number().int().min(1),
  drift: z.number().min(0),
  dot: z.object({ size: z.number(), color, opacity: z.number() }),
  link: z.object({
    distance: z.number(),
    width: z.number(),
    color,
    opacity: z.number(),
  }),
  glow,
  anim,
});

const group = z.object({
  ...box,
  kind: z.literal("group"),
  cw: z.number(),
  ch: z.number(),
  get children() {
    return z.array(ElementSchema);
  },
  anim,
});

export const ElementSchema: z.ZodType<Element> = z.discriminatedUnion("kind", [
  rect,
  ellipse,
  icon,
  image,
  group,
  text,
  line,
  particles,
]);

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
    kind: z.enum([
      "rect",
      "ellipse",
      "icon",
      "image",
      "group",
      "text",
      "line",
      "particles",
      "background",
    ]),
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
