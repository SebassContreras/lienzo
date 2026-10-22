# 049 — image-trim-service — Design

## Approach

- D1@1 (implements R1, R2, R4): A port `ImageProbe = { opaqueBounds(src: string): Promise<Crop | undefined>; dispose() }`, taking the URL the page loads (the tool resolves a project asset reference to its route), in `src/service/image-probe.ts` is added to `Ctx` as `images`; tools depend on the port, tests inject a fake.
- D2@1 (implements R1, R2): The adapter `createBrowserImageProbe` uses the `?render` page through `lazyRenderPage`, the lazy session the renderer already had, now shared (opened on first use, closed by `ctx.dispose`) and, in the page, decodes the asset, reads its pixels with `getImageData` and runs the shared `alphaBounds` (048/D2) through `window.lienzoOpaqueBounds` _(standard: Playwright page.evaluate — https://playwright.dev/docs/evaluating)_; no image library is added.
- D3@1 (implements R1, R4): `src/service/tools/image-trim.ts` opens the scene, finds the image by `id`, asks the probe, applies `applyCrop` (048/D3) and saves; an undecodable or empty image fails with `image_unreadable` / `image_empty` on `id` before any save.
- D4@1 (implements R2): `element_add` with `trim: true` on an image calls the same trim step from D3 before saving; on failure the element is not added.
- D5@1 (implements R3): `image_trim` is registered in `src/service/tools/index.ts`, the list both the MCP server and the CLI read; `AGENTS.md` and `README.md` list it.

## Deliverables

- `src/service/image-probe.ts`, `src/service/ctx.ts`
- `src/service/tools/image-trim.ts`, `src/service/tools/element-add.ts`, `src/service/tools/index.ts`
- `src/service/tools/image-trim.test.ts`, `AGENTS.md`, `README.md`

## Sequencing

- Needs 048 done (`crop`, `alphaBounds`, `applyCrop`). D1 → D2 → D3 → D4 → D5.

## Trade-offs

- Decoding in the headless browser (D2). Pros: no native image dependency; the same decoder and the same `alphaBounds` as the editor, so both trims match. Cons: the first call starts a browser (a few seconds). Mitigation: started lazily and reused for later calls; tests use a fake probe and one real-browser test like `renderer.test.ts`.
- A port instead of calling the page from the tool (D1). Pros: the tool is testable without a browser and the decoder can be swapped (e.g. for a PNG library). Cons: one small interface. Mitigation: a single method, one adapter (principle 1 allows it: a test requires it).
- A separate browser session from the renderer (D2). Pros: the renderer stays untouched (SRP). Cons: a scene that is trimmed and exported in one run opens two pages. Mitigation: both close on `ctx.dispose`; share the session only if this shows up as slow.
- A trim step shared by two tools (D3, D4). Pros: one behaviour, one place to fix. Cons: `element_add` depends on the probe. Mitigation: only when `trim` is true.
