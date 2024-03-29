import { sql } from "drizzle-orm";
import { Counter } from "prom-client";
import { ulid } from "ulid";
import * as data from "../data";
import { logger } from "../../utilities/logger";

export type EventTypes =
  | "jobCreated"
  | "jobReceived"
  | "jobStatusRequest"
  | "jobResulted"
  | "jobStalled"
  | "jobStalledTooManyTimes"
  | "jobRecovered"
  | "machinePing"
  | "machineStalled"
  | "machineResourceProbe"
  | "functionInvocation"
  | "predictorRetryableResult"
  | "predictorRecovered"
  | "deploymentInitiated"
  | "deploymentInactivated"
  | "deploymentResulted"
  | "deploymentNotified";

type Event = {
  clusterId: string;
  type: EventTypes;
  jobId?: string;
  machineId?: string;
  deploymentId?: string;
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
    retryable?: boolean;
    reason?: string;
    pendingJobs?: number;
    machineCount?: number;
    replacedBy?: string;
    deploymentStatus?: string;
    callConfig?: object;
  };
};

const counter = new Counter({
  name: "differential_events_total",
  help: "Internal event counter",
  labelNames: ["clusterId", "serviceName", "type"],
});

type InsertableEvent = Event & {
  createdAt: Date;
};

class EventWriterBuffer {
  private buffer: InsertableEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly flushInterval: number) {}

  public push(event: InsertableEvent) {
    this.buffer.push(event);

    counter.inc(
      {
        type: event.type,
        clusterId: event.clusterId,
        serviceName: event.service,
      },
      1,
    );

    if (this.flushTimeout === null) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async quit() {
    if (this.flushTimeout !== null) {
      logger.info("Flushing events before exit");
      clearTimeout(this.flushTimeout);
      await this.flush();
    }
  }

  async flush() {
    const events = this.buffer;
    this.buffer = [];
    this.flushTimeout = null;
    await this.writeEvents(events);
  }

  private async writeEvents(events: InsertableEvent[], attempt = 0) {
    try {
      if (events.length === 0) {
        return;
      }

      const values = events.map(
        (e) =>
          sql`(${ulid()}, ${e.clusterId}, ${e.type}, ${e.jobId ?? null}, ${e.machineId ?? null}, ${e.createdAt}, ${e.meta ?? null}, ${e.service ?? null}, ${e.deploymentId ?? null})`,
      );

      const result = await data.db.execute(
        sql`
          INSERT INTO events (id, cluster_id, type, job_id, machine_id, created_at, meta, service, deployment_id)
          VALUES ${sql.join(values, sql`,`)};
        `,
      );

      logger.debug("Wrote events", {
        count: result.rowCount,
      });
    } catch (e) {
      if (attempt < 3) {
        logger.error("Failed to write events, retrying", {
          error: e,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        await this.writeEvents(events, attempt + 1);
      } else {
        logger.error("Failed to write events", {
          e,
        });
      }
    }
  }
}

export let buffer: EventWriterBuffer | null = null;

export const initialize = (flushInterval: number = 3000) => {
  buffer = new EventWriterBuffer(flushInterval);
};

export const quit = async () => {
  await buffer?.quit();
  buffer = null;
};

// Synthetic delay is useful for ordering events that are written in the same tick.
export const write = (event: Event, syntheticDelay = 0) => {
  if (buffer === null) {
    return;
  }

  logger.debug("Adding event to buffer", {
    event: event,
  });

  buffer?.push({
    ...event,
    createdAt: new Date(Date.now() + syntheticDelay),
  });
};
