import msgpackr from "msgpackr";
import * as eventAggregation from "../observability/event-aggregation";
import * as events from "../observability/events";
import { serializeError } from "../predictor/serialize-error";
import {
  functionDefinition,
  getServiceDefinitions,
} from "../service-definitions";
import { createOwner } from "../test/util";
import {
  createJob,
  getJobStatus,
  getJobStatuses,
  nextJobs,
  persistJobResult,
} from "./jobs";
import { selfHealJobs } from "./persist-result";

const mockTargetFn = "testTargetFn";
const mockTargetArgs = "testTargetArgs";

describe("createJob", () => {
  it("should create a job", async () => {
    const owner = await createOwner();

    const result = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner,
      service: "testService",
    });

    expect(result.id).toBeDefined();
  });
});

describe("nextJobs", () => {
  const mockMachineId = "testMachineId";
  const mockIp = "127.0.0.1";
  const mockLimit = 5;

  let owner: { clusterId: string };

  beforeAll(async () => {
    owner = await createOwner();
  });

  it("should be able to return spefic jobs per service", async () => {
    const fnName = `testfn${Date.now()}`;
    const serviceName = `testService${Date.now()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner,
      service: serviceName,
    });

    const result = await nextJobs({
      owner,
      limit: mockLimit,
      machineId: mockMachineId,
      ip: mockIp,
      service: serviceName,
    });

    expect(result.length).toBe(1);

    expect(result).toStrictEqual([
      {
        id,
        targetArgs: "testTargetArgs",
        targetFn: fnName,
      },
    ]);
  });

  it("should persist the service definition", async () => {
    const service = `service-def`;

    const definition = {
      name: service,
      functions: [
        {
          name: Math.random().toString(),
          rate: {
            per: "minute" as const,
            limit: 1000,
          },
          cacheTTL: 1000,
        },
      ],
    };

    await nextJobs({
      owner,
      limit: mockLimit,
      machineId: mockMachineId,
      ip: mockIp,
      service,
      definition,
    });

    const stored = await getServiceDefinitions(owner);

    expect(stored).toStrictEqual([definition]);
  });
});

describe("selfHealJobs", () => {
  it("should mark a job for retries, once it has timed out", async () => {
    const owner = await createOwner();
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";

    const fnDefinition = {
      maxAttempts: 2,
      name: "testTargetFn",
      timeoutIntervalSeconds: 1,
    };

    // feed a service definition with retry config
    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
      definition: {
        name: "testService",
        functions: [fnDefinition],
      },
    });

    const saved = await functionDefinition(owner, "testService", targetFn);

    expect(saved).toStrictEqual(fnDefinition);

    const createJobResult = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner,
      service: "testService",
    });

    // get the job, so that it moves to running state
    const nextJobResult = await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

    expect(nextJobResult.length).toBe(1);
    expect(nextJobResult[0].id).toBe(createJobResult.id);

    // wait for the job to timeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // run the self heal job
    const healedJobs = await selfHealJobs();

    expect(healedJobs.stalledFailedByTimeout).toContain(createJobResult.id);
    expect(healedJobs.stalledRecovered).toContain(createJobResult.id);

    // query the next job, it should be good to go
    const nextJobResult2 = await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

    expect(nextJobResult2.length).toBe(1);
    expect(nextJobResult2[0].id).toBe(createJobResult.id);
  }, 10000);

  it("should not retry a job that has reached max attempts", async () => {
    const owner = await createOwner();
    const targetFn = "testTargetFn";

    const fnDefinition = {
      maxAttempts: 1,
      name: "testTargetFn",
      timeoutIntervalSeconds: 1,
    };

    // feed a service definition with retry config
    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
      definition: {
        name: "testService",
        functions: [fnDefinition],
      },
    });

    const saved = await functionDefinition(owner, "testService", targetFn);

    expect(saved).toStrictEqual(fnDefinition);

    const createJobResult = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner,
      service: "testService",
    });

    // get the job, so that it moves to running state
    const nextJobResult = await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

    expect(nextJobResult.length).toBe(1);
    expect(nextJobResult[0].id).toBe(createJobResult.id);

    // wait for the job to timeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // run the self heal job
    const healedJobs = await selfHealJobs();

    expect(healedJobs.stalledFailedByTimeout).toContain(createJobResult.id);
    expect(healedJobs.stalledRecovered).not.toContain(createJobResult.id);

    // query the next job, it should not appear
    const nextJobResult2 = await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

    expect(nextJobResult2.length).toBe(0);
  }, 10000);
});

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

    const result = {
      id: createJobResult.id,
      result: "testResult",
    };

    await persistJobResult({
      result: "foo",
      resultType: "resolution",
      jobId: createJobResult.id,
      owner,
      machineId: "testMachineId",
    });

    const status = await getJobStatus({
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

    const owner = await createOwner({
      predictiveRetriesEnabled: true,
    });
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";

    const definition = {
      name: "testService",
      functions: [
        {
          name: "testTargetFn",
          maxAttempts: 2,
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
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";
    const service = "testService";

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service,
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
});

describe("getJobStatuses", () => {
  it("should get statuses of multiple jobs", async () => {
    const owner = await createOwner();
    const targetFn = "testTargetFn";
    const targetArgs = "testTargetArgs";

    const createJobResult = await createJob({
      targetFn,
      targetArgs,
      owner,
      service: "testService",
    });

    const otherJobs = [];

    // other jobs
    for (let i = 0; i < 3; i++) {
      const otherJob = await createJob({
        targetFn: `testTargetFn${i}`,
        targetArgs: `testTargetArgs${i}`,
        owner,
        service: "testService",
      });

      otherJobs.push(otherJob);
    }

    await persistJobResult({
      result: "foo",
      resultType: "resolution",
      jobId: createJobResult.id,
      owner,
      machineId: "testMachineId",
    });

    const result = await getJobStatuses({
      jobIds: [createJobResult.id, ...otherJobs.map((x) => x.id)],
      owner,
    });

    expect(result).toContainEqual({
      id: createJobResult.id,
      result: "foo",
      resultType: "resolution",
      service: "testService",
      status: "success",
    });

    expect(result).toContainEqual({
      id: otherJobs[0].id,
      status: "pending",
      result: null,
      resultType: null,
      service: "testService",
    });
  });

  it("must exit successfully even if no jobs have completed", async () => {
    const owner = await createOwner();

    const jobs = [];

    // other jobs
    for (let i = 0; i < 3; i++) {
      const otherJob = await createJob({
        targetFn: `testTargetFn${i}`,
        targetArgs: `testTargetArgs${i}`,
        owner,
        service: "testService",
      });

      jobs.push(otherJob);
    }

    const result = await getJobStatuses({
      jobIds: jobs.map((x) => x.id),
      owner,
      longPollTimeout: 2000,
    });

    expect(result).toContainEqual({
      id: jobs[0].id,
      status: "pending",
      result: null,
      resultType: null,
      service: "testService",
    });

    expect(result).toHaveLength(3);
  });
});
