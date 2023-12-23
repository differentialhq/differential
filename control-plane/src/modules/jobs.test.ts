import { createJob, nextJobs, putJobResult } from "./jobs";

const mockOwner = { clusterId: "testClusterId" };
const mockTargetFn = "testTargetFn";
const mockTargetArgs = "testTargetArgs";
const mockService = `testService-${Date.now()}`;

describe("createJob", () => {
  it("should create a job", async () => {
    const result = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
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
      service: mockService,
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

describe("cacheability", () => {
  it("should return cached job if it exists", async () => {
    const fnName = `cacheabilityTest-${Math.random()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    const mockResult = { ouput: Math.random() };

    // persist the result with a cache expiry date in the future
    await putJobResult({
      jobId: id,
      result: JSON.stringify(mockResult),
      resultType: "resolution",
      clusterId: mockOwner.clusterId,
      cacheTTL: 5, // 5 seconds
    });

    // now, try to create a new job with the same fn and args
    const result = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    // the resulting id should be the same as the cached job
    expect(result.id).toBe(id);
  });

  it("should not return cached job if it exists but is expired", async () => {
    const fnName = `cacheabilityTest-${Math.random()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    const mockResult = { ouput: Math.random() };

    // persist the result with a cache expiry date in the future
    await putJobResult({
      jobId: id,
      result: JSON.stringify(mockResult),
      resultType: "resolution",
      clusterId: mockOwner.clusterId,
      cacheTTL: -5, // never cached
    });

    // now, try to create a new job with the same fn and args
    const result = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    // the resulting id should be the same as the cached job
    expect(result.id).not.toBe(id);
  });

  it("should not return cached job if it exists but is rejected", async () => {
    const fnName = `cacheabilityTest-${Math.random()}`;

    const { id } = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    const mockResult = { ouput: Math.random() };

    // persist the result with a cache expiry date in the future
    await putJobResult({
      jobId: id,
      result: JSON.stringify(mockResult),
      resultType: "rejection",
      clusterId: mockOwner.clusterId,
      cacheTTL: 5, // 5 seconds
    });

    // now, try to create a new job with the same fn and args
    const result = await createJob({
      targetFn: fnName,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: mockService,
    });

    // the resulting id should be the same as the cached job
    expect(result.id).not.toBe(id);
  });
});
