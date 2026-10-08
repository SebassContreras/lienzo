/**
 * Scene model. A scene is plain JSON: everything the renderer needs to draw any frame.
 * Elements are drawn in array order (last = on top).
 */

export type AnimKind =
  | "none"
  | "float"
  | "pulse"
  | "breathe"
  | "fade-in"
  | "pop-in"
  | "slide-up"
  | "draw";

export type Anim = {
  kind: AnimKind;
  /** px for float/slide-up, % for pulse/breathe. */
  amount: number;
  /** Full cycles per loop; integers keep GIF/MP4 loops seamless. */
  cycles: number;
  /** Seconds; phase offset for loops, start time for entries. */
  delay: number;
};

export type Glow = {
  enabled: boolean;
  color: string;
  blur: number;
  /** Number of stacked passes, 1–4. */
  strength: number;
};

export type Shadow = {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  x: number;
  y: number;
};

export type Fill = {
  color: string;
  color2: string;
  gradient: boolean;
  angle: number;
  opacity: number;
};

export type StrokeStyle = "solid" | "dashed" | "dotted";

export type RectEl = {
  id: string;
  kind: "rect";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  fill: Fill;
  border: {
    width: number;
    color: string;
    opacity: number;
    style: StrokeStyle;
    /** Marching border; dash periods per loop, 0 = still. */
    flow: number;
  };
  borderGlow: Glow;
  bgGlow: Glow;
  shadow: Shadow;
  /** Text drawn inside the rectangle; moves and animates with it. */
  label: {
    text: string;
    font: string;
    size: number;
    weight: number;
    color: string;
    align: "left" | "center" | "right";
    padding: number;
  };
  anim: Anim;
};

/** An ellipse inside its box (a circle when `w` equals `h`); styled like a rectangle. */
export type EllipseEl = Omit<RectEl, "kind" | "radius"> & { kind: "ellipse" };

/** Shapes that share the rectangle's fill, border, glows, shadow and label. */
export type ShapeEl = RectEl | EllipseEl;

/** A lucide icon drawn as strokes, optionally on a rounded tile. */
export type IconEl = {
  id: string;
  kind: "icon";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Lucide icon name in PascalCase, e.g. "Wrench". */
  icon: string;
  /** Stroke width on lucide's 24x24 grid. */
  stroke: number;
  color: string;
  opacity: number;
  tile: {
    enabled: boolean;
    color: string;
    color2: string;
    gradient: boolean;
    angle: number;
    opacity: number;
    radius: number;
    /** Space between the tile's edge and the icon, px. */
    padding: number;
  };
  glow: Glow;
  anim: Anim;
};

/** A picture file stored in `assets/`, drawn into its box. */
export type ImageEl = {
  id: string;
  kind: "image";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** URL path such as `/assets/3f2a….png`; empty until a file is chosen. */
  src: string;
  /** Width / height of the picture itself; resizing keeps it when `keepAspect`. */
  aspect: number;
  keepAspect: boolean;
  radius: number;
  opacity: number;
  border: { width: number; color: string; opacity: number };
  shadow: Shadow;
  anim: Anim;
};

/**
 * Elements moved, resized, duplicated and animated as one. Children live in their own
 * coordinate space, `cw` × `ch`, which is stretched onto the group's box `x, y, w, h`.
 */
export type GroupEl = {
  id: string;
  kind: "group";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cw: number;
  ch: number;
  children: Element[];
  anim: Anim;
};

export type TextEl = {
  id: string;
  kind: "text";
  name: string;
  x: number;
  y: number;
  text: string;
  font: string;
  size: number;
  weight: number;
  italic: boolean;
  color: string;
  color2: string;
  gradient: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  opacity: number;
  glow: Glow;
  anim: Anim;
};

export type Endpoint = { x: number; y: number; attach?: string };

export type FlowKind = "none" | "ants" | "pulse" | "comet";

export type LineEl = {
  id: string;
  kind: "line";
  name: string;
  a: Endpoint;
  b: Endpoint;
  /** Perpendicular offset of the curve's control point, px. */
  bend: number;
  width: number;
  color: string;
  opacity: number;
  style: StrokeStyle;
  arrowStart: boolean;
  arrowEnd: boolean;
  glow: Glow;
  flow: {
    kind: FlowKind;
    color: string;
    /** Laps (pulse/comet) or dash periods (ants) per loop. */
    speed: number;
    count: number;
    size: number;
    reverse: boolean;
  };
  anim: Anim;
};

/**
 * Points drifting inside the box, joined by lines when close ("constellation"). Paints no
 * background of its own. Motion is a closed loop derived from `seed` (see particle-field).
 */
