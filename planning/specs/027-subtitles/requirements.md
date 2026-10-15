# 027 — subtitles — Requirements

## What's being built

A subtitle/caption component: an element placed on canvas that displays timed text cues
(words or phrases) synchronized with scene time `t`, supporting standard subtitle imports
(`.srt`, `.vtt`) and social media styling (karaoke word-by-word highlights, box backgrounds).

## Who it serves

Creators making reels, shorts, and social media videos that require engaging, synchronized
on-screen captions.

## Requirements

- R1@1: A `subtitles` component descriptor is registered in the component registry, offering fields for cue data, typography, colors, active word highlight color, layout, and background box/badge styling.
- R2@1: The component holds an array of timestamped cues (`start`, `end`, `text`, and optional per-word timestamps `words: [{ word, start, end }]`).
- R3@2: Subtitles render deterministically in `drawScene` at canvas time `t` constrained within the element's bounding box `(w, h)`: when a cue exceeds the box capacity, words are paginated dynamically into a synchronized active word window (2–4 words / fit lines) so text never overflows the box.
- R4@1: Standard `.srt` and `.vtt` subtitle files can be imported into the component, parsing timestamps and text into the component cues.
- R5@1: The inspector provides an interface to edit cue text and timestamps, add/remove cues, and configure text appearance and background styles.
- R6@1: At least one built-in preset recipe exists in a fitting category (e.g. reels captions / viral subtitles).

## Out of scope

- Audio transcription (speech-to-text is handled in spec 028 or external tools).
- Multi-language subtitle tracks switching during export.

## Dependencies

012, 013, 015.

## Owner split

All tasks agent.
