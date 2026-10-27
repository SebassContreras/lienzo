/**
 * Asset references inside scene data (063/D6). Any string naming a file under `assets/`
 * (`/projects/<slug>/assets/…`, `/api/projects/<slug>/assets/…`, `assets/…`) is a reference,
 * whatever field holds it — image and 3D `src`, audio `assetId`, symbols and group children
 * alike — so a new kind needs no change here.
 */
import { descriptorOf } from "../components/index.ts";
import type { Element, Scene } from "../model/model.ts";
import { safeAssetPath, ASSETS_PREFIX as UNDER_ASSETS } from "./asset-path.ts";

/** The path under `assets/` that `ref` names, or undefined when it names none. */
function assetPathOf(ref: string): string | undefined {
  const match = UNDER_ASSETS.exec(ref);
  return match
    ? safeAssetPath(ref.slice(match[0].length).split("/"))
    : undefined;
}

/** `data` with every reference to `from` pointing at `to`; the rest is copied untouched. */
export function renameAssetRefs(
  data: unknown,
  from: string,
  to: string,
): unknown {
  if (typeof data === "string") {
    if (assetPathOf(data) !== from) return data;
    return `${UNDER_ASSETS.exec(data)?.[0] ?? ""}${to}`;
  }
  if (Array.isArray(data)) return data.map((v) => renameAssetRefs(v, from, to));
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, renameAssetRefs(v, from, to)]),
    );
  }
  return data;
}

/** Whether `data` holds any reference to the asset at `path`. */
export function usesAsset(data: unknown, path: string): boolean {
  if (typeof data === "string") return assetPathOf(data) === path;
  if (Array.isArray(data)) return data.some((v) => usesAsset(v, path));
  if (typeof data === "object" && data !== null)
    return Object.values(data).some((v) => usesAsset(v, path));
  return false;
}

/** References that are not project files: web and inline images. */
export const EXTERNAL_REF = /^(?:https?:|data:|blob:)/i;

/** Whether `v` is a bare reference to a project file (`logos/x.png`, `0d80….mp3`). */
const isBare = (v: string) =>
  !EXTERNAL_REF.test(v) && !v.startsWith("/") && !UNDER_ASSETS.test(v);

/** `ref` as `/projects/<project>/assets/<ref>` when bare, else as given (074/D5). */
export const canonicalRef = (ref: string, project: string) =>
  isBare(ref) ? `/projects/${project}/assets/${ref}` : ref;

/**
 * `el` with each asset reference its kind names (`assets(el)`) written as
 * `/projects/<project>/assets/<path>` when given bare (`logos/x.png`, as `asset_add` returns
 * in `filename`), so renames and deletes find it (074/D5). Other values are kept as given.
 */
export function withCanonicalAssets(el: Element, project: string): Element {
  const refs = new Set(descriptorOf(el.kind)?.assets?.(el as never) ?? []);
  const bare = (v: unknown): v is string =>
    typeof v === "string" && refs.has(v) && isBare(v);
  if (![...Object.values(el)].some(bare)) return el;
  return Object.fromEntries(
    Object.entries(el).map(([k, v]) => [
      k,
      bare(v) ? canonicalRef(v, project) : v,
    ]),
  ) as Element;
}

/**
 * `scene` with its audio (`audio.assetId`, each `audioTracks[].assetId`) in the same form
 * (080/D3): the player and the export fetch the ref as a URL, so a bare one loads nothing.
 */
export function withCanonicalAudio(scene: Scene, project: string): Scene {
  return {
    ...scene,
    ...(scene.audio
      ? {
          audio: {
            ...scene.audio,
            assetId: canonicalRef(scene.audio.assetId, project),
          },
        }
      : {}),
    ...(scene.audioTracks
      ? {
          audioTracks: scene.audioTracks.map((t) => ({
            ...t,
            assetId: canonicalRef(t.assetId, project),
          })),
        }
      : {}),
  };
}

/** The audio refs of `scene`: `audio` first, then each track's. */
export const audioRefs = (scene: Scene | undefined): string[] => [
  ...(scene?.audio ? [scene.audio.assetId] : []),
  ...(scene?.audioTracks ?? []).map((t) => t.assetId),
];
