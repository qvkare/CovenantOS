import type {
  AuditEntry,
  ChainEvent,
  CovenantRecord,
  Evidence,
  Facility,
  FacilitySummary,
  ProposedAction,
} from "@covenantos/shared";

import { api } from "./api";

export type {
  AuditEntry,
  FacilitySummary,
};

export interface FacilitiesResponse {
  facilities: FacilitySummary[];
}

export interface FacilityDetailResponse {
  facility: FacilitySummary;
  covenants: CovenantRecord[];
  evidence: Evidence[];
  escrow: {
    balance: string;
    held: string;
    released: string;
    reserve: string;
    recentTxs: Array<{ type: string; amount: string; txHash: string; at: string }>;
  };
}

export interface AuditResponse {
  entries: AuditEntry[];
}

export interface ExtractCovenantsResponse {
  covenants: CovenantRecord[];
  documentId: string;
}

export interface RegisterFacilityResponse {
  facility: Facility;
  txHashes: string[];
}

export async function listFacilities(): Promise<FacilitiesResponse> {
  return api<FacilitiesResponse>("/facilities");
}

export async function getFacility(id: string): Promise<FacilityDetailResponse> {
  return api<FacilityDetailResponse>(`/facilities/${id}`);
}

export async function getFacilityCovenants(
  id: string,
): Promise<{ covenants: CovenantRecord[] }> {
  return api(`/facilities/${id}/covenants`);
}

export async function triggerFacilityCheck(
  id: string,
): Promise<{ status: string; event?: ChainEvent }> {
  return api(`/facilities/${id}/check`, { method: "POST" });
}

export async function getFacilityAudit(id: string): Promise<AuditResponse> {
  return api(`/facilities/${id}/audit`);
}

export async function listActions(
  status?: string,
): Promise<{ actions: ProposedAction[] }> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return api(`/actions${q}`);
}

export async function approveAction(
  id: string,
  body: { approver: string; txHash?: string },
): Promise<{ action: ProposedAction }> {
  return api(`/actions/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function rejectAction(
  id: string,
): Promise<{ action: ProposedAction }> {
  return api(`/actions/${id}/reject`, { method: "POST" });
}

export async function extractCovenants(
  file: File,
  facilityName?: string,
): Promise<ExtractCovenantsResponse> {
  const form = new FormData();
  form.append("file", file);
  if (facilityName) form.append("name", facilityName);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/facilities/extract`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<ExtractCovenantsResponse>;
}

export async function registerFacility(body: {
  name: string;
  issuer: string;
  covenants: CovenantRecord[];
}): Promise<RegisterFacilityResponse> {
  return api("/facilities", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function registerCovenant(
  id: string,
): Promise<{ covenant: CovenantRecord; txHash: string; registryHash?: string }> {
  return api(`/covenants/${id}/register`, { method: "POST" });
}

export async function updateCovenant(
  id: string,
  body: Partial<CovenantRecord>,
): Promise<{ covenant: CovenantRecord }> {
  return api(`/covenants/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
