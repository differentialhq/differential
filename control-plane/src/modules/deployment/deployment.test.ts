import { createOwner } from "../test/util";
import {
  createDeployment,
  getDeployment,
  releaseDeployment,
  updateDeploymentResult,
} from "./deployment";
import { DeploymentProvider } from "./deployment-provider";
import * as data from "../data";
import { eq } from "drizzle-orm";

describe("createDeployment", () => {
  let owner: { clusterId: string };

  beforeAll(async () => {
    owner = await createOwner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a deployment", async () => {
    const result = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    expect(result.id).toBeDefined();
    expect(result.clusterId).toEqual(owner.clusterId);
  });
});

describe("getDeployment", () => {
  let owner: { clusterId: string };

  beforeAll(async () => {
    owner = await createOwner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retreive a deployment", async () => {
    const { id } = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    const result = await getDeployment(id);

    expect(result.id).toEqual(id);
    expect(result.clusterId).toEqual(owner.clusterId);
    expect(result.service).toEqual("testService");
    expect(result.status).toEqual("uploading");
  });
});

describe("releaseDeployment", () => {
  let owner: { clusterId: string };

  const provider: DeploymentProvider = {
    name: () => "mockProvider",
    schema: jest.fn(),
    create: jest.fn(async () => ({})),
    update: jest.fn(async () => ({})),
    notify: jest.fn(),
    getLogs: jest.fn(),
    minimumNotificationInterval: jest.fn(),
  };

  beforeAll(async () => {
    owner = await createOwner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call DeploymentProvider.create for a new deployment", async () => {
    const deployment = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await releaseDeployment(deployment, provider);

    expect(provider.create).toHaveBeenCalledWith(deployment);

    expect(provider.create).toHaveBeenCalledTimes(1);
    expect(provider.update).toHaveBeenCalledTimes(0);
  });

  it("should call DeploymentProvider.update for a existing deployment", async () => {
    const deployment = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await data.db
      .update(data.deployments)
      .set({ status: "active" })
      .where(eq(data.deployments.id, deployment.id));

    await releaseDeployment(deployment, provider);

    expect(provider.update).toHaveBeenCalledWith(deployment);

    expect(provider.update).toHaveBeenCalledTimes(1);
    expect(provider.create).toHaveBeenCalledTimes(0);
  });
});

describe("updateDeploymentResult", () => {
  let owner: { clusterId: string };

  const provider: DeploymentProvider = {
    name: () => "mockProvider",
    schema: jest.fn(),
    create: jest.fn(async () => ({})),
    update: jest.fn(async () => ({})),
    notify: jest.fn(),
    getLogs: jest.fn(),
    minimumNotificationInterval: jest.fn(),
  };

  beforeAll(async () => {
    owner = await createOwner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.only("should mark existing deployment status inactive", async () => {
    const deployment = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await data.db
      .update(data.deployments)
      .set({ status: "active" })
      .where(eq(data.deployments.id, deployment.id));

    const deployment2 = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await releaseDeployment(deployment2, provider);

    // Deployment 1 should still be "active"
    expect(await getDeployment(deployment.id)).toEqual({
      ...deployment,
      status: "active",
      assetUploadId: null,
    });

    // Deployment 2 should still be "uploading"
    expect(await getDeployment(deployment2.id)).toEqual({
      ...deployment2,
      status: "uploading",
      assetUploadId: null,
    });

    await updateDeploymentResult(deployment2, "active");

    // Deployment 1 should be "inactive"
    expect(await getDeployment(deployment.id)).toEqual({
      ...deployment,
      status: "inactive",
      assetUploadId: null,
    });

    // Deployment 2 should be "active"
    expect(await getDeployment(deployment2.id)).toEqual({
      ...deployment2,
      status: "active",
      assetUploadId: null,
    });
  });
});
