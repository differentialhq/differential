import { Differential } from "./Differential";

describe("Differential", () => {
  const env = process.env;
  beforeEach(() => {
    delete process.env.DIFFERENTIAL_API_SECRET;
  });

  afterEach(() => {
    process.env = { ...env };
  });
  it("should initialize without optional args", () => {
    expect(() => new Differential("test")).not.toThrow();
  });

  it("should throw if no API secret is provided", () => {
    expect(() => new Differential()).toThrow();
  });

  it("should initialize with API secret in environment", () => {
    process.env.DIFFERENTIAL_API_SECRET = "environment_secret";
    expect(() => new Differential()).not.toThrow();
    const d = new Differential();
    expect(d.secretPartial).toBe("envi...");
  });
});
