import type { CompactScene } from "../../model/compact.ts";
import type { Scene } from "../../model/model.ts";

/**
 * When a build overwrites a stored scene, keeps that scene's audio unless the compact
 * input names `audioTracks` itself (`[]` included), and says so in a notice (060/D4).
 * Pure: audio is usually generated after the visuals, so a redesign shouldn't erase it.
 */
export function keepAudio(
  built: Scene,
  previous: Scene | undefined,
  compact: Pick<CompactScene, "audioTracks">,
): { scene: Scene; notice?: string } {
  if (!previous || compact.audioTracks !== undefined) return { scene: built };
  const { audio, audioTracks } = previous;
  if (!audio && !audioTracks?.length) return { scene: built };
  const count = audioTracks?.length ?? 1;
  return {
    scene: { ...built, audio, audioTracks },
    notice:
      `Se conservaron ${count} pista(s) de audio de la escena existente; ` +
      "pasa `audioTracks` para reemplazarlas",
  };
}
