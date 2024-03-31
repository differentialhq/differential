# AI-Powered Retry Logic for Promise

Status: **Technical Preview**

!!!
This feature is at the Technical Preview stage. Due to the nature of probabilistic outcomes, this feature may result in non-deterministic behaviour. It's opt-in and switched off by default.

As with all Differential AI features, you might determine that your risk tolerance is lower than what this feature requires. In that case, you do not have to do anything and the feature will not be exposed to your users.
!!!

Differential can predict transient errors and retry the operations without the developer having to write custom code.

## How it works

The control-plane has all the required context on a particular failure, when it happens. It knows the function, some metadata about the source, payload, and the error message. It can use this information to predict if the error is transient or not.

If it's predicted to be transient, Differential will retry the operation again without any client intervention. This is especially useful for database deadlocks, network errors, and other transient errors.

## Errors in the worker

For example, let's consider this that occurs due to a database deadlock:

```typescript
// service.ts
let call = 0;

const chargeCustomer = async (customerId: string, amount: number) => {
  call++;

  if (call < 2) {
    throw new Error("Database deadlock");
  }

  return "charged";
};

const orderService = d.service({
  name: "order",
  functions: {
    chargeCustomer,
  },
});

// consumer.ts
const client = d.client<typeof orderService>("order");
```

Calling this function will result in a deadlock error:

```typescript
await client.chargeCustomer("customer_id", 100); // Error: Database deadlock
```

## Automatically recovering from transient errors

Predictive retries can be enabled by setting the `predictiveRetriesOnRejection` key in the call configuration object. This will retry the function call if the worker rejects the job, based on the output of our internal AI workflow.

By enabling predictive retries, Differential will retry the operation again transparently once it predicts the error to be transient:

```typescript
await client.chargeCustomer("customer_id", 100, {
  $d: {
    predictiveRetriesOnRejection: true,
  },
}); // charged
```

## How to help Differential AI to predict transient errors

1. Clear, human readable error messages would help Differential to predict transient errors more accurately. Differential uses the error message to predict if the error is transient or not. If the error message is not clear, Differential may not be able to predict the error accurately.

```typescript
w;
const chargeCustomer = async (customerId: string, amount: number) => {
  throw new Error("ERROR_CODE_123"); // ⛔️ Not clear. Differential will not be able to predict the retryability, and the client will have to handle the error.
};
```

```typescript
const chargeCustomer = async (customerId: string, amount: number) => {
  throw new Error("Database deadlock"); // ✅ Clear. Differential will predict the error to be transient and retry the operation.
};
```

2. Pass down the error context without overwriting it.

```typescript
const order = async () => {
  try {
    await client.chargeCustomer("customer_id", 100);
  } catch (error) {
    throw new Error("Error in foo"); // ⛔️ Overwriting the error message. Differential will not be able to predict the error accurately.
  }
};
```

3. Differential AI can handle well known error codes, such as `ER_LOCK_DEADLOCK` in MySQL, `ECONNRESET` in network errors, or `429`s in HTTP requests. If you have a well known error code, you can pass it down in the error context to Differential AI to help it predict the error accurately.

## Behaviour

It's worth noting that Differential doesn't retry the operation indefinitely. It has a retry limit for any function call that results in a transient error (default 3 times). If the function fails more than the retry limit, Differential will return the error to the client, so that client can handle it.
