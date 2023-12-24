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
- [buildClient](Differential.md#buildclient)
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

[ts-core/src/Differential.ts:379](https://github.com/differentialHQ/differential/blob/d326d55/ts-core/src/Differential.ts#L379)

## Methods

### background

▸ **background**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<\{ `id`: `string`  }\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Returns the job id of the function call, and doesn't wait for the function to complete.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService`\<`any`\> |
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

[ts-core/src/Differential.ts:602](https://github.com/differentialHQ/differential/blob/d326d55/ts-core/src/Differential.ts#L602)

___

### buildClient

▸ **buildClient**\<`T`\>(`service`): `ServiceClient`\<`T`\>

Provides a type safe client for performing calls to a registered service.
Waits for the function to complete before returning, and returns the result of the function call.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService`\<`any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `service` | `T`[``"definition"``][``"name"``] |

#### Returns

`ServiceClient`\<`T`\>

ServiceClient<T>

**`Example`**

```ts
import { d } from "./differential";
import type { helloService } from "./hello-service";

const client = d.buildClient<typeof helloService>();

// Client usage
const result = client.hello("world");
console.log(result); // "Hello world"
```

#### Defined in

[ts-core/src/Differential.ts:534](https://github.com/differentialHQ/differential/blob/d326d55/ts-core/src/Differential.ts#L534)

___

### call

▸ **call**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<`ReturnType`\<`T`[``"definition"``][``"functions"``][`U`]\>\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Waits for the function to complete before returning, and returns the result of the function call.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService`\<`any`\> |
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

[ts-core/src/Differential.ts:559](https://github.com/differentialHQ/differential/blob/d326d55/ts-core/src/Differential.ts#L559)

___

### service

▸ **service**\<`T`, `N`\>(`service`): `RegisteredService`\<`T`\>

Registers a service with Differential. This will register all functions on the service.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ServiceDefinition`\<`N`\> |
| `N` | extends `string` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `service` | `T` | The service definition. |

#### Returns

`RegisteredService`\<`T`\>

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

[ts-core/src/Differential.ts:496](https://github.com/differentialHQ/differential/blob/d326d55/ts-core/src/Differential.ts#L496)
