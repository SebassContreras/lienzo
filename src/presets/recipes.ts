import type { PresetRecipe } from "../model/preset.ts";

/**
 * The built-in recipes in `presets/built-in/`, bundled at build time so they are available
 * synchronously (library, demo scene, tests). File names start with a number that sets
 * their order in the library.
 */
const files = import.meta.glob<PresetRecipe>("../../presets/built-in/*.json", {
  eager: true,
  import: "default",
});

const ALL: PresetRecipe[] = Object.keys(files)
  .sort()
  .map((path) => files[path] as PresetRecipe);

/** Built-in element presets. */
export const BUILT_IN_RECIPES = ALL.filter((r) => r.kind !== "background");

/** Built-in background presets. */
export const BUILT_IN_BACKGROUNDS = ALL.filter((r) => r.kind === "background");
