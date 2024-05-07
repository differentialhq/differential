import { initClient, tsRestFetchApi } from "@ts-rest/core";
import debug from "debug";
import {
  CallConfig,
  CallConfiguredBackgroundFunction,
  CallConfiguredFunction,
  extractCallConfig,
} from "./call-config";
import { contract } from "./contract";
import { DifferentialError } from "./errors";
import { Events } from "./events";
import { ResultsPoller } from "./results-poller";
import { pack, unpack } from "./serialize";
import { deserializeError, serializeError } from "./serialize-error";
import { Result, TaskQueue } from "./task-queue";
import { AsyncFunction } from "./types";
import zodToJsonSchema from "zod-to-json-schema";

const log = debug("differential:client");

type ServiceClient<T extends RegisteredService<any>> = {
  [K in keyof T["definition"]["functions"]]: CallConfiguredFunction<
    T["definition"]["functions"][K]["func"]
  >;
};

type BackgroundServiceClient<T extends RegisteredService<any>> = {
  [K in keyof T["definition"]["functions"]]: CallConfiguredBackgroundFunction<
    T["definition"]["functions"][K]["func"]
  >;
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

const createClient = ({
  baseUrl,
  machineId,
  deploymentId,
  clientAbortController,
}: {
  baseUrl: string;
  machineId: string;
  deploymentId?: string;
  clientAbortController?: AbortController;
}) =>
  initClient(contract, {
    baseUrl,
    baseHeaders: {
      "x-machine-id": machineId,
      ...(deploymentId && { "x-deployment-id": deploymentId }),
    },
    api: clientAbortController
      ? (args) => {
          return tsRestFetchApi({
            ...args,
            signal: clientAbortController.signal,
          });
        }
      : undefined,
  });

type ServiceRegistryFunction = {
  fn: AsyncFunction;
  name: string;
};

const functionRegistry: { [key: string]: ServiceRegistryFunction } = {};

type PollingAgentService = {
  name: string;
  idleTimeout?: number;
  onIdle?: () => void;
};

type PollingAgentOptions = {
  endpoint: string;
  machineId: string;
  validateBeforeSerialization: boolean;
  deploymentId?: string;
  authHeader: string;
  service: PollingAgentService;
  ttl?: number;
  maxIdleCycles?: number;
  exitHandler: () => void;
};

class PollingAgent {
  private errorCount = 0;
  private idleCycleCount = 0;
  private taskQueue = new TaskQueue();
  private abortController = new AbortController();
  private pollingAborted = false;
  private active = false;
  private exitHandler: () => void;

  private pollState = {
    current: 0,
    concurrency: 100,
  };

  private client: ReturnType<typeof createClient>;
  private authHeader: string;
  private service: PollingAgentService;
  private ttl?: number;
  private maxIdleCycles?: number;
  private validateBeforeSerialization: boolean;

  constructor(options: PollingAgentOptions) {
    this.authHeader = options.authHeader;
    this.service = options.service;
    this.ttl = options.ttl;
    this.maxIdleCycles = options.maxIdleCycles;
    this.exitHandler = options.exitHandler;
    this.validateBeforeSerialization = options.validateBeforeSerialization;

    this.client = createClient({
      baseUrl: options.endpoint,
      machineId: options.machineId,
      deploymentId: options.deploymentId,
      clientAbortController: this.abortController,
    });
  }

  private async pollForNextJob(): Promise<{
    jobCount: number;
    ok: boolean;
  }> {
    log("Polling for next job", { service: this.service });

    if (this.pollState.concurrency <= this.pollState.current) {
      log("Max concurrency reached");
      return {
        jobCount: 0,
        ok: true,
      };
    }

    // TODO: cache this
    const functions = Object.entries(functionRegistry)
      .filter(([, { name }]) => name === this.service.name)
      .map(([functionName, config]) => ({
        name: functionName,
        schema: JSON.stringify(zodToJsonSchema(config.fn.input)),
      }));

    console.log(functions);

    const pollResult = await this.client
      .createJobsRequest({
        body: {
          limit: Math.ceil(
            (this.pollState.concurrency - this.pollState.current) / 2,
          ),
          ttl: this.ttl,
          service: this.service.name,
          // TODO: send this conditionally, only when it has changed
          functions,
        },
        headers: {
          authorization: this.authHeader,
        },
      })
      .catch((e) => {
        if (e.name === "AbortError") {
          log("Polling aborted");

          return {
            status: -1,
          } as const;
        } else {
          log(`Failed to poll for next job: ${e.message}`);

          return {
            status: -1,
          } as const;
        }
      });

    if (pollResult.status === 400) {
      log("Error polling for next job", JSON.stringify(pollResult.body));

      return {
        jobCount: 0,
        ok: false,
      };
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

          const onComplete = async (result: Result) => {
            log("Persisting job result", {
              id: job.id,
              targetFn: job.targetFn,
              resultType: result.type,
              functionExecutionTime: result.functionExecutionTime,
            });

            await this.client
              .persistJobResult({
                body: {
                  result: pack(
                    result.content,
                    this.validateBeforeSerialization,
                  ),
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
                    },
                  );
                }
              })
              .finally(() => {
                this.pollState.current -= 1;
              });
          };

          if (!registered) {
            const error = new DifferentialError(
              `Function was not registered. name='${job.targetFn}'`,
            );

            await onComplete({
              type: "rejection",
              content: serializeError(error),
              functionExecutionTime: 0,
            });
          } else {
            const args: Parameters<AsyncFunction["func"]> = unpack(
              job.targetArgs,
            );

            log("Executing fn", {
              id: job.id,
              targetFn: job.targetFn,
              registeredFn: registered.fn,
              args,
            });

            this.taskQueue.addTask(registered.fn.func, args, onComplete);
          }
        }),
      );

      return {
        jobCount: jobs.length,
        ok: true,
      };
    } else if (pollResult.status === 401) {
      throw new DifferentialError(DifferentialError.UNAUTHORISED);
    } else {
      log("Error polling for next job", { pollResult });

      return {
        jobCount: 0,
        ok: false,
      };
    }
  }

  private async poll(): Promise<void> {
    if (this.abortController.signal.aborted) {
      this.pollingAborted = true;
      log("Polling aborted");
      return;
    }

    const [{ ok, jobCount }] = await Promise.all([
      await this.pollForNextJob(),
      await new Promise((resolve) => setTimeout(resolve, 2000)), // this acts as a throttle
    ]);

    if (ok) {
      this.errorCount = 0;
      jobCount > 0 ? (this.idleCycleCount = 0) : this.idleCycleCount++;
    } else {
      this.errorCount += 1;
    }

    if (this.errorCount > 10) {
      log("Too many errors, stopping polling agent", { service: this.service });
      this.quit();
    }

    if (this.maxIdleCycles && this.idleCycleCount >= this.maxIdleCycles) {
      log("Max idle cycles reached, stopping polling agent", {
        service: this.service,
      });
      this.quit();
    }

    return this.poll();
  }

  start() {
    log("Starting polling agent", { service: this.service });

    this.active = true;

    this.poll();
  }

  async quit(): Promise<void> {
    if (!this.active) {
      return;
    }

    log("Quitting polling agent", { service: this.service });

    this.abortController.abort();
    await this.taskQueue.quit();

    // wait for pollingAborted to be set to true
    while (!this.pollingAborted) {
      log("Waiting for polling to abort");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.active = false;
    this.exitHandler();
    log("Polling aborted");
  }

  setConcurrency(concurrency: number) {
    this.pollState.concurrency = concurrency;
  }

  public get serviceName(): string {
    return this.service.name;
  }

  public get polling(): boolean {
    return this.active;
  }
}

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
  private apiSecret: string;
  private authHeader: string;
  private endpoint: string;
  private machineId: string;
  private deploymentId?: string;
  private controlPlaneClient: ReturnType<typeof createClient>;
  private validateBeforeSerialization: boolean = true;

  private jobPollWaitTime?: number;
  private maxIdleCycles?: number;

  private pollingAgents: PollingAgent[] = [];

  private events: Events;

  private resultsPoller: ResultsPoller;

  /**
   * Initializes a new Differential instance.
   * @param apiSecret The API Secret for your Differential cluster. If not provided, it will be read from the `DIFFERENTIAL_API_SECRET` environment variable. You can obtain one from https://api.differential.dev/demo/token.
   * @param options Additional options for the Differential client.
   * @param options.endpoint The endpoint for the Differential cluster. Defaults to https://api.differential.dev.
   * @param options.encryptionKeys An array of encryption keys to use for encrypting and decrypting data. These keys are never sent to the control-plane and allows you to encrypt function arguments and return values. If you do not provide any keys, Differential will not encrypt any data. Encryption has a performance impact on your functions. When you want to rotate keys, you can add new keys to the start of the array. Differential will try to decrypt data with each key in the array until it finds a key that works. Differential will encrypt data with the first key in the array. Each key must be 32 bytes long.
   * @param options.jobPollWaitTime The amount of time in milliseconds that the client will maintain a connection to the control-plane when polling for jobs. Defaults to 20000ms. If a job is not received within this time, the client will close the connection and try again.
   * @param options.validateBeforeSerialization If set to false, Differential will not validate the data before serializing it. This can be useful for performance reasons, but can lead to unexpected results if the data is not serializable. Defaults to true.
   *
   * @example
   * ```ts
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
   * ```
   */
  constructor(
    apiSecret?: string,
    options?: {
      endpoint?: string;
      encryptionKeys?: Buffer[];
      jobPollWaitTime?: number;
      validateBeforeSerialization?: boolean;
    },
  ) {
    if (apiSecret && process.env.DIFFERENTIAL_API_SECRET) {
      log(
        "API Secret was provided as an argument and environment variable. Constructor argument will be used.",
      );
    }

    apiSecret = apiSecret || process.env.DIFFERENTIAL_API_SECRET;

    if (!apiSecret) {
      throw new DifferentialError("No API Secret provided.");
    }

    this.apiSecret = apiSecret;

    this.authHeader = `Basic ${this.apiSecret}`;
    this.endpoint = options?.endpoint || "https://api.differential.dev";
    this.machineId = Math.random().toString(36).substring(7);

    this.deploymentId = process.env.DIFFERENTIAL_DEPLOYMENT_ID;

    if (process.env.DIFFERENTIAL_DEPLOYMENT_PROVIDER === "lambda") {
      this.maxIdleCycles = 2;
    }

    options?.encryptionKeys?.forEach((key, i) => {
      if (key.length !== 32) {
        throw new DifferentialError(
          `Encryption keys must be 32 bytes long. Received key of length ${key.length} at index ${i}`,
        );
      }
    });

    const jobPollWaitTime = options?.jobPollWaitTime || 20000;

    if (jobPollWaitTime < 5000) {
      throw new DifferentialError("jobPollWaitTime must be at least 5000ms");
    }

    this.jobPollWaitTime = options?.jobPollWaitTime;

    log("Initializing control plane client", {
      endpoint: this.endpoint,
      machineId: this.machineId,
    });

    this.controlPlaneClient = createClient({
      baseUrl: this.endpoint,
      machineId: this.machineId,
      deploymentId: this.deploymentId,
    });

    this.events = new Events(async (events) => {
      const result = await this.controlPlaneClient.ingestClientEvents({
        body: { events: events },
        headers: {
          authorization: this.authHeader,
        },
      });
      log("Sent metrics to control plane", {
        result: result,
      });
    });

    this.resultsPoller = new ResultsPoller(
      this.controlPlaneClient,
      this.authHeader,
    );

    this.resultsPoller.start();
  }

  public get secretPartial(): string {
    return (this.apiSecret || "").substring(0, 4) + "...";
  }

  private async listen(service: ServiceDefinition<any>) {
    this.events.startResourceProbe();
    if (
      this.pollingAgents.find(
        (p) => p.serviceName === service.name && p.polling,
      )
    ) {
      throw new DifferentialError(`Service is already started`, {
        serviceName: service.name,
      });
    }

    const pollingAgent = new PollingAgent({
      endpoint: this.endpoint,
      machineId: this.machineId,
      authHeader: this.authHeader,
      deploymentId: this.deploymentId,
      service: {
        name: service.name,
      },
      ttl: this.jobPollWaitTime,
      maxIdleCycles: this.maxIdleCycles,
      exitHandler: () => {
        const pollingAgents = this.pollingAgents.find((agent) => agent.polling);
        if (!pollingAgents) {
          log("All polling agents quit");
          this.stop();
        }
      },
      validateBeforeSerialization: this.validateBeforeSerialization,
    });

    this.pollingAgents.push(pollingAgent);

    pollingAgent.start();
  }

  private async stop(): Promise<void> {
    this.events.stopResourceProbe();

    await Promise.all(this.pollingAgents.map((agent) => agent.quit()));

    log("All polling agents quit", {
      count: this.pollingAgents.length,
    });

    await this.resultsPoller.stop();
  }

  private register({
    fn,
    name,
    serviceName,
  }: {
    fn: AsyncFunction;
    name: string;
    serviceName: string;
  }) {
    if (typeof fn.func !== "function") {
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
      name: serviceName,
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
    service: T,
  ): RegisteredService<T> {
    for (const [key, value] of Object.entries(service.functions)) {
      if (functionRegistry[key]) {
        throw new DifferentialError(
          `Function name '${key}' is already registered by another service.`,
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
      start: () => this.listen(service),
      stop: () => this.stop(),
    };
  }

  client<T extends RegisteredService<any>>(
    service: T["definition"]["name"],
  ): ServiceClient<T>;

  client<T extends RegisteredService<any>>(
    service: T["definition"]["name"],
    options: { background: true },
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
    },
  ): ServiceClient<T> | BackgroundServiceClient<T> {
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
    U extends keyof T["definition"]["functions"],
  >(
    service: T["definition"]["name"],
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<ReturnType<T["definition"]["functions"][U]>> {
    const start = Date.now();
    // create a job
    const { id, callConfig } = await this.createJob<T, U>(service, fn, args);

    log("Waiting for job to complete", { id });

    return new Promise((resolve, reject) => {
      this.resultsPoller.getResult(id, callConfig, (result) => {
        log("Got result", { fn, id, result });

        const end = Date.now();

        this.events.push({
          timestamp: new Date(),
          type: "functionInvocation",
          tags: {
            function: fn as string,
            service: service,
          },
          intFields: {
            roundTripTime: end - start,
          },
        });

        log("Result received", { id, result });

        if (result.type === "resolution") {
          // return the result
          return resolve(
            result.content as ReturnType<T["definition"]["functions"][U]>,
          );
        } else if (result.type === "rejection") {
          const error = deserializeError(result.content);
          return reject(error);
        } else {
          return reject(new DifferentialError("Unexpected result type"));
        }
      });
    });
  }

  /**
   * @ignore
   * @deprecated Use `d.client` instead.
   */
  async background<
    T extends RegisteredService<any>,
    U extends keyof T["definition"]["functions"],
  >(
    service: T["definition"]["name"],
    fn: U,
    ...args: Parameters<T["definition"]["functions"][U]>
  ): Promise<{ id: string }> {
    // create a job
    const { id } = await this.createJob<T, U>(service, fn, args);

    return { id };
  }

  private async createJob<
    T extends RegisteredService<any>,
    U extends keyof T["definition"]["functions"],
  >(
    service: T["definition"]["name"],
    fn: string | number | symbol,
    args: Parameters<T["definition"]["functions"][U]>,
  ): Promise<{
    id: string;
    callConfig: CallConfig;
  }> {
    log("Creating job", { service, fn, args });

    const { callConfig, originalArgs } = extractCallConfig(args);

    const TODO_CONFIGURE_RETRY_COUNT_ON_STALL = 3;
    const TODO_CONFIGURE_PREDICTIVE_RETRIES_ON_REJECTION = false;
    const TODO_CONFIGURE_TIMEOUT_SECONDS = 300;

    const effectiveCallConfig = {
      cache: callConfig?.cache,
      retryCountOnStall:
        callConfig?.retryCountOnStall ?? TODO_CONFIGURE_RETRY_COUNT_ON_STALL,
      predictiveRetriesOnRejection:
        callConfig?.predictiveRetriesOnRejection ??
        TODO_CONFIGURE_PREDICTIVE_RETRIES_ON_REJECTION,
      timeoutSeconds:
        callConfig?.timeoutSeconds ?? TODO_CONFIGURE_TIMEOUT_SECONDS,
    };

    const result = await this.controlPlaneClient.createJob({
      body: {
        service,
        targetFn: fn as string,
        targetArgs: pack(originalArgs, this.validateBeforeSerialization),
        callConfig: effectiveCallConfig,
      },
      headers: {
        authorization: this.authHeader,
      },
    });

    log("Job created", { service, fn, args, body: result.body });

    if (result.status === 201) {
      return {
        id: result.body.id,
        callConfig: effectiveCallConfig,
      };
    } else if (result.status === 401) {
      throw new DifferentialError(DifferentialError.UNAUTHORISED);
    } else {
      throw new DifferentialError(`Failed to create job: ${result.status}`);
    }
  }
}
