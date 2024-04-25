import { getServiceDefinitions } from "../service-definitions";
import { createOwner } from "../test/util";
import { createJob, getJobStatuses, nextJobs, persistJobResult } from "./jobs";
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

    const createJobResult = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner,
      service: "testService",
      callConfig: {
        retryCountOnStall: 2,
        predictiveRetriesOnRejection: false,
        timeoutSeconds: 1,
      },
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
  });

  it("should not retry a job that has reached max attempts", async () => {
    const owner = await createOwner();

    const createJobResult = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner,
      service: "testService",
      callConfig: {
        retryCountOnStall: 0,
        predictiveRetriesOnRejection: false,
        timeoutSeconds: 1,
      },
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

    await nextJobs({
      owner,
      limit: 10,
      machineId: "testMachineId",
      ip: "1.1.1.1",
      service: "testService",
    });

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
      status: "running",
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
