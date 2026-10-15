import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Saves binary asset data to `assets/<hash>.<ext>` at the repository root.
 * Returns the asset path `/assets/<hash>.<ext>`.
 */
export async function saveAudioAsset(
  root: string,
  audioBuffer: Uint8Array,
  format: string,
): Promise<string> {
  const dir = join(root, "assets");
  await mkdir(dir, { recursive: true });

  const ext = format.toLowerCase().trim() || "mp3";
  const hash = createHash("sha256")
    .update(audioBuffer)
    .digest("hex")
    .slice(0, 16);
  const fileName = `${hash}.${ext}`;
  const filePath = join(dir, fileName);

  await writeFile(filePath, audioBuffer);
  return `/assets/${fileName}`;
}
