import { d } from "./d";
import { productService } from "./product";

describe("Caching", () => {
  beforeAll(async () => {
    await productService.start();
  }, 10000);

  afterAll(async () => {
    await productService.stop();
  });

  it("should get the cached results when possible", async () => {
    const client = d.client<typeof productService>("product");

    const productId = Math.random().toString();

    const result1 = await client.getProduct(productId, "foo", {
      $d: {
        cache: {
          key: productId,
          ttlSeconds: 10,
        },
      },
    });

    const result2 = await client.getProduct(productId, "bar", {
      $d: {
        cache: {
          key: productId,
          ttlSeconds: 10,
        },
      },
    });

    expect(result1).toEqual(result2);
  });

  it("should respect cache ttl", async () => {
    const client = d.client<typeof productService>("product");

    const productId = Math.random().toString();

    const result1 = await client.getProduct(productId, "foo", {
      $d: {
        cache: {
          key: productId,
          ttlSeconds: 1,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for cache to expire

    const result2 = await client.getProduct(productId, "bar", {
      $d: {
        cache: {
          key: productId,
          ttlSeconds: 1,
        },
      },
    });

    expect(result1).not.toEqual(result2);
  });
});
