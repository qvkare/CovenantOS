import { describe, expect, it } from "vitest";
import {
  parseActionIdFromProposedEventBytes,
  parseProposedActionIdFromEffects,
} from "../src/chain/tx.js";

describe("parseProposedActionIdFromEffects", () => {
  it("derives action_id from ActionProposed event bytes in effects", () => {
    const eventBytes =
      "6400000060000000140000006576656e745f416374696f6e50726f706f736564050000000000000002000000000000000112000000706172616d732d686f6c642d6d6f2d30303200533109d2891f6c3a293be1bc88ad38965301dd8211b455e7850d1fc2268bce830e032000000060389317739a86ebe19c343aa263e0d01617dc03c59e642c16db12d3696769d60100000038";

    expect(parseActionIdFromProposedEventBytes(Buffer.from(eventBytes, "hex"))).toBe("5");

    const result = {
      rawJSON: {
        execution_info: {
          execution_result: {
            Version2: {
              effects: [
                {
                  kind: {
                    Write: {
                      CLValue: { cl_type: "Any", bytes: eventBytes, parsed: null },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    };

    expect(parseProposedActionIdFromEffects(result as never)).toBe("5");
  });

  it("returns undefined when no ActionProposed event effects exist", () => {
    expect(parseProposedActionIdFromEffects({ rawJSON: {} } as never)).toBeUndefined();
  });
});
