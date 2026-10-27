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
