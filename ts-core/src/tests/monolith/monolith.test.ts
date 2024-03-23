import { d } from "./d";
import type { dbService } from "./db";
import { expertService } from "./expert";
import { facadeService } from "./facade";

describe("monolith", () => {
  beforeAll(async () => {
    await expertService.start();
    await facadeService.start();
  });

  afterAll(async () => {
    await expertService.stop();
    await facadeService.stop();
  });

  it("should not import a service, if we're just consuming it", async () => {
    const db = d.client<typeof dbService>("db", { background: true });

    const result = await db.getNumberFromDB(1, 2);

    expect(result.id).toBeDefined();

    // at this point, dbService should not be registered
    expect((globalThis as any).db).toBeUndefined();
  });

  it("should be able to call a service", async () => {
    const result = await d
      .client<typeof expertService>("expert")
      .callExpert("Can't touch this");

    expect(result).toBe("Expert says: Can't touch this");
  });

  it("service client should return the same result as 'call'", async () => {
    const result = await d.call<typeof expertService, "callExpert">(
      "expert",
      "callExpert",
      "Can't touch this",
    );

    const client = d.client<typeof expertService>("expert");
    const clientResult = await client.callExpert("Can't touch this");

    expect(clientResult).toBe(result);
  });

  it("should be able to call a service from another service", async () => {
    const result = await d
      .client<typeof facadeService>("facade")
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
  });

  it("should not let an already started service start again", async () => {
    await expect(expertService.start()).rejects.toThrowError(
      "Service is already started",
    );
  });
});
