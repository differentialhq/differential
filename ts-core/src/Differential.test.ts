import { Differential } from "./Differential";

describe("Differential", () => {
  it("should initialize without optional args", () => {
    expect(() => new Differential("test")).not.toThrow();
  });
});
