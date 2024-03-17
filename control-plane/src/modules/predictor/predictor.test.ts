import msgpackr from "msgpackr";
import { isRetryable } from "./predictor";

describe("predictor", () => {
  it("should cache the prediction", async () => {
    const nonce = Math.random().toString(36).substring(7);

    const errorName = `Error${nonce}`;

    const status = await isRetryable(
      msgpackr
        .pack({ name: errorName, message: "This error is retryable" })
        .toString("base64"),
    );

    expect(status.retryable).toBe(true);
    expect(status.cached).toBeFalsy();

    const status2 = await isRetryable(
      msgpackr
        .pack({ name: errorName, message: "This error is retryable" })
        .toString("base64"),
    );

    expect(status2.retryable).toBe(true);
    expect(status2.cached).toBe(true);
  });
});
