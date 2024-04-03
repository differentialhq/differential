import fastify from "fastify";
import { initServer } from "@ts-rest/fastify";
import { router } from "./router";
import { createOwner } from "./test/util";
import { upsertAccessPointForCluster } from "./management";
import { nextJobs, persistJobResult } from "./jobs/jobs";
import msgpackr from "msgpackr";

describe("router", () => {
  const port = 9876;
  const host = `0.0.0.0`;

  const endpoint = `http://${host}:${port}`;

  const app = fastify();
  const s = initServer();
  app.register(s.plugin(router));

  beforeAll(async () => {
    await app.listen({ port, host: "0.0.0.0" });
  });

  describe("live", () => {
    it("should return 200", async () => {
      const response = await fetch(`${endpoint}/live`);
      expect(response.status).toBe(200);
    });
  });

  describe("executeJobSync", () => {
    it("should execute job synchronously", async () => {
      const owner = await createOwner();

      const { token } = await upsertAccessPointForCluster({
        clusterId: owner.clusterId,
        name: "test",
        allowedServices: "test",
      });

      const persistResultInBackground = async (): Promise<void> => {
        const n = await nextJobs({
          service: "test",
          machineId: "test",
          owner,
          ip: "1.1.1.1",
          limit: 1,
        });

        if (n.length === 0) {
          return persistResultInBackground();
        } else {
          const { id, targetArgs } = n[0];

          const complex = {
            targetArgs,
          };

          await persistJobResult({
            jobId: id,
            result: msgpackr.pack(complex).toString("base64"),
            machineId: "test",
            owner,
            resultType: "resolution",
          });
        }
      };

      // runs in background
      persistResultInBackground();

      const response = await fetch(
        `${endpoint}/clusters/${owner.clusterId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: "test",
            function: "testfn",
            args: ["bird"],
          }),
        },
      );

      const json = await response.json();

      expect(json).toEqual({
        result: '{"targetArgs":"kaRiaXJk"}',
        resultType: "resolution",
        status: "success",
      });
    });
  });
});
