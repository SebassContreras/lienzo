import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Saves audio bytes into `dir` as `<content hash>.<ext>` (086/D3): the caller resolves `dir`
 * through `ProjectStore`. Returns the file name.
 */
export async function saveAudioAsset(
  dir: string,
  audioBuffer: Uint8Array,
  format: string,
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const ext = format.toLowerCase().trim() || "mp3";
  const hash = createHash("sha256")
    .update(audioBuffer)
    .digest("hex")
    .slice(0, 16);
  const fileName = `${hash}.${ext}`;
  await writeFile(join(dir, fileName), audioBuffer);
  return fileName;
}
