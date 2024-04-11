# How to ensure idempotency in your functions

Idempotency is a property of an operation that means the operation can be applied multiple times without changing the result beyond the initial application. In other words, making the same request multiple times has the same effect as making the request once.

In other words, you'd have to ensure:

1. The intended operation is applied at least once.
2. The intended operation is not applied multiple times.

## 1. Making sure the intended operation is applied at least once

Checking whether the operation is applied successfully is a concern of the developer - in the context of Differential. You can use the [retry policy](https://docs.differential.dev/advanced/calling-functions/customizing-function-calls/#retries) to make sure your functions can recover from machines stalling.

```typescript
// service.ts
async function chargeOrder(orderId: string, paymentMethod: PaymantMethod) {
  // Check if the order has already been charged
  const charge = await getChargeForOrder(orderId);

  if (charge) {
    return charge;
  }

  // Charge the order
  const charge = await chargeOrderWithPaymentMethod(orderId, paymentMethod);

  return charge;
}

export const orderService = d.service({
  name: "order",
  functions: {
    chargeOrder,
  },
});

// client.ts
function chargeOrder() {
  await orderService.chargeOrder(orderId, paymentMethod, {
    $d: {
      retryCountOnStall: 1, // function will be tried on stalling
    },
  });
}
```

## Preventing duplicate calls

At the same time, it's important to make sure that additional clients do not apply the same operation.

For this purpose, you can use [`$d.executionId`](https://docs.differential.dev/advanced/calling-functions/customizing-function-calls/#execution-id) in the call config that will prevent additional callers from triggering multiple calls.

Therefore, the function will look like:

```typescript
function chargeOrder() {
  await orderService.chargeOrder(orderId, paymentMethod, {
    $d: {
      retryCountOnStall: 1, // function will be tried on stalling
      executionId: orderId, // additional clients will not execute `chargeOrder` again for the same key
    },
  });
}
```
