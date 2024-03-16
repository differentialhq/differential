import { cached, extractDifferentialConfig } from "./functions";

describe("cache", () => {
  it("should inject cacheKey into differentialConfig", () => {
    const mockFn = jest.fn();

    const cachedFn = cached(mockFn, 10);

    cachedFn("foo", "bar", { $cacheKey: "baz" });

    expect(mockFn).toHaveBeenCalledWith("foo", "bar", {
      $cacheKey: "baz",
    });
  });
});

describe("extractDifferentialConfig", () => {
  it("should extract differentialConfig", () => {
    const args = ["foo", "bar", { $cacheKey: "baz" }];

    const { differentialConfig, originalArgs } =
      extractDifferentialConfig(args);

    expect(differentialConfig).toEqual({ $cacheKey: "baz" });
    expect(originalArgs).toEqual(["foo", "bar"]);
  });
});
