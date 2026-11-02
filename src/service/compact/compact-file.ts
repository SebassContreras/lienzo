import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { CompactSceneInput } from "../../model/compact.ts";
import { MAX_ASSET_BYTES } from "../assets/asset-helpers.ts";
import { fail } from "../core/registry.ts";

/**
 * Resolves and reads a compact scene JSON file (090/D1, D2).
 * Supports relative and absolute paths, enforcing a 20 MB size limit.
 * Throws ToolFailure with appropriate error codes on failure.
 */
export async function readCompactFile(
  filePath: string,
  paramName = "compactFile",
): Promise<CompactSceneInput> {
  const path = resolve(filePath);

  const size = await stat(path).then(
    (s) => s.size,
    () => -1,
  );

  if (size < 0) {
    fail("not_found", `No existe el archivo «${filePath}»`, paramName);
  }

  if (size > MAX_ASSET_BYTES) {
    fail("too_large", "Archivo demasiado grande (máx 20MB)", paramName);
  }

  const content = await readFile(path, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    fail(
      "invalid_json",
      `«${filePath}» no es un archivo JSON válido`,
      paramName,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail(
      "invalid_compact",
      `El contenido de «${filePath}» debe ser un objeto`,
      paramName,
    );
  }

  return parsed as CompactSceneInput;
}
