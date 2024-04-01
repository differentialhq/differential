---
order: 1980
---

# Call Configuration and Customizing Function Calls

Any function call in Differential can be customized with additional metadata. The configuration is passed as the second argument to the function call. This metadata can be used to control the behavior of the function call, such as setting a cache key, specifying a timeout, etc.

```typescript
const client = d.client<typeof myService>("myService");

const result = await client.myFunction("arg1", "arg2", {
  $d: {
    // configuration options
  },
});
```

At the runtime, the configuration options are interpreted by the client libraries and the control-plane to induce the desired behavior.

## Configuration Options

These are the configuration options that can be passed to a function call under the `$d` key:

```ts
type CallConfig = {
  cache?: {
    key: string;
    ttlSeconds: number;
  };
  retryCountOnStall?: number;
  predictiveRetriesOnRejection?: boolean;
  timeoutSeconds?: number;
  executionId?: string;
};
```

## Caching

Caching can be achieved by setting the `cache` key in the configuration object. The `key` is a unique identifier for the cache entry, and `ttlSeconds` is the time-to-live for the cache entry in seconds.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    cache: {
      key: "myCacheKey",
      ttlSeconds: 60,
    },
  },
});
```

This will look up any other function calls that would have been resolved with the same cache key within the `ttlSeconds` time frame and return the latest one.

## Retries

A function call might stall when the function can't complete within the alotted timeout interval or when a worker stalls. Differential automatically retries this call one more time by default. This can be customized by setting the `retryCountOnStall` key in the configuration object.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    retryCountOnStall: 3, // function might be retried 3 times
  },
});

const result = await client.myFunction("arg1", "arg2", {
  $d: {
    retryCountOnStall: 0, // function will not be retried on stalling
  },
});
```

## Predictive Retries

Predictive retries can be enabled by setting the `predictiveRetriesOnRejection` key in the configuration object. This will retry the function call if the worker rejects the job, based on the output of our internal AI workflow. Read more about [Predictive Retries](../guides/predictive-retries.md). Due to the nature of probabilistic outcomes, this feature is opt-in and switched off by default.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    predictiveRetriesOnRejection: true,
  },
});
```

## Timeout

The timeout for a function call can be set by specifying the `timeoutSeconds` key in the configuration object. This will cause the function call to fail if it doesn't complete within the specified time via a `DifferentialError.TIMEOUT` error.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    timeoutSeconds: 10, // function call will fail if it doesn't complete within 10 seconds
  },
});
```

Note: the timeout refers to the time taken by the function to complete on the worker. Therefore, the actual time taken as observed by the client might be higher due to network latency, time taken to distribute the job, and the time taken to obtain and process the response.

## Execution ID

The `executionId` key can be set in the configuration object to specify the execution ID for the function call. This can be used to track the execution of the function call across the control-plane and the workers. But perhaps the most useful feature is using the execution ID to prevent duplicate function calls, as the same execution ID for the same function in the same cluster will be resolved to the same result, if the result has been resolved before.

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    executionId: "myExecutionId",
  },
});

const result2 = await client.myFunction("arg1", "arg2", {
  $d: {
    executionId: "myExecutionId",
  },
});

assert.deepEqual(result === result2);
```
