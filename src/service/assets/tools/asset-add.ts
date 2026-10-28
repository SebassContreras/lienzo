import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool, fail } from "../../core/registry.ts";
import {
  ASSET_TYPES,
  looksLikeAudio,
  MAX_ASSET_BYTES,
  normalizeExtension,
  writeAsset,
} from "../asset-helpers.ts";
import { safeAssetPath } from "../asset-path.ts";
import { imageSize, isImageExtension } from "../image-header.ts";

export const assetAdd = defineTool({
  name: "asset_add",
  effects: ["asset"],
  description:
    "Copy a local file (`file`, a path on this machine) into the project's assets/, or into " +
    "`folder` inside it, named by its content hash as the editor's upload names it. Accepts " +
    "png, jpg, svg, webp, glb, mp3, wav, aac, ogg, ttf, otf, woff and woff2 up to 20 MB; an " +
    "image must decode and an audio file must start as its extension says. " +
    "Returns the `src` to use in an image, audio or 3D element; `filename` (the path inside " +
    "assets/) works too and is stored as that `src`, so asset_rename follows either.",
  input: z.object({
    project: PROJECT,
    file: z.string().min(1),
    folder: z.string().optional(),
  }),
  output: z.object({ src: z.string(), filename: z.string() }),
  async run({ project, file, folder }, ctx) {
    const pctx = await inProject(ctx, project);
    const ext = normalizeExtension(extname(file));
    if (!ASSET_TYPES[ext])
      fail("unsupported_type", `Formato no soportado: «${ext}»`, "file");
    const sub = folder ? safeAssetPath(folder.split("/")) : "";
    if (sub === undefined)
      fail("invalid_folder", `Carpeta no válida «${folder}»`, "folder");
    const path = resolve(file);
    const size = await stat(path).then(
      (s) => s.size,
      () => -1,
    );
    if (size < 0) fail("not_found", `No existe el archivo «${file}»`, "file");
    if (size > MAX_ASSET_BYTES)
      fail("too_large", "Archivo demasiado grande (máx 20MB)", "file");
    const dir = join(pctx.projects.resolvePath(project, "assets"), sub);
    const bytes = await readFile(path);
    if (isImageExtension(ext) && !imageSize(bytes))
      fail(
        "invalid_image",
        `«${file}» no es una imagen ${ext.toUpperCase()} válida (solo tiene la extensión)`,
        "file",
      );
    if (ASSET_TYPES[ext]?.startsWith("audio/") && !looksLikeAudio(bytes, ext))
      fail(
        "invalid_audio",
        `«${file}» no es un audio ${ext.toUpperCase()} válido (solo tiene la extensión)`,
        "file",
      );
    const filename = await writeAsset(dir, bytes, ext);
    const rel = sub ? `${sub}/${filename}` : filename;
    return { src: `/projects/${project}/assets/${rel}`, filename: rel };
  },
});
