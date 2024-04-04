import { upsertAccessPointForCluster } from "./management";
import {
  validateAccessPointAccess,
  validateAccessPointOrClusterTokenAccess,
  validateClusterTokenAccess,
} from "./routing-helpers";
import { createOwner } from "./test/util";

describe("routing-helpers", () => {
  describe("validateClusterTokenAccess", () => {
    it("should reject bad tokens", async () => {
      ["bad token", "Bearer bad token", "Bearerbadtoken"].forEach(
        async (authorization) => {
          await validateClusterTokenAccess(authorization);
        },
      );
    });

    it("should accept good tokens", async () => {
      const owner = await createOwner();

      const result = await validateClusterTokenAccess(
        `Bearer ${owner.apiSecret}`,
      );

      expect(result).toEqual({
        clusterId: owner.clusterId,
        cloudEnabled: false,
        organizationId: null,
      });
    });
  });

  describe("validateAccessPointAccess", () => {
    it("should reject bad tokens", async () => {
      const owner = await createOwner();

      [
        {
          clusterId: owner.clusterId,
          authorization: "bad token",
        },
        {
          clusterId: owner.clusterId,
          authorization: "Bearer bad token",
        },
      ].map(async (params) => {
        const result = await validateAccessPointAccess(params);

        expect(result).toEqual({
          name: "",
          allowedServices: [],
        });
      });
    });

    it("should accept good tokens", async () => {
      const owner = await createOwner();

      const accessPoint = await upsertAccessPointForCluster({
        clusterId: owner.clusterId,
        name: "test",
        allowedServices: "test",
      });

      const result = await validateAccessPointAccess({
        clusterId: owner.clusterId,
        authorization: `Bearer ${accessPoint.token}`,
      });

      expect(result).toEqual({
        name: "test",
        allowedServices: ["test"],
      });
    });

    it("should reject good tokens with mismatching cluster ids", async () => {
      const owner = await createOwner();

      const accessPoint = await upsertAccessPointForCluster({
        clusterId: owner.clusterId,
        name: "test",
        allowedServices: "test",
      });

      const result = await validateAccessPointAccess({
        clusterId: "other",
        authorization: `Bearer ${accessPoint.token}`,
      });

      expect(result).toEqual({
        name: "",
        allowedServices: [],
      });
    });
  });

  describe("validateAccessPointOrClusterTokenAccess", () => {
    it("should validate access point tokens", async () => {
      const owner = await createOwner();

      const accessPoint = await upsertAccessPointForCluster({
        clusterId: owner.clusterId,
        name: "test",
        allowedServices: "test",
      });

      const result = await validateAccessPointOrClusterTokenAccess(
        `Bearer ${accessPoint.token}`,
        owner.clusterId,
      );

      expect(result).toEqual({
        clusterId: owner.clusterId,
        allowedServices: ["test"],
      });
    });

    it("should validate cluster tokens", async () => {
      const owner = await createOwner();

      const result = await validateAccessPointOrClusterTokenAccess(
        `Bearer ${owner.apiSecret}`,
        owner.clusterId,
      );

      expect(result).toEqual({
        clusterId: owner.clusterId,
        allowedServices: ["*"],
      });
    });
  });
});
