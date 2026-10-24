# 062 — editor-scene-controls — Tasks

- [ ] T001 [agent] [status:todo] Move the shot rules of `shot_set` into `setShot`/`removeShot` in `src/model/shots.ts` and call them from the tool
      covers: D1@1
- [ ] T002 [agent] [status:todo] Test `shots.ts`: create, update, camera merge, order by start, `end < start` and removing a missing shot fail
      covers: R1@1, R5@1
      kind: test
- [ ] T003 [agent] [status:todo] "Tomas" section in the scene inspector (`src/editor/scene/shots-section.tsx`)
      covers: D2@1
- [ ] T004 [agent] [status:todo] "Toma" select for top-level elements in the element inspector
      covers: D2@1
- [ ] T005 [agent] [status:todo] `symbolFromGroup` and `replaceWithUse` in `src/model/symbols.ts`
      covers: D3@1
- [ ] T006 [agent] [status:todo] Test `symbols.ts`: relative children, same box for the instance, edited children reach every `use`
      covers: R2@1
      kind: test
- [ ] T007 [agent] [status:todo] "Símbolos" section: list and "Crear símbolo desde el grupo"
      covers: D3@1
- [ ] T008 [agent] [status:todo] `symbol-select` widget for `use.symbol`
      covers: D3@1
- [ ] T009 [agent] [status:todo] "Editar símbolo" mode with banner and "Volver"
      covers: D4@1
- [ ] T010 [agent] [status:todo] `repeat` and `until` controls in each track lane header
      covers: D5@1
- [ ] T011 [agent] [status:todo] `origin` widget (anchor grid plus x, y)
      covers: D6@1
- [ ] T012 [agent] [status:todo] Equivalence test: editor changes give the same JSON as `shot_set`, `keyframe_set` and `element_update`
      covers: R5@1
      kind: test
- [ ] T013 [agent] [status:todo] Browser check (playwright-core + Edge) of shots, symbols, track repeat, origin and undo
      covers: R1@1, R2@1, R3@1, R4@1
      kind: test
