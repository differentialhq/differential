import {
  getServiceDefinitionForCluster,
  registerServiceDefinitionForCluster,
} from "./cluster";

describe("clusters", () => {
  describe("registerServiceDefinitionForCluster", () => {
    it("should persist the service definition", async () => {
      const clusterId = Math.random().toString();

      await registerServiceDefinitionForCluster(clusterId, {
        name: "test",
        functions: {
          test: {
            name: "test",
            description: null,
            cacheKeyGenerator: null,
          },
        },
      });

      const serviceDefinition = await getServiceDefinitionForCluster(clusterId);

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
    const clusterId = Math.random().toString();

    await registerServiceDefinitionForCluster(clusterId, {
      name: "test",
      functions: {
        test: {
          name: "test",
          description: null,
          cacheKeyGenerator: function (args: [{ id: string }]) {
            return args[0] ? args[0].id : null;
          }.toString(),
        },
      },
    });

    const serviceDefinition = await getServiceDefinitionForCluster(clusterId);

    expect(
      eval(
        `(${serviceDefinition?.functions.test.cacheKeyGenerator})({ id: "test" })`
      )
    ).toEqual("test");
  });
});
