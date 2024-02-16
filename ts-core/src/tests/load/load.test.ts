import { d } from "./d";
import { loadService } from "./load";

describe("Load test", () => {
  beforeAll(async () => {
    await loadService.start();
  });

  afterAll(async () => {
    await loadService.stop();
  });

  it("should complete 100 calls in parallel", async () => {
    const client = d.client<typeof loadService>("load");

    const promises: Promise<any>[] = [];

    for (let i = 0; i < 100; i++) {
      promises.push(client.echo("hello"));
    }

    const results = await Promise.all(promises);

    // expect(results).toHaveLength(100);
    expect(results[0].echo).toBe("hello");
  }, 20000);

  it("should complete 1000 calls in parallel", async () => {
    const client = d.client<typeof loadService>("load");

    const promises: Promise<any>[] = [];

    for (let i = 0; i < 1000; i++) {
      promises.push(client.echo("hello"));
    }

    const results = await Promise.all(promises);

    expect(results).toHaveLength(1000);
    expect(results[0].echo).toBe("hello");
  }, 60000);
});
