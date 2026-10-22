// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultScene, type Scene } from "../../model/model.ts";
import type { SceneChanged } from "../../model/scene-changed.ts";
import type { SceneEvents } from "./scene-events.ts";
import { type JointModeOptions, useJointMode } from "./use-joint-mode.ts";

/** The dev server's socket (the boundary): `emit` plays a written scene file. */
function fakeEvents() {
  let listener: ((c: SceneChanged) => void) | undefined;
  const events: SceneEvents = {
    on(cb) {
      listener = cb;
      return () => {
        listener = undefined;
      };
    },
  };
  const emit = (name: string, scene: Scene | string) =>
    act(() =>
      listener?.({
        project: "acme",
        name,
        text: typeof scene === "string" ? scene : JSON.stringify(scene),
      }),
    );
  return { events, emit };
}

function setup(overrides: Partial<JointModeOptions> = {}) {
  const { events, emit } = fakeEvents();
  const options: JointModeOptions = {
    enabled: true,
    events,
    project: "acme",
    sceneName: "post",
    scene: defaultScene(),
    onAgentScene: vi.fn(),
    onAgentOpen: vi.fn(),
    save: vi.fn(async () => {}),
    ...overrides,
  };
  const hook = renderHook((props: JointModeOptions) => useJointMode(props), {
    initialProps: options,
  });
  const edit = (scene: Scene) =>
    act(() => hook.rerender({ ...options, scene }));
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  return { hook, options, emit, edit, wait };
}

const agentScene = () => ({ ...defaultScene(), duration: 9 });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("joint mode", () => {
  it("shows the agent's version of the open scene and locks the editor", () => {
    const { hook, options, emit } = setup();

    emit("post", agentScene());

    expect(options.onAgentScene).toHaveBeenCalledWith(agentScene());
    expect(hook.result.current.locked).toBe(true);
  });

  it("opens another scene the agent writes", () => {
    const { options, emit } = setup();

    emit("otra", agentScene());

    expect(options.onAgentOpen).toHaveBeenCalledWith("otra", agentScene());
  });

  it("unlocks 3 s after the agent's last write", () => {
    const { hook, emit, wait } = setup();
    emit("post", agentScene());

    wait(3500);

    expect(hook.result.current.locked).toBe(false);
  });

  it("unlocks at once on take-control", () => {
    const { hook, emit } = setup();
    emit("post", agentScene());

    act(() => hook.result.current.takeControl());

    expect(hook.result.current.locked).toBe(false);
  });

  it("writes the user's change to the scene file after the debounce", () => {
    const { options, edit, wait } = setup();
    const changed = { ...defaultScene(), duration: 5 };

    edit(changed);
    wait(400);

    expect(options.save).toHaveBeenCalledWith("post", changed);
  });

  it("writes nothing during the agent's turn", () => {
    const { options, emit, edit, wait } = setup();
    emit("post", agentScene());

    edit({ ...defaultScene(), duration: 5 });
    wait(400);

    expect(options.save).not.toHaveBeenCalled();
  });

  it("ignores the editor's own write, which never locks it", () => {
    const { hook, options, edit, wait, emit } = setup();
    const changed = { ...defaultScene(), duration: 5 };
    edit(changed);
    wait(400);

    emit("post", changed);

    expect(hook.result.current.locked).toBe(false);
    expect(options.onAgentScene).not.toHaveBeenCalled();
  });

  it("reports an invalid file and does not write over it", () => {
    const { hook, options, emit, edit, wait } = setup();
    emit("post", "{ half written");
    wait(3500);

    edit({ ...defaultScene(), duration: 5 });
    wait(400);

    expect(hook.result.current.invalid).toBeDefined();
    expect(options.save).not.toHaveBeenCalled();
  });

  it("does nothing with the mode off", () => {
    const { hook, options, emit, edit, wait } = setup({ enabled: false });

    emit("post", agentScene());
    edit({ ...defaultScene(), duration: 5 });
    wait(400);

    expect(hook.result.current.locked).toBe(false);
    expect(options.onAgentScene).not.toHaveBeenCalled();
    expect(options.save).not.toHaveBeenCalled();
  });
});
