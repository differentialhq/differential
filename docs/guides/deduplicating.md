# How to deduplicate function calls

Consider a scenario where two or more function calls are issued for the same operation. Your code may be racing to complete the operation multiple times, or it may be the network which is repeatedly timing out and causing the same operation to be retried. In such cases, you may want to deduplicate the function calls to ensure that the operation is only executed once.

## Execution ID

Execution ID is a cluster-wide unique identifier that is generated and set for each function call.

Usually, the control-plane takes care of generating and setting the execution ID. However, you can also set the execution ID manually to deduplicate function calls.

## What happens if you call a function with the same Execution ID?

When two or more function calls happen with the same Execution ID, the subsequent function calls will get the same result as the original function call.

If the first function call is still in progress, the subsequent function calls will wait for the original function call to complete and return the same result.

If the first function call has already completed, the subsequent function calls will return the same result as the original function call.

## How to deduplicate function calls

De-duplicating the function call can be done by setting the Execution ID for the function call. Here is an example of how you can set the Execution ID for a function call:

```typescript
const result = await client.myFunction("arg1", "arg2", {
  $d: {
    executionId: "myExecutionId",
  },
});

// same function, again
const result2 = await client.myFunction("arg1", "arg2", {
  $d: {
    executionId: "myExecutionId",
  },
});

// another function in a different service
const result3 = await otherClient.myFunction("arg1", "arg2", {
  $d: {
    executionId: "myExecutionId",
  },
});

assert.deepEqual(result, result3); // result and result3 will be the same because Exeuction ID needs to be unique cluster wide
```
