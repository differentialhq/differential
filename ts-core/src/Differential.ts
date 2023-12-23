import { initClient } from "@ts-rest/core";
import debug from "debug";
import { contract } from "./contract";
import { pack, unpack } from "./serialize";
import { AsyncFunction } from "./types";
import { Result, TaskQueue } from "./task-queue";
import { getTTLForFunction } from "./utils";

const log = debug("differential:client");

const { serializeError, deserializeError } = require("./errors");

export type ServiceDefinition = {
  name: string;
  functions: {
    [key: string]: AsyncFunction;
  };
};

export type RegisteredService = {
  definition: ServiceDefinition;
  start: () => Promise<void>;
  stop: () => Promise<void>;
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
    // TODO: if this happens, we need to update the job status to "failed"
    // and see if we can cancel the job on the service through some signal implementation.
    if (attempt > 10) {
      throw new DifferentialError("Failed to execute job due to timeout", {
        code: "JOB_TIMEOUT",
        attempts: attempt,
      });
    }

    // TODO: rework attempt logic
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    return pollForJob(client, params, authHeader, attempt + 1);
  }

  throw new DifferentialError("Unexpected Error", {
    code: "UNEXPECTED_ERROR",
    serverResponse: result,
  });
};

type ServiceRegistryFunction = {
  fn: AsyncFunction;
  serviceName: string;
  options?: {};
};

const functionRegistry: { [key: string]: ServiceRegistryFunction } = {};

class PollingAgent {
  private pollingForNextJob = false;
  private pollJobsTimer: NodeJS.Timeout | undefined;

  private pollState = {
    current: 0,
    concurrency: 100,
    polling: false, // this is the polling state for the currently executing job.
  };

  constructor(
    private client: ReturnType<typeof createClient>,
    private authHeader: string,
    private service: {
      name: string;
      idleTimeout?: number;
      onIdle?: () => void;
    }
  ) {}

