import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Saves binary asset data to `projects/<projectSlug>/assets/<hash>.<ext>`.
 * Returns the asset path `/projects/<projectSlug>/assets/<hash>.<ext>`.
 */
export async function saveAudioAsset(
  root: string,
  audioBuffer: Uint8Array,
  format: string,
  projectSlug = "mi-proyecto",
): Promise<string> {
  const dir = join(root, "projects", projectSlug, "assets");
  await mkdir(dir, { recursive: true });

  const ext = format.toLowerCase().trim() || "mp3";
  const hash = createHash("sha256")
    .update(audioBuffer)
    .digest("hex")
    .slice(0, 16);
  const fileName = `${hash}.${ext}`;
  const filePath = join(dir, fileName);

  await writeFile(filePath, audioBuffer);
  return `/projects/${projectSlug}/assets/${fileName}`;
}
