/**
 * Compact `effects` expansion (058/D2): partial effects merged over the element's own (a
 * preset's, or the defaults), with a notice for every key that is not an effect.
 */
import {
  defaultEffects,
  type EffectsDefaults,
  effects,
} from "../../components/fields/effects.ts";

const KNOWN = Object.keys(effects().fields);

export function expandEffects(
  base: EffectsDefaults | undefined,
  raw: Record<string, unknown>,
  path: string,
): { effects: EffectsDefaults; notices: string[] } {
  const merged: Record<string, unknown> = { ...(base ?? defaultEffects()) };
  const notices: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (KNOWN.includes(key)) merged[key] = value;
    else
      notices.push(
        `${path}: «${key}» no es un efecto conocido (hay: ${KNOWN.join(", ")}); se ignoró`,
      );
  }
  return { effects: merged as EffectsDefaults, notices };
}
