/**
 * Canvas sizes as tools take them (074/D2): `WxH`, `[w, h]`, a ratio or a size preset name.
 * Anything else is an error that lists the accepted forms, never a silent square.
 */
import { SIZE_PRESETS } from "./model.ts";

/** Social formats by aspect ratio, sized as `SIZE_PRESETS` sizes them. */
const RATIOS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

const FORMS =
  `«WxH» (p. ej. «1080x1920»), [ancho, alto], una proporción (${Object.keys(RATIOS).join(", ")}) ` +
  `o un formato (${SIZE_PRESETS.map((p) => p.label.split(" ")[0]).join(", ")})`;

export type ParsedSize = { width: number; height: number } | { error: string };

/** The canvas `size` names. */
export function parseSize(
  size: string | readonly [number, number],
): ParsedSize {
  if (Array.isArray(size)) return { width: size[0], height: size[1] };
  const text = (size as string).trim();
  const dims = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(text);
  if (dims) return { width: Number(dims[1]), height: Number(dims[2]) };
  const ratio = RATIOS[text.replace(/\s/g, "")];
  if (ratio) return { ...ratio };
  const name = text.toLowerCase();
  const preset = SIZE_PRESETS.find(
    (p) => p.label.split(" ")[0]?.toLowerCase() === name,
  );
  if (preset) return { width: preset.width, height: preset.height };
  return { error: `Tamaño «${text}» no válido: usa ${FORMS}` };
}
