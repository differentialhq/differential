import { Differential } from ".";

export const d = Differential({
  apiKey: "test",
  apiSecret: "test",
  environmentId: "test",
});

describe("should execute function", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await d.listen();
  });

  afterAll(() => {
    d.quit();
  });

  it("when success", async () => {
    const fn = d.fn(async () => {
      return "inline";
    });

    expect(await fn()).toEqual("inline");
  }, 10000);

  it("when success in background", async () => {
    const fn = d.background(async () => {
      return "background";
    });

    expect((await fn()).id).toBeTruthy();
  }, 10000);

  it("when fail", async () => {
    const fn = d.fn(async () => {
      // wait for 3s
      await new Promise((resolve) => setTimeout(resolve, 1000));

      throw new Error("fail");
    });

    try {
      await fn();
      throw new Error("should not reach here");
    } catch (e: any) {
      expect(e.message).toEqual("fail");
      expect(e.stack).toContain("integration.test.ts");
    }
  }, 10000);

  const fn1 = d.fn(async () => {
    return 1;
  });

  const fn2 = d.fn(async () => {
    return 2;
  });

  it("when fn1", async () => {
    expect(await fn1()).toEqual(1);
  }, 10000);

  it("when fn2", async () => {
    expect(await fn2()).toEqual(2);
  }, 10000);
});
