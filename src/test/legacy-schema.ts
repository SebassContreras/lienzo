/**
 * The scene schema as it was written by hand before spec 012, kept only so tests can check
 * that the schema generated from the descriptors accepts and rejects exactly the same scenes.
 */
import { z } from "zod";

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
    return z.array(LegacyElement);
  },
  anim,
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
