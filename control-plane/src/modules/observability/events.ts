import { ulid } from "ulid";
import * as data from "../data";

export type EventTypes =
  | "jobCreated"
  | "jobReceived"
  | "jobStatusRequest"
  | "jobResulted"
  | "jobStalled"
  | "jobRecovered"
  | "machinePing"
  | "machineResourceProbe"
  | "functionInvocation";

type Event = {
  clusterId: string;
  type: EventTypes;
  jobId?: string;
  machineId?: string;
  service?: string;
  meta?: {
    targetFn?: string;
    targetArgs?: string;
    result?: string;
    resultType?: string;
    functionExecutionTime?: number;
    service?: string;
    ip?: string;
    limit?: number;
    status?: string;
    attemptsRemaining?: number;
  };
};

type InsertableEvent = Event & {
  createdAt: Date;
};

class EventWriterBuffer {
  private buffer: InsertableEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly flushInterval: number) {}

  public push(event: InsertableEvent) {
    this.buffer.push(event);
    if (this.flushTimeout === null) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
    }

    process.on("beforeExit", async () => {
      if (this.flushTimeout !== null) {
        console.log("Flushing events before exit");
        clearTimeout(this.flushTimeout);
        await this.flush();
      }
    });
  }

  async flush() {
    const events = this.buffer;
    this.buffer = [];
    this.flushTimeout = null;
    await this.writeEvents(events);
  }

  private async writeEvents(events: Event[], attempt = 0) {
    try {
      const result = await data.db.insert(data.events).values(
        events.map((e) => ({
          id: ulid(),
          cluster_id: e.clusterId,
          type: e.type,
          job_id: e.jobId,
          machine_id: e.machineId,
          created_at: new Date(),
          meta: e.meta,
          service: e.service,
        })),
      );

      console.log("Wrote events", {
        count: result.rowCount,
      });
    } catch (e) {
      if (attempt < 3) {
        console.error("Failed to write events, retrying", e);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        await this.writeEvents(events, attempt + 1);
      } else {
        console.error("Failed to write events", e);
      }
    }
  }
}

export let buffer: EventWriterBuffer | null = null;

export const initialize = (flushInterval: number = 3000) => {
  buffer = new EventWriterBuffer(flushInterval);
};

export const write = (event: Event) => {
  if (buffer === null) {
    console.warn("Event writer not initialized, this is a no-op", event);
  }

  buffer?.push({
    ...event,
    createdAt: new Date(),
  });
};
