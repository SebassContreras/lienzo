import { describe, expect, it } from "vitest";
import { IDLE_MS, nextTurn, USER_TURN } from "./turn.ts";

const AGENT_TURN = nextTurn(USER_TURN, { type: "agentWrote", at: 1000 });

describe("joint mode turns", () => {
  it("gives the turn to the agent when it writes", () => {
    expect(AGENT_TURN.owner).toBe("agent");
  });

  it("keeps the agent's turn while it wrote less than 3 s ago", () => {
    const turn = nextTurn(AGENT_TURN, { type: "tick", at: 1000 + IDLE_MS - 1 });

    expect(turn.owner).toBe("agent");
  });

  it("gives the turn back to the user after 3 s without a write", () => {
    const turn = nextTurn(AGENT_TURN, { type: "tick", at: 1000 + IDLE_MS });

    expect(turn.owner).toBe("user");
  });

  it("restarts the wait when the agent writes again", () => {
    const again = nextTurn(AGENT_TURN, { type: "agentWrote", at: 3500 });

    const turn = nextTurn(again, { type: "tick", at: 1000 + IDLE_MS });

    expect(turn.owner).toBe("agent");
  });

  it("gives the turn back to the user at once on take-control", () => {
    const turn = nextTurn(AGENT_TURN, { type: "takeControl" });

    expect(turn.owner).toBe("user");
  });
});
