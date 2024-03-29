# Predictive Retries on Promise Rejection

Status: **Technical Preview**

!!!
This feature is at the Technical Preview stage. Due to the nature of probabilistic outcomes, this feature may result in non-deterministic behaviour. It's opt-in and switched off by default.
!!!

Differential can predict transient errors and retry the operations without the developer having to write custom code.

The control-plane has all the required context on a particular failure, when it happens. It knows the function, some metadata about the source, payload, and the error message. It can use this information to predict if the error is transient or not.

If it's predicted to be transient, Differential will retry the operation again without any client intervention. This is especially useful for database deadlocks, network errors, and other transient errors.

It's worth noting that Differential doesn't retry the operation indefinitely. It has a retry limit for any function call that results in a transient error (default 3 times). If the function fails more than the retry limit, Differential will return the error to the client, so that client can handle it.

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

Predictive retries can be enabled by setting the `predictiveRetriesOnRejection` key in the call configuration object. This will retry the function call if the worker rejects the job, based on the output of our internal AI workflow.

By enabling predictive retries, Differential will retry the operation again transparently once it predicts the error to be transient:

```typescript
await client.chargeCustomer("customer_id", 100, {
  $d: {
    predictiveRetriesOnRejection: true,
  },
}); // charged
```
