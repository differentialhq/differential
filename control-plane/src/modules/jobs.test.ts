import { createJob, nextJobs } from "./jobs";

const mockOwner = { clusterId: "testClusterId" };
const mockTargetFn = "testTargetFn";
const mockTargetArgs = "testTargetArgs";
const mockPool = "testPool";

describe("createJob", () => {
  it("should create a job", async () => {
    const result = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      pool: mockPool,
      service: "testService",
    });

    expect(result.id).toBeDefined();
  });
});

describe("nextJobs", () => {
  const mockMachineId = "testMachineId";
  const mockIp = "127.0.0.1";
  const mockLimit = 5;

  // TODO: deprecate this test
  it("should update and return jobs for specified functions", async () => {
    const fnName = `testfn${Date.now()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      pool: mockPool,
      service: null,
    });

    const mockFunctions = fnName;

    const result = await nextJobs({
      functions: mockFunctions,
      owner: mockOwner,
      limit: mockLimit,
      machineId: mockMachineId,
      ip: mockIp,
      service: null,
    });

    expect(result).toStrictEqual([
      {
        id,
        targetArgs: "testTargetArgs",
        targetFn: fnName,
      },
    ]);
  });

  it("should be able to return spefic jobs per service", async () => {
    const fnName = `testfn${Date.now()}`;

    const serviceName = `testService${Date.now()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: serviceName,
    });

    const result = await nextJobs({
      owner: mockOwner,
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
});
