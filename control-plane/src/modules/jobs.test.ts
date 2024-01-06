import { createJob, nextJobs } from "./jobs";

const mockTargetFn = "testTargetFn";
const mockTargetArgs = "testTargetArgs";

describe("createJob", () => {
  it("should create a job", async () => {
    const mockOwner = { clusterId: Math.random().toString() };

    const result = await createJob({
      targetFn: mockTargetFn,
      targetArgs: mockTargetArgs,
      owner: mockOwner,
      service: "testService",
    });

    expect(result.id).toBeDefined();
  });
});

describe("nextJobs", () => {
  const mockMachineId = "testMachineId";
  const mockIp = "127.0.0.1";
  const mockLimit = 5;

  it("should be able to return spefic jobs per service", async () => {
    const fnName = `testfn${Date.now()}`;
    const serviceName = `testService${Date.now()}`;
    const mockOwner = { clusterId: Math.random().toString() };

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

  it("should respect idempotency", async () => {
    const ik = Math.random().toString();
    const owner = { clusterId: Math.random().toString() };
    const service = "minimal";
    const targetFn = "foo";

    const { id: id1 } = await createJob({
      targetFn,
      targetArgs: "1",
      owner,
      service,
      idempotencyKey: ik,
    });

    const { id: id2 } = await createJob({
      targetFn,
      targetArgs: "2",
      owner,
      service,
      idempotencyKey: ik,
    });

    expect(id1).toBe(id2);

    const result = await nextJobs({
      owner,
      limit: 10,
      machineId: mockMachineId,
      ip: mockIp,
      service,
    });

    expect(result.length).toBe(1);
    expect(result[0].targetFn).toBe(targetFn);
    expect(result[0].targetArgs).toBe("1");
  });
});
