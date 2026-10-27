import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import type { CompactScene } from "../../model/compact.ts";
import { defaultElement, type Element, type Scene } from "../../model/model.ts";

/**
 * When a build overwrites a stored scene, keeps that scene's audio unless the compact
 * input names `audioTracks` itself (`[]` included), and says so in a notice (060/D4).
 * The stored subtitle cues go with the audio: a built `subtitles` element with no cues
 * takes them, and with none the stored element is kept.
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
  const kept = keepCues(built.elements, previous.elements);
  const cues = kept ? ` y ${kept} subtítulo(s)` : "";
  return {
    scene: {
      ...built,
      audio,
      audioTracks,
      elements: kept
        ? keptElements(built.elements, previous.elements)
        : built.elements,
    },
    notice:
      `Se conservaron ${count} pista(s) de audio${cues} de la escena existente; ` +
      "pasa `audioTracks` para reemplazarlas",
  };
}

const isSubtitles = (el: Element): el is SubtitlesEl => el.kind === "subtitles";

/** How many stored cues carry over: 0 when the build brings cues of its own. */
function keepCues(built: Element[], previous: Element[]): number {
  const stored = previous.find(isSubtitles)?.cues?.length ?? 0;
  const own = built.find(isSubtitles)?.cues;
  return own?.length && !isSampleCues(own) ? 0 : stored;
}

/** A `subtitles` element built with no `cues` holds the descriptor's sample ones. */
function isSampleCues(cues: SubtitlesEl["cues"]): boolean {
  const sample = (defaultElement("subtitles") as SubtitlesEl).cues;
  return JSON.stringify(cues) === JSON.stringify(sample);
}

function keptElements(built: Element[], previous: Element[]): Element[] {
  const stored = previous.find(isSubtitles) as SubtitlesEl;
  const index = built.findIndex(isSubtitles);
  if (index < 0) return [...built, stored];
  return built.map((el, i) =>
    i === index ? { ...(el as SubtitlesEl), cues: stored.cues } : el,
  );
}
