# Class: Differential

The Differential client. This is the main entry point for using Differential.

**`Example`**

```ts
const d = new Differential("API_SECRET"); // obtain this from your Differential dashboard

const myService = d.service({
  name: "my-service",
  functions: {
    hello: async (name: string) => { ... }
  },
});

await d.listen("my-service");

// stop the service on shutdown
process.on("beforeExit", async () => {
  await d.quit();
});

// call a function on the service
const result = await d.call<typeof myService, "hello">("hello", "world");

console.log(result); // "Hello world"
```

## Table of contents

### Constructors

- [constructor](Differential.md#constructor)

### Methods

- [background](Differential.md#background)
- [call](Differential.md#call)
- [service](Differential.md#service)

## Constructors

### constructor

• **new Differential**(`apiSecret`): [`Differential`](Differential.md)

Initializes a new Differential instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apiSecret` | `string` | The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard). |

#### Returns

[`Differential`](Differential.md)

#### Defined in

[src/Differential.ts:374](https://github.com/differentialHQ/differential/blob/b306aab/ts-core/src/Differential.ts#L374)

## Methods

### background

▸ **background**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<\{ `id`: `string`  }\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Returns the job id of the function call, and doesn't wait for the function to complete.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService` |
| `U` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | `U` | The function name to call. |
| `...args` | `Parameters`\<`T`[``"definition"``][``"functions"``][`U`]\> | The arguments to pass to the function. |

#### Returns

`Promise`\<\{ `id`: `string`  }\>

The job id of the function call.

**`Example`**

```ts
import { d } from "./differential";

const result = await d.background<typeof helloService, "hello">("hello", "world");

console.log(result.id); //
```

#### Defined in

[src/Differential.ts:572](https://github.com/differentialHQ/differential/blob/b306aab/ts-core/src/Differential.ts#L572)

___

### call

▸ **call**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<`ReturnType`\<`T`[``"definition"``][``"functions"``][`U`]\>\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Waits for the function to complete before returning, and returns the result of the function call.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService` |
| `U` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | `U` | The function name to call. |
| `...args` | `Parameters`\<`T`[``"definition"``][``"functions"``][`U`]\> | The arguments to pass to the function. |

#### Returns

`Promise`\<`ReturnType`\<`T`[``"definition"``][``"functions"``][`U`]\>\>

The return value of the function.

**`Example`**

```ts
import { d } from "./differential";
import { helloService } from "./hello-service";

const result = await d.call<typeof helloService, "hello">("hello", "world");

console.log(result); // "Hello world"
```

#### Defined in

[src/Differential.ts:529](https://github.com/differentialHQ/differential/blob/b306aab/ts-core/src/Differential.ts#L529)

___

### service

▸ **service**\<`T`\>(`service`): `RegisteredService`

Registers a service with Differential. This will register all functions on the service.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ServiceDefinition` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `service` | `T` | The service definition. |

#### Returns

`RegisteredService`

A registered service instance.

**`Example`**

```ts
const d = new Differential("API_SECRET");

const service = d.service({
  name: "my-service",
  functions: {
    hello: async (name: string) => {
      return `Hello ${name}`;
   }
});

// start the service
await service.start();

// stop the service on shutdown
process.on("beforeExit", async () => {
  await service.stop();
});
```

#### Defined in

[src/Differential.ts:491](https://github.com/differentialHQ/differential/blob/b306aab/ts-core/src/Differential.ts#L491)
