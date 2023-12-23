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
          },
        },
      });
    });
  });
});
