# How to cache results of function calls

Since all function calls within Differential are durable, the control-plane can cache the results of function calls. When subsequent function calls are made for the same operation, you can opt to return the cached result instead of executing the operation again.

This will save you compute and network resources, and also reduce the latency of the function call.

## Configuring the Cache Key and TTL

You can configure the key and time-to-live (TTL) for the cache (in seconds) whenever you call a function.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 60,
    },
  },
});

const result2 = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 60,
    },
  },
});

assert.deepEqual(result, result2); // result and result2 will be the same
```

In the above example, the result of the function call will be cached with the key `myCacheKey` for 60 seconds. If the same function is called again within 60 seconds with the same key, the cached result will be returned instead of executing the function again.

## Multiple Cache Configurations for the same function

You can configure multiple cache configurations for the same function call at different call sites. The configuration the function call honors is the only one that is configured in the function call config.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 60,
    },
  },
});

const result2 = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey2",
      ttlSeconds: 60,
    },
  },
});

assert.notDeepEqual(result, result2); // result and result2 will be different, because the cache keys are different

// call with the same cache key as the first call, but with a different TTL
const result3 = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 30,
    },
  },
});

assert.deepEqual(result, result3); // result and result3 will be the same, because the cache key is the same, and the `result` is still in the cache
```

## Cache Invalidation

Since the cache key and the TTL are configured in the call to the function, to invalidate the cache, you can simply call the function without the cache configuration.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 60,
    },
  },
});

const result2 = await client.myFunction("arg1", "arg2");

assert.notDeepEqual(result, result2); // result and result2 will be different
```
