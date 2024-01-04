import { d } from "./d";
import { expertServiceDefinition } from "./expert";
import { facadeServiceDefinition } from "./facade";
import {expertService, facadeService} from "./d.register";

describe("monolith", () => {
  it("should be able to call a service", async () => {
    await expertService.start();

    const result = await d
      .client(expertServiceDefinition)
      .callExpert("Can't touch this");

    expect(result).toBe("Expert says: Can't touch this");

    await expertService.stop();
  }, 10000);

  it.only("service client should return the same result as 'call'", async () => {
    await expertService.start();

    const result = await d.call(
      expertServiceDefinition,
      "callExpert",
      "Can't touch this"
    );

    const client = d.client(expertServiceDefinition);
    const clientResult = await client.callExpert("Can't touch this");

    expect(clientResult).toBe(result);

    await expertService.stop();
  }, 10000);

  it("should be able to call a service from another service", async () => {
    await facadeService.start();
    await expertService.start();

    const result = await d
      .client(facadeServiceDefinition)
      .interFunctionCall({
        expertText: "foobar",
        cowText: "foobar",
      });

    expect(result).toMatchInlineSnapshot(`
[
  "
    foobar
      \\   ^__^
       \\  (oo)\\_______
          (__)\\       )\\/\\
              ||----w |
              ||     ||
    ",
  "Expert says: foobar",
]
`);

    await facadeService.stop();
    await expertService.stop();
  }, 20000);

  it("should be ok to start the service idempotently", async () => {
    await expertService.start();
    await expertService.start();

    await expertService.stop();
  });
});
