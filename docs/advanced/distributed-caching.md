# Distributed Caching

Status: **General Availability**

Differential is useful for caching expensive operations and speeding up you application by storing returned values in the control-plane. It's then available to be used by other calls, without having to call the function again.

Differential supports global caching via a convenience function called `cached`. It takes a function, and a `ttl` in milliseconds and returns a new function that prompts the user to provide a cache key. If the function has already been called with that key, it will return the same result as before.

To mark a function as cached, simply wrap it with the `cached` function.

```typescript
import { cached } from "@differentialhq/core";

const getCustomer = async (customerId: string) => {
  const customer = await getCustomerFromDatabase(customerId);
  return customer;
};

export const customerService = d.service({
  name: "customer",
  functions: {
    getCustomer: cached(getCustomer, { ttl: 1000 }), // 1 second
  },
});
```

Now, when you call the function, you must provide a cache key.

```typescript
// const customer = await customerClient.getCustomer(customerId); // ⛔️ Error: Expected 2 arguments, but got 1.

const customer = await customerClient.getCustomer(customerId, {
  $cacheKey: customerId,
});
```

If you call the function again with the same cache key, the previous result will be returned.

```typescript
const customer2 = await customerClient.getCustomer(customerId, {
  $cacheKey: customerId,
});

assert.deepEqual(customer === customer2);
```

One question you might have is why the client function call has to provide the cache key. The reason for this is two-fold:

1. Control-plane doesn't have to compute the cache key at the time of job distribution, which is a performance optimization.
2. Security features such as [end to end encryption](./end-to-end-encryption.md) still work, as the cache key is not visible to the control-plane.
