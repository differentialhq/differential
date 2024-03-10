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
    process.env.DIFFERENTIAL_API_SECRET = "test";
    expect(() => new Differential()).not.toThrow();
  });

  it("should warn for multiple API secrets", () => {
    process.env.DIFFERENTIAL_API_SECRET = "test";
    jest.spyOn(console, "warn");
    expect(() => new Differential("test")).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      "API Secret was provided as an argument and environment variable. Constructor argument will be used.",
    );
  });
});
