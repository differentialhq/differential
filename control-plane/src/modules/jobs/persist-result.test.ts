import msgpackr from "msgpackr";
import * as eventAggregation from "../observability/event-aggregation";
import * as events from "../observability/events";
import { serializeError } from "../predictor/serialize-error";
import { createOwner } from "../test/util";
import {
  createJob,
  getJobStatusSync,
  nextJobs,
  persistJobResult,
} from "./jobs";
import { selfHealJobs } from "./persist-result";

describe("persistJobResult", () => {
  it("should persist the result of a job", async () => {
    const owner = await createOwner();
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service: "testService",
    });

    const retrieved = await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

    expect(retrieved.length).toBe(1);

    const count = await persistJobResult({
      result: "foo",
      resultType: "resolution",
      jobId: createJobResult.id,
      owner,
      machineId: "testMachineId",
    });

    expect(count).toBe(1);

    const status = await getJobStatusSync({
      jobId: createJobResult.id,
      owner,
    });

    expect(status).toStrictEqual({
      result: "foo",
      resultType: "resolution",
      service: "testService",
      status: "success",
    });
  });

  it("should attempt to retry when predictive retries are enabled", async () => {
    await events.initialize();

    const owner = await createOwner();
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";

    const definition = {
      name: "testService",
      functions: [
        {
          name: "testTargetFn",
        },
      ],
    };

    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
      definition,
    });

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service: "testService",
      callConfig: {
        predictiveRetriesOnRejection: true,
      },
    });

    await persistJobResult({
      result: msgpackr
        .pack(serializeError(new Error("ECONNRESET")))
        .toString("base64"),
      resultType: "rejection",
      jobId: createJobResult.id,
      owner,
      machineId: "testMachineId",
    });

    await events.buffer?.flush();
    await events.quit();

    const eventsForJob = await eventAggregation.getJobActivityByJobId({
      jobId: createJobResult.id,
      clusterId: owner.clusterId,
    });

    expect(eventsForJob[0].type).toBe("predictorRetryableResult");

    expect(eventsForJob[0]).toEqual(
      expect.objectContaining({
        machineId: "testMachineId",
        type: "predictorRetryableResult",
        meta: expect.objectContaining({
          retryable: true,
        }),
      }),
    );
  }, 10000);

  it("should auto retry when a machine is stalled", async () => {
    const owner = await createOwner();
    const targetFn = "machineStallTestFn";
    const targetArgs = "testTargetArgs";
    const service = "testService";

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service,
      callConfig: {
        retryCountOnStall: 1,
      },
    });

    // last ping will be now
    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service,
    });

    const machineStallTimeout = 1;

    // wait 1s for the machine to stall
    await new Promise((resolve) =>
      setTimeout(resolve, machineStallTimeout * 1000),
    );

    // self heal jobs with machine stall timeout of 1s
    const healedJobs = await selfHealJobs({ machineStallTimeout });

    expect(
      healedJobs.stalledMachines.some(
        (x) => x.id === "testMachineId" && x.clusterId === owner.clusterId,
      ),
    ).toBe(true);
    expect(healedJobs.stalledRecovered).toContain(createJobResult.id);
  });

  it("should only accept the machine that's assigned to the job", async () => {
    const owner = await createOwner();
    const targetFn = "machineStallTestFn";
    const targetArgs = "testTargetArgs";
    const service = "testService";

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service,
      callConfig: {
        retryCountOnStall: 1,
      },
    });

    // last ping will be now
    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service,
    });

    // persist job results from both machines

    await persistJobResult({
      result: "foo",
      resultType: "resolution",
      jobId: createJobResult.id,
      owner,
      machineId: "testMachineId",
    });

    await persistJobResult({
      result: "bar",
      resultType: "resolution",
      jobId: createJobResult.id,
      owner,
      machineId: "otherMachineId",
    });

    const status = await getJobStatusSync({
      jobId: createJobResult.id,
      owner,
    });

    expect(status).toStrictEqual({
      result: "foo",
      resultType: "resolution",
      service,
      status: "success",
    });
  });
});
