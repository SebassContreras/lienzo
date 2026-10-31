/**
 * What a `guide` input means (086/R1, D1): a non-empty string is written as given, `""` and
 * `null` delete the guide, leaving it out keeps it. The limit counts UTF-16 code units
 * (`string.length`), as Zod's `.max` does.
 */
import { z } from "zod";
import { fail } from "../core/registry.ts";

export const GUIDE_MAX = 20_000;

export const GuideInputSchema = z.string().nullable().optional();

/** The value to store (`null` deletes, `undefined` keeps), or a `guide_too_long` failure. */
export function guideValue(
  input: string | null | undefined,
): string | null | undefined {
  if (input === undefined || input === null) return input;
  if (input.length > GUIDE_MAX)
    fail(
      "guide_too_long",
      `La guía de marca tiene ${input.length} caracteres; el máximo es ${GUIDE_MAX}`,
      "guide",
    );
  return input === "" ? null : input;
}
