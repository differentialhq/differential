import { d } from "./d";
import { helloService } from "./hello";

describe("e2ee", () => {
  it("should be able to call a service", async () => {
    await helloService.start();

    const result = await d
      .client<typeof helloService>("hello")
      .greet(["Bob", "Alice"]);

    expect(result).toEqual({
      result: "Hello Bob, Alice",
      names: ["Bob", "Alice"],
    });

    await helloService.stop();
  }, 10000);
});
