/**
 * The message the dev server sends when a project scene file is written (050/D1), shared by
 * the server plugin and the editor so both name it the same.
 */
export const SCENE_CHANGED = "lienzo:scene-changed";

export type SceneChanged = { project: string; name: string; text: string };
