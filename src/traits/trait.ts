import type {
  Background,
  EllipseEl,
  GroupEl,
  IconEl,
  ImageEl,
  LineEl,
  ParticlesEl,
  RectEl,
  ShapeEl,
  TextEl,
} from "../model/model.ts";

/** A trait parameter is a plain JSON value so recipes can set it. */
export type ParamValue = string | number | boolean;
export type TraitParams = Record<string, ParamValue>;

/** What each kind of trait target is, by the name recipes use for it. */
export type TraitTargets = {
  rect: RectEl;
  ellipse: EllipseEl;
  icon: IconEl;
  image: ImageEl;
  group: GroupEl;
  text: TextEl;
  line: LineEl;
  particles: ParticlesEl;
  background: Background;
};
export type TraitTarget = keyof TraitTargets;

type Appliers<P> = {
  [K in TraitTarget]?: (target: TraitTargets[K], params: P) => void;
} & {
  /** Applies to every shape styled like a rectangle (rectangle, ellipse). */
  shape?: (target: ShapeEl, params: P) => void;
};

const SHAPE_KINDS: readonly string[] = ["rect", "ellipse"];

/** The function a trait applies to `kind`, if it supports it. */
export function applierFor(
  trait: Trait,
  kind: TraitTarget,
): ((target: unknown, params: TraitParams) => void) | undefined {
  const own = trait.apply[kind] as
    | ((target: unknown, params: TraitParams) => void)
    | undefined;
  if (own) return own;
  return SHAPE_KINDS.includes(kind)
    ? (trait.apply.shape as (target: unknown, params: TraitParams) => void)
    : undefined;
}

/**
 * A reusable style piece: `params` holds each parameter's default, and `apply` says how the
 * trait changes every kind it supports. Recipes list traits by `id`.
 */
export type Trait<P extends TraitParams = TraitParams> = {
  id: string;
  label: string;
  params: P;
  apply: Appliers<P>;
};

/** Keeps each trait's parameter types precise while the registry stores them uniformly. */
export function defineTrait<P extends TraitParams>(trait: Trait<P>): Trait {
  return trait as unknown as Trait;
}
