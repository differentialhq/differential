import { createOwner } from "../test/util";
import {
  createDeployment,
  getDeployment,
  releaseDeployment,
} from "./deployment";
import { getPresignedURL } from "../s3";
import { DeploymentProvider } from "./deployment-provider";
import * as data from "../data";
import { eq } from "drizzle-orm";

jest.mock("../s3", () => ({
  UPLOAD_BUCKET: "mockedBucket",
  getPresignedURL: jest.fn().mockResolvedValue("mockedPresignedURL"),
}));

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

  it("should generate a presigned url", async () => {
    const result = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    expect(result.id).toBeDefined();
    expect(result.clusterId).toEqual(owner.clusterId);

    expect(getPresignedURL).toHaveBeenCalledTimes(2);
    expect(getPresignedURL).toHaveBeenCalledWith(
      "mockedBucket",
      owner.clusterId,
      "testService",
      `${result.id}-package`,
    );
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
    expect(result.status).toEqual("ready");
  });
});

describe("releaseDeployment", () => {
  let owner: { clusterId: string };

  const provider: DeploymentProvider = {
    name: () => "mockProvider",
    schema: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    notify: jest.fn(),
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

  it("should update deployment status on release", async () => {
    const deployment = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await releaseDeployment(deployment, provider);

    expect(await getDeployment(deployment.id)).toEqual({
      ...deployment,
      status: "active",
    });

    const deployment2 = await createDeployment({
      clusterId: owner.clusterId,
      serviceName: "testService",
    });

    await releaseDeployment(deployment2, provider);

    // Deployment 2 is now active and deployment 1 is inactive
    expect(await getDeployment(deployment.id)).toEqual({
      ...deployment,
      status: "inactive",
    });
    expect(await getDeployment(deployment2.id)).toEqual({
      ...deployment2,
      status: "active",
    });
  });
});
