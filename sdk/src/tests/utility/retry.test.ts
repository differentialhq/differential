import { DifferentialError } from "../../errors";
import { d } from "./d";
import { productService } from "./product";

describe("retrying", () => {
  beforeAll(async () => {
    await productService.start();
  });

  afterAll(async () => {
    await productService.stop();
  });

  it("should not retry a function when attempts is 1", async () => {
    const client = d.client<typeof productService>("product");

    const productId = Math.random().toString();

    await expect(
      client.succeedsOnSecondAttempt(productId, {
        $d: {
          retryCountOnStall: 0,
          timeoutSeconds: 5,
        },
      }),
    ).rejects.toThrow(DifferentialError.EXECUTION_DID_NOT_COMPLETE);
  });

  it("should be able to retry a function", async () => {
    const client = d.client<typeof productService>("product");

    const productId = Math.random().toString();

    const result = await client.succeedsOnSecondAttempt(productId, {
      $d: {
        retryCountOnStall: 2,
        timeoutSeconds: 5,
      },
    });

    expect(result).toBe(true);
  });
});
