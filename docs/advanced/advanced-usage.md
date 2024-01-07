# Advanced Usage

## End to End Encryption

You might wish to encrypt all function arguments and return values, so that the control plane cannot see them. This is possible with Differential, but it requires you to configure your own encryption keys.

These encryption keys are used to encrypt and decrypt the function arguments and return values. The control plane does not have access to these keys.

The Typescript example below shows how to configure your own encryption keys.

```typescript
const d = new Differential("API_SECRET", {
  encryptionKeys: [
    Buffer.from("abcdefghijklmnopqrstuvwxzy123456"), // 32 bytes
  ],
});
```

It accepts an array of encryption keys. This is useful if you want to rotate your encryption keys. Differential will try to decrypt the function arguments and return values with each encryption key until it finds one that works.

## Idempotency

Idempotency is a property of a function that means that if you call it multiple times with the same arguments, it will always return the same result. This is useful for functions that have side effects, such as sending an email or charging a credit card.

Differential supports idempotency via a convenience function called `idempotent`. It takes a function and returns a new function that prompts the user to provide an idempotency key. If the function has already been called with that key, it will return the same result as before.

To mark a function as idempotent, simply wrap it with the `idempotent` function.

```typescript
import { idempotent } from "@differentialhq/core";

const chargeOrder = async (order: Order) => {
  const charge = await chargeCustomer(order.customerId, order.amount);
  return charge;
}
export const orderService = d.service({
  name: "order",
  functions: {
    chargeOrder: idempotent(chargeOrder),
  },
});
```

Now, when you call the function, you must provide an idempotency key.

```typescript
// const charge = await orderClient.chargeOrder(order); // ⛔️ Error: Expected 2 arguments, but got 1.

const charge = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });
```

If you call the function again with the same idempotency key, the previous result will be returned.

```typescript
const charge2 = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });

assert.deepEqual(charge === charge2);
```

This is helpful when you model your functions as having side effects, such as sending an email or charging a credit card. If you call the function again with the same idempotency key, the side effect will not happen again.

## Global Cache

Coming soon.

## Rate Limiting

Coming soon.