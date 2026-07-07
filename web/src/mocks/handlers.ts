import { http, HttpResponse, delay } from "msw";

import { DEMO_FACILITY_IDS, getDemoStore } from "@covenantos/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function subscribeMockEvents(listener: (event: unknown) => void) {
  return getDemoStore().subscribe((event) => listener(event));
}

export const handlers = [
  http.get(`${API}/facilities`, () => {
    return HttpResponse.json({ facilities: getDemoStore().listFacilities() });
  }),

  http.get(`${API}/facilities/:id`, ({ params }) => {
    const detail = getDemoStore().getFacility(String(params.id));
    if (!detail) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  http.get(`${API}/facilities/:id/covenants`, ({ params }) => {
    const id = String(params.id);
    if (!getDemoStore().getFacility(id)) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ covenants: getDemoStore().getCovenants(id) });
  }),

  http.get(`${API}/facilities/:id/audit`, ({ params }) => {
    const id = String(params.id);
    if (!getDemoStore().getFacility(id)) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ entries: getDemoStore().getAudit(id) });
  }),

  http.post(`${API}/facilities/:id/check`, async ({ params }) => {
    await delay(800);
    const id = String(params.id);
    const store = getDemoStore();
    const facility = store.getFacility(id);
    if (!facility) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scenario = id === DEMO_FACILITY_IDS.breach ? "breach" : "healthy";
    const rawPayload =
      scenario === "breach"
        ? { dscr: 0.82, cashBalance: 120000, scenario: "breach" }
        : { dscr: 1.45, cashBalance: 540000, scenario: "healthy" };

    store.recordEvidence(id, {
      sourceId: "bank-statement",
      payloadHash: `mock-${scenario}-${Date.now()}`,
      rawPayload,
      x402PaymentRef: `x402-mock-${Date.now()}`,
      onchainReceiptTx: `deploy-mock-evidence-${Date.now()}abcdef1234567890ab`,
    });

    const result = store.evaluateLatestEvidence(id);
    return HttpResponse.json(result);
  }),

  http.post(`${API}/facilities/extract`, async () => {
    await delay(1800);
    return HttpResponse.json(getDemoStore().extractCovenants());
  }),

  http.post(`${API}/facilities`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      issuer: string;
      covenants: unknown[];
    };
    await delay(1200);
    const result = getDemoStore().registerFacility({
      name: body.name,
      issuer: body.issuer,
      covenants: body.covenants as Parameters<
        ReturnType<typeof getDemoStore>["registerFacility"]
      >[0]["covenants"],
    });
    return HttpResponse.json(result);
  }),

  http.put(`${API}/covenants/:id`, async ({ params, request }) => {
    const updated = getDemoStore().updateCovenant(
      String(params.id),
      (await request.json()) as Record<string, unknown>,
    );
    if (!updated) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ covenant: updated });
  }),

  http.get(`${API}/actions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    return HttpResponse.json({ actions: getDemoStore().listActions(status) });
  }),

  http.post(`${API}/actions/:id/approve`, async ({ params, request }) => {
    const body = (await request.json()) as { approver: string; txHash?: string };
    await delay(600);
    const action = getDemoStore().approveAction(String(params.id), body);
    if (!action) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ action });
  }),

  http.post(`${API}/actions/:id/reject`, async ({ params }) => {
    const action = getDemoStore().rejectAction(String(params.id));
    if (!action) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ action });
  }),
];
