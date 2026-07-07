import { describe, expect, it } from "vitest";
import { parseProposedActionIdFromEffects } from "../src/chain/tx.js";

describe("parseProposedActionIdFromEffects", () => {
  it("derives action_id from PolicyGuard next_action_id U32 write", () => {
    const result = {
      rawJSON: {
        execution_info: {
          execution_result: {
            Version2: {
              effects: [
                {
                  kind: {
                    Write: {
                      CLValue: { cl_type: "U32", parsed: 2 },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    };

    expect(parseProposedActionIdFromEffects(result as never)).toBe("1");
  });

  it("returns undefined when no numeric write effects exist", () => {
    expect(parseProposedActionIdFromEffects({ rawJSON: {} } as never)).toBeUndefined();
  });
});
