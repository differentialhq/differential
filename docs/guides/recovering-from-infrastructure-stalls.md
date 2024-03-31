# Retrying function calls on infrastructure failures

Sometimes the functions can stall due to a machine crashing, network issues, or other infrastructure failures. In these cases, you can instruct Differential to retry the function call without writing any custom error recovery logic.

## Retry Configuration

You can configure the number of times a function call should be retried in case of a stall. By default, Differential retries the function call once. You can customize this behavior by setting the `retryCountOnStall` key in the configuration object.

Imagine you have a function that takes a long time to execute:

```typescript
async function myFunction(arg1: string, arg2: string) {
  // wait for 1 minute
  await new Promise(() => {}, 5 * 60 * 1000);

  return "done";
}
```

You can configure the number of times the function should be retried in case of a stall:

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    retryCountOnStall: 3, // function might be retried 3 times on stalling
    timeoutSeconds: 10, // function will timeout after 10 seconds
  },
});

const result = await client.myFunction("arg1", "arg2", {
  $d: {
    retryCountOnStall: 0, // function will not be retried on stalling
    timeoutSeconds: 10, // function will timeout after 10 seconds
  },
});
```

## Default Behavior

The default behavior is to retry the function call once, after the function times out. The default timeout is 5 minutes.

For example, the following function will be retried once after 5 minutes.

## Retries vs. Failures

Note that this retry mechanism is different from the retries that are done when a function call is rejected. When a function call is explicitly rejected becasue of a `throw`, `reject` or an unhandled exception, it is up to the client to retry the function call.
