import { z } from "zod";
import {
  type DirName,
  type KindDef,
  LOOP_IDS,
  LOOPS,
  type LoopId,
  MOTION_IDS,
  MOTIONS,
  type MotionId,
  TEXT_MOTION_IDS,
} from "../../animations/index.ts";
import {
  EASING_NAMES,
  type Easing,
  EasingSchema,
} from "../../engine/easing.ts";
import { num, obj, type Parent, schemaOf, select, widget } from "./field.ts";

/** Every animation a component can offer, by the name it had before slots (spec 013). */
export const ANIM_KINDS = [
  "none",
  "float",
  "pulse",
  "breathe",
  "fade-in",
  "pop-in",
  "slide-up",
  "draw",
] as const;

export type AnimKind = (typeof ANIM_KINDS)[number];

/** What an entry or exit does; an exit plays its kind in reverse. */
const MOTION_KINDS = ["none", ...MOTION_IDS] as const;
export type MotionKind = "none" | MotionId;

export const LOOP_KINDS = ["none", ...LOOP_IDS] as const;
export type LoopKind = "none" | LoopId;

/** The entry kind each pre-slot entry animation became. */
const MOTION_OF: Partial<Record<AnimKind, MotionKind>> = {
  "fade-in": "fade",
  "pop-in": "pop",
  "slide-up": "slide",
  draw: "draw",
};

/** What a component offers in its entry and exit slots, and in its loop slot. */
export type AnimOffer = {
  motions: readonly MotionKind[];
  loops: readonly LoopKind[];
};

const TEXT_MOTIONS: readonly MotionKind[] = TEXT_MOTION_IDS;

/** Entrances that move the element as a whole (no line drawing, no text reveal). */
const BOX_MOTIONS = MOTION_KINDS.filter(
  (k) => k !== "draw" && !TEXT_MOTIONS.includes(k),
);

/** Animations for anything with a box: shapes, icons, images, groups. */
export const BOX_ANIMS: AnimOffer = { motions: BOX_MOTIONS, loops: LOOP_KINDS };

/** A box's animations plus the text reveals. */
export const TEXT_ANIMS: AnimOffer = {
  motions: [...BOX_MOTIONS, ...TEXT_MOTIONS],
  loops: LOOP_KINDS,
};

/** Every kind, for code that reads any scene. */
export const ALL_ANIMS: AnimOffer = {
  motions: MOTION_KINDS,
  loops: LOOP_KINDS,
};

type Defs = Record<string, KindDef>;

const defOf = (defs: Defs, k: unknown): KindDef | undefined =>
  typeof k === "string" ? defs[k] : undefined;

const labelOf = (defs: Defs, k: string) =>
  k === "none" ? "Ninguna" : (defOf(defs, k)?.label ?? k);

/** The `amount` control, labelled and bounded by what the kind says it means. */
const amountOf = (defs: Defs, name: string) =>
  num(12, {
    label: (p: Parent) => `${name}: ${defOf(defs, p.kind)?.amount?.label}`,
    max: (p: Parent) => defOf(defs, p.kind)?.amount?.max ?? 80,
    visible: (p: Parent) => defOf(defs, p.kind)?.amount !== undefined,
  });

const DIR_OPTIONS = [
  ["down", "Abajo"],
  ["up", "Arriba"],
  ["left", "Izquierda"],
  ["right", "Derecha"],
] as const satisfies readonly (readonly [DirName, string])[];

const DIR_NAMES = DIR_OPTIONS.map(([d]) => d) as [DirName, ...DirName[]];

const ENTRY_SEC = 0.8;

const EASING_OPTIONS = [
  ["auto", "Automática"],
  ...EASING_NAMES.map((n) => [n, n] as const),
] as const satisfies readonly (readonly [Easing, string])[];

const easing = (label: string) =>
  select<Easing>(EASING_OPTIONS, "auto", {
    label,
    schema: EasingSchema,
    visible: (p: Parent) => p.kind !== "none",
  });

/** An entry or an exit: one pass of a motion kind, held at its end. */
function motion(
  kinds: readonly MotionKind[],
  name: string,
  side: string,
  delay: number,
) {
  return obj(
    {
      kind: select(
        kinds.map((k) => [k, labelOf(MOTIONS, k)] as const),
        "none" as MotionKind,
        {
          label: `${name}: tipo`,
          widget: "anim-kind",
          schema: z.enum(
            MOTION_KINDS as unknown as [MotionKind, ...MotionKind[]],
          ),
        },
      ),
      amount: amountOf(MOTIONS, name),
      /** The side it comes from (entry) or goes to (exit). */
      from: select<DirName>(DIR_OPTIONS, "down", {
        label: `${name}: ${side}`,
        schema: z.enum(DIR_NAMES),
        visible: (p: Parent) => defOf(MOTIONS, p.kind)?.directional === true,
      }),
      /** Seconds from the scene's start. */
      delay: num(delay, {
        label: `${name}: inicio (s)`,
        max: 30,
        step: 0.1,
        visible: (p: Parent) => p.kind !== "none",
      }),
      duration: num(ENTRY_SEC, {
        label: `${name}: duración (s)`,
        min: 0.1,
        max: 10,
        step: 0.1,
        bounds: [0, Infinity],
        visible: (p: Parent) => p.kind !== "none",
      }),
      easing: easing(`${name}: curva`),
    },
    {},
  );
}

