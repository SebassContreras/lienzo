import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const ASSET_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  glb: "model/gltf-binary",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

export const MAX_ASSET_BYTES = 20 * 1024 * 1024;

export function hashBuffer(data: Buffer, length = 16): string {
  return createHash("sha256").update(data).digest("hex").slice(0, length);
}

/**
 * Whether `bytes` start the way `ext` audio does (081/D6), the counterpart of `imageSize`
 * for pictures: a header check, so a renamed text file or a corrupt blob is refused at the door.
 */
export function looksLikeAudio(bytes: Uint8Array, ext: string): boolean {
  const at = (i: number) => bytes[i] ?? 0;
  const text = (i: number, s: string) =>
    [...s].every((ch, k) => at(i + k) === ch.charCodeAt(0));
  const mpegSync = at(0) === 0xff && (at(1) & 0xe0) === 0xe0;
  if (ext === "mp3") return text(0, "ID3") || mpegSync;
  if (ext === "wav") return text(0, "RIFF") && text(8, "WAVE");
  if (ext === "ogg") return text(0, "OggS");
  if (ext === "aac") return mpegSync || text(4, "ftyp") || text(0, "ADIF");
  return true;
}

export function normalizeExtension(ext: string): string {
  const clean = ext.trim().toLowerCase().replace(/^\./, "");
  return clean === "jpeg" ? "jpg" : clean;
}

/** Writes `data` as `<hash>.<ext>` in `dir` (content-addressed, as uploads are) and returns the name. */
export async function writeAsset(
  dir: string,
  data: Buffer,
  ext: string,
): Promise<string> {
  const filename = `${hashBuffer(data)}.${ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), data);
  return filename;
}
