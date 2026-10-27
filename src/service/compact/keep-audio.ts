import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import type { CompactScene } from "../../model/compact.ts";
import type { Element, Scene } from "../../model/model.ts";

/**
 * When a build overwrites a stored scene, keeps that scene's audio unless the compact
 * input names `audioTracks` itself (`[]` included), and says so in a notice (060/D4).
 * The stored subtitle cues go with the audio, unless the input gives a `subtitles`
 * element `cues` of its own: the built one takes them, and with none the stored one is kept.
 * Pure: audio is usually generated after the visuals, so a redesign shouldn't erase it.
 */
export function keepAudio(
  built: Scene,
  previous: Scene | undefined,
  compact: Partial<Pick<CompactScene, "audioTracks" | "elements">>,
): { scene: Scene; notice?: string } {
  if (!previous || compact.audioTracks !== undefined) return { scene: built };
  const { audio, audioTracks } = previous;
  if (!audio && !audioTracks?.length) return { scene: built };
  const count = audioTracks?.length ?? 1;
  const stored = previous.elements.find(isSubtitles);
  const kept = stored?.cues.length && !bringsCues(compact) ? stored : undefined;
  const cues = kept ? ` y ${kept.cues.length} subtítulo(s)` : "";
  return {
    scene: {
      ...built,
      audio,
      audioTracks,
      elements: kept ? withCues(built.elements, kept) : built.elements,
    },
    notice:
      `Se conservaron ${count} pista(s) de audio${cues} de la escena existente; ` +
      "pasa `audioTracks` para reemplazarlas",
  };
}

const isSubtitles = (el: Element): el is SubtitlesEl => el.kind === "subtitles";

/** Whether the compact input gives a `subtitles` element cues of its own. */
function bringsCues(compact: Partial<Pick<CompactScene, "elements">>): boolean {
  return (compact.elements ?? []).some(
    (el) => el.kind === "subtitles" && "cues" in el && el.cues !== undefined,
  );
}

/** Puts the stored cues on the built `subtitles` element, or adds the stored one. */
function withCues(built: Element[], stored: SubtitlesEl): Element[] {
  const index = built.findIndex(isSubtitles);
  if (index < 0) return [...built, stored];
  return built.map((el, i) =>
    i === index ? { ...(el as SubtitlesEl), cues: stored.cues } : el,
  );
}