const ITERATIONS = [
  ["infinite", "Siempre"],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(
    (n) => [n, n === 1 ? "1 vez" : `${n} veces`] as const,
  ),
] as const;

function loop(kinds: readonly LoopKind[]) {
  const shown = (p: Parent) => p.kind !== "none";
  return obj(
    {
      kind: select(
        kinds.map((k) => [k, labelOf(LOOPS, k)] as const),
        "none" as LoopKind,
        {
          label: "Loop: tipo",
          widget: "anim-kind",
          schema: z.enum(LOOP_KINDS as unknown as [LoopKind, ...LoopKind[]]),
        },
      ),
      amount: amountOf(LOOPS, "Loop"),
      /** Full cycles per scene; integers keep GIF/MP4 loops seamless (A6). */
      cycles: num(1, {
        label: "Loop: ciclos por escena",
        min: 1,
        max: 8,
        int: true,
        visible: shown,
      }),
      /** Seconds; a phase offset while it repeats forever, else its start. */
      delay: num(0, {
        label: "Loop: inicio (s)",
        max: 30,
        step: 0.1,
        visible: shown,
      }),
      iterations: select<"infinite" | number>(ITERATIONS, "infinite", {
        label: "Loop: repeticiones",
        schema: z.union([z.literal("infinite"), z.number().positive()]),
        visible: shown,
      }),
      direction: select(
        [
          ["normal", "Normal"],
          ["reverse", "Inversa"],
          ["alternate", "Alterna"],
        ] as const,
        "normal" as "normal" | "reverse" | "alternate",
        { label: "Loop: dirección", visible: shown },
      ),
      easing: easing("Loop: curva"),
    },
    {},
  );
}

const LEGACY_LOOPS: readonly unknown[] = LOOP_KINDS;

/**
 * The current shape of an `anim` written earlier: a pre-slot `{ kind, amount, cycles, delay }`
 * moves into its slot, and entry and exit slots without a side (before 018) come from below,
 * which is how they moved then.
 */
export function migrateAnim(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  if (!("kind" in v)) return withSides(v as Parent);
  const old = v as {
    kind: AnimKind;
    amount?: number;
    cycles?: number;
    delay?: number;
  };
  const amount = old.amount ?? 12;
  const delay = old.delay ?? 0;
  const slots = {
    in: defaultsOf(motion(MOTION_KINDS, "", "", 0)),
    loop: defaultsOf(loop(LOOP_KINDS)),
    out: defaultsOf(motion(MOTION_KINDS, "", "", 3)),
  };
  if (LEGACY_LOOPS.includes(old.kind) && old.kind !== "none") {
    Object.assign(slots.loop, {
      kind: old.kind,
      amount,
      cycles: old.cycles ?? 1,
      delay,
    });
  }
  const entry = MOTION_OF[old.kind];
  if (entry) Object.assign(slots.in, { kind: entry, amount, delay });
  return slots;
}

function withSides(v: Parent): Parent {
  const side = (slot: unknown) =>
    slot && typeof slot === "object" && !("from" in slot)
      ? { ...slot, from: "down" }
      : slot;
  return { ...v, in: side(v.in), out: side(v.out) };
}

function defaultsOf(f: { default: Parent }): Parent {
  return structuredClone(f.default);
}

/**
 * The element's preset animation: an entry, a loop and an exit, each optional (spec 013).
 * `offer` is what the inspector offers; any kind opens, so scenes edited by hand keep
 * working. Scenes written before slots are read into them.
 */
export function anim(offer: AnimOffer, section = "Animación") {
  const fields = {
    in: motion(offer.motions, "Entrada", "desde", 0),
    loop: loop(offer.loops),
    out: motion(offer.motions, "Salida", "hacia", 3),
    late: widget("anim-late"),
  };
  const group = obj(fields, { section });
  return {
    ...group,
    schema: z.preprocess(
      migrateAnim,
      schemaOf(fields),
    ) as unknown as typeof group.schema,
  };
}
