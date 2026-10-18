import { type AnimPreset, parseAnimPreset } from "../model/anim-preset.ts";
import type { Element, Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { parseVoicePreset, type VoicePreset } from "../model/voice-preset.ts";
import { oneLine } from "./json-files.ts";

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

/** Animation presets in `presets/animations/`; files that fail the schema are left out. */
export async function loadAnimPresetFiles(): Promise<
  { file: string; preset: AnimPreset }[]
> {
  const items =
    await getJson<{ name: string; data: unknown }[]>("/api/animations");
  return items.flatMap((item) => {
    const parsed = parseAnimPreset(item.data);
    return parsed.ok ? [{ file: item.name, preset: parsed.value }] : [];
  });
}

/** `data` as an animation preset, or an error naming `what`. */
export function toAnimPreset(data: unknown, what: string): AnimPreset {
  const parsed = parseAnimPreset(data);
  if (!parsed.ok)
    throw new Error(
      `${what} no es una animación válida: ${oneLine(parsed.error)}`,
    );
  return parsed.value;
}

/**
 * Writes an animation preset to `presets/animations/<file>.json`, validated first: an
 * invalid one rejects and nothing is written (019/D11).
 */
export async function saveAnimPreset(
  data: unknown,
  file?: string,
): Promise<void> {
  const preset = toAnimPreset(data, `«${file ?? "la animación"}»`);
  const name = file ?? preset.name;
  await postJson(`/api/animations?name=${encodeURIComponent(name)}`, preset);
}

/** Voice presets in `presets/voices/` (037/D3, R4); files that fail the schema are left out. */
export async function loadVoicePresetFiles(): Promise<
  { file: string; preset: VoicePreset }[]
> {
  const items = await getJson<{ name: string; data: unknown }[]>("/api/voices");
  return items.flatMap((item) => {
    const parsed = parseVoicePreset(item.data);
    return parsed.ok ? [{ file: item.name, preset: parsed.value }] : [];
  });
}

/** `data` as a voice preset, or an error naming `what`. */
export function toVoicePreset(data: unknown, what: string): VoicePreset {
  const parsed = parseVoicePreset(data);
  if (!parsed.ok)
    throw new Error(
      `${what} no es un preset de voz válido: ${oneLine(parsed.error)}`,
    );
  return parsed.value;
}

/**
 * Writes a voice preset to `presets/voices/<file>.json`, validated first.
 */
export async function saveVoicePreset(
  data: unknown,
  file?: string,
): Promise<void> {
  const preset = toVoicePreset(data, `«${file ?? "el preset de voz"}»`);
  const name = file ?? preset.name;
  await postJson(`/api/voices?name=${encodeURIComponent(name)}`, preset);
}

/** Scenes live as JSON files in `projects/<slug>/scenes/`. */
export async function loadScenes(
  projectSlug = "mi-proyecto",
): Promise<{ name: string; data: Scene }[]> {
  return getJson(`/api/projects/${encodeURIComponent(projectSlug)}/scenes`);
}

export async function saveScene(
  name: string,
  scene: Scene,
  projectSlug = "mi-proyecto",
): Promise<void> {
  await postJson(
    `/api/projects/${encodeURIComponent(projectSlug)}/scenes?name=${encodeURIComponent(name)}`,
    scene,
  );
}

const IMAGE_FILES = {
  exts: ["png", "jpg", "jpeg", "svg", "webp"],
  error: "Formato no admitido: usa PNG, JPG, SVG o WebP",
};

/** What a 3D element's model may be: a GLTF binary. */
export const MODEL_FILES = {
  exts: ["glb"],
  error: "Formato no admitido: usa un modelo .glb",
};

/** Audio files for scene audio tracks (.mp3, .wav, .aac, .ogg). */
export const AUDIO_FILES = {
  exts: ["mp3", "wav", "aac", "ogg"],
  error: "Formato no admitido: usa MP3, WAV, AAC u OGG",
};

/**
 * Uploads a file into `assets/` (named by its content hash) and returns its URL path; an
 * image unless `accepted` says otherwise.
 */
export async function uploadAsset(
  file: File,
  accepted = IMAGE_FILES,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!accepted.exts.includes(ext)) throw new Error(accepted.error);
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

export type StoreKind = "presets" | "animations" | "voices" | "scenes";

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
