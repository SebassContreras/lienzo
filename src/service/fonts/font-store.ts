/**
 * Font files on disk (045/D1, D5): the global `fonts/` folder and each project's `fonts/`.
 * The only module that reads or writes them.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type FontFile,
  isFontFamilyName,
  parseFontFile,
} from "../../model/font-files.ts";
import { ProjectSlugSchema } from "../../model/project.ts";

/** `undefined` = the global folder; a slug = that project's folder. */
export type FontScope = string | undefined;

export type FontStore = {
  list(project?: FontScope): Promise<FontFile[]>;
  read(file: string, project?: FontScope): Promise<Buffer | undefined>;
  write(file: string, data: Buffer, project?: FontScope): Promise<void>;
};

/** A stored font name is one plain file `Family-Weight.ext`, never a path. */
function checkedFile(file: string): FontFile {
  const parsed = parseFontFile(file);
  if (!parsed || /[/]/.test(file) || !isFontFamilyName(parsed.family)) {
    throw new Error(`Nombre de fuente no válido: «${file}»`);
  }
  return parsed;
}

export function createFontStore(root: string): FontStore {
  const dirOf = (project?: FontScope) =>
    project === undefined
      ? join(root, "fonts")
      : join(root, "projects", ProjectSlugSchema.parse(project), "fonts");

  return {
    async list(project) {
      const files = await readdir(dirOf(project)).catch(() => [] as string[]);
      return files
        .map(parseFontFile)
        .filter((f): f is FontFile => f !== undefined)
        .sort(
          (a, b) => a.family.localeCompare(b.family) || a.weight - b.weight,
        );
    },
    async read(file, project) {
      checkedFile(file);
      return readFile(join(dirOf(project), file)).catch(() => undefined);
    },
    async write(file, data, project) {
      checkedFile(file);
      const dir = dirOf(project);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, file), data);
    },
  };
}
