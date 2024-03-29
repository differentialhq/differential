---
order: 2000
---

# How functions fail

Functions in Differential can "fail" in 2 main ways.

## 1. Promise rejection

A function can fail via a promise rejection due to an explicity `throw` statement in the function code or due to an unhandled exception.

Differential does not automatically retry failed function calls - i.e., if a function call fails, it fails. It is up to the client to decide if it wants to retry the function call. This is the scenarios denoted by 1 and 2 above. The exception to this is [predictive retries](../guides/predictive-retries.md), which is an opt-in feature to retry function calls based on the error metadata.

## 2. Stalling

A function can stall if it does not complete within the alotted time. This usually happens if:

1. Function fails to complete within the alotted `timeoutSeconds` time.
2. Worker stalls due to a machine crash or network problems. (See [Recovering from machine failures](./compute-recovery.md) for more information)

Differential does automatically retry function calls that stall. This can be customized by setting the `retryCountOnStall` key in the call configuration object.
