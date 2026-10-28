/** The bundled fonts (`@fontsource/*`), loaded before the first frame is drawn. */
export const FONTS = [
  "Inter",
  "Space Grotesk",
  "Poppins",
  "JetBrains Mono",
  "Caveat",
  "Press Start 2P",
] as const;

/** The weights `main.tsx` loads for each bundled family (069/D10); keep the two in step. */
export const BUNDLED_WEIGHTS: Record<
  (typeof FONTS)[number],
  readonly number[]
> = {
  Inter: [400, 600, 700, 800],
  "Space Grotesk": [400, 700],
  Poppins: [400, 600, 800],
  "JetBrains Mono": [400, 700],
  Caveat: [400, 700],
  "Press Start 2P": [400],
};

/**
 * The weight a browser draws when `wanted` is not among the family's `available` ones, by
 * the CSS font matching rule (CSS Fonts 4 §5.2): 400 to 500 look up to 500, then down, then
 * up; heavier look up, then down; lighter look down, then up. Measurement and drawing share it.
 */
export function matchedWeight(
  available: readonly number[],
  wanted: number,
): number {
  if (available.length === 0) return 400;
  if (available.includes(wanted)) return wanted;
  const below = available.filter((w) => w < wanted).sort((a, b) => b - a);
  const above = available.filter((w) => w > wanted).sort((a, b) => a - b);
  if (wanted >= 400 && wanted <= 500) {
    return above.find((w) => w <= 500) ?? below[0] ?? above[0] ?? 400;
  }
  return (
    (wanted < 400 ? (below[0] ?? above[0]) : (above[0] ?? below[0])) ?? 400
  );
}
