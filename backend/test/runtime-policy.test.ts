import { describe, expect, it } from "vitest";
import { defaultAgentPolicy } from "../src/policy/runtime-policy.js";

describe("runtime policy", () => {
  it("requires escalation by default", () => {
    expect(defaultAgentPolicy.escalationRequired).toBe(true);
  });
});
