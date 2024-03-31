# How to ensure idempotency in your functions

Idempotency is a property of an operation that means the operation can be applied multiple times without changing the result beyond the initial application. In other words, making the same request multiple times has the same effect as making the request once.

In the context of Differential, you can easily achive this by the combination of:

1. Retrying the function call if it gets rejected, which would allow you ensure at-least-once execution.
2. Checking a unique identifier in the request to ensure that the operation is not applied multiple times.

The following is an example of how you can implement idempotency:

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
let attempt = 0;

function chargeOrder() {
  try {
    await orderService.chargeOrder(orderId, paymentMethod);
  } catch (error) {
    if (attempt < 3) {
      attempt++;
      return chargeOrder(orderId, paymentMethod);
    }
    throw error;
  }
}
```

## Guarding against duplicate requests due to stalled machine retries

If a machine processing a request stalls, Differential will retry the request on another machine. This can lead to the same request being processed multiple times. To guard against this, you must use a unique identifier in the execution chain and check if the operation has already been applied explicitly.
