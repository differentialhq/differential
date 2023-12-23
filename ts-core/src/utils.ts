import { AsyncFunction } from "./types";

const registry = new Map();

/**
 * Wrapper function to cache the result of an async function
 * @param fn Async function to cache
 * @param options Options for caching
 * @param options.ttl Time to live in seconds
 * @returns
 * @example
 * ```ts
 * import { cache } from "@differentialhq/core";
 *
 * export const dbService = d.service({
 *   name: "db",
 *   functions: {
 *     veryExpensiveLookup: cache(veryExpensiveLookup, { ttl: 100 }),
 *   },
 * });
 * ```
 */
export const cache = <T extends AsyncFunction>(
  fn: T,
  options: { ttl: number }
) => {
  registry.set(fn, options);

  return fn;
};

/**
 * This function is used internally to get the TTL for a cached function
 * @ignore
 */
export const getTTLForFunction = (fn: AsyncFunction) => {
  return registry.get(fn)?.ttl;
};
