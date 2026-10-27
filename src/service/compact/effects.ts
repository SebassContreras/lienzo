/**
 * Compact `effects` expansion (058/D2): partial effects merged over the element's own (a
 * preset's, or the defaults), with a notice for every key that is not an effect.
 */
import {
  defaultEffects,
  type EffectsDefaults,
  effects,
} from "../../components/fields/effects.ts";
import { closestKey } from "../../model/ignored.ts";

const KNOWN = Object.keys(effects().fields);

/** Where a key given under `effects` belongs when it names one of the element's fields. */
function ownHint(key: string, own: readonly string[]): string {
  const near = key.toLowerCase();
  const fields = own.includes(key)
    ? [key]
    : own.filter((f) => f.toLowerCase().includes(near));
  const field = fields[0] ?? closestKey(key, own);
  if (!field) return "";
  const all = fields.length > 1 ? fields.join(", ") : field;
  return `. ${all} ${fields.length > 1 ? "son campos" : "es un campo"} del propio elemento, fuera de effects: \`${field}: { enabled: true }\``;
}

export function expandEffects(
  base: EffectsDefaults | undefined,
  raw: Record<string, unknown>,
  path: string,
  own: readonly string[] = [],
): { effects: EffectsDefaults; notices: string[] } {
  const merged: Record<string, unknown> = { ...(base ?? defaultEffects()) };
  const notices: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (KNOWN.includes(key)) merged[key] = value;
    else
      notices.push(
        `${path}: «${key}» no es un efecto conocido (hay: ${KNOWN.join(", ")}); se ignoró` +
          ownHint(key, own),
      );
  }
  return { effects: merged as EffectsDefaults, notices };
}
