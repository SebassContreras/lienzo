/** The editor's calls to the font API (045/D5, D6). */
import type { FontFile } from "../../model/font-files.ts";

async function answer<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
  return body as T;
}

/** Uploads a font file; `project` omitted = global `fonts/`. */
export async function uploadFont(
  file: File,
  font: { family: string; weight: number; project?: string },
): Promise<FontFile> {
  const q = new URLSearchParams({
    family: font.family,
    weight: String(font.weight),
    ext: file.name.split(".").pop()?.toLowerCase() ?? "",
  });
  if (font.project) q.set("project", font.project);
  return answer(
    await fetch(`/api/fonts/upload?${q}`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: await file.arrayBuffer(),
    }),
  );
}

/** Downloads a Google Fonts family through the app server (045/D6). */
export async function installFromGoogle(font: {
  family: string;
  weights: number[];
  project?: string;
}): Promise<FontFile[]> {
  return answer(
    await fetch("/api/fonts/google", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(font),
    }),
  );
}
