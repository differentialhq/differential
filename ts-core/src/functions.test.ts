import { extractDifferentialConfig, idempotent } from "./functions";

describe("idempotent", () => {
  it("should inject idempotencyKey into differentialConfig", () => {
    const mockFn = jest.fn();

    const idempotentFn = idempotent(mockFn);

    idempotentFn("foo", "bar", { $idempotencyKey: "baz" });

    expect(mockFn).toHaveBeenCalledWith("foo", "bar", {
      $idempotencyKey: "baz",
    });
  });
});

describe("extractDifferentialConfig", () => {
  it("should extract differentialConfig", () => {
    const args = ["foo", "bar", { $idempotencyKey: "baz" }];

    const { differentialConfig, originalArgs } =
      extractDifferentialConfig(args);

    expect(differentialConfig).toEqual({ $idempotencyKey: "baz" });
    expect(originalArgs).toEqual(["foo", "bar"]);
  });
});
