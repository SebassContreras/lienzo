/** Computed numbers the tools return, rounded so they read cleanly (068/D5, 069/D14). */

/** `n` to two decimals: positions, boxes and seconds. */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** `n` to three decimals: proportions such as an image's aspect. */
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
