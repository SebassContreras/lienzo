/**
 * The scene schema as it was written by hand before spec 012, kept only so tests can check
 * that the schema generated from the descriptors accepts and rejects exactly the same scenes.
 */
import { z } from "zod";
import { ALL_ANIMS, anim as animField } from "../components/fields/anim.ts";
import {
  templateSchema as template,
  variationSchema as variation,
} from "../components/particles/descriptor.ts";
import { TracksSchema } from "../model/track.ts";

const color = z.string();
const align = z.enum(["left", "center", "right"]);
const strokeStyle = z.enum(["solid", "dashed", "dotted"]);

/**
 * The one group spec 013 reshaped after 012: `anim` became entry/loop/exit slots. The old flat
 * shape is still read (and migrated into the slots), so both sides check it with the same
 * schema here; the migration itself is tested in `src/engine/anim.test.ts`.
 */
const anim = animField(ALL_ANIMS).schema;

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
  // added by 015, optional, so scenes without it still read
  tracks: TracksSchema.optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
};

const shapeFields = {
  ...box,
  opacity: z.number().min(0).max(1).default(1),
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
  // added by 048, the whole picture when missing
  crop: z
    .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
    .default({ x: 0, y: 0, w: 1, h: 1 }),
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
  // added by 015, optional, so scenes without it still read
  tracks: TracksSchema.optional(),
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
  // added by 021, optional
  anchor: z
    .enum(["auto", "top", "bottom", "left", "right", "center"])
    .optional(),
});

const line = z.object({
  id: z.string(),
  kind: z.literal("line"),
  name: z.string(),
  // added by 015, optional, so scenes without it still read
  tracks: TracksSchema.optional(),
  a: endpoint,
  b: endpoint,
  // added by 021, straight when missing
  route: z.enum(["straight", "orthogonal", "curved"]).default("straight"),
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
  opacity: z.number().min(0).max(1).default(1),
  kind: z.literal("particles"),
  count: z.number().int().min(1).max(300),
  seed: z.number(),
  // relaxed by spec 057: fractional and zero speeds; the motion fields are new and default
  speed: z.number().min(0),
  drift: z.number().min(0),
  motion: z.enum(["drift", "fall", "static"]).default("drift"),
  direction: z.number().min(0).max(360).default(90),
  gravity: z.number().min(0).default(0),
  twinkle: z.number().min(0).max(1).default(0),
  // added by spec 014; missing in old scenes, they read as `null` and alike points
  template,
  variation,
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
  opacity: z.number().min(0).max(1).default(1),
  kind: z.literal("group"),
  cw: z.number(),
  ch: z.number(),
  get children() {
    return z.array(LegacyElement);
  },
  anim,
  // added by 018 with a default, so scenes without it still read
  stagger: z.number().min(0).default(0),
  // added by 017 with defaults: no window frame
  frame: z.enum(["none", "browser", "terminal", "phone"]).default("none"),
  title: z.string().default("lienzo.app"),
  frameColor: color.default("#1e293b"),
  bodyColor: color.default("#0b1220"),
});

const LegacyElement: z.ZodType<unknown> = z.discriminatedUnion("kind", [
  rect,
  ellipse,
  icon,
  image,
  group,
  text,
  line,
  particles,
]);

const BackgroundSchema = z.object({
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

export const LegacySceneSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  duration: z.number().positive(),
  fps: z.number().positive(),
  background: BackgroundSchema,
  elements: z.array(LegacyElement),
});
