# Class: Differential

The Differential client. This is the main entry point for using Differential.

Differential client exposes two main methods:
* `service` - Registers a service with Differential. This will register all functions on the service.
* `client` - Provides a type safe client for performing calls to a registered service.

**`Example`**

```ts
// src/service.ts

// create a new Differential instance
const d = new Differential("API_SECRET");

const myService = d.service({
  name: "my-service",
  functions: {
    hello: async (name: string) => {
      return `Hello ${name}`;
    },
  },
});

await myService.start();

// stop the service on shutdown
process.on("beforeExit", async () => {
  await myService.stop();
});

// src/client.ts

// create a client for the service
const client = d.client<typeof myService>("my-service");

// call a function on the service
const result = await client.hello("world");

console.log(result); // "Hello world"
```

## Table of contents

### Constructors

- [constructor](Differential.md#constructor)

### Methods

- [client](Differential.md#client)
- [service](Differential.md#service)

## Constructors

### constructor

• **new Differential**(`apiSecret`): [`Differential`](Differential.md)

Initializes a new Differential instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apiSecret` | `string` | The API Secret for your Differential cluster. You can obtain one from https://api.differential.dev/demo/token. |

#### Returns

[`Differential`](Differential.md)

#### Defined in

[src/Differential.ts:398](https://github.com/differentialHQ/differential/blob/bc48554/ts-core/src/Differential.ts#L398)

## Methods

### client

▸ **client**\<`T`\>(`service`): `ServiceClient`\<`T`\>

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

const client = d.client<helloService>("hello");

// Client usage
const result = client.hello("world");
console.log(result); // "Hello world"
```

#### Defined in

[src/Differential.ts:518](https://github.com/differentialHQ/differential/blob/bc48554/ts-core/src/Differential.ts#L518)

▸ **client**\<`T`\>(`service`, `options`): `BackgroundServiceClient`\<`T`\>

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
| `options` | `Object` |
| `options.background` | ``true`` |

#### Returns

`BackgroundServiceClient`\<`T`\>

ServiceClient<T>

**`Example`**

```ts
import { d } from "./differential";
import type { helloService } from "./hello-service";

const client = d.client<helloService>("hello");

// Client usage
const result = client.hello("world");
console.log(result); // "Hello world"
```

#### Defined in

[src/Differential.ts:522](https://github.com/differentialHQ/differential/blob/bc48554/ts-core/src/Differential.ts#L522)

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

[src/Differential.ts:494](https://github.com/differentialHQ/differential/blob/bc48554/ts-core/src/Differential.ts#L494)
