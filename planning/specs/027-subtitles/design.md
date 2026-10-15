# 027 — subtitles — Design

## Approach

- D1@1 (implements R1, R2): A `subtitles` component descriptor (`src/components/subtitles/descriptor.ts`) is registered in `src/components/index.ts`, defining fields for cue list (`cues: SubtitleCue[]`), typography (font, size, line height, weight), colors (text color, active word highlight color), layout (alignment, max width), and background badge/box styling (padding, corner radius, background color).
- D2@1 (implements R3): The component drawing function (`src/components/subtitles/draw.ts`) renders deterministically at scene time `t` using a pure helper (`src/engine/subtitles/cue-timing.ts`) to locate the active cue and calculate word-level karaoke progress when `words` timestamps are present.
- D3@1 (implements R4): Pure parser modules for SRT (`src/engine/subtitles/parsers/srt.ts`) and WebVTT (`src/engine/subtitles/parsers/vtt.ts`) parse file strings into standardized domain `SubtitleCue` models, handling timestamp formats (`00:00:00,000` and `00:00:00.000`) and optional word-level tags (`<00:00.000>`).
- D4@1 (implements R5): The component inspector integrates a dedicated cues editor widget (`src/editor/widgets/cues-editor.tsx`) to view, add, edit, or delete cues and import `.srt` / `.vtt` files directly.
- D5@1 (implements R6): A built-in preset recipe (`presets/built-in/viral-subtitles.json`) is added under the `subtitles` category with modern reels/shorts typography, high-contrast karaoke word highlights, and a rounded pill background.

## Trade-offs & Mitigations

- **Decision:** Lightweight in-house SRT/VTT parser functions vs external npm parser library.
  - *Pros:* Zero external runtime dependencies (keeping bundle small and adhering to A18); pure functions that run seamlessly in browser and Node (CLI/MCP).
  - *Cons:* Must robustly support varying timestamp delimiters and line breaks (`\r\n` vs `\n`).
  - *Mitigation:* Explicit test matrix covering SRT, VTT, millisecond vs comma separators, BOM characters, and malformed cue lines.
- **Decision:** Word-by-word karaoke rendered via Canvas 2D text measurement (`ctx.measureText`).
  - *Pros:* Deterministic rendering across preview and headless video export without layout thrashing.
  - *Cons:* Requires precise per-word position tracking during line wrapping.
  - *Mitigation:* Encapsulate word layout calculation into a pure layout helper function (`src/engine/subtitles/layout.ts`).

## Deliverables

- `src/components/subtitles/descriptor.ts`: Component field definitions and registration.
- `src/components/subtitles/draw.ts`: Deterministic Canvas 2D draw function with active word highlighting.
- `src/engine/subtitles/cue-timing.ts`: Pure helper for active cue and active word resolution.
- `src/engine/subtitles/layout.ts`: Word wrapping and line layout computation.
- `src/engine/subtitles/parsers/srt.ts`: Pure SRT parser.
- `src/engine/subtitles/parsers/vtt.ts`: Pure WebVTT parser.
- `src/editor/widgets/cues-editor.tsx`: Cues editor UI in inspector.
- `presets/built-in/viral-subtitles.json`: Built-in subtitle preset recipe.
- Unit tests: `src/engine/subtitles/parsers.test.ts`, `src/engine/subtitles/cue-timing.test.ts`.

## Sequencing

1. Cue types & pure parsers (SRT / VTT) with tests (T001, T002).
2. Layout & cue timing resolution helpers (T003).
3. Subtitles component descriptor & draw function (T004).
4. Inspector cues editor widget (T005).
5. Built-in preset recipe & integration test suite (T006, T007).
