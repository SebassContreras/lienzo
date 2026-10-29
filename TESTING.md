# Testing Standards & Verification Guidelines

This document governs testing philosophy, contract invariants, test partitioning, and test hygiene. AI agents must follow these rules when writing automated tests or auditing test suites. The decision behind the policy is A14 in [ARCHITECTURE.md](./ARCHITECTURE.md); engineering rules live in [ENGINEERING.md](./ENGINEERING.md).

---

## 🧪 Testing Invariants & Input Partitioning

AI agents must write deterministic tests that assert domain contracts rather than surface-level happy-path anecdotes.

### 1. Systematic Input Partitioning
Cover the observable input space systematically:
- **Valid Nominal Cases:** Typical valid inputs and expected permutations.
- **Boundary Values:** Minimum, maximum, `boundary - 1`, `boundary + 1`, and off-by-one conditions.
- **Malformed & Empty Inputs:** Empty strings, empty collections, `null` / `undefined`, and unexpected types.
- **Compound Errors:** Simultaneous invalid fields to verify error aggregation without premature crashes.

### 2. Contract Suites over Fragmented Tests
- If multiple components or services modify the same state or share validation rules, write a shared contract test suite that runs uniformly against all writers.
- Assert rules at the invariant boundary rather than duplicating tests across entry points.

### 3. Root-Cause Regressions via Equivalence Classes
- When fixing a bug, never write a test that only asserts the single reported failing payload.
- Identify the underlying missing equivalence class or violated invariant, and assert the generalized invariant across all entry points that accept that shape.

### 4. Property & State Transitions
- Assert state machine lifecycles and invariants (uniqueness, idempotency, monotonic counters, serialization/deserialization round-trips) rather than isolated static properties.

---

## 🧼 Test Hygiene & Parameterization

### 1. AAA / Given-When-Then Structure
- Organize every test into three distinct phases: **Arrange** (set up preconditions), **Act** (execute the target behavior), and **Assert** (verify observable outcomes).
- Use descriptive behavioral test names stating the expected outcome under specific conditions (e.g., `test_rejects_expired_token_with_unauthorized_status`).

### 2. Parameterized & Table-Driven Tests
- Use native test table capabilities (`test.each`, `@pytest.mark.parametrize`, Go test tables) to test matrices of inputs and boundary values compactly.
- Keep table rows readable with explicit test case descriptions.

### 3. Clean Test Bodies
- No conditional branching (`if`/`else`), ternary operators, or manual loops inside test execution blocks. Branching in tests hides unexercised paths.

### 4. Isolate & Mock at Boundaries
- **Never mock the unit under test:** Test the real component logic.
- **Mock only external boundaries:** Network requests, external third-party APIs, disk I/O, or clock/timers when non-deterministic.

---

## 🧷 Project Test Policy (Vitest)

Tests run with Vitest (`pnpm test`).

- Tests (A14, spec 082): test the contract, not the implementation. A shared rule is tested in
  every writer that applies it (one adapter per writer in `src/service/contract/`; a writer
  without one fails the suite), and every tool is tried with bad inputs derived from its schema.
  Pure logic, timing math and transformations get examples. No micro-test per Zod field and no
  test of private helpers. Name a test by the behavior, never by a spec number or a QA round, and
  keep it beside the functionality it tests. A QA finding becomes a rule in the matrix, not one
  more case. Run single files while working; run the full suite in the dedicated test task.
  The gate: `pnpm test:cov` fails when a folder falls below its coverage floor
  (`vitest.config.ts`), and `pnpm test:mutate:rules` when the rule modules' mutation score
  falls below 76.54% (082/T041); a floor is raised as tests grow, never lowered.

### QA runs of the MCP tools

- Before a QA run of the MCP tools, restart the MCP server after pulling: it runs the code
  it started with, and a stale server reports fixed bugs as open (071).
  The server's MCP `instructions` name the build (commit, `+dirty`, the time `pnpm build:cli` ran or the source started); compare the commit with
  `git rev-parse --short HEAD` (072). A QA report of "still open" counts only with that
  commit matching `HEAD`, or replayed with `pnpm lienzo`; otherwise replay it first (073). `pnpm replay [id…]` runs the replay corpus (`src/service/contract/corpus/`, 082) in a fresh process at `HEAD`; a case that passes there but fails on the MCP server means the server is stale.
- A QA run follows `docs/qa-log.md` (082): the closed list of what to check, the class of
  each finding (missing matrix cell, missing rule, text, design decision), one log line per
  finding, a corpus case for each one, and when a round ends. A round gets no spec of its own.
