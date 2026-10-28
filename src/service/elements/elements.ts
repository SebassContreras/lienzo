/**
 * Pure element edits shared by the element tools (007/D3, D5). Kinds and keyframe paths come
 * from the descriptor registry, so a kind added later works with no tool change (R6).
 */
import { trackPaths } from "../../components/descriptor.ts";
import { descriptorOf, KINDS } from "../../components/index.ts";
import { keyframeError, valueKind } from "../../engine/tracks.ts";
import { ignoredFields, ignoredNotice } from "../../model/ignored.ts";
import type { Element } from "../../model/model.ts";
import { ElementSchema } from "../../model/schema.ts";
import { deepMerge } from "../../presets/resolve.ts";
import { fail } from "../registry.ts";

/** `el` with `patch` deep-merged in (objects key by key, the rest replaced); id and kind stay. */
export function patched(el: Element, patch: Record<string, unknown>): Element {
  const out = structuredClone(el) as unknown as Record<string, unknown>;
  deepMerge(out, patch);
  return { ...out, id: el.id, kind: el.kind } as unknown as Element;
}

/**
 * What a patch on `el` did not change (069/D7): keys its kind has no field for, as
 * `ignoredFields` lists them under `patch.`, and an `id` or `kind` that differs, since
 * neither changes.
 */
export function patchNotices(
  el: Element,
  patch: Record<string, unknown>,
): string[] {
  const parsed = ElementSchema.safeParse(patched(el, patch));
  const ignored = parsed.success
    ? ignoredFields(patch, parsed.data, "patch").map(ignoredNotice)
    : [];
  const fixed = (["id", "kind"] as const)
    .filter((k) => k in patch && patch[k] !== el[k])
    .map(
      (k) =>
        `«${k}» no cambia con un patch (sigue «${el[k]}»): ${k === "kind" ? "quita el elemento y agrega otro" : "usa element_add con otro id"}`,
    );
  return [...fixed, ...ignored];
}

/** Whether `el` animates `x` or `y`, which wins over its `at` placement while it plays. */
export function hasPositionTrack(el: Element): boolean {
  return Boolean(el.tracks?.x || el.tracks?.y);
}

/** The notice for an element placed by `at` that also has an `x`/`y` track (069/D11). */
export const trackOverridesAt = (where: string) =>
  `${where}: tiene \`at\` y una pista en x/y; la pista fija x/y y anula la posición de \`at\` (sus valores son absolutos: calcúlalos desde donde \`at\` lo deja, o quita \`at\`)`;

/** Fails unless `kind` is a registered component kind. */
export function checkKind(kind: string, path = "kind"): void {
  if (!descriptorOf(kind))
    fail(
      "unknown_kind",
      `Tipo de elemento desconocido «${kind}» (hay: ${KINDS.join(", ")})`,
      path,
    );
}

/** Fails unless `path` is an animatable track path of `kind`. */
export function checkTrackPath(kind: string, path: string): void {
  const d = descriptorOf(kind);
  const paths = d ? trackPaths(d) : [];
  if (!paths.includes(path))
    fail(
      "unknown_path",
      `«${path}» no se puede animar en «${kind}» (se puede: ${paths.join(", ")})`,
      "path",
    );
}

/** Fails unless `value` fits keyframe `path` of an element of `kind` (a color, or a number). */
export function checkKeyframe(kind: string, path: string, value: unknown) {
  checkTrackPath(kind, path);
  const color = valueKind(kind, path) === "color";
  if (color ? typeof value !== "string" : typeof value !== "number")
    fail(
      "invalid_value",
      color ? "Se esperaba un color" : "Se esperaba un número",
      "value",
    );
  const error = keyframeError(kind, path, value);
  if (error) fail("invalid_value", error, "value");
}

/** How element positions read, told to every agent placing elements. */
export const COORDINATES =
  "Coordinates: an element's `x, y` is the top-left corner of its box, never its centre; " +
  'a text\'s `align` aligns its lines inside its own box, so `x: 540` with `align: "center"` ' +
  "starts the text at 540. To centre something use `at`, which centres the measured box on a point.";
