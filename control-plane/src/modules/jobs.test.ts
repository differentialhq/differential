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
    });

    expect(result.id).toBeDefined();
  });
});

describe("nextJobs", () => {
  const mockMachineId = "testMachineId";
  const mockIp = "127.0.0.1";
  const mockLimit = 5;

  it("should update and return jobs for specified functions", async () => {
    const fnName = `testfn${Date.now()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      pool: mockPool,
    });

    const mockFunctions = fnName;

    const result = await nextJobs({
      functions: mockFunctions,
      owner: mockOwner,
      limit: mockLimit,
      machineId: mockMachineId,
      ip: mockIp,
    });

    expect(result).toStrictEqual([
      {
        id,
        targetArgs: "testTargetArgs",
        targetFn: fnName,
      },
    ]);
  });
});
