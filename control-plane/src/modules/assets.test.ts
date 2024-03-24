import * as data from "./data";
import { ulid } from "ulid";
import { createAssetUploadWithTarget } from "./assets";
import { createOwner } from "./test/util";
import { getPresignedURL } from "./s3";

jest.mock("./s3", () => ({
  getPresignedURL: jest.fn().mockResolvedValue("mockedPresignedURL"),
}));

jest.mock("../utilities/env", () => ({
  env: {
    ...jest.requireActual("../utilities/env").env,
    ASSET_UPLOAD_BUCKET: "mockedBucket",
  },
}));

describe("createAssetUploadWithTarget", () => {
  let cluster1: string;
  let cluster2: string;

  beforeAll(async () => {
    cluster1 = (await createOwner()).clusterId;
    cluster2 = (await createOwner()).clusterId;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a client library asset upload", async () => {
    const lib = await data.db
      .insert(data.clientLibraryVersions)
      .values({
        id: ulid(),
        cluster_id: cluster1,
        version: "1.0.0",
      })
      .returning({
        id: data.clientLibraryVersions.id,
      });

    const type = "client_library";
    const result = await createAssetUploadWithTarget({
      target: lib[0].id,
      clusterId: cluster1,
      type,
    });

    expect(result).toBeDefined();
    expect(result).toBe("mockedPresignedURL");

    expect(getPresignedURL).toHaveBeenCalledWith(
      "mockedBucket",
      expect.stringContaining(`${type}/`),
    );
  });

  it("should create a service bundle asset upload", async () => {
    const deployment = await data.db
      .insert(data.deployments)
      .values({
        id: ulid(),
        cluster_id: cluster1,
        service: "mock",
        provider: "mock",
      })
      .returning({
        id: data.deployments.id,
      });

    const type = "service_bundle";
    const result = await createAssetUploadWithTarget({
      target: deployment[0].id,
      clusterId: cluster1,
      type,
    });

    expect(result).toBeDefined();
    expect(result).toBe("mockedPresignedURL");

    expect(getPresignedURL).toHaveBeenCalledWith(
      "mockedBucket",
      expect.stringContaining(`${type}/`),
    );
  });

  it("should fail with asset upload exists for target", async () => {
    const deployment = await data.db
      .insert(data.deployments)
      .values({
        id: ulid(),
        cluster_id: cluster1,
        service: "mock",
        provider: "mock",
      })
      .returning({
        id: data.deployments.id,
      });

    const type = "service_bundle";
    const result = await createAssetUploadWithTarget({
      target: deployment[0].id,
      clusterId: cluster1,
      type,
    });

    expect(result).toBeDefined();
    expect(result).toBe("mockedPresignedURL");

    const result2 = createAssetUploadWithTarget({
      target: deployment[0].id,
      clusterId: cluster1,
      type,
    });

    await expect(result2).rejects.toEqual(
      new Error(`Could not create asset upload for target ${deployment[0].id}`),
    );
  });

  it("should fail when target is for another cluster", async () => {
    const deployment = await data.db
      .insert(data.deployments)
      .values({
        id: ulid(),
        cluster_id: cluster1,
        service: "mock",
        provider: "mock",
      })
      .returning({
        id: data.deployments.id,
      });

    const type = "service_bundle";
    const target = deployment[0].id;

    const result = createAssetUploadWithTarget({
      clusterId: cluster2,
      target,
      type,
    });

    await expect(result).rejects.toEqual(
      new Error(`Could not find deployment for target ${target}`),
    );
  });

  it("should fail when client library version doesn't exist", async () => {
    const target = ulid();
    const type = "client_library";
    const result = createAssetUploadWithTarget({
      clusterId: cluster1,
      target,
      type,
    });

    await expect(result).rejects.toEqual(
      new Error(`Could not find client version for target ${target}`),
    );
  });

  it("should fail when deployment doesn't exist", async () => {
    const target = ulid();
    const type = "service_bundle";
    const result = createAssetUploadWithTarget({
      clusterId: cluster1,
      target,
      type,
    });

    await expect(result).rejects.toEqual(
      new Error(`Could not find deployment for target ${target}`),
    );
  });
});
