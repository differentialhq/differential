import { initClient } from "@ts-rest/core";
import debug from "debug";
import { contract } from "./contract";
import { pack, unpack } from "./serialize";
import { ListenerConfig } from "./ListenerConfig";

const log = debug("differential:client");

const { serializeError, deserializeError } = require("./errors");

type AssertPromiseReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R extends Promise<any>
    ? T
    : "Any function that is passed to fn must return a Promise. Fix this by making the inner function async."
  : "Any function that is passed to fn must return a Promise. Fix this by making the inner function async.";

const cyrb53 = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
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

const functionRegistry: { [key: string]: Function } = {};

const pollState = {
  current: 0,
  concurrency: 100,
  polling: false, // this is the polling state for the currently executing job.
};

type Result<T = unknown> = {
  content: T;
  type: "resolution" | "rejection";
};

const executeFn = async (fn: Function, args: unknown[]): Promise<Result> => {
  try {
    const result = await fn(...args);

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
  machineType?: string
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
          machineTypes: machineType, // TODO: machineTypes -> machineType
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
          const fn = functionRegistry[job.targetFn];

          log("Executing job", job.id, job.targetFn);

          let result: Result;

          if (!fn) {
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
            const args = unpack(job.targetArgs);
            result = await executeFn(fn, args);
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

export class Differential {
  private authHeader: string;
  private pollJobsTimer: NodeJS.Timeout | undefined;
  private endpoint: string;
  private machineId: string;
  private client: ReturnType<typeof createClient>;

  /**
   * waking up is done by sending a request to the health check url directly
   * so that the network doesn't have to be configured to allow incoming requests.
   * from the outside.
   */
  private onWork = async (runsOn?: string): Promise<void> => {
    const listeners = runsOn
      ? this.listeners?.filter((l) => l.machineType === runsOn)
      : this.listeners;

    for (const listener of listeners ?? []) {
      listener.onWork?.();
    }
  };

  /**
   * Initializes a new Differential instance.
   * @param apiSecret The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard).
   * @param listeners An array of listener configurations to use for listening for jobs. A listener listens for work and executes them in the host compute environment.
   * @param params Parameters for initializing a new Differential instance.
   * @param params.encryptionKeys An array of encryption keys to use for encrypting and decrypting your function arguments before being sent to Differential and after being received from Differential. This is useful for encrypting sensitive data, but does have a performance impact. If you do not provide any encryption keys, Differential will not encrypt your function arguments.
   * @param params.endpoint The endpoint of your Differential cluster. Defaults to `https://api.differential.dev`.
   * @param params.machineId A unique identifier for the process that runs this instance. Appears in the console logs of your Differential cluster. Defaults to a random string.
   * @param params.listeners An array of listeners to use for listening for jobs.
   *
   * @example Basic usage
   * ```ts
   *  const d = new Differential("API_SECRET", []);
   * ```
   * @example With listeners
   * ```ts
   * const d = new Differential("API_SECRET", [
   *   // background worker can keep running
   *   new ListenerConfig({
   *     machineType: "background-worker",
   *   }),
   *   // image processor should scale in and out when there's no work
   *   // because it's expensive to keep running
   *   new ListenerConfig({
   *     machineType: "image-processor",
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
  constructor(
    private apiSecret: string,
    private listeners?: ListenerConfig[],
    params?: {
      encryptionKeys?: string[];
      endpoint?: string;
      machineId?: string;
    }
  ) {
    this.authHeader = `Basic ${this.apiSecret}`;
    this.endpoint = params?.endpoint ?? "https://api.differential.dev";
    this.machineId =
      params?.machineId ?? Math.random().toString(36).substring(7);

    log("Initializing client", {
      endpoint: this.endpoint,
      machineId: this.machineId,
    });

    this.client = createClient(this.endpoint, this.machineId);
  }

  /**
   * Listens for jobs and executes them in the host compute environment. This method is non-blocking.
   * @param listenParams
   * @param listenParams.asMachineType The machine type to listen for jobs for. If not provided, all machine types will be listened for.
   * @param listenParams.registerPaths An array of paths to register for differential functions. Differential functions are functions that are registered with d.fn() or d.background(). This function will scan these paths for functions that are wrapped and register them with Differential.
   *
   * @example Basic usage
   * ```ts
   * d.listen();
   * ```
   *
   * @example With machine type
   * ```ts
   * d.listen({
   *  asMachineType: "image-processor",
   *  registerPaths: ["./modules/image-processor/index"]
   * });
   */
  listen(listenParams?: { asMachineType?: string; registerPaths?: string[] }) {
    for (const path of listenParams?.registerPaths ?? []) {
      log("Registering path for differential functions", path);
      require(path);
    }

    let lastTimeWeHadJobs = Date.now();

    const initMachineTypes = this.listeners?.map(
      (listener) => listener.machineType
    );

    if (
      listenParams?.asMachineType &&
      !initMachineTypes?.includes(listenParams?.asMachineType)
    ) {
      throw new DifferentialError(
        `Machine type '${listenParams?.asMachineType}' is not configured in listeners`
      );
    }

    const listener = this.listeners?.find(
      (listener) => listener.machineType === listenParams?.asMachineType
    );

    this.pollJobsTimer = setInterval(async () => {
      const result = await pollForNextJob(
        this.client,
        this.authHeader,
        listenParams?.asMachineType
      );

      if (result?.jobCount === 0 && listener?.idleTimeout) {
        const timeSinceLastJob = Date.now() - lastTimeWeHadJobs;

        if (timeSinceLastJob > listener?.idleTimeout) {
          log("Idle timeout reached");
          listener?.onIdle?.();
        }
      } else {
        lastTimeWeHadJobs = Date.now();
      }
    }, 1000);
  }

  /**
   * Stops listening for jobs, and waits for all currently executing jobs to finish. Useful for a graceful shutdown.
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
  quit(): Promise<void> {
    clearInterval(this.pollJobsTimer);

    return new Promise((resolve) => {
      if (pollState.polling) {
        const quitTimer: NodeJS.Timeout = setInterval(() => {
          log("Waiting for polling to finish");
          if (!pollState.polling) {
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

  /**
   * Register a foreground function with Differential. The inner function will be executed in the host compute environment, and the result will be returned to the caller.
   * @param f The function to register with Differential. Can be any async function.
   * @param options
   * @param options.name The name of the function. Defaults to the name of the function passed in, or a hash of the function if it is anonymous. Differential does a good job of uniquely identifying the function across different runtimes, as long as the source code is the same. Specifying the function name would be helpful if the source code between your nodes is somehow different, and you'd like to ensure that the same function is being executed.
   * @param options.runOn The machine type to run this function on. If not provided, the function will be run on any machine type.
   * @returns A function that returns a promise that resolves to the result of the function.
   *
   * @example Basic usage
   * ```ts
   * const processImage = d.fn(async (image: Buffer) => {
   *   const processedImage = await imageProcessor.process(image);
   *   return processedImage;
   * }, {
   *   runOn: "image-processor"
   * });
   * ```
   */
  fn<T extends (...args: Parameters<T>) => ReturnType<T>>(
    f: AssertPromiseReturnType<T>,
    options?: {
      name?: string;
      runOn?: string;
    }
  ): T {
    if (typeof f !== "function") {
      throw new DifferentialError("fn must be a function");
    }

    const name = options?.name || f.name || cyrb53(f.toString()).toString();

    log(`Registering function`, {
      name,
    });

    if (!name) {
      throw new DifferentialError("Function must have a name");
    }

    functionRegistry[name] = f;

    return (async (...args: unknown[]) => {
      // wake up machine
      await this.onWork(options?.runOn);

      // create a job
      const id = await this.client
        .createJob({
          body: {
            targetFn: name,
            targetArgs: pack(args),
            machineType: options?.runOn,
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

      // wait for the job to complete
      pollState.polling = true;
      const result = await pollForJob(
        this.client,
        { jobId: id },
        this.authHeader
      );

      if (result.type === "resolution") {
        // return the result
        pollState.polling = false;
        return result.content;
      } else if (result.type === "rejection") {
        pollState.polling = false;
        const error = deserializeError(result.content);
        throw error;
      } else {
        throw new DifferentialError("Unexpected result type");
      }
    }) as unknown as T;
  }

  /**
   * Register a background function with Differential. The inner function will be executed asynchronously in the host compute environment. Good for set-and-forget functions.
   * @param f The function to register with Differential. Can be any async function.
   * @param options
   * @param options.name The name of the function. Defaults to the name of the function passed in, or a hash of the function if it is anonymous. Differential does a good job of uniquely identifying the function across different runtimes, as long as the source code is the same. Specifying the function name would be helpful if the source code between your nodes is somehow different, and you'd like to ensure that the same function is being executed.
   * @param options.runOn The machine type to run this function on. If not provided, the function will be run on any machine type.
   * @returns A promise that resolves to the job ID of the job that was created.
   *
   * @example Basic usage
   * ```ts
   * const report = d.background(async (data: { userId: string }) => {
   *   await db.insert(data);
   * }, {
   *   runOn: "background-worker"
   * });
   * ```
   */
  background<T extends (...args: Parameters<T>) => ReturnType<T>>(
    f: AssertPromiseReturnType<T>,
    options?: {
      name?: string;
      runOn?: string;
    }
  ): (...args: Parameters<T>) => Promise<{ id: string }> {
    if (typeof f !== "function") {
      throw new DifferentialError("fn must be a function");
    }

    const name = options?.name || f.name || cyrb53(f.toString()).toString();

    log(`Registering function`, {
      name,
    });

    if (!name) {
      throw new DifferentialError("Function must have a name");
    }

    functionRegistry[name] = f;

    return async (...args: unknown[]) => {
      // wake up machine
      await this.onWork(options?.runOn);

      // create a job
      const id = await this.client
        .createJob({
          body: {
            targetFn: name,
            targetArgs: pack(args),
            machineType: options?.runOn,
          },
          headers: {
            authorization: this.authHeader,
          },
        })
        .then((res) => {
          if (res.status === 201) {
            return res.body.id;
          } else {
            throw new DifferentialError(`Failed to create job: ${res.status}`);
          }
        });

      return { id };
    };
  }
}
