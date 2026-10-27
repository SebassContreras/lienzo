/**
 * Pure text measurement abstraction (054/D1).
 * Anti-corruption layer isolating browser Canvas measurement from Node glyph metrics (A18, A20).
 */
import opentype from "opentype.js";

export type MeasureStyle = {
  font: string;
  size: number;
  weight: number;
  italic?: boolean;
  letterSpacing?: number;
};

export type FontMetrics = {
  ascent: number;
  descent: number;
  lineHeight: number;
};

export type TextMeasurer = {
  measureWidth(text: string, style: MeasureStyle): number;
  getMetrics(style: MeasureStyle): FontMetrics;
};

const BUNDLED_FONT_PACKAGES: Record<string, string> = {
  inter: "inter",
  "space grotesk": "space-grotesk",
  poppins: "poppins",
  "jetbrains mono": "jetbrains-mono",
  caveat: "caveat",
  "press start 2p": "press-start-2p",
};

/**
 * Normalizes weight to the closest available standard weight in fontsource packages.
 */
function findClosestWeight(weights: number[], target: number): number {
  if (weights.length === 0) return 400;
  return weights.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

const AVAILABLE_WEIGHTS: Record<string, number[]> = {
  inter: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  "space-grotesk": [300, 400, 500, 600, 700],
  poppins: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  "jetbrains-mono": [100, 200, 300, 400, 500, 600, 700, 800],
  caveat: [400, 500, 600, 700],
  "press-start-2p": [400],
};

const fontCache = new Map<string, opentype.Font | null>();

/** Installed fonts with metrics here, by lowercase family then weight (067/D5). */
let installedFonts = new Map<string, Map<number, opentype.Font>>();

/** A font file to measure with: a ttf, otf or woff (opentype.js cannot read woff2). */
export type InstalledFont = { family: string; weight: number; data: Buffer };

/**
 * Makes `fonts` the installed fonts text is measured with, replacing those of the previous
 * project, and returns the files opentype cannot read; those families stay estimated (067/D5).
 */
export function setInstalledFonts(fonts: readonly InstalledFont[]): string[] {
  const next = new Map<string, Map<number, opentype.Font>>();
  const unreadable: string[] = [];
  for (const { family, weight, data } of fonts) {
    try {
      const font = opentype.parse(
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      );
      const key = family.trim().toLowerCase();
      const weights = next.get(key) ?? new Map<number, opentype.Font>();
      next.set(key, weights.set(weight, font));
    } catch {
      unreadable.push(`${family} ${weight}`);
    }
  }
  installedFonts = next;
  return unreadable;
}

/** The installed font of `family` closest to `weight`, if any. */
function installedFont(family: string, weight: number): opentype.Font | null {
  const weights = installedFonts.get(family);
  if (!weights) return null;
  return weights.get(findClosestWeight([...weights.keys()], weight)) ?? null;
}

/**
 * Loads and parses an opentype font from disk in Node.js, or takes an installed one.
 * Caches parsed font objects in memory.
 */
export function loadFontSync(
  family: string,
  weight: number,
  italic = false,
): opentype.Font | null {
  const normFamily = family.trim().toLowerCase();
  const pkgName = BUNDLED_FONT_PACKAGES[normFamily];
  if (!pkgName) return installedFont(normFamily, weight);

  const weights = AVAILABLE_WEIGHTS[pkgName] ?? [400];
  const matchedWeight = findClosestWeight(weights, weight);
  const styleSuffix = italic ? "italic" : "normal";
  const cacheKey = `${pkgName}:${matchedWeight}:${styleSuffix}`;

  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey) ?? null;
  }

  try {
    // Only in Node environment
    if (typeof process === "undefined" || !process.versions?.node) {
      return null;
    }

    // Built-in lookup instead of a static import, so browser bundles are unaffected; an ES
    // module has no global `require`, so one is made for this file (063/D3)
    const path = process.getBuiltinModule("node:path");
    const fs = process.getBuiltinModule("node:fs");
    const { createRequire } = process.getBuiltinModule("node:module");
    const pkgJsonPath = createRequire(import.meta.url).resolve(
      `@fontsource/${pkgName}/package.json`,
    );
    const filesDir = path.join(path.dirname(pkgJsonPath), "files");

    // Look for matching woff or ttf
    const baseName = `${pkgName}-latin-${matchedWeight}-${styleSuffix}.woff`;
    const fallbackBaseName = `${pkgName}-latin-${matchedWeight}-normal.woff`;
    let fontPath = path.join(filesDir, baseName);
    if (!fs.existsSync(fontPath)) {
      fontPath = path.join(filesDir, fallbackBaseName);
    }
    if (!fs.existsSync(fontPath)) {
      // Find any latin woff
      const files = fs.readdirSync(filesDir) as string[];
      const candidate = files.find(
        (f) => f.startsWith(`${pkgName}-latin-`) && f.endsWith(".woff"),
      );
      if (candidate) {
        fontPath = path.join(filesDir, candidate);
      } else {
        fontCache.set(cacheKey, null);
        return null;
      }
    }

    const buf = fs.readFileSync(fontPath);
    const font = opentype.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
    fontCache.set(cacheKey, font);
    return font;
  } catch {
    fontCache.set(cacheKey, null);
    return null;
  }
}

