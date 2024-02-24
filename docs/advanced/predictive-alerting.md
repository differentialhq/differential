# Predictive Alerting

Status: **In Development**

Differential can predict if a function is failing due to an unrecoverable error that requires a code change, and alert you with reproduction steps.

The control-plane has all the required context on a particular failure, when it happens. It knows the function, some metadata about the source, payload, and the error message. It can use this information to predict if the error is unrecoverable or not.

If it's predicted to be unrecoverable, Differential will alert you prompting to make the necessary code change. This is especially useful for errors that are hard to reproduce, and require a code change to fix.

For example, let's consider this that occurs due to a data inconsistency:

```typescript
// service.ts
const getCustomerName = async (customerId: string) => {
  const customer = await getCustomerFromDatabase(customerId);
  return customer.name;
};

const customerService = d.service({
  name: "customer",
  functions: {
    getCustomerName,
  },
});

// consumer.ts
const client = d.client<typeof customerService>("customer");

await client.getCustomerName("invalid_id"); // TypeError: Cannot read property 'name' of undefined
```

In this case, Differential can predict that the error is unrecoverable, and prompt you to make a code change. It will provide you with the exact payload that caused the error, and the reproduction steps to reproduce the error locally.
