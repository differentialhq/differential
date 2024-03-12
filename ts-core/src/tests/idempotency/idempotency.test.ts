import { countService } from "./count";
import { d } from "./d";

describe.skip("Idempotency", () => {
  it("should call the functions only once", async () => {
    await countService.start();

    const client = d.client<typeof countService>("count");

    const key = Math.random().toString(36);

    const result1 = await client.count("hello", { $idempotencyKey: key });

    expect(result1).toEqual({
      callCount: 1,
      echo: "hello",
    });

    const result2 = await client.count("hello2", { $idempotencyKey: key });

    expect(result2).toEqual({
      callCount: 1,
      echo: "hello",
    });

    await countService.stop();
  }, 10000);
});