let browserCanvasCtx: OffscreenCanvasRenderingContext2D | undefined;

function getBrowserContext(): OffscreenCanvasRenderingContext2D | undefined {
  if (typeof OffscreenCanvas !== "undefined") {
    browserCanvasCtx ??= new OffscreenCanvas(1, 1).getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;
    return browserCanvasCtx;
  }
  return undefined;
}

/**
 * The canvas `font` for `style`. A family the page lacks falls back to Inter, the bundled UI
 * font, then any sans-serif, never the browser's default serif (067/D4).
 */
export function fontStringOf(style: MeasureStyle): string {
  return `${style.italic ? "italic " : ""}${style.weight} ${style.size}px "${style.font}", "Inter", sans-serif`;
}

/**
 * Measures text advance width using opentype glyph advance and kerning.
 */
export function measureWithOpentype(
  font: opentype.Font,
  text: string,
  fontSize: number,
  letterSpacing = 0,
): number {
  const scale = fontSize / font.unitsPerEm;
  let totalWidth = 0;
  let prevGlyph: opentype.Glyph | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    if (prevGlyph) {
      totalWidth += font.getKerningValue(prevGlyph, glyph) * scale;
    }
    totalWidth += (glyph.advanceWidth ?? 0) * scale;
    if (i < text.length - 1) {
      totalWidth += letterSpacing;
    }
    prevGlyph = glyph;
  }

  return totalWidth;
}

/**
 * Typographic fallback width estimation when no font tables are available.
 * Uses realistic character width ratios based on typical sans-serif proportions.
 */
function fallbackMeasureWidth(text: string, style: MeasureStyle): number {
  const charWidthRatio = 0.54; // Average glyph advance width ratio for sans-serif latin
  const baseCharWidth = style.size * charWidthRatio;
  const ls = style.letterSpacing ?? 0;
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    // Simple proportional adjustment for common glyph classes
    let factor = 1.0;
    if ("ijl|.,:;'! ".includes(ch)) factor = 0.35;
    else if ("mwMW@#%&".includes(ch)) factor = 1.4;
    else if (/[A-Z0-9]/.test(ch)) factor = 1.15;
    w += baseCharWidth * factor;
    if (i < text.length - 1) w += ls;
  }
  return w;
}

/**
 * Whether `measureTextWidth` falls back to the estimate for `style`: no canvas and no font
 * tables (064/D3). Mirrors its branches, so the two never disagree.
 */
export function widthIsEstimated(style: MeasureStyle): boolean {
  return (
    !getBrowserContext() &&
    !loadFontSync(style.font, style.weight, style.italic)
  );
}

/**
 * Returns accurate width for a single line of text.
 */
export function measureTextWidth(text: string, style: MeasureStyle): number {
  if (text.length === 0) return 0;

  // 1. Browser canvas measurement
  const ctx = getBrowserContext();
  if (ctx) {
    ctx.font = fontStringOf(style);
    ctx.letterSpacing = `${style.letterSpacing ?? 0}px`;
    return ctx.measureText(text).width;
  }

  // 2. Node opentype.js glyph measurement
  const font = loadFontSync(style.font, style.weight, style.italic);
  if (font) {
    return measureWithOpentype(
      font,
      text,
      style.size,
      style.letterSpacing ?? 0,
    );
  }

  // 3. Fallback proportional heuristic
  return fallbackMeasureWidth(text, style);
}

/**
 * Returns vertical font metrics (ascent, descent, default line height).
 */
export function measureFontMetrics(style: MeasureStyle): FontMetrics {
  const font = loadFontSync(style.font, style.weight, style.italic);
  if (font?.unitsPerEm) {
    const upe = font.unitsPerEm;
    const asc =
      (font.tables.hhea?.ascender ??
        font.tables.os2?.sTypoAscender ??
        upe * 0.8) / upe;
    const desc =
      Math.abs(
        font.tables.hhea?.descender ??
          font.tables.os2?.sTypoDescender ??
          upe * 0.2,
      ) / upe;
    return {
      ascent: asc * style.size,
      descent: desc * style.size,
      lineHeight: (asc + desc) * style.size,
    };
  }

  // Typographic standard defaults
  return {
    ascent: style.size * 0.8,
    descent: style.size * 0.2,
    lineHeight: style.size * 1.2,
  };
}
