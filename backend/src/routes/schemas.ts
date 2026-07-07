import { z } from "zod";

export const approveActionSchema = z.object({
  approver: z.string().min(1).max(200),
  txHash: z.string().max(128).optional(),
});

export const evidenceBodySchema = z.object({
  scenario: z.enum(["healthy", "breach"]).optional(),
});

export const checkBodySchema = z.object({
  fetchEvidence: z.boolean().optional(),
  scenario: z.enum(["healthy", "breach"]).optional(),
});

export const registerFacilitySchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  covenants: z.array(z.record(z.string(), z.unknown())).min(1).max(50),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body ?? {});
}
