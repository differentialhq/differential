---
order: 1990
---

# How to handle failures

Differential failure modes and error handling is not too dissimilar from the traditional failure modes and error handling in a service-oriented architecture.

## A function call results in a rejection

When a promise gets rejected from a remote function, Differential will serialize the error and send it back to the caller. The caller can then handle the error as needed.

Differential does not do any retries or error handling on behalf of the caller in this case. It is up to the caller to decide how to handle the error.

However, Differential does serialize the error and send it back to the caller, which allows the caller to handle the error as needed.

For example, given this service function:

```typescript
class MyCustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MyCustomError";
  }
}

async function myFunction() {
  throw new MyCustomError("This is a custom error");
}
```

The caller can handle the error like this:

```typescript
try {
  await myFunction();
} catch (e) {
  if (e.name === "MyCustomError") {
    console.log("Caught a custom error:", e.message);
  } else {
    console.log("Caught an unknown error:", e.message);
  }
}
```

### Stack trace

Differential does preserve the stack trace that is generated when the error is thrown, in the remote function.

### Error prototype

Differential does preserve the prototype of all the native JavaScript errors as defined in the [Well-Known Intrinsic Objects](https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects). This means that the caller can check the error type using the `instanceof` operator for these errors.

However, custom errors are not preserved across the boundary. This means that the caller cannot check the error type using the `instanceof` operator for custom errors. However, the caller can still check the class properties of the error to determine the error type - such as the `name` and `message` properties.

## A function call results in a timeout

When a function call results in a timeout, Differential will reject the promise with a `DifferentialError`, with a message of `DifferentialError.REMOTE_EXECUTION_ERROR`. The caller can then handle the error as needed.

## A function call results in continued machine failure

Differential can detect when a machine has stopped responding and will automatically failover to another machine. This also means that the functions that were running on the failed machine will be marked as stalled, so that they can be re-executed on another machine.

By default, a cluster will auto-retry a stalled function up to 3 times. If the function still fails after 3 retries, the function will be marked as failed and the caller will receive a `DifferentialError` with a message of `DifferentialError.REMOTE_EXECUTION_ERROR`.

Differential will prevent retrying the function indefinitely, to prevent a machine from continuously failing.

## Network gets interrupted during a function call

When the network gets interrupted during a function call, Differential will try to re-establish the connection to the control-plane.

Once the connection is re-established, the caller will continue to poll the control-plane for the results of the function. If the function has already completed, the caller will receive the results as expected.

In case of repeated failures, the number of cycles that Differential will try to re-establish the connection is configured via `ResultsPoller.MAX_ERROR_CYCLES` in the client. By default, this is set to 5, spaced out over 250 seconds. If the connection is not re-established after the configured number of cycles, the function will be marked as failed and the caller will receive a `DifferentialError` with a message of `DifferentialError.TOO_MANY_NETWORK_ERRORS`.
