import { d } from "./d";
import type { dbService } from "./db";
import { expertService } from "./expert";
import { facadeService } from "./facade";

describe("monolith", () => {
  it("should not import a service, if we're just consuming it", async () => {
    const result = await d.background<typeof dbService, "getNumberFromDB">(
      "getNumberFromDB",
      10,
      2
    );

    expect(result.id).toBeDefined();

    // at this point, dbService should not be registered
    expect((globalThis as any).db).toBeUndefined();
  });

  it("should be able to call a service", async () => {
    await expertService.start();

    const result = await d.call<typeof expertService, "callExpert">(
      "callExpert",
      "Can't touch this"
    );

    expect(result).toBe("Expert says: Can't touch this");

    await expertService.stop();
  }, 10000);

  it("service client should return the same result", async () => {
    await expertService.start();

    const result = await d.call<typeof expertService, "callExpert">(
      "callExpert",
      "Can't touch this"
    );

    const client = d.buildClient<typeof expertService>()
    client.callExpert("Can't touch this")

    expect(clientResult).toBe(result);

    await expertService.stop();
  }, 10000);

  it("should be able to call a service from another service", async () => {
    await facadeService.start();
    await expertService.start();

    const result = await d.call<typeof facadeService, "interFunctionCall">(
      "interFunctionCall",
      {
        expertText: "foobar",
        cowText: "foobar",
      }
    );

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
