import { z } from "zod";
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

/** Animations for anything with a box: shapes, icons, images, text, groups. */
export const BOX_ANIMS: readonly AnimKind[] = [
  "none",
  "float",
  "pulse",
  "breathe",
  "fade-in",
  "pop-in",
  "slide-up",
];

/** What an entry or exit does; an exit plays its kind in reverse. */
export const MOTION_KINDS = ["none", "fade", "pop", "slide", "draw"] as const;
export type MotionKind = (typeof MOTION_KINDS)[number];

export const LOOP_KINDS = ["none", "float", "pulse", "breathe"] as const;
export type LoopKind = (typeof LOOP_KINDS)[number];

/** The entry kind each pre-slot entry animation became. */
export const MOTION_OF: Partial<Record<AnimKind, MotionKind>> = {
  "fade-in": "fade",
  "pop-in": "pop",
  "slide-up": "slide",
  draw: "draw",
};

const MOTION_LABELS: Record<MotionKind, string> = {
  none: "Ninguna",
  fade: "Desvanecer",
  pop: "Pop",
  slide: "Deslizar",
  draw: "Dibujarse",
};

const LOOP_LABELS: Record<LoopKind, string> = {
  none: "Ninguna",
  float: ANIM_LABELS.float,
  pulse: ANIM_LABELS.pulse,
  breathe: ANIM_LABELS.breathe,
};

export const ENTRY_SEC = 0.8;

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
function motion(kinds: readonly MotionKind[], name: string, delay: number) {
  return obj(
    {
      kind: select(
        kinds.map((k) => [k, MOTION_LABELS[k]] as const),
        "none" as MotionKind,
        { label: `${name}: tipo`, schema: z.enum(MOTION_KINDS) },
      ),
      /** px, for slide. */
      amount: num(12, {
        label: `${name}: distancia`,
        max: 80,
        visible: (p: Parent) => p.kind === "slide",
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
        kinds.map((k) => [k, LOOP_LABELS[k]] as const),
        "none" as LoopKind,
        { label: "Loop: tipo", schema: z.enum(LOOP_KINDS) },
      ),
      /** px for float, % for pulse/breathe. */
      amount: num(12, {
        label: (p: Parent) =>
          p.kind === "float" ? "Loop: distancia" : "Loop: intensidad %",
        max: (p: Parent) => (p.kind === "breathe" ? 100 : 80),
        visible: shown,
      }),
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

const LOOPS: readonly unknown[] = LOOP_KINDS;

/** The slot shape of a pre-slot `{ kind, amount, cycles, delay }`, or `v` itself. */
export function migrateAnim(v: unknown): unknown {
  if (!v || typeof v !== "object" || !("kind" in v)) return v;
  const old = v as {
    kind: AnimKind;
    amount?: number;
    cycles?: number;
    delay?: number;
  };
  const amount = old.amount ?? 12;
  const delay = old.delay ?? 0;
  const slots = {
    in: defaultsOf(motion(MOTION_KINDS, "", 0)),
    loop: defaultsOf(loop(LOOP_KINDS)),
    out: defaultsOf(motion(MOTION_KINDS, "", 3)),
  };
  if (LOOPS.includes(old.kind) && old.kind !== "none") {
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

function defaultsOf(f: { default: Parent }): Parent {
  return structuredClone(f.default);
}

/**
 * The element's preset animation: an entry, a loop and an exit, each optional (spec 013).
 * `kinds` are the ones the inspector offers, by their pre-slot names; any kind opens, so
 * scenes edited by hand keep working. Scenes written before slots are read into them.
 */
export function anim(kinds: readonly AnimKind[], section = "Animación") {
  const motions = MOTION_KINDS.filter(
    (k) => k === "none" || kinds.some((a) => MOTION_OF[a] === k),
  );
  const loops = LOOP_KINDS.filter((k) => kinds.includes(k));
  const fields = {
    in: motion(motions, "Entrada", 0),
    loop: loop(loops),
    out: motion(motions, "Salida", 3),
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
