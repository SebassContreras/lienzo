import { createHash } from "node:crypto";

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

export function normalizeExtension(ext: string): string {
  const clean = ext.trim().toLowerCase().replace(/^\./, "");
  return clean === "jpeg" ? "jpg" : clean;
}
