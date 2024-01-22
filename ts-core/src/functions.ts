import { AsyncFunction } from "./types";

const idempotentFunctions: AsyncFunction[] = [];

export const isFunctionIdempotent = (fn: AsyncFunction) =>
  idempotentFunctions.includes(fn);

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
> = (
  ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;

type DifferentialConfig = {
  $idempotencyKey?: string;
  $cacheKey?: string;
};

export const extractDifferentialConfig = (
  args: any[],
): {
  differentialConfig: DifferentialConfig;
  originalArgs: any[];
} => {
  // just one now because we only support either idempotency key or cache key
  const lastArg = args[args.length - 1];

  if (
    typeof lastArg === "object" &&
    lastArg !== null &&
    "$idempotencyKey" in lastArg
  ) {
    return {
      differentialConfig: lastArg,
      originalArgs: args.slice(0, args.length - 1),
    };
  }

  if (
    typeof lastArg === "object" &&
    lastArg !== null &&
    "$cacheKey" in lastArg
  ) {
    return {
      differentialConfig: lastArg,
      originalArgs: args.slice(0, args.length - 1),
    };
  }

  return {
    differentialConfig: {},
    originalArgs: args,
  };
};

/**
 * This is a utility function that makes a function in a service definition idempotent.
 *
 * @param fn The function to make idempotent
 * @returns The same function with the same parameters, but with an additional parameter at the end of the function call that is the idempotency key
 * @example
 * ```ts
 * // src/services/order.ts
 *
 * const chargeOrder = async (order: Order) => {
 *   const charge = await chargeCustomer(order.customerId, order.amount);
 *   return charge;
 * }
 *
 * export const orderService = d.service({
 *   name: "order",
 *   functions: {
 *     chargeOrder: idempotent(chargeOrder),
 *   },
 * });
 *
 * // src/client.ts
 * const orderClient = d.client<typeof orderService>("order");
 *
 * // const order = await orderClient.chargeOrder(order); // ⛔️ Error: Expected 2 arguments, but got 1.
 *
 * const charge = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });
 *
 * // if you call the function again with the same idempotency key, previous result will be returned
 *
 * const charge2 = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });
 *
 * assert.deepEqual(charge === charge2);
 * ```
 */
export const idempotent = <T extends AsyncFunction>(
  fn: T,
): AddParameters<T, [Pick<DifferentialConfig, "$idempotencyKey">]> => {
  idempotentFunctions.push(fn);
  return fn as any;
};

/**
 * This is a utility function that makes a function in a service definition cached.
 *
 * @param fn The function to make cached
 * @param ttl The time to live of the cache in milliseconds
 * @returns The same function with the same parameters, but with an additional parameter at the end of the function call that is the cache key
 *
 * @example
 * ```ts
 * // src/services/product.ts
 *
 * const getProduct = async (productId: string) => {
 *   const product = await getProductFromDatabase(productId);
 *   return product;
 * }
 *
 * export const productService = d.service({
 *   name: "product",
 *   functions: {
 *     getProduct: cached(getProduct, 10000), // cache results for 10 seconds
 *   },
 * });
 *
 * // src/client.ts
 *
 * const productClient = d.client<typeof productService>("product");
 *
 * const productId = "123";
 *
 * const product = await productClient.getProduct(productId, { $cacheKey: productId });
 *
 * // if you call the function again with the same cache key, previous result will be returned
 *
 * const product2 = await productClient.getProduct(productId, { $cacheKey: productId });
 *
 * assert.deepEqual(product === product2);
 */
export const cached = <T extends AsyncFunction>(
  fn: T,
  ttl: number,
): AddParameters<T, [Pick<DifferentialConfig, "$cacheKey">]> => {
  idempotentFunctions.push(fn);
  return fn as any;
};
