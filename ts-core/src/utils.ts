const registry = new Map();

export const cache = (fn: Function, options: { ttl: number }) => {
  registry.set(fn, options);

  return fn;
};