  pollForNextJob = async (): Promise<
    | {
        jobCount: number;
      }
    | undefined
  > => {
    if (this.pollingForNextJob) {
      return;
    }

    log("Polling for next job", { service: this.service });
    this.pollingForNextJob = true;

    if (this.pollState.concurrency <= this.pollState.current) {
      log("Max concurrency reached");
      return;
    }

    try {
      const pollResult = await this.client
        .getNextJobs({
          query: {
            limit: Math.ceil(
              (this.pollState.concurrency - this.pollState.current) / 2
            ),
            functions: Object.entries(functionRegistry)
              .filter((s) => s[1].serviceName === this.service.name)
              .map((s) => s[0])
              .join(","),
          },
          headers: {
            authorization: this.authHeader,
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

        this.pollState.current += pollResult.body.length;

        const jobs = pollResult.body;

        await Promise.allSettled(
          jobs.map(async (job) => {
            const registered = functionRegistry[job.targetFn];

            log("Executing job", {
              id: job.id,
              targetFn: job.targetFn,
              registered: !!registered,
            });

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
              const args: Parameters<AsyncFunction> = unpack(job.targetArgs);

              log("Executing fn", {
                id: job.id,
                targetFn: job.targetFn,
                registeredFn: registered.fn,
                args,
              });

              const onComplete = async (result: Result) => {
                log("Persisting job result", {
                  id: job.id,
                  resultType: result.type,
                });

                await this.client
                  .persistJobResult({
                    body: {
                      result: pack(result.content),
                      resultType: result.type,
                      cacheTTL: getTTLForFunction(registered.fn),
                    },
                    params: {
                      jobId: job.id,
                    },
                    headers: {
                      authorization: this.authHeader,
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
                    this.pollState.current -= 1;
                  });
              };

              TaskQueue.addTask(registered.fn, args, onComplete);
            }
          })
        );

        return {
          jobCount: jobs.length,
        };
      } else {
        log("Error polling for next job", { pollResult });
      }
    } finally {
      this.pollingForNextJob = false;
    }
  };

  startPolling() {
    let resolved = false;
    let lastTimeWeHadJobs = Date.now();

    return new Promise<void>((resolve) => {
      this.pollJobsTimer = setInterval(async () => {
        const result = await this.pollForNextJob();

        if (!resolved) {
          resolved = true;
          resolve();
        }

        if (result?.jobCount === 0 && this.service?.idleTimeout) {
          const timeSinceLastJob = Date.now() - lastTimeWeHadJobs;

          if (timeSinceLastJob > this.service?.idleTimeout) {
            log("Idle timeout reached");
            this.service?.onIdle?.();
          }
        } else {
          lastTimeWeHadJobs = Date.now();
        }
      }, 1000);
    });
  }

  quit(): Promise<void> {
    clearInterval(this.pollJobsTimer);

    return new Promise(async (resolve) => {
      await TaskQueue.quit();

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

  setConcurrency(concurrency: number) {
    this.pollState.concurrency = concurrency;
  }

  public get serviceName(): string {
    return this.service.name;
  }

  public get polling(): boolean {
    return this.pollState.polling;
  }
}

/**
 * The Differential client. This is the main entry point for using Differential.
 *
 * @example Basic usage
 * ```ts
 *  const d = new Differential("API_SECRET"); // obtain this from your Differential dashboard
 *
 * const myService = d.service({
 *   name: "my-service",
 *   functions: {
 *     hello: async (name: string) => { ... }
 *   },
 * });
 *
 * await d.listen("my-service");
 *
 * // stop the service on shutdown
 * process.on("beforeExit", async () => {
 *   await d.quit();
 * });
 *
 * // call a function on the service
 * const result = await d.call<typeof myService, "hello">("hello", "world");
 *
 * console.log(result); // "Hello world"
 * ```
 */
export class Differential {
  private authHeader: string;
  private endpoint: string;
  private machineId: string;
  private client: ReturnType<typeof createClient>;

  private pollingAgents: PollingAgent[] = [];

  /**
   * Initializes a new Differential instance.
   * @param apiSecret The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard).
   */
  constructor(private apiSecret: string) {
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

  private async listen(service: string) {
    const pollingAgent = new PollingAgent(this.client, this.authHeader, {
      name: service,
    });

    if (
      this.pollingAgents.find((p) => p.serviceName === service && p.polling)
    ) {
      log("Polling agent already exists. This is a no-op", { service });
      return;
    }

    this.pollingAgents.push(pollingAgent);

    await pollingAgent.startPolling();
  }

  private async quit(): Promise<void> {
    await Promise.all(this.pollingAgents.map((agent) => agent.quit()));

    log("All polling agents quit", {
      count: this.pollingAgents.length,
    });
  }

  private register<T extends AsyncFunction>({
    fn,
    name,
    serviceName,
  }: {
    fn: AsyncFunction;
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

  /**
   * Registers a service with Differential. This will register all functions on the service.
   * @param service The service definition.
   * @returns A registered service instance.
   * @example
   * ```ts
   * const d = new Differential("API_SECRET");
   *
   * const service = d.service({
   *   name: "my-service",
   *   functions: {
   *     hello: async (name: string) => {
   *       return `Hello ${name}`;
   *    }
   * });
   *
   * // start the service
   * await service.start();
   *
   * // stop the service on shutdown
   * process.on("beforeExit", async () => {
   *   await service.stop();
   * });
   * ```
   */
  service<T extends ServiceDefinition>(service: T): RegisteredService {
    for (const [key, value] of Object.entries(service.functions)) {
      if (functionRegistry[key]) {
        throw new DifferentialError(
          `Function name '${key}' is already registered by another service.`
        );
      } else {
        this.register({
          fn: value,
          name: key,
          serviceName: service.name,
        });
      }
    }

    return {
      definition: service,
      start: () => this.listen(service.name),
      stop: () => this.quit(),
    };
  }

  /**
   * Calls a function on a registered service, while ensuring the type safety of the function call through generics.
   * Waits for the function to complete before returning, and returns the result of the function call.
   * @param fn The function name to call.
   * @param args The arguments to pass to the function.
   * @returns The return value of the function.
   * @example
   * ```ts
   * import { d } from "./differential";
   * import { helloService } from "./hello-service";
   *
   * const result = await d.call<typeof helloService, "hello">("hello", "world");
   *
   * console.log(result); // "Hello world"
   * ```
   */
  async call<
    T extends RegisteredService,
    U extends keyof T["definition"]["functions"]
  >(
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<ReturnType<T["definition"]["functions"][U]>> {
    // create a job
    const id = await this.createJob<T, U>(fn, args);

    // wait for the job to complete
    const result = await pollForJob(
      this.client,
      { jobId: id },
      this.authHeader
    );

    if (result.type === "resolution") {
      // return the result
      return result.content as ReturnType<T["definition"]["functions"][U]>;
    } else if (result.type === "rejection") {
      const error = deserializeError(result.content);
      throw error;
    } else {
      throw new DifferentialError("Unexpected result type");
    }
  }

  /**
   * Calls a function on a registered service, while ensuring the type safety of the function call through generics.
   * Returns the job id of the function call, and doesn't wait for the function to complete.
   * @param fn The function name to call.
   * @param args The arguments to pass to the function.
   * @returns The job id of the function call.
   * @example
   * ```ts
   * import { d } from "./differential";
   *
   * const result = await d.background<typeof helloService, "hello">("hello", "world");
   *
   * console.log(result.id); //
   * ```
   */
  async background<
    T extends RegisteredService,
    U extends keyof T["definition"]["functions"]
  >(
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<{ id: string }> {
    // create a job
    const id = await this.createJob<T, U>(fn, args);

    return { id };
  }

  private async createJob<
    T extends RegisteredService,
    U extends keyof T["definition"]["functions"]
  >(
    fn: string | number | symbol,
    args: Parameters<T["definition"]["functions"][U]>
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
}
