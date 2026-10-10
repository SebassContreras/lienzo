# 018 — more-animations — Tasks

- [ ] T001 [agent] [status:todo] Move the kinds into the `src/animations/` registry by family; `anim.ts` keeps the composition
      covers: D6@1, A24@1
- [ ] T002 [agent] [status:todo] Rotation, skew and per-axis scale in `AnimState` and `withTransform`
      covers: D7@1
- [ ] T003 [agent] [status:todo] Attention animations
      covers: D6@1
- [ ] T004 [agent] [status:todo] Entrance animations with direction; exits reuse them
      covers: D6@1
- [ ] T005 [agent] [status:todo] Highlight glow
      covers: D6@1
- [ ] T006 [agent] [status:todo] Text reveal by char, word or line, and typewriter
      covers: D8@1
- [ ] T007 [agent] [status:todo] Group stagger in `group/draw.ts`
      covers: D9@1
- [ ] T008 [agent] [status:todo] Animation picker with live preview and default slots
      covers: D10@1
- [ ] T009 [agent] [status:todo] Test over the whole registry: deterministic, attention kinds close their loop, entrances end at rest, exits end hidden, old kinds unchanged, stagger offsets, text reveal
      covers: R1@1, R2@1, R3@1, R5@1, R9@1, R10@1
      kind: test
- [ ] T010 [agent] [status:todo] Test in the browser: pick and preview animations on several kinds
      covers: R8@1
      kind: test
