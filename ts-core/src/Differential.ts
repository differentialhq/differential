import { initClient } from "@ts-rest/core";
import debug from "debug";
import { contract } from "./contract";
import { pack, unpack } from "./serialize";
import { AsyncFunction } from "./types";
import { Result, TaskQueue } from "./task-queue";
import { DifferentialError } from "./errors";

const log = debug("differential:client");

const { serializeError, deserializeError } = require("./errors");

type ServiceClient<T extends RegisteredService<any>> = {
  [K in keyof T["definition"]["functions"]]: T["definition"]["functions"][K];
};

type BackgroundServiceClient<T extends RegisteredService<any>> = {
  [K in keyof T["definition"]["functions"]]: (
    ...args: Parameters<T["definition"]["functions"][K]>
  ) => Promise<{ id: string }>;
};

export type ServiceDefinition<T extends string> = {
  name: T;
  functions: {
    [key: string]: AsyncFunction;
  };
};

export type RegisteredService<T extends ServiceDefinition<any>> = {
  definition: T;
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
    private controlPlaneClient: ReturnType<typeof createClient>,
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
      const pollResult = await this.controlPlaneClient
        .getNextJobs({
          query: {
            limit: Math.ceil(
              (this.pollState.concurrency - this.pollState.current) / 2
            ),
            functions: Object.entries(functionRegistry)
              .filter((s) => s[1].serviceName === this.service.name)
              .map((s) => s[0])
              .join(","),
            service: this.service.name,
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
                  functionExecutionTime: result.functionExecutionTime,
                });

                await this.controlPlaneClient
                  .persistJobResult({
                    body: {
                      result: pack(result.content),
                      resultType: result.type,
                      functionExecutionTime: result.functionExecutionTime,
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
      } else if (pollResult.status === 401) {
        throw new DifferentialError(DifferentialError.UNAUTHORISED);
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

type WorkerPool = {
  idleTimeout?: number;
  onWork?: () => void;
  onIdle?: () => void;
  concurrency?: number;
};

/**
 * The Differential client. This is the main entry point for using Differential.
 *
 * Differential client exposes two main methods:
 * * `service` - Registers a service with Differential. This will register all functions on the service.
 * * `client` - Provides a type safe client for performing calls to a registered service.
 *
 * @example Basic usage
 * ```ts
 * // src/service.ts
 *
 * // create a new Differential instance
 * const d = new Differential("API_SECRET");
 *
 * const myService = d.service({
 *   name: "my-service",
 *   functions: {
 *     hello: async (name: string) => {
 *       return `Hello ${name}`;
 *     },
 *   },
 * });
 *
 * await myService.start();
 *
 * // stop the service on shutdown
 * process.on("beforeExit", async () => {
 *   await myService.stop();
 * });
 *
 * // src/client.ts
 *
 * // create a client for the service
 * const client = d.client<typeof myService>("my-service");
 *
 * // call a function on the service
 * const result = await client.hello("world");
 *
 * console.log(result); // "Hello world"
 * ```
 */
export class Differential {
  private authHeader: string;
  private endpoint: string;
  private machineId: string;
  private controlPlaneClient: ReturnType<typeof createClient>;

  private pollingAgents: PollingAgent[] = [];

  /**
   * Initializes a new Differential instance.
   * @param apiSecret The API Secret for your Differential cluster. You can obtain one from https://api.differential.dev/demo/token.
   * @param options Additional options for the Differential client.
   * @param options.endpoint The endpoint for the Differential cluster. Defaults to https://api.differential.dev.
   * @param options.encryptionKeys An array of encryption keys to use for encrypting and decrypting data. These keys are never sent to the control-plane and allows you to encrypt function arguments and return values. If you do not provide any keys, Differential will not encrypt any data. Encryption has a performance impact on your functions. When you want to rotate keys, you can add new keys to the start of the array. Differential will try to decrypt data with each key in the array until it finds a key that works. Differential will encrypt data with the first key in the array. Each key must be 32 bytes long.
   * @example
   * ```ts
   *
   * // Basic usage
   * const d = new Differential("API_SECRET");
   *
   * // With encryption
   * const d = new Differential("API_SECRET", {
   *  encryptionKeys: [
   *    Buffer.from("abcdefghijklmnopqrstuvwxzy123456"), // current key
   *    Buffer.from("abcdefghijklmnopqrstuvwxzy123old"), // previous key
   *  ],
   * });
   */
  constructor(
    private apiSecret: string,
    options?: {
      endpoint?: string;
      encryptionKeys?: Buffer[];
    }
  ) {
    this.authHeader = `Basic ${this.apiSecret}`;
    this.endpoint = options?.endpoint || "https://api.differential.dev";
    this.machineId = Math.random().toString(36).substring(7);

    options?.encryptionKeys?.forEach((key, i) => {
      if (key.length !== 32) {
        throw new DifferentialError(
          `Encryption keys must be 32 bytes long. Received key of length ${key.length} at index ${i}`
        );
      }
    });

    log("Initializing control plane client", {
      endpoint: this.endpoint,
      machineId: this.machineId,
    });

    this.controlPlaneClient = createClient(this.endpoint, this.machineId);
  }

  private async listen(service: string) {
    const pollingAgent = new PollingAgent(
      this.controlPlaneClient,
      this.authHeader,
      {
        name: service,
      }
    );

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
  service<T extends ServiceDefinition<N>, N extends string>(
    service: T
  ): RegisteredService<T> {
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

  client<T extends RegisteredService<any>>(
    service: T["definition"]["name"]
  ): ServiceClient<T>;

  client<T extends RegisteredService<any>>(
    service: T["definition"]["name"],
    options: { background: true }
  ): BackgroundServiceClient<T>;

  /**
   * Provides a type safe client for performing calls to a registered service.
   * Waits for the function to complete before returning, and returns the result of the function call.
   * @returns ServiceClient<T>
   * @example
   * ```ts
   * import { d } from "./differential";
   * import type { helloService } from "./hello-service";
   *
   * const client = d.client<helloService>("hello");
   *
   * // Client usage
   * const result = client.hello("world");
   * console.log(result); // "Hello world"
   * ```
   */
  client<T extends RegisteredService<any>>(
    service: T["definition"]["name"],
    options?: {
      background?: boolean;
    }
  ): ServiceClient<T> {
    const d = this;

    if (options?.background === true) {
      return new Proxy({} as BackgroundServiceClient<T>, {
        get(_target, property, _receiver) {
          return (...args: any[]) =>
            d.background(service, property, ...(args as any));
        },
      });
    } else {
      return new Proxy({} as ServiceClient<T>, {
        get(_target, property, _receiver) {
          return (...args: any[]) =>
            d.call(service, property, ...(args as any));
        },
      });
    }
  }

  /**
   * @ignore
   * @deprecated Use `d.client` instead.
   */
  async call<
    T extends RegisteredService<any>,
    U extends keyof T["definition"]["functions"]
  >(
    service: T["definition"]["name"],
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<ReturnType<T["definition"]["functions"][U]>> {
    // create a job
    const id = await this.createJob<T, U>(service, fn, args);

    // wait for the job to complete
    const result = await pollForJob(
      this.controlPlaneClient,
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
   * @ignore
   * @deprecated Use `d.client` instead.
   */
  async background<
    T extends RegisteredService<any>,
    U extends keyof T["definition"]["functions"]
  >(
    service: T["definition"]["name"],
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<{ id: string }> {
    // create a job
    const id = await this.createJob<T, U>(service, fn, args);

    return { id };
  }

  private async createJob<
    T extends RegisteredService<any>,
    U extends keyof T["definition"]["functions"]
  >(
    service: T["definition"]["name"],
    fn: string | number | symbol,
    args: Parameters<T["definition"]["functions"][U]>
  ) {
    log("Creating job", { service, fn, args });

    return await this.controlPlaneClient
      .createJob({
        body: {
          service,
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
          throw new DifferentialError(DifferentialError.UNAUTHORISED);
        } else {
          throw new DifferentialError(`Failed to create job: ${res.status}`);
        }
      });
  }
}
