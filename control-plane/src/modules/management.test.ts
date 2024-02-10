import { getClusterSettings, setClusterSettings } from "./management";
import { createOwner } from "./test/util";

describe("management", () => {
  describe("cluster settings", () => {
    it("should be able to get and set cluster settings", async () => {
      const owner = await createOwner();

      const initial = await getClusterSettings(owner.clusterId);

      expect(initial).toStrictEqual({
        predictiveRetriesEnabled: false,
      });

      await setClusterSettings(owner.clusterId, {
        predictiveRetriesEnabled: true,
      });

      const updated = await getClusterSettings(owner.clusterId);

      expect(updated).toStrictEqual({
        predictiveRetriesEnabled: true,
      });
    });
  });
});
