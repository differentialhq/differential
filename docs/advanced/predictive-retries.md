# Predictive Retries

Status: **Technical Preview**

Differential can predict transient errors and retry the operations without the developer having to write custom code.

The control-plane has a lot of context on a particular failure when it happens. It knows the function, some metadata about the source, payload, and the error message. It can use this information to predict if the error is transient or not.

If it's predicted to be transient, Differential will retry the operation on a healthy worker before the client even notices. This is especially useful for database deadlocks, network errors, and other transient errors.

It's worth noting that Differential doesn't retry the operation indefinitely. It has a retry limit for any function call that results in a transient error (default 3 times). If the function fails more than the retry limit, Differential will mark the function as permanently failed.

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

await client.chargeCustomer("customer_id", 100); // "charged"
```

You can turn this feature on for your cluster using the [Console](https://console.differential.dev/). It's off by default.
