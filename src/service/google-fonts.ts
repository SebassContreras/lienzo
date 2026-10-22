/**
 * The adapter to Google Fonts (045/D6): the only module that knows its URLs and answer
 * format. The css2 API picks the font format from the user agent; a current browser's
 * gets woff2. `fetch` is injected, so tests never touch the network.
 */
const CSS_API = "https://fonts.googleapis.com/css2";
const WOFF2_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export type GoogleFace = { weight: number; url: string };

/**
 * The woff2 URL of each weight in a css2 answer, preferring the `latin` subset (each
 * `@font-face` is preceded by a `/* subset *\/` comment); fonts without subsets give one.
 */
export function parseGoogleCss(css: string): GoogleFace[] {
  const byWeight = new Map<number, { url: string; latin: boolean }>();
  const blocks = css.split("@font-face").slice(1);
  const comments = css.split("@font-face").slice(0, -1);
  blocks.forEach((block, i) => {
    const weight = Number(block.match(/font-weight:\s*(\d+)/)?.[1]);
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!weight || !url) return;
    const subset = comments[i]?.match(/\/\*\s*([\w-]+)\s*\*\/\s*$/)?.[1];
    const latin = subset === "latin";
    const seen = byWeight.get(weight);
    if (!seen || (latin && !seen.latin)) byWeight.set(weight, { url, latin });
  });
  return [...byWeight]
    .sort(([a], [b]) => a - b)
    .map(([weight, { url }]) => ({ weight, url }));
}

/** The css2 URL for `family` in `weights`. */
export function googleCssUrl(
  family: string,
  weights: readonly number[],
): string {
  const name = family.trim().replace(/ +/g, "+");
  const list = [...new Set(weights)].sort((a, b) => a - b).join(";");
  return `${CSS_API}?family=${name}:wght@${list}&display=swap`;
}

/** Downloads `family` in `weights` as woff2 files. Throws when Google has no such family. */
export async function downloadGoogleFont(
  family: string,
  weights: readonly number[],
  get: typeof fetch,
): Promise<{ weight: number; data: Buffer }[]> {
  const res = await get(googleCssUrl(family, weights), {
    headers: { "user-agent": WOFF2_USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(
      `Google Fonts no tiene «${family}» en los pesos ${weights.join(", ")} (${res.status})`,
    );
  }
  const faces = parseGoogleCss(await res.text());
  if (faces.length === 0) {
    throw new Error(`Google Fonts no devolvió archivos para «${family}»`);
  }
  return Promise.all(
    faces.map(async ({ weight, url }) => {
      const file = await get(url);
      if (!file.ok)
        throw new Error(`No se pudo descargar ${url} (${file.status})`);
      return { weight, data: Buffer.from(await file.arrayBuffer()) };
    }),
  );
}
