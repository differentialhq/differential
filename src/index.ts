import { initClient } from "@ts-rest/core";
import { contract } from "./contract";
import { unpack, pack } from "./serialize";
import debug from "debug";

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

const createClient = (baseUrl: string) =>
  initClient(contract, {
    baseUrl,
    baseHeaders: {},
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
  polling: false,
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

export const pollForNextJob = async (
  client: ReturnType<typeof createClient>,
  authHeader: string,
  machineTypes?: string[]
) => {
  if (pollState.concurrency <= pollState.current) {
    log("Max concurrency reached");
    return;
  }

  const pollResult = await client
    .getNextJobs({
      query: {
        limit: Math.ceil((pollState.concurrency - pollState.current) / 2),
        machineTypes: machineTypes?.join(","),
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
  }

  if (pollResult.status === 200) {
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
            }' registeredFunctions='${Object.keys(functionRegistry).join(",")}'`
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
  }
};

export const Differential = (params: {
  apiSecret: string;
  encyptionKeys?: string[];
  endpoint?: string;
}) => {
  const authCredentials = params.apiSecret;
  const authHeader = `Basic ${authCredentials}`;

  let timer: NodeJS.Timeout;

  const endpoint = params.endpoint ?? "https://api.differential.dev";

  log("Initializing client", {
    endpoint,
  });

  const client = createClient(endpoint);

  return {
    listen: (listenParams?: { asMachineTypes?: string[] }) => {
      timer = setInterval(async () => {
        await pollForNextJob(client, authHeader, listenParams?.asMachineTypes);
      }, 1000);
    },
    quit: async (): Promise<void> => {
      clearInterval(timer);

      if (pollState.polling) {
        return new Promise((resolve) => {
          let quitTimer: NodeJS.Timeout = setInterval(() => {
            log("Waiting for polling to finish");
            if (!pollState.polling) {
              log("Polling finished");
              clearInterval(quitTimer);
              resolve();
            }
          }, 500);
        });
      }
    },
    fn: <T extends (...args: Parameters<T>) => ReturnType<T>>(
      f: AssertPromiseReturnType<T>,
      options?: {
        name?: string;
        runOn?: string;
      }
    ): T => {
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
        // create a job
        const id = await client
          .createJob({
            body: {
              targetFn: name,
              targetArgs: pack(args),
              machineType: options?.runOn,
            },
            headers: {
              authorization: authHeader,
            },
          })
          .then((res) => {
            if (res.status === 201) {
              return res.body.id;
            } else if (res.status === 401) {
              throw new DifferentialError(
                "Invalid API Key or API Secret. Make sure you are using the correct API Key and API Secret."
              );
            }
            {
              throw new DifferentialError(
                `Failed to create job: ${res.status}`
              );
            }
          });

        // wait for the job to complete
        pollState.polling = true;
        const result = await pollForJob(client, { jobId: id }, authHeader);

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
    },
    background: <T extends (...args: Parameters<T>) => ReturnType<T>>(
      f: AssertPromiseReturnType<T>,
      options?: {
        name?: string;
        runOn?: string;
      }
    ): ((...args: Parameters<T>) => Promise<{ id: string }>) => {
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
        // create a job
        const id = await client
          .createJob({
            body: {
              targetFn: name,
              targetArgs: pack(args),
              machineType: options?.runOn,
            },
            headers: {
              authorization: authHeader,
            },
          })
          .then((res) => {
            if (res.status === 201) {
              return res.body.id;
            } else {
              throw new DifferentialError(
                `Failed to create job: ${res.status}`
              );
            }
          });

        return { id };
      };
    },
  };
};
