# UI/UX Design & Style Guidelines

This document governs the visual UI/UX conventions of the Lienzo **editor** (the React app): design tokens, component states and accessibility. AI agents must follow it when implementing screens or editor components. It does not describe the posts a user makes (those take their look from each project's brand guide in `projects/<project>/project.json`) nor the tool interface used by the CLI and MCP server (see [ARCHITECTURE.md](./ARCHITECTURE.md), A20, and [ENGINEERING.md](./ENGINEERING.md)).

The source of truth for every value below is `src/styles.css`; if this document and the file disagree, fix whichever is wrong in the same change.

---

## 🎨 Visual & UI/UX Standards

### 1. Design Token Strategy
- **Tokens over Raw Values:** use the CSS variables declared on `:root` in `src/styles.css`; add a new variable instead of repeating a new hex code.
- **Theme:** dark only (`color-scheme: dark`).
- **Color tokens:**
  - `--bg` `#0b0d12`: page background, inputs.
  - `--panel` `#12151c` and `--panel-2` `#181c25`: panels, top bar, buttons.
  - `--line` `#242a36`: borders and separators.
  - `--text` `#e5e7eb`: primary text.
  - `--muted` `#8b93a3`: secondary text, placeholders.
  - `--accent` `#38bdf8`: highlights.
  - Primary button: background `#0369a1`, border `#0284c7` (`button.primary`).
- **Typography:** Inter (bundled with `@fontsource/inter`, A12), falling back to `system-ui, sans-serif`; base size 13px. Sizes in use are 10px, 11px, 12px, 13px and 14px; labels and secondary text are 11–12px.
- **Radius:** 4px for small controls, 5px for inputs, 6px for buttons, 999px for pills.
- **Spacing:** there is no formal scale; reuse the paddings and gaps of the neighboring component (typically 2–14px) instead of introducing new values.

### 2. Component Hierarchy & Layout
- **Shell:** one CSS grid, `270px 1fr 300px` columns under a 48px top bar: left sidebar (project tabs), center stage, right inspector.
- **Generated inspector:** the element inspector is generated from the component descriptors (A23), so a new field gets its control from its descriptor; a control the field types do not cover is a `custom` field or a widget in `WIDGETS` (`src/editor/field-editor.tsx`), see [ENGINEERING.md](./ENGINEERING.md).
- **Composition over inheritance:** build composite editor components from the existing primitives in `src/editor/widgets/`.
- **State feedback:** buttons declare these states today:
  - `default`: `--panel-2` background, `--line` border.
  - `hover`: border `#3a4252` (`button:hover:not(:disabled)`).
  - `disabled`: opacity 0.4 and default cursor.
  - `primary`: the blue variant above.
  - Interactive controls added from now on also declare `focus` (visible focus ring) and, when work is asynchronous, `loading` (non-interactive).

### 3. Accessibility (A11y)
- **Contrast:** keep WCAG AA ratios (4.5:1 for normal text, 3:1 for large text) when choosing colors; `--muted` on `--panel` is the pair to check before using it for important text.
- **Keyboard Navigation:** interactive elements must be focusable with Tab and operable with Enter/Space.
- **Semantics:** use `<button>`, `<select>`, `<input>` and similar native elements instead of `<div>`s with click handlers.
- **Screen Readers:** icon-only or unlabeled controls carry an `aria-label` in Spanish, as the editor already does (for example `aria-label="Familia"`).

### 4. Copy, Tone & Microcopy
- **Language:** all UI text is Spanish; the document is `lang="es"` (A16). Code, comments and docs stay English.
- **Action-Oriented Labels:** button labels are imperative verbs.
- **Clear Error Messages:** state what happened and how to fix it; no cryptic codes. Tool failures already list the valid options (see `RULES` in `src/mcp/server.ts`).

---

## ⚠️ Known Gaps (open, not rules)

- `src/styles.css` uses `var(--fg)` in three places (lines 945, 1012, 1083) but only `--text` is declared, so those rules inherit their color instead of using a token.
- There is no `:focus-visible` style, and one rule sets `outline: none` (the keyframe track list, line 825), so keyboard focus is not visibly marked.
- 18 distinct raw hex codes remain in the file beside the tokens.
