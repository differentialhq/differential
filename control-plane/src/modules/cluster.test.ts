import {
  createCluster,
  getServiceDefinitionForCluster,
  registerServiceDefinitionForCluster,
} from "./cluster";

const crateTestCluster = async () => {
  return createCluster({
    organizationId: "unit-test",
  });
};

describe("clusters", () => {
  describe("registerServiceDefinitionForCluster", () => {
    it("should persist the service definition", async () => {
      const { id } = await crateTestCluster();

      await registerServiceDefinitionForCluster(id, {
        name: "test",
        functions: {
          test: {
            name: "test",
            description: null,
            cacheKeyGenerator: null,
          },
        },
      });

      const serviceDefinition = await getServiceDefinitionForCluster(id);

      expect(serviceDefinition).toEqual({
        name: "test",
        functions: {
          test: {
            name: "test",
            description: null,
            cacheKeyGenerator: null,
          },
        },
      });
    });
  });

  it("should be able to execute cache key generators", async () => {
    const { id } = await crateTestCluster();

    await registerServiceDefinitionForCluster(id, {
      name: "test",
      functions: {
        test: {
          name: "test",
          description: null,
          cacheKeyGenerator: function (input?: { id?: string }) {
            return input?.id;
          }.toString(),
        },
      },
    });

    const serviceDefinition = await getServiceDefinitionForCluster(id);

    expect(
      eval(
        `"use strict";(${serviceDefinition?.functions.test.cacheKeyGenerator})({ id: "test" })`
      )
    ).toEqual("test");
  });
});
