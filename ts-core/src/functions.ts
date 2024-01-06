import { AsyncFunction } from "./types";

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any]
> = (
  ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;

type DifferentialConfig = {
  $idempotencyKey?: string;
};

export const extractDifferentialConfig = (
  args: any[]
): {
  differentialConfig: DifferentialConfig;
  originalArgs: any[];
} => {
  // just one now because we only support idempotency
  // this has the be a inverse for loop if we have more
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

  return {
    differentialConfig: {},
    originalArgs: args,
  };
};

/**
 * This is a utility function that makes a function in a service definition idempotent.
 *
 *
 * @param fn The function to make idempotent
 * @returns The same function with the same parameters, but with an additional parameter at the end of the function call that is the idempotency key
 * @example
 * ```ts
 * // src/services/order.ts
 *
 * const chargeOrder = async (order: Order) => {
 *   await chargeCustomer(order.customerId, order.amount);
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
 * const order = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });
 *
 * // if you call the function again with the same idempotency key, previous result will be returned
 *
 * const order2 = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });
 *
 * assert.deepEqual(order === order2);
 * ```
 */
export const idempotent = <T extends AsyncFunction>(
  fn: T
): AddParameters<T, [Pick<DifferentialConfig, "$idempotencyKey">]> => {
  return fn as any;
};
