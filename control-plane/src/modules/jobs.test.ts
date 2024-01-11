import { createJob, nextJobs } from "./jobs";
import * as data from "./data";
import { getServiceDefinition } from "./service-definitions";

const mockTargetFn = "testTargetFn";
const mockTargetArgs = "testTargetArgs";

const createOwner = async () => {
  const clusterId = Math.random().toString();

  await data.db
    .insert(data.clusters)
    .values({
      id: clusterId,
      api_secret: "test",
    })
    .execute();

  return { clusterId };
};

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

  it("should persist the service definition", async () => {
    const service = `service-def`;

    const definition = {
      name: service,
      functions: [
        {
          name: Math.random().toString(),
          idempotent: true,
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

    // delay to allow for background write
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const stored = await getServiceDefinition(service, owner);

    expect(stored).toStrictEqual(definition);
  });
});
