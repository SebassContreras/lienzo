import type { Scene } from "../../model/model.ts";
import { parseScene } from "../../model/schema.ts";

export type Incoming =
  | { kind: "own" }
  | { kind: "invalid"; error: string }
  | { kind: "scene"; scene: Scene };

/**
 * What a scene file written on disk means for the editor (050/D4): `own` when it holds the
 * scene the editor itself last wrote (`lastWritten`, its `JSON.stringify`; the file's
 * formatting does not matter), `invalid` when it is not a valid scene, else the scene.
 */
export function incomingScene(
  text: string,
  lastWritten: string | undefined,
): Incoming {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { kind: "invalid", error: String(error) };
  }
  if (JSON.stringify(data) === lastWritten) return { kind: "own" };
  const parsed = parseScene(data);
  return parsed.ok
    ? { kind: "scene", scene: parsed.value }
    : { kind: "invalid", error: parsed.error };
}
