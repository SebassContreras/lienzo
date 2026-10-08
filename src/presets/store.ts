import type { Element, Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";

/** Before recipes, a user preset stored the whole element. */
type LegacyPreset = { name: string; element: Element };

/** Reads a stored preset as a recipe; an old whole-element file becomes `set` on no traits. */
export function asRecipe(data: PresetRecipe | LegacyPreset): PresetRecipe {
  if ("element" in data) {
    const { id: _id, ...set } = data.element;
    return { name: data.name, kind: data.element.kind, traits: [], set };
  }
  return data;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}
async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
}

/** User presets live as recipe JSON files in `presets/`. */
export async function loadUserPresets(): Promise<PresetRecipe[]> {
  return (await loadUserPresetFiles()).map((item) => item.recipe);
}

/** User presets with the file name each is stored under (for rename, overwrite, delete). */
export async function loadUserPresetFiles(): Promise<
  { file: string; recipe: PresetRecipe }[]
> {
  const items =
    await getJson<{ name: string; data: PresetRecipe | LegacyPreset }[]>(
      "/api/presets",
    );
  return items.map((item) => ({
    file: item.name,
    recipe: asRecipe(item.data),
  }));
}

/** Writes a preset to `presets/<file>.json`; `file` defaults to its name. */
export async function saveUserPreset(
  preset: PresetRecipe,
  file = preset.name,
): Promise<void> {
  await postJson(`/api/presets?name=${encodeURIComponent(file)}`, preset);
}

/** Scenes live as JSON files in `scenes/`. */
export async function loadScenes(): Promise<{ name: string; data: Scene }[]> {
  return getJson("/api/scenes");
}

export async function saveScene(name: string, scene: Scene): Promise<void> {
  await postJson(`/api/scenes?name=${encodeURIComponent(name)}`, scene);
}

/** Uploads an image into `assets/` (named by its content hash) and returns its URL path. */
export async function uploadAsset(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) {
    throw new Error("Formato no admitido: usa PNG, JPG, SVG o WebP");
  }
  const res = await fetch(`/api/assets?ext=${ext}`, {
    method: "POST",
    body: file,
  });
  if (!res.ok) throw new Error(`/api/assets: ${res.status}`);
  return ((await res.json()) as { path: string }).path;
}

async function call(url: string, method: string): Promise<void> {
  const res = await fetch(url, { method });
  if (res.ok) return;
  const { error } = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(
    error === "name taken"
      ? "Ya existe otro con ese nombre"
      : `${url}: ${res.status}`,
  );
}

export type StoreKind = "presets" | "scenes";

/** Removes a stored preset or scene by its file name. */
export async function deleteStored(
  kind: StoreKind,
  name: string,
): Promise<void> {
  await call(`/api/${kind}?name=${encodeURIComponent(name)}`, "DELETE");
}

/** Renames a stored preset or scene; a preset's own `name` follows. */
export async function renameStored(
  kind: StoreKind,
  from: string,
  to: string,
): Promise<void> {
  await call(
    `/api/${kind}/rename?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    "POST",
  );
}