export type ParticlesEl = {
  id: string;
  kind: "particles";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Number of points, 1–300. */
  count: number;
  /** Changing it redistributes the points. */
  seed: number;
  /** Highest number of laps a point makes per loop (integer, ≥ 1). */
  speed: number;
  /** How far, px, a point wanders from its resting place. */
  drift: number;
  dot: { size: number; color: string; opacity: number };
  link: { distance: number; width: number; color: string; opacity: number };
  glow: Glow;
  anim: Anim;
};

export type Element =
  | RectEl
  | EllipseEl
  | IconEl
  | ImageEl
  | GroupEl
  | TextEl
  | LineEl
  | ParticlesEl;
export type ElementKind = Element["kind"];

export type Background = {
  color: string;
  color2: string;
  gradient: boolean;
  angle: number;
  dots: boolean;
  dotColor: string;
  dotGap: number;
  /** Soft radial light in the middle, 0 = off. */
  spotlight: number;
  spotlightColor: string;
};

export type Scene = {
  width: number;
  height: number;
  /** Loop length, seconds. */
  duration: number;
  fps: number;
  background: Background;
  elements: Element[];
};

export const FONTS = [
  "Inter",
  "Space Grotesk",
  "Poppins",
  "JetBrains Mono",
  "Caveat",
  "Press Start 2P",
] as const;

export const SIZE_PRESETS = [
  { label: "Cuadrado 1080×1080", width: 1080, height: 1080 },
  { label: "Vertical 1080×1350", width: 1080, height: 1350 },
  { label: "Story 1080×1920", width: 1080, height: 1920 },
  { label: "Horizontal 1920×1080", width: 1920, height: 1080 },
  { label: "LinkedIn 1200×627", width: 1200, height: 627 },
];

/** Animations for anything with a box: shapes, icons, images, text. */
const BOX_ANIMS: AnimKind[] = [
  "none",
  "float",
  "pulse",
  "breathe",
  "fade-in",
  "pop-in",
  "slide-up",
];

export const ANIMS_BY_KIND: Record<ElementKind, AnimKind[]> = {
  rect: BOX_ANIMS,
  ellipse: BOX_ANIMS,
  icon: BOX_ANIMS,
  image: BOX_ANIMS,
  group: BOX_ANIMS,
  text: BOX_ANIMS,
  line: ["none", "fade-in", "draw"],
  particles: ["none", "fade-in", "pop-in", "breathe"],
};

