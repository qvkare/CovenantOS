import WebSocket from "ws";
import type { ChainEvent } from "@covenantos/shared";
import type { IndexerConfig } from "./config.js";
import { normalizeContractHash } from "./config.js";
import { parseCsprCloudMessage } from "./parser.js";

export type IndexerStatus = {
  enabled: boolean;
  mode: IndexerConfig["mode"];
  connected: boolean;
  lastError?: string;
  subscribedPackages: string[];
};

export class CsprCloudContractSubscriber {
  private socket: WebSocket | undefined;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private stopped = false;
  private status: IndexerStatus;

  constructor(
    private readonly config: IndexerConfig,
    private readonly onEvent: (event: ChainEvent) => void,
    private readonly onStatus?: (status: IndexerStatus) => void,
  ) {
    this.status = {
      enabled: config.enabled,
      mode: config.mode,
      connected: false,
      subscribedPackages: config.contractPackageHashes,
    };
  }

  getStatus(): IndexerStatus {
    return { ...this.status };
  }

  start(): void {
    if (!this.config.enabled || this.config.mode !== "cspr-cloud") {
      this.publishStatus();
      return;
    }

    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.status.connected = false;
    this.publishStatus();
  }

  private connect(): void {
    if (this.stopped || this.config.mode !== "cspr-cloud") return;

    const hashes = this.config.contractPackageHashes.map(normalizeContractHash).join(",");
    const url = `${this.config.streamingBaseUrl}/contract-events?contract_package_hash=${hashes}`;

    const socket = new WebSocket(url, {
      headers: {
        authorization: this.config.csprCloudToken ?? "",
      },
    });

    this.socket = socket;

    socket.on("open", () => {
      this.status.connected = true;
      this.status.lastError = undefined;
      this.publishStatus();
    });

    socket.on("message", (frame) => {
      try {
        const parsed = JSON.parse(frame.toString()) as unknown;
        const allowed = new Set(this.config.contractPackageHashes.map(normalizeContractHash));
        const event = parseCsprCloudMessage(parsed, allowed);
        if (event) {
          this.onEvent(event);
        }
      } catch {
        // ignore malformed frames
      }
    });

    socket.on("close", () => {
      this.status.connected = false;
      this.publishStatus();
      this.scheduleReconnect();
    });

    socket.on("error", () => {
      this.status.lastError = "websocket_error";
      this.status.connected = false;
      this.publishStatus();
    });
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 5000);
  }

  private publishStatus(): void {
    this.onStatus?.(this.getStatus());
  }
}

export class ChainIndexer {
  private subscriber: CsprCloudContractSubscriber | undefined;

  constructor(
    private readonly config: IndexerConfig,
    private readonly onEvent: (event: ChainEvent) => void,
  ) {}

  start(): IndexerStatus {
    this.subscriber = new CsprCloudContractSubscriber(this.config, this.onEvent);
    this.subscriber.start();
    return this.getStatus();
  }

  stop(): void {
    this.subscriber?.stop();
  }

  getStatus(): IndexerStatus {
    return (
      this.subscriber?.getStatus() ?? {
        enabled: this.config.enabled,
        mode: this.config.mode,
        connected: false,
        subscribedPackages: this.config.contractPackageHashes,
      }
    );
  }
}
