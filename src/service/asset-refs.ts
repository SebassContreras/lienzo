/**
 * Asset references inside scene data (063/D6). Any string naming a file under `assets/`
 * (`/projects/<slug>/assets/…`, `/api/projects/<slug>/assets/…`, `assets/…`) is a reference,
 * whatever field holds it — image and 3D `src`, audio `assetId`, symbols and group children
 * alike — so a new kind needs no change here.
 */
import { safeAssetPath } from "./asset-path.ts";

/** Anchored, so a project whose slug is itself `assets` is not mistaken for the folder. */
const UNDER_ASSETS = /^\/?(?:(?:api\/)?projects\/[^/]+\/)?assets\//;

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
