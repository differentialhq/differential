import { initClient } from "@ts-rest/core";
import debug from "debug";
import { contract } from "./contract";
import { pack, unpack } from "./serialize";

const log = debug("differential:client");

const { serializeError, deserializeError } = require("./errors");

type AssertPromiseReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R extends Promise<any>
    ? T
    : "Any function that is passed to fn must return a Promise. Fix this by making the inner function async."
  : "Any function that is passed to fn must return a Promise. Fix this by making the inner function async.";

// Define a type for any function that returns a promise
type AsyncFunction = (...args: any[]) => Promise<any>;

export type ServiceDefinition = {
  name: string;
  operations: {
    [key: string]: {
      fn: AsyncFunction;
      options?: {};
    };
  };
};

const createClient = (baseUrl: string, machineId: string) =>
  initClient(contract, {
    baseUrl,
    baseHeaders: {
      "x-machine-id": machineId,
    },
  });

class DifferentialError extends Error {
  constructor(message: string, meta?: { [key: string]: unknown }) {
    super(message);
    this.name = "DifferentialError";
  }
}

const pollForJob = async (
  client: ReturnType<typeof createClient>,
  params: { jobId: string },
  authHeader: string,
  attempt = 1
): Promise<Result> => {
  const result = await client.getJobStatus({
    params: {
      jobId: params.jobId,
    },
    headers: {
      authorization: authHeader,
    },
  });

  if (result.status === 200 && result.body.status === "success") {
    return {
      content: unpack(result.body.result!),
      type: result.body.resultType!,
    };
  }

  if (result.status === 200 && result.body.status === "failure") {
    throw new DifferentialError("Unexpected Error", {
      code: "UNEXPECTED_ERROR",
    });
  }

  const jobPending =
    result.status === 200 &&
    (result.body.status === "pending" || result.body.status === "running");

  const serviceUnavailable =
    result.status === 503 ||
    result.status === 504 ||
    result.status === 502 ||
    result.status === 500 ||
    result.status === 429;

  if (jobPending || serviceUnavailable) {
    if (attempt > 10) {
      throw new DifferentialError("Failed to execute job due to timeout", {
        code: "JOB_TIMEOUT",
        attempts: attempt,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    return pollForJob(client, params, authHeader, attempt + 1);
  }

  throw new DifferentialError("Unexpected Error", {
    code: "UNEXPECTED_ERROR",
    serverResponse: result,
  });
};

type ServiceRegistryFunction = {
  fn: Function;
  serviceName: string;
  options?: {};
};

const functionRegistry: { [key: string]: ServiceRegistryFunction } = {};

type Result<T = unknown> = {
  content: T;
  type: "resolution" | "rejection";
};

const executeFn = async (fn: Function, arg: unknown): Promise<Result> => {
  try {
    const result = await fn(arg);

    return {
      content: result,
      type: "resolution",
    };
  } catch (e) {
    if (e instanceof Error) {
      return {
        content: serializeError(e),
        type: "rejection",
      };
    } else if (typeof e === "string") {
      return {
        content: serializeError(new Error(e)),
        type: "rejection",
      };
    } else {
      return {
        content: new Error(
          "Differential encountered an unexpected error type. Make sure you are throwing an Error object."
        ),
        type: "rejection",
      };
    }
  }
};

let pollingForNextJob = false;

const pollForNextJob = async (
  client: ReturnType<typeof createClient>,
  authHeader: string,
  pollState: {
    current: number;
    concurrency: number;
    polling: boolean;
  },
  service: string
): Promise<
  | {
      jobCount: number;
    }
  | undefined
> => {
  if (pollingForNextJob) {
    return;
  }

  log("Polling for next job");
  pollingForNextJob = true;

  if (pollState.concurrency <= pollState.current) {
    log("Max concurrency reached");
    return;
  }

  try {
    const pollResult = await client
      .getNextJobs({
        query: {
          limit: Math.ceil((pollState.concurrency - pollState.current) / 2),
          functions: Object.entries(functionRegistry)
            .filter((s) => s[1].serviceName === service)
            .map((s) => s[0])
            .join(","),
        },
        headers: {
          authorization: authHeader,
        },
      })
      .catch((e) => {
        log(`Failed to poll for next job: ${e.message}`);

        return {
          status: -1,
        } as const;
      });

    if (pollResult.status === 400) {
      log("Error polling for next job", JSON.stringify(pollResult.body));
    } else if (pollResult.status === 200) {
      log("Received jobs", pollResult.body.length);

      pollState.current += pollResult.body.length;

      const jobs = pollResult.body;

      await Promise.allSettled(
        jobs.map(async (job) => {
          const registered = functionRegistry[job.targetFn];

          log("Executing job", job.id, job.targetFn);

          let result: Result;

          if (!registered) {
            const error = new DifferentialError(
              `Function was not registered. name='${
                job.targetFn
              }' registeredFunctions='${Object.keys(functionRegistry).join(
                ","
              )}'`
            );

            result = {
              content: serializeError(error),
              type: "rejection",
            };
          } else {
            const arg = unpack(job.targetArgs);
            result = await executeFn(registered.fn, arg);
          }

          await client
            .persistJobResult({
              body: {
                result: pack(result.content),
                resultType: result.type,
              },
              params: {
                jobId: job.id,
              },
              headers: {
                authorization: authHeader,
              },
            })
            .then((res) => {
              if (res.status === 204) {
                log("Completed job", job.id, job.targetFn);
              } else {
                throw new DifferentialError(
                  `Failed to persist job: ${res.status}`,
                  {
                    jobId: job.id,
                    body: res.body,
                  }
                );
              }
            })
            .finally(() => {
              pollState.current -= 1;
            });
        })
      );

      return {
        jobCount: jobs.length,
      };
    } else {
      log("Error polling for next job", pollResult.status);
    }
  } finally {
    pollingForNextJob = false;
  }
};

type WorkerPool = {
  idleTimeout?: number;
  onWork?: () => void;
  onIdle?: () => void;
};

/**
 * The Differential client. Use this to register functions, and establish listeners to listen for function calls.
 * For most use cases, you should only need one Differential instance per process.
 *
 * @example Basic usage
 * ```ts
 *  const d = new Differential("API_SECRET");
 * ```
 *
 * @example With listeners
 * ```ts
 * const d = new Differential("API_SECRET", [
 *   // background worker can keep running
 *   new PoolConfig({
 *     pool: "background-worker",
 *   }),
 *   // image processor should scale in and out when there's no work
 *   // because it's expensive to keep running
 *   new PoolConfig({
 *     pool: "image-processor",
 *     idleTimeout: 10_000,
 *     onWork: () => {
 *        flyMachinesInstance.start();
 *     },
 *     onIdle: () => {
 *       flyMachinesInstance.stop();
 *     },
 *   }),
 * ]);
 * ```
 */
export class Differential {
  private authHeader: string;
  private pollJobsTimer: NodeJS.Timeout | undefined;
  private endpoint: string;
  private machineId: string;
  private client: ReturnType<typeof createClient>;

  private pollState = {
    current: 0,
    concurrency: 100,
    polling: false, // this is the polling state for the currently executing job.
  };

  /**
   * Initializes a new Differential instance.
   * @param apiSecret The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard).
   * @param workerPools A dictionary of worker pool configurations to use for running service functions.
   */
  constructor(
    private apiSecret: string,
    private workerPools?: {
      [key: string]: WorkerPool;
    }
  ) {
    this.authHeader = `Basic ${this.apiSecret}`;
    this.endpoint =
      process.env.DIFFERENTIAL_API_ENDPOINT_OVERRIDE ??
      "https://api.differential.dev";
    this.machineId = Math.random().toString(36).substring(7);

    log("Initializing client", {
      endpoint: this.endpoint,
      machineId: this.machineId,
    });

    this.client = createClient(this.endpoint, this.machineId);
  }

  /**
   * waking up is done by sending a request to the health check url directly
   * so that the network doesn't have to be configured to allow incoming requests.
   * from the outside.
   */
  // TODO: call this
  // private onWork = async (pool?: string): Promise<void> => {
  //   if (!pool) {
  //     // execute all pools

  //     const pools = this.workerPools
  //       ? Object.values(this.workerPools)
  //       : undefined;

  //     for (const listener of pools ?? []) {
  //       listener.onWork?.();
  //     }
  //   } else {
  //     // execute specific pool
  //     const listener = this.workerPools?.[pool];

  //     listener?.onWork?.();
  //   }
  // };

  private listen(service: string) {
    let lastTimeWeHadJobs = Date.now();

    const pool = this.workerPools?.[service];

    this.pollJobsTimer = setInterval(async () => {
      const result = await pollForNextJob(
        this.client,
        this.authHeader,
        this.pollState,
        service
      );

      if (result?.jobCount === 0 && pool?.idleTimeout) {
        const timeSinceLastJob = Date.now() - lastTimeWeHadJobs;

        if (timeSinceLastJob > pool?.idleTimeout) {
          log("Idle timeout reached");
          pool?.onIdle?.();
        }
      } else {
        lastTimeWeHadJobs = Date.now();
      }
    }, 1000);
  }

  /**
   * Stops the service, and waits for all currently executing functions to finish. Useful for a graceful shutdown.
   * @returns A promise that resolves when all currently executing jobs have finished.
   *
   * @example Basic usage
   * ```ts
   * process.on("beforeExit", async () => {
   *   await d.quit();
   *   process.exit(0);
   * });
   * ```
   */
  private quit(): Promise<void> {
    clearInterval(this.pollJobsTimer);

    return new Promise((resolve) => {
      if (this.pollState.polling) {
        const quitTimer: NodeJS.Timeout = setInterval(() => {
          log("Waiting for polling to finish");
          if (!this.pollState.polling) {
            log("Polling finished");
            clearInterval(quitTimer);
            resolve();
          }
        }, 500);
      } else {
        resolve();
      }
    });
  }

  private register<T extends (...args: Parameters<T>) => ReturnType<T>>({
    fn,
    name,
    serviceName,
  }: {
    fn: AssertPromiseReturnType<T>;
    name: string;
    serviceName: string;
  }) {
    if (typeof fn !== "function") {
      throw new DifferentialError("fn must be a function");
    }

    log(`Registering function`, {
      name,
    });

    if (!name) {
      throw new DifferentialError("Function must have a name");
    }

    functionRegistry[name] = {
      fn: fn,
      serviceName,
    };
  }

  service<T extends ServiceDefinition>(service: T) {
    for (const [key, value] of Object.entries(service.operations)) {
      if (functionRegistry[key]) {
        throw new DifferentialError(
          `Function name '${key}' is already registered by another service.`
        );
      } else {
        this.register({
          fn: value.fn,
          name: key,
          serviceName: service.name,
        });
      }
    }

    return {
      ...service,
      start: () => this.listen(service.name),
      stop: () => this.quit(),
    };
  }

  async call<T extends ServiceDefinition>(
    fn: keyof T["operations"],
    args: Parameters<T["operations"][keyof T["operations"]]["fn"]>[0],
    options?: { background?: boolean }
  ): Promise<ReturnType<T["operations"][keyof T["operations"]]["fn"]>> {
    // create a job
    const id = await this.createJob<T>(fn, args);

    // wait for the job to complete
    this.pollState.polling = true;
    const result = await pollForJob(
      this.client,
      { jobId: id },
      this.authHeader
    );

    if (result.type === "resolution") {
      // return the result
      this.pollState.polling = false;
      return result.content as ReturnType<
        T["operations"][keyof T["operations"]]["fn"]
      >;
    } else if (result.type === "rejection") {
      this.pollState.polling = false;
      const error = deserializeError(result.content);
      throw error;
    } else {
      throw new DifferentialError("Unexpected result type");
    }
  }

  async background<T extends ServiceDefinition>(
    fn: keyof T["operations"],
    args: Parameters<T["operations"][keyof T["operations"]]["fn"]>[0]
  ): Promise<{ id: string }> {
    // create a job
    const id = await this.createJob<T>(fn, args);

    return { id };
  }

  private async createJob<T extends ServiceDefinition>(
    fn: string | number | symbol,
    args: Parameters<T["operations"][keyof T["operations"]]["fn"]>[0]
  ) {
    return await this.client
      .createJob({
        body: {
          targetFn: fn as string,
          targetArgs: pack(args),
        },
        headers: {
          authorization: this.authHeader,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          return res.body.id;
        } else if (res.status === 401) {
          throw new DifferentialError(
            "Invalid API Key or API Secret. Make sure you are using the correct API Key and API Secret."
          );
        } else {
          throw new DifferentialError(`Failed to create job: ${res.status}`);
        }
      });
  }

  /**
   * Sets the maximum number of function calls to execute concurrently.
   * @param concurrency The maximum number of function calls to execute concurrently. Defaults to 100.
   * @example Basic usage
   * ```ts
   * d.setConcurrency(1); // only execute one function at a time
   * ```
   */
  setConcurrency(concurrency: number) {
    this.pollState.concurrency = concurrency;
  }
}
