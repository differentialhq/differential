import { countService } from "./count";
import { d } from "./d";

describe("Idempotency", () => {
  it("should call the functions only once", async () => {
    await countService.start();

    const client = d.client<typeof countService>("hello");

    const result1 = await client.count("hello", { $idempotencyKey: "1" });

    expect(result1).toEqual({
      callCount: 1,
      echo: "hello",
    });

    const result2 = await client.count("hello2", { $idempotencyKey: "1" });

    expect(result2).toEqual({
      callCount: 1,
      echo: "hello",
    });

    await countService.stop();
  }, 10000);
});
