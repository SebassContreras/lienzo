import { bgGlow } from "./bg-glow.ts";
import { border } from "./border.ts";
import { breathe } from "./breathe.ts";
import { dots } from "./dots.ts";
import { fadeIn } from "./fade-in.ts";
import { fill } from "./fill.ts";
import { float } from "./float.ts";
import { flow } from "./flow.ts";
import { glass } from "./glass.ts";
import { glow } from "./glow.ts";
import { gradient } from "./gradient.ts";
import { gradientText } from "./gradient-text.ts";
import { noGlow } from "./no-glow.ts";
import { noShadow } from "./no-shadow.ts";
import { pulse } from "./pulse.ts";
import { solid } from "./solid.ts";
import { spotlight } from "./spotlight.ts";
import type { Trait } from "./trait.ts";

export {
  applierFor,
  type Trait,
  type TraitParams,
  type TraitTarget,
} from "./trait.ts";

const ALL: Trait[] = [
  glow,
  noGlow,
  bgGlow,
  fill,
  glass,
  border,
  noShadow,
  gradientText,
  flow,
  float,
  pulse,
  breathe,
  fadeIn,
  solid,
  gradient,
  dots,
  spotlight,
];

/** Every trait by id; recipes name traits through this registry. */
export const TRAITS: ReadonlyMap<string, Trait> = new Map(
  ALL.map((t) => [t.id, t]),
);
