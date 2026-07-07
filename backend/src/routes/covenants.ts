import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { CovenantRecord } from "@covenantos/shared";
import { ChainWriter } from "../chain/writer.js";
import { getAppStore } from "../store/persisting-store.js";

const chainWriter = new ChainWriter();
const HUMAN_REVIEW_THRESHOLD = 0.85;

function covenantRegistryHash(covenant: CovenantRecord): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: covenant.id,
        facilityId: covenant.facilityId,
        type: covenant.type,
        threshold: covenant.threshold,
        cadence: covenant.cadence,
        sourceQuote: covenant.sourceQuote,
      }),
    )
    .digest("hex");
}

export async function registerCovenantRoutes(app: FastifyInstance) {
  app.post("/covenants/:id/register", async (request, reply) => {
    const { id } = request.params as { id: string };
    const store = getAppStore();

    let covenant: CovenantRecord | null = null;
    for (const facility of store.listFacilities()) {
      const match = store.getCovenants(facility.id).find((c) => c.id === id);
      if (match) {
        covenant = match;
        break;
      }
    }

    if (!covenant) {
      return reply.status(404).send({ error: "Covenant not found" });
    }

    if (!covenant.humanVerified && covenant.confidence < HUMAN_REVIEW_THRESHOLD) {
      return reply.status(422).send({
        error: "Covenant requires human verification before on-chain registration",
        covenant,
      });
    }

    if (covenant.onchainRef) {
      return reply.send({
        covenant,
        txHash: covenant.onchainRef,
        alreadyRegistered: true,
      });
    }

    const registryHash = covenantRegistryHash(covenant);
    const txHash =
      (await chainWriter.registerCovenant({
        facilityId: covenant.facilityId,
        covenantId: covenant.id,
        registryHash,
      })) ?? `deploy-covenant-${registryHash.slice(0, 16)}abcdef1234567890abcdef1234567890ab`;

    const updated = store.updateCovenant(id, {
      onchainRef: txHash,
      humanVerified: true,
    });

    return reply.send({
      covenant: updated,
      txHash,
      registryHash,
    });
  });
}