export const ANIM_LABELS: Record<AnimKind, string> = {
  none: "Ninguna",
  float: "Flotar",
  pulse: "Pulso (escala)",
  breathe: "Brillo que respira",
  "fade-in": "Aparecer",
  "pop-in": "Pop",
  "slide-up": "Subir",
  draw: "Dibujarse",
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const noAnim: Anim = { kind: "none", amount: 12, cycles: 1, delay: 0 };
const noGlow = (color: string): Glow => ({
  enabled: false,
  color,
  blur: 24,
  strength: 1,
});

export function defaultRect(): RectEl {
  return {
    id: newId(),
    kind: "rect",
    name: "Rectángulo",
    x: 0,
    y: 0,
    w: 280,
    h: 180,
    radius: 24,
    fill: {
      color: "#13254a",
      color2: "#0b1630",
      gradient: true,
      angle: 90,
      opacity: 0.9,
    },
    border: {
      width: 2,
      color: "#3b82f6",
      opacity: 0.8,
      style: "solid",
      flow: 0,
    },
    borderGlow: { ...noGlow("#3b82f6"), enabled: true, blur: 18 },
    bgGlow: noGlow("#2563eb"),
    shadow: {
      enabled: true,
      color: "#000000",
      opacity: 0.5,
      blur: 40,
      x: 0,
      y: 16,
    },
    label: {
      text: "",
      font: "Inter",
      size: 28,
      weight: 600,
      color: "#ffffff",
      align: "center",
      padding: 24,
    },
    anim: { ...noAnim },
  };
}

export function defaultEllipse(): EllipseEl {
  const { radius: _radius, ...rect } = defaultRect();
  return { ...rect, kind: "ellipse", name: "Elipse", w: 200, h: 200 };
}

export function defaultIcon(): IconEl {
  return {
    id: newId(),
    kind: "icon",
    name: "Icono",
    x: 0,
    y: 0,
    w: 120,
    h: 120,
    icon: "Wrench",
    stroke: 2,
    color: "#e0f2fe",
    opacity: 1,
    tile: {
      enabled: true,
      color: "#1e3a8a",
      color2: "#0b1630",
      gradient: true,
      angle: 135,
      opacity: 1,
      radius: 28,
      padding: 28,
    },
    glow: noGlow("#60a5fa"),
    anim: { ...noAnim },
  };
}

export function defaultImage(): ImageEl {
  return {
    id: newId(),
    kind: "image",
    name: "Imagen",
    x: 0,
    y: 0,
    w: 320,
    h: 240,
    src: "",
    aspect: 4 / 3,
    keepAspect: true,
    radius: 16,
    opacity: 1,
    border: { width: 0, color: "#ffffff", opacity: 0.3 },
    shadow: {
      enabled: false,
      color: "#000000",
      opacity: 0.5,
      blur: 40,
      x: 0,
      y: 16,
    },
    anim: { ...noAnim },
  };
}

export function defaultGroup(): GroupEl {
  return {
    id: newId(),
    kind: "group",
    name: "Grupo",
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    cw: 100,
    ch: 100,
    children: [],
    anim: { ...noAnim },
  };
}

export function defaultText(): TextEl {
  return {
    id: newId(),
    kind: "text",
    name: "Texto",
    x: 0,
    y: 0,
    text: "Texto",
    font: "Inter",
    size: 64,
    weight: 800,
    italic: false,
    color: "#ffffff",
    color2: "#60a5fa",
    gradient: false,
    align: "left",
    lineHeight: 1.15,
    letterSpacing: 0,
    opacity: 1,
    glow: noGlow("#60a5fa"),
    anim: { ...noAnim },
  };
}

export function defaultLine(): LineEl {
  return {
    id: newId(),
    kind: "line",
    name: "Línea",
    a: { x: 0, y: 0 },
    b: { x: 260, y: 0 },
    bend: 0,
    width: 3,
    color: "#3b82f6",
    opacity: 0.6,
    style: "solid",
    arrowStart: false,
    arrowEnd: true,
    glow: { ...noGlow("#3b82f6"), enabled: true, blur: 12 },
    flow: {
      kind: "pulse",
      color: "#93c5fd",
      speed: 2,
      count: 2,
      size: 5,
      reverse: false,
    },
    anim: { ...noAnim },
  };
}

export function defaultParticles(): ParticlesEl {
  return {
    id: newId(),
    kind: "particles",
    name: "Partículas",
    x: 0,
    y: 0,
    w: 600,
    h: 400,
    count: 60,
    seed: 1,
    speed: 1,
    drift: 40,
    dot: { size: 2.5, color: "#93c5fd", opacity: 0.9 },
    link: { distance: 120, width: 1, color: "#60a5fa", opacity: 0.5 },
    glow: noGlow("#60a5fa"),
    anim: { ...noAnim },
  };
}

const DEFAULTS: Record<ElementKind, () => Element> = {
  rect: defaultRect,
  ellipse: defaultEllipse,
  icon: defaultIcon,
  image: defaultImage,
  group: defaultGroup,
  text: defaultText,
  line: defaultLine,
  particles: defaultParticles,
};

/** A fresh default element of `kind`; throws for a kind that does not exist. */
export function defaultElement(kind: ElementKind): Element {
  if (!Object.hasOwn(DEFAULTS, kind)) {
    throw new Error(`unknown element kind ${kind}`);
  }
  return DEFAULTS[kind]();
}

/** The background of a new scene ("Azul noche"). */
export function defaultBackground(): Background {
  return {
    color: "#0a1430",
    color2: "#030712",
    gradient: true,
    angle: 120,
    dots: true,
    dotColor: "#1e3a8a",
    dotGap: 36,
    spotlight: 0.35,
    spotlightColor: "#1d4ed8",
  };
}

export function defaultScene(): Scene {
  return {
    width: 1080,
    height: 1080,
    duration: 4,
    fps: 30,
    background: defaultBackground(),
    elements: [],
  };
}

/**
 * Deep copies with fresh ids, for groups' children too. A copied line attached to another
 * copied element (or to something inside a copied group) is attached to that copy; other
 * attachments are kept.
 */
export function cloneElements(elements: Element[]): Element[] {
  const copies = structuredClone(elements);
  const ids = new Map<string, string>();
  const renew = (e: Element) => {
    const id = newId();
    ids.set(e.id, id);
    e.id = id;
    if (e.kind === "group") e.children.forEach(renew);
  };
  const relink = (e: Element) => {
    if (e.kind === "line") {
      for (const end of [e.a, e.b]) {
        if (end.attach) end.attach = ids.get(end.attach) ?? end.attach;
      }
    }
    if (e.kind === "group") e.children.forEach(relink);
  };
  copies.forEach(renew);
  copies.forEach(relink);
  return copies;
}

/** Deep copy with fresh ids (see `cloneElements`). */
export function cloneElement<T extends Element>(el: T): T {
  return cloneElements([el])[0] as T;
}
