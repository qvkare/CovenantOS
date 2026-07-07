import type { ChainEvent } from "@covenantos/shared";
import { CovenantAgent } from "../agents/covenant-agent.js";
import { getAppStore } from "../store/persisting-store.js";

const CHECK_INTERVAL_MS = Number(process.env.COVENANT_CHECK_INTERVAL_MS ?? 15 * 60 * 1000);
const CHECK_ON_EVENTS = new Set<ChainEvent["type"]>(["EvidenceRecorded", "Deposited"]);

export class CovenantCheckScheduler {
  private timer: NodeJS.Timeout | undefined;
  private readonly agent = new CovenantAgent();

  start(): void {
    if (process.env.COVENANT_SCHEDULER_ENABLED === "false") return;
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.runScheduledChecks();
    }, CHECK_INTERVAL_MS);

    getAppStore().subscribe((event) => {
      if (CHECK_ON_EVENTS.has(event.type)) {
        void this.runFacilityCheck(event.facilityId);
      }
    });
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async runScheduledChecks(): Promise<void> {
    const store = getAppStore();
    for (const facility of store.listFacilities()) {
      if (facility.status === "paused" || facility.status === "closed") continue;
      await this.runFacilityCheck(facility.id);
    }
  }

  private async runFacilityCheck(facilityId: string | undefined): Promise<void> {
    if (!facilityId) return;
    const store = getAppStore();
    const detail = store.getFacility(facilityId);
    if (!detail || detail.evidence.length === 0) return;
    store.evaluateLatestEvidence(facilityId);
  }
}
