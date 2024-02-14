import debug from "debug";
import { createClient } from "./create-client";
import { unpack } from "./serialize";
import { Result } from "./task-queue";

const log = debug("differential:client");

type Workload = {
  jobId: string;
  attempts: number;
  result?: Result;
  onResult: (err: Error, result: Result) => void;
};

// this is a utility function that polls a batch job until it's done
// it batches the requests to avoid hitting the server too hard

export class ResultsPoller {
  private static MAX_ERROR_CYCLES = 50;
  private currentErrorCycle = 0;
  private exited = false;

  constructor(
    private client: ReturnType<typeof createClient>,
    private authHeader: string,
  ) {
    this.exited = false;
  }

  private jobs: {
    [jobId: string]: Workload;
  } = {};

  private addJob(
    jobId: string,
    onResult: (err: Error, result: Result) => void,
  ) {
    this.jobs[jobId] = {
      jobId,
      attempts: 0,
      onResult,
    };
  }

  private next = async () => {
    const unresolved = Object.values(this.jobs).filter((job) => {
      return job.result === undefined;
    });

    const result = await this.client.getJobStatuses({
      body: {
        jobIds: unresolved.map((job) => job.jobId),
      },
      headers: {
        authorization: this.authHeader,
      },
    });

    switch (result.status) {
      case 200: {
        for (const job of result.body.filter(
          (job) => job.status === "success" || job.status === "failure",
        )) {
          this.jobs[job.id].result = {
            content: unpack(job.result!),
            type: job.resultType!,
          };

          this.jobs[job.id].onResult(null!, this.jobs[job.id].result as Result);
        }

        this.currentErrorCycle = 0;

        break;
      }
      case 429: {
        log("Rate limited, waiting for 5s");

        // rate limited, wait for 5s
        await new Promise((resolve) => setTimeout(resolve, 5000));

        break;
      }
      default: {
        log("Error polling jobs", result);

        // unknown error, wait for 5s
        await new Promise((resolve) => setTimeout(resolve, 5000));

        this.currentErrorCycle++;

        if (this.currentErrorCycle > ResultsPoller.MAX_ERROR_CYCLES) {
          log("Too many errors occurred while polling jobs", result);

          const error = new Error(
            "Too many errors occurred while polling jobs",
          );

          for (const job of unresolved) {
            log(
              "Failing job due to too many errors on control-plane",
              job.jobId,
            );
            job.onResult(error, null!);
          }
        }

        break;
      }
    }
  };

  public start = async () => {
    while (true) {
      if (this.exited) {
        break;
      }

      await this.next();
    }
  };

  public stop = () => {
    this.exited = true;
  };

  public getResult = (
    jobId: string,
    onResult: (err: Error, r: Result) => void,
  ) => {
    this.addJob(jobId, (err, result) => {
      onResult(err, result);
      delete this.jobs[jobId];
    });
  };
}
