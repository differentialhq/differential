# Function: idempotent

▸ **idempotent**\<`T`\>(`fn`): `AddParameters`\<`T`, [`Pick`\<`DifferentialConfig`, ``"$idempotencyKey"``\>]\>

This is a utility function that makes a function in a service definition idempotent.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AsyncFunction` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | `T` | The function to make idempotent |

#### Returns

`AddParameters`\<`T`, [`Pick`\<`DifferentialConfig`, ``"$idempotencyKey"``\>]\>

The same function with the same parameters, but with an additional parameter at the end of the function call that is the idempotency key

**`Example`**

```ts
// src/services/order.ts

const chargeOrder = async (order: Order) => {
  await chargeCustomer(order.customerId, order.amount);
}

export const orderService = d.service({
  name: "order",
  functions: {
    chargeOrder: idempotent(chargeOrder),
  },
});

// src/client.ts
const orderClient = d.client<typeof orderService>("order");

// const order = await orderClient.chargeOrder(order); // ⛔️ Error: Expected 2 arguments, but got 1.

const order = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });

// if you call the function again with the same idempotency key, previous result will be returned

const order2 = await orderClient.chargeOrder(order, { $idempotencyKey: order.id });

assert.deepEqual(order === order2);
```

#### Defined in

[ts-core/src/functions.ts:75](https://github.com/differentialHQ/differential/blob/64eeed9/ts-core/src/functions.ts#L75)
