import { initClient } from "@ts-rest/core";
import { contract } from "../modules/contract";
import jsonwebtoken from "jsonwebtoken";

export const client = initClient(contract, {
  baseUrl: "http://0.0.0.0:4000",
  baseHeaders: {},
});

const environmentId = "test";

describe("jobs", () => {
  let secretKey: string;

  beforeAll(async () => {
    const jwtToken = jsonwebtoken.sign(
      {
        environmentId,
      },
      "secret" // must be the same as process.env.JWT_SECRET
    );

    const result = await client.createCredential({
      params: {
        organizationId: "test",
      },
      body: {},
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    if (result.status !== 201) {
      throw new Error("Expected 201");
    }

    secretKey = result.body.apiSecret;
  });

  it("should be able to persist a job and get the status back", async () => {
    const response = await client.createJob({
      body: {
        targetFn: "add",
        targetArgs: "fake",
      },
      headers: {
        authorization: `Bearer ${secretKey}`,
      },
    });

    expect(response.status).toEqual(201);

    if (response.status !== 201) {
      throw new Error("Expected 201");
    }

    const jobId = response.body.id;

    const statusResponse = await client.getNextJobs({
      headers: {
        authorization: `Bearer ${secretKey}`,
        "x-machine-id": "foo",
      },
      query: {
        limit: 10,
      },
    });

    expect(statusResponse.status).toEqual(200);

    if (statusResponse.status !== 200) {
      throw new Error("Expected 200");
    }

    expect(statusResponse.body).toContainEqual({
      id: jobId,
      targetFn: "add",
      targetArgs: "fake",
    });
  });

  it("should be able to get the jobs for a specific worker pool", async () => {
    const response = await client.createJob({
      body: {
        targetFn: "add",
        targetArgs: "fake",
        pool: "foo",
      },
      headers: {
        authorization: `Bearer ${secretKey}`,
      },
    });

    expect(response.status).toEqual(201);

    if (response.status !== 201) {
      throw new Error("Expected 201");
    }

    const jobId = response.body.id;

    const statusResponse = await client.getNextJobs({
      headers: {
        authorization: `Bearer ${secretKey}`,
        "x-machine-id": "foo",
      },
      query: {
        limit: 10,
      },
    });

    expect(statusResponse.status).toEqual(200);
    expect(statusResponse.body).toEqual([]);

    const statusResponse2 = await client.getNextJobs({
      headers: {
        authorization: `Bearer ${secretKey}`,
        "x-machine-id": "foo",
      },
      query: {
        limit: 10,
        pools: "foo",
      },
    });

    expect(statusResponse2.status).toEqual(200);

    if (statusResponse2.status !== 200) {
      throw new Error("Expected 200");
    }

    expect(statusResponse2.body).toContainEqual({
      id: jobId,
      targetFn: "add",
      targetArgs: "fake",
    });
  });
});
