import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Scene } from "../../model/model.ts";
import { incomingScene } from "./incoming.ts";
import type { SceneEvents } from "./scene-events.ts";
import { nextTurn, USER_TURN } from "./turn.ts";

/** How often the agent's turn is checked for the idle timeout. */
const TICK_MS = 500;
/** How long after the user's last change the scene is written (050/D5). */
const WRITE_DELAY_MS = 400;

export type JointModeOptions = {
  enabled: boolean;
  /** The dev server's scene events; undefined outside `pnpm dev`. */
  events: SceneEvents | undefined;
  project: string;
  /** The open scene's file name; undefined for an unsaved scene, which is never written. */
  sceneName: string | undefined;
  scene: Scene;
  /** Shows the agent's version of the open scene, as one undo step. */
  onAgentScene: (scene: Scene) => void;
  /** Opens another scene the agent wrote. */
  onAgentOpen: (name: string, scene: Scene) => void;
  /** Writes the user's version of the open scene to its file. */
  save: (name: string, scene: Scene) => Promise<void>;
};

/**
 * Joint mode (050/D7): applies the scenes the agent writes and hands the turn over (D3,
 * D4), and in the user's turn writes their changes back (D5). Does nothing when disabled.
 */
export function useJointMode({
  enabled,
  events,
  project,
  sceneName,
  scene,
  onAgentScene,
  onAgentOpen,
  save,
}: JointModeOptions) {
  const [turn, dispatch] = useReducer(nextTurn, USER_TURN);
  const [invalid, setInvalid] = useState<string>();
  /** `JSON.stringify` of the scene last written or received, to skip echoes. */
  const lastWritten = useRef<string | undefined>(undefined);
  const latest = useRef({ sceneName, onAgentScene, onAgentOpen });
  latest.current = { sceneName, onAgentScene, onAgentOpen };

  const active = enabled && events !== undefined;

  // the agent's writes
  useEffect(() => {
    if (!active || !events) return;
    return events.on((change) => {
      if (change.project !== project) return;
      const incoming = incomingScene(change.text, lastWritten.current);
      if (incoming.kind === "own") return;
      dispatch({ type: "agentWrote", at: Date.now() });
      if (incoming.kind === "invalid") {
        setInvalid(incoming.error);
        return;
      }
      setInvalid(undefined);
      lastWritten.current = JSON.stringify(incoming.scene);
      const { sceneName: open, onAgentScene, onAgentOpen } = latest.current;
      if (change.name === open) onAgentScene(incoming.scene);
      else onAgentOpen(change.name, incoming.scene);
    });
  }, [active, events, project]);

  // the agent's turn ends after it stays quiet
  useEffect(() => {
    if (turn.owner !== "agent") return;
    const id = setInterval(
      () => dispatch({ type: "tick", at: Date.now() }),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [turn.owner]);

  // the user's changes, written back
  useEffect(() => {
    if (!active || turn.owner !== "user" || !sceneName || invalid) return;
    const json = JSON.stringify(scene);
    if (json === lastWritten.current) return;
    const id = setTimeout(() => {
      lastWritten.current = json;
      void save(sceneName, scene);
    }, WRITE_DELAY_MS);
    return () => clearTimeout(id);
  }, [active, turn.owner, sceneName, invalid, scene, save]);

  // turning the mode off forgets the session
  useEffect(() => {
    if (active) return;
    dispatch({ type: "takeControl" });
    setInvalid(undefined);
    lastWritten.current = undefined;
  }, [active]);

  const takeControl = useCallback(() => dispatch({ type: "takeControl" }), []);

  return {
    /** True while the agent owns the turn: the editor must not change the scene. */
    locked: active && turn.owner === "agent",
    /** Why nothing is written: the file on disk is not a valid scene (R7). */
    invalid: active ? invalid : undefined,
    takeControl,
  };
}
